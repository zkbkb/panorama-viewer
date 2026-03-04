import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { setQuaternionFromOrientation } from "../utils/orientation";
import type { GyroscopeOrientation } from "./useGyroscope";

const DEG2RAD = THREE.MathUtils.DEG2RAD;
const LERP_FACTOR = 0.1;
const MIN_FOV = 30;
const MAX_FOV = 110;
const DEFAULT_FOV = 75;
const PINCH_SENSITIVITY = 0.08;
const WHEEL_SENSITIVITY = 0.05;
const SPHERE_RADIUS = 500;
const SPHERE_WIDTH_SEGMENTS = 64;
const SPHERE_HEIGHT_SEGMENTS = 32;
const MAX_LATITUDE = 85;
const FRICTION = 0.97;
const INERTIA_THRESHOLD = 0.001;
const VELOCITY_SMOOTHING = 0.3; // EMA weight for new velocity samples
const RECENTER_DURATION_MS = 500;
const DOUBLE_TAP_INTERVAL = 300;
const DOUBLE_TAP_DISTANCE = 30;
const KEYBOARD_PAN_SPEED = 2; // degrees per frame at default FOV

interface UsePanoramaRendererOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  imageUrl: string;
  gyroEnabled: boolean;
  horizonLocked: boolean;
  orientationRef: RefObject<GyroscopeOrientation | null>;
}

export function usePanoramaRenderer({
  containerRef,
  imageUrl,
  gyroEnabled,
  horizonLocked,
  orientationRef,
}: UsePanoramaRendererOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number>(0);

  // Control state stored in refs to avoid re-renders in the animation loop
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const targetLonRef = useRef(0);
  const targetLatRef = useRef(0);
  const fovRef = useRef(DEFAULT_FOV);
  const targetFovRef = useRef(DEFAULT_FOV);

  // Drag state
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const dragStartLonRef = useRef(0);
  const dragStartLatRef = useRef(0);

  // Pinch state
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef(0);

  // Inertia state
  const velocityLonRef = useRef(0);
  const velocityLatRef = useRef(0);
  const lastPointerTimeRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const lastPointerYRef = useRef(0);

  // Double-tap state
  const lastTapTimeRef = useRef(0);
  const lastTapXRef = useRef(0);
  const lastTapYRef = useRef(0);

  // Keyboard state
  const pressedKeysRef = useRef<Set<string>>(new Set());

  // Gyro touch offset
  const gyroOffsetLonRef = useRef(0);
  const gyroOffsetLatRef = useRef(0);
  const gyroDragStartOffsetLonRef = useRef(0);
  const gyroDragStartOffsetLatRef = useRef(0);

  // Reference quaternions for smooth gyro activation (no camera jump)
  const initialGyroQRef = useRef<THREE.Quaternion | null>(null);
  const initialCameraQRef = useRef<THREE.Quaternion | null>(null);
  // Track current raw gyro quaternion for recenter
  const currentGyroQRef = useRef(new THREE.Quaternion());
  // Default camera orientation (lon=0, lat=0) for recenter
  const defaultCameraQRef = useRef(new THREE.Quaternion());

  // Recenter animation state
  const recenterFromQRef = useRef(new THREE.Quaternion());
  const recenterProgressRef = useRef(1); // 1 = no animation, <1 = animating
  const recenterStartTimeRef = useRef(0);

  // Refs for animation loop (avoid stale closures)
  const gyroEnabledRef = useRef(gyroEnabled);
  const prevGyroEnabledRef = useRef(gyroEnabled);
  gyroEnabledRef.current = gyroEnabled;
  const horizonLockedRef = useRef(horizonLocked);
  const prevHorizonLockedRef = useRef(horizonLocked);
  horizonLockedRef.current = horizonLocked;

  // Screen orientation for gyroscope
  const screenOrientationRef = useRef(0);

  useEffect(() => {
    const handleOrientationChange = () => {
      screenOrientationRef.current =
        (window.screen?.orientation?.angle ??
          (window as { orientation?: number }).orientation ?? 0) *
        DEG2RAD;
    };
    handleOrientationChange();
    window.addEventListener("orientationchange", handleOrientationChange);
    return () =>
      window.removeEventListener("orientationchange", handleOrientationChange);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      DEFAULT_FOV,
      width / height,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // Capture default orientation (lon=0, lat=0 → looking at +X)
    camera.lookAt(SPHERE_RADIUS, 0, 0);
    defaultCameraQRef.current.copy(camera.quaternion);

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Sphere geometry (inverted)
    const geometry = new THREE.SphereGeometry(
      SPHERE_RADIUS,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS
    );
    geometry.scale(-1, 1, 1);

    // Material
    const material = new THREE.MeshBasicMaterial();
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Canvas style
    const canvas = renderer.domElement;
    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";
    // Make canvas focusable for keyboard events
    canvas.tabIndex = 0;
    canvas.style.outline = "none";

    // --- Helper: compute degrees-per-pixel for 1:1 "跟手" drag mapping ---
    const getDegreesPerPixel = () => {
      const vFov = fovRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight;
      return {
        x: (vFov * (w / h)) / w,
        y: vFov / h,
      };
    };

    // --- Event Handlers ---

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 1) {
        // Double-tap detection
        const now = performance.now();
        const dx = e.clientX - lastTapXRef.current;
        const dy = e.clientY - lastTapYRef.current;
        const dist = Math.hypot(dx, dy);
        if (
          now - lastTapTimeRef.current < DOUBLE_TAP_INTERVAL &&
          dist < DOUBLE_TAP_DISTANCE
        ) {
          // Double-tap: toggle zoom
          targetFovRef.current =
            targetFovRef.current < DEFAULT_FOV - 5 ? DEFAULT_FOV : MIN_FOV;
          lastTapTimeRef.current = 0; // reset to prevent triple-tap
        } else {
          lastTapTimeRef.current = now;
        }
        lastTapXRef.current = e.clientX;
        lastTapYRef.current = e.clientY;

        isDraggingRef.current = true;
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        // Stop any inertia on new touch
        velocityLonRef.current = 0;
        velocityLatRef.current = 0;
        lastPointerTimeRef.current = performance.now();
        lastPointerXRef.current = e.clientX;
        lastPointerYRef.current = e.clientY;

        if (gyroEnabledRef.current) {
          gyroDragStartOffsetLonRef.current = gyroOffsetLonRef.current;
          gyroDragStartOffsetLatRef.current = gyroOffsetLatRef.current;
        } else {
          // Sync target to the currently displayed position so that
          // starting a drag during inertia doesn't cause a jump
          targetLonRef.current = lonRef.current;
          targetLatRef.current = latRef.current;
          dragStartLonRef.current = lonRef.current;
          dragStartLatRef.current = latRef.current;
        }
        canvas.style.cursor = "grabbing";
      }

      if (pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values());
        lastPinchDistRef.current = Math.hypot(
          pts[1].x - pts[0].x,
          pts[1].y - pts[0].y
        );
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 2) {
        // Pinch zoom
        const pts = Array.from(pointersRef.current.values());
        const dist = Math.hypot(
          pts[1].x - pts[0].x,
          pts[1].y - pts[0].y
        );
        const delta = lastPinchDistRef.current - dist;
        targetFovRef.current = Math.max(
          MIN_FOV,
          Math.min(MAX_FOV, targetFovRef.current + delta * PINCH_SENSITIVITY)
        );
        lastPinchDistRef.current = dist;
        return;
      }

      if (isDraggingRef.current && pointersRef.current.size === 1) {
        // 1:1 "跟手" mapping: degrees-per-pixel based on current FOV and viewport
        const dpp = getDegreesPerPixel();
        const deltaX = (pointerStartRef.current.x - e.clientX) * dpp.x;
        const deltaY = (e.clientY - pointerStartRef.current.y) * dpp.y;

        // Track velocity for inertia (exponential moving average to avoid spikes)
        const now = performance.now();
        const dt = now - lastPointerTimeRef.current;
        if (dt > 0) {
          const newVelLon = ((lastPointerXRef.current - e.clientX) * dpp.x) / dt;
          const newVelLat = ((e.clientY - lastPointerYRef.current) * dpp.y) / dt;
          velocityLonRef.current += (newVelLon - velocityLonRef.current) * VELOCITY_SMOOTHING;
          velocityLatRef.current += (newVelLat - velocityLatRef.current) * VELOCITY_SMOOTHING;
        }
        lastPointerTimeRef.current = now;
        lastPointerXRef.current = e.clientX;
        lastPointerYRef.current = e.clientY;

        if (gyroEnabledRef.current) {
          gyroOffsetLonRef.current =
            gyroDragStartOffsetLonRef.current + deltaX;
          gyroOffsetLatRef.current = Math.max(
            -MAX_LATITUDE,
            Math.min(
              MAX_LATITUDE,
              gyroDragStartOffsetLatRef.current + deltaY
            )
          );
        } else {
          targetLonRef.current = dragStartLonRef.current + deltaX;
          targetLatRef.current = Math.max(
            -MAX_LATITUDE,
            Math.min(MAX_LATITUDE, dragStartLatRef.current + deltaY)
          );
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      canvas.releasePointerCapture(e.pointerId);
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size === 0) {
        isDraggingRef.current = false;
        canvas.style.cursor = "grab";
        // Only apply inertia if the finger was still moving at release (flick gesture).
        // If the user paused before lifting, discard velocity.
        const timeSinceLastMove = performance.now() - lastPointerTimeRef.current;
        if (timeSinceLastMove > 80) {
          velocityLonRef.current = 0;
          velocityLatRef.current = 0;
        }
      } else if (pointersRef.current.size === 1) {
        // Transitioning from pinch back to single-finger drag:
        // reset start position so the next pointermove doesn't jump
        const remaining = Array.from(pointersRef.current.values())[0];
        pointerStartRef.current = { x: remaining.x, y: remaining.y };
        if (gyroEnabledRef.current) {
          gyroDragStartOffsetLonRef.current = gyroOffsetLonRef.current;
          gyroDragStartOffsetLatRef.current = gyroOffsetLatRef.current;
        } else {
          dragStartLonRef.current = lonRef.current;
          dragStartLatRef.current = latRef.current;
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetFovRef.current = Math.max(
        MIN_FOV,
        Math.min(MAX_FOV, targetFovRef.current + e.deltaY * WHEEL_SENSITIVITY)
      );
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      pressedKeysRef.current.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key);
    };
    const onBlur = () => {
      pressedKeysRef.current.clear();
    };
    const onVisibilityChange = () => {
      if (document.hidden) pressedKeysRef.current.clear();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Resize handler
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onResize);

    // Frame timing for delta-time-based physics
    let lastFrameTime = performance.now();

    // Pre-allocated objects reused each frame
    const target = new THREE.Vector3();
    const gyroQuaternion = new THREE.Quaternion();
    const inverseInitQ = new THREE.Quaternion();
    const offsetQ = new THREE.Quaternion();
    const offsetEuler = new THREE.Euler();
    const rollCorrectionEuler = new THREE.Euler();
    const forwardVec = new THREE.Vector3();
    const recenterTargetQ = new THREE.Quaternion();

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min(now - lastFrameTime, 32); // cap to avoid huge jumps
      lastFrameTime = now;

      // Smooth FOV — only update projection matrix when FOV is actually changing
      const fovDelta = targetFovRef.current - fovRef.current;
      if (Math.abs(fovDelta) > 0.01) {
        fovRef.current += fovDelta * LERP_FACTOR;
        camera.fov = fovRef.current;
        camera.updateProjectionMatrix();
      }

      // Keyboard navigation (dt-based for framerate independence)
      const keys = pressedKeysRef.current;
      if (keys.size > 0 && !gyroEnabledRef.current) {
        const fovScale = fovRef.current / DEFAULT_FOV;
        const speed = KEYBOARD_PAN_SPEED * fovScale * (dt / 16);
        const zoomSpeed = dt / 16;
        if (keys.has("ArrowLeft") || keys.has("a")) targetLonRef.current -= speed;
        if (keys.has("ArrowRight") || keys.has("d")) targetLonRef.current += speed;
        if (keys.has("ArrowUp") || keys.has("w"))
          targetLatRef.current = Math.min(MAX_LATITUDE, targetLatRef.current + speed);
        if (keys.has("ArrowDown") || keys.has("s"))
          targetLatRef.current = Math.max(-MAX_LATITUDE, targetLatRef.current - speed);
        if (keys.has("=") || keys.has("+"))
          targetFovRef.current = Math.max(MIN_FOV, targetFovRef.current - zoomSpeed);
        if (keys.has("-"))
          targetFovRef.current = Math.min(MAX_FOV, targetFovRef.current + zoomSpeed);
      }

      // Detect gyro toggle: when disabled, extract current view as lon/lat
      if (prevGyroEnabledRef.current && !gyroEnabledRef.current) {
        initialGyroQRef.current = null;
        initialCameraQRef.current = null;
        gyroOffsetLonRef.current = 0;
        gyroOffsetLatRef.current = 0;

        // Extract camera forward direction → lon/lat for seamless transition
        const fwd = forwardVec.set(0, 0, -1).applyQuaternion(camera.quaternion);
        const extractedLat = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE,
          Math.asin(Math.max(-1, Math.min(1, fwd.y))) / DEG2RAD
        ));
        const extractedLon = Math.atan2(fwd.z, fwd.x) / DEG2RAD;
        lonRef.current = extractedLon;
        latRef.current = extractedLat;
        targetLonRef.current = extractedLon;
        targetLatRef.current = extractedLat;
      }
      prevGyroEnabledRef.current = gyroEnabledRef.current;

      if (gyroEnabledRef.current) {
        const ori = orientationRef.current;
        if (ori) {
          const alpha = ori.alpha * DEG2RAD;
          const beta = ori.beta * DEG2RAD;
          const gamma = ori.gamma * DEG2RAD;
          const orient = screenOrientationRef.current;

          setQuaternionFromOrientation(
            gyroQuaternion,
            alpha,
            beta,
            gamma,
            orient
          );
          currentGyroQRef.current.copy(gyroQuaternion);

          // Detect horizon lock toggle — recapture reference to avoid view jump
          if (
            prevHorizonLockedRef.current !== horizonLockedRef.current &&
            initialGyroQRef.current
          ) {
            // Zero roll on current camera so both transitions are seamless
            rollCorrectionEuler.setFromQuaternion(camera.quaternion, "YXZ");
            rollCorrectionEuler.z = 0;
            camera.quaternion.setFromEuler(rollCorrectionEuler);
            // Recapture from corrected camera + current gyro
            initialGyroQRef.current = gyroQuaternion.clone();
            initialCameraQRef.current = camera.quaternion.clone();
            gyroOffsetLonRef.current = 0;
            gyroOffsetLatRef.current = 0;
          }
          prevHorizonLockedRef.current = horizonLockedRef.current;

          // On first gyro frame, capture reference quaternions
          if (!initialGyroQRef.current) {
            initialGyroQRef.current = gyroQuaternion.clone();
            initialCameraQRef.current = camera.quaternion.clone();
          }

          // camera = initialCameraQ * offsetQ * inverse(initialGyroQ) * currentGyroQ
          // Touch offset defines the base direction; gyro relative motion is applied on top
          const initCamQ = initialCameraQRef.current;
          if (!initCamQ) return; // Type guard; logically unreachable after block above
          camera.quaternion.copy(initCamQ);

          // Apply touch offset first (defines which direction in the panorama we face)
          if (
            gyroOffsetLonRef.current !== 0 ||
            gyroOffsetLatRef.current !== 0
          ) {
            offsetEuler.set(
              gyroOffsetLatRef.current * DEG2RAD,
              -gyroOffsetLonRef.current * DEG2RAD,
              0,
              "YXZ"
            );
            offsetQ.setFromEuler(offsetEuler);
            camera.quaternion.multiply(offsetQ);
          }

          // Then apply relative gyro motion (device movement since activation)
          inverseInitQ.copy(initialGyroQRef.current).invert();
          camera.quaternion.multiply(inverseInitQ).multiply(gyroQuaternion);

          // Optionally zero roll to keep the horizon level
          if (horizonLockedRef.current) {
            rollCorrectionEuler.setFromQuaternion(camera.quaternion, 'YXZ');
            rollCorrectionEuler.z = 0;
            camera.quaternion.setFromEuler(rollCorrectionEuler);
          }

          // Smooth recenter animation: time-based SLERP
          if (recenterProgressRef.current < 1) {
            const elapsed = now - recenterStartTimeRef.current;
            recenterProgressRef.current = Math.min(1, elapsed / RECENTER_DURATION_MS);
            // Quintic ease-out for a silky deceleration curve
            const t = 1 - Math.pow(1 - recenterProgressRef.current, 4);
            // Copy target first to avoid self-aliasing (slerpQuaternions
            // internally does this.copy(qa) which would destroy qb if qb === this)
            recenterTargetQ.copy(camera.quaternion);
            camera.quaternion.slerpQuaternions(recenterFromQRef.current, recenterTargetQ, t);
          }
        }
      } else {
        const hasInertia = !isDraggingRef.current &&
          (Math.abs(velocityLonRef.current) > INERTIA_THRESHOLD ||
           Math.abs(velocityLatRef.current) > INERTIA_THRESHOLD);

        if (hasInertia) {
          // Apply velocity directly to displayed position (no LERP layer)
          // so the transition from drag to coast is seamless
          const frictionFactor = Math.pow(FRICTION, dt / 16); // framerate-independent
          lonRef.current += velocityLonRef.current * dt;
          latRef.current = Math.max(
            -MAX_LATITUDE,
            Math.min(MAX_LATITUDE, latRef.current + velocityLatRef.current * dt)
          );
          // Keep target in sync for when the next drag starts
          targetLonRef.current = lonRef.current;
          targetLatRef.current = latRef.current;
          velocityLonRef.current *= frictionFactor;
          velocityLatRef.current *= frictionFactor;
          if (Math.abs(velocityLonRef.current) < INERTIA_THRESHOLD) velocityLonRef.current = 0;
          if (Math.abs(velocityLatRef.current) < INERTIA_THRESHOLD) velocityLatRef.current = 0;
        } else if (isDraggingRef.current) {
          // During drag: snap directly to target for instant 1:1 feel
          lonRef.current = targetLonRef.current;
          latRef.current = targetLatRef.current;
        } else {
          // LERP for other target changes (keyboard, etc.)
          lonRef.current += (targetLonRef.current - lonRef.current) * LERP_FACTOR;
          latRef.current += (targetLatRef.current - latRef.current) * LERP_FACTOR;
        }

        const phi = (90 - latRef.current) * DEG2RAD;
        const theta = lonRef.current * DEG2RAD;

        target.set(
          SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
          SPHERE_RADIUS * Math.cos(phi),
          SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta)
        );
        camera.lookAt(target);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onResize);

      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      materialRef.current = null;
      meshRef.current = null;
    };
    // The main useEffect intentionally depends only on containerRef. All other state
    // (gyroEnabled, horizonLocked, orientationRef, imageUrl) is accessed via refs to
    // avoid tearing down and rebuilding the entire WebGL context on every state change.
    // Texture loading is handled by a separate useEffect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  // Load texture when imageUrl changes
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    setIsLoading(true);
    setError(null);
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;

        // Dispose old texture
        if (textureRef.current) {
          textureRef.current.dispose();
        }
        textureRef.current = texture;
        material.map = texture;
        material.needsUpdate = true;
        setIsLoading(false);
      },
      undefined,
      () => {
        setError("Failed to load image. The file may be corrupted or too large.");
        setIsLoading(false);
      }
    );
  }, [imageUrl]);

  const recenter = useCallback(() => {
    // Capture current camera orientation as the animation start point
    if (cameraRef.current) {
      recenterFromQRef.current.copy(cameraRef.current.quaternion);
      recenterProgressRef.current = 0;
      recenterStartTimeRef.current = performance.now();
    }
    // Set target: current device orientation = initial view (panorama center)
    initialGyroQRef.current = currentGyroQRef.current.clone();
    initialCameraQRef.current = defaultCameraQRef.current.clone();
    gyroOffsetLonRef.current = 0;
    gyroOffsetLatRef.current = 0;
  }, []);

  return { isLoading, error, recenter };
}
