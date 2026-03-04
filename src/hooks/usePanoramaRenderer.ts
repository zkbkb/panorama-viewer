import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { setQuaternionFromOrientation } from "../utils/orientation";
import type { GyroscopeOrientation } from "./useGyroscope";

const DEG2RAD = THREE.MathUtils.DEG2RAD;
const LERP_FACTOR = 0.1;
const MIN_FOV = 30;
const MAX_FOV = 110;
const DEFAULT_FOV = 75;

interface UsePanoramaRendererOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  imageUrl: string;
  gyroEnabled: boolean;
  orientationRef: RefObject<GyroscopeOrientation>;
}

export function usePanoramaRenderer({
  containerRef,
  imageUrl,
  gyroEnabled,
  orientationRef,
}: UsePanoramaRendererOptions) {
  const [isLoading, setIsLoading] = useState(true);
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

  // Gyro enabled ref (to access in animation loop without stale closure)
  const gyroEnabledRef = useRef(gyroEnabled);
  const prevGyroEnabledRef = useRef(gyroEnabled);
  gyroEnabledRef.current = gyroEnabled;

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

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Sphere geometry (inverted)
    const geometry = new THREE.SphereGeometry(500, 64, 32);
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

    // --- Event Handlers ---

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 1) {
        isDraggingRef.current = true;
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        if (gyroEnabledRef.current) {
          gyroDragStartOffsetLonRef.current = gyroOffsetLonRef.current;
          gyroDragStartOffsetLatRef.current = gyroOffsetLatRef.current;
        } else {
          dragStartLonRef.current = targetLonRef.current;
          dragStartLatRef.current = targetLatRef.current;
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
          Math.min(MAX_FOV, targetFovRef.current + delta * 0.08)
        );
        lastPinchDistRef.current = dist;
        return;
      }

      if (isDraggingRef.current && pointersRef.current.size === 1) {
        const deltaX =
          (pointerStartRef.current.x - e.clientX) * 0.15;
        const deltaY =
          (e.clientY - pointerStartRef.current.y) * 0.15;

        if (gyroEnabledRef.current) {
          gyroOffsetLonRef.current =
            gyroDragStartOffsetLonRef.current + deltaX;
          gyroOffsetLatRef.current = Math.max(
            -85,
            Math.min(
              85,
              gyroDragStartOffsetLatRef.current + deltaY
            )
          );
        } else {
          targetLonRef.current = dragStartLonRef.current + deltaX;
          targetLatRef.current = Math.max(
            -85,
            Math.min(85, dragStartLatRef.current + deltaY)
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
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetFovRef.current = Math.max(
        MIN_FOV,
        Math.min(MAX_FOV, targetFovRef.current + e.deltaY * 0.05)
      );
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

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

    // Camera target vector (reused each frame)
    const target = new THREE.Vector3();
    const gyroQuaternion = new THREE.Quaternion();
    const inverseInitQ = new THREE.Quaternion();
    const offsetQ = new THREE.Quaternion();
    const offsetEuler = new THREE.Euler();

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth FOV
      fovRef.current += (targetFovRef.current - fovRef.current) * LERP_FACTOR;
      camera.fov = fovRef.current;
      camera.updateProjectionMatrix();

      // Detect gyro toggle: clear reference quaternions when disabled
      if (prevGyroEnabledRef.current && !gyroEnabledRef.current) {
        initialGyroQRef.current = null;
        initialCameraQRef.current = null;
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

          // On first gyro frame, capture reference quaternions
          if (!initialGyroQRef.current) {
            initialGyroQRef.current = gyroQuaternion.clone();
            initialCameraQRef.current = camera.quaternion.clone();
          }

          // camera = initialCameraQ * inverse(initialGyroQ) * currentGyroQ
          inverseInitQ.copy(initialGyroQRef.current).invert();
          camera.quaternion
            .copy(initialCameraQRef.current!)
            .multiply(inverseInitQ)
            .multiply(gyroQuaternion);

          // Apply touch offset as additional rotation
          if (
            gyroOffsetLonRef.current !== 0 ||
            gyroOffsetLatRef.current !== 0
          ) {
            offsetEuler.set(
              -gyroOffsetLatRef.current * DEG2RAD,
              -gyroOffsetLonRef.current * DEG2RAD,
              0,
              "YXZ"
            );
            offsetQ.setFromEuler(offsetEuler);
            camera.quaternion.multiply(offsetQ);
          }
        }
      } else {
        // Smooth interpolation for manual controls
        lonRef.current += (targetLonRef.current - lonRef.current) * LERP_FACTOR;
        latRef.current += (targetLatRef.current - latRef.current) * LERP_FACTOR;

        const phi = (90 - latRef.current) * DEG2RAD;
        const theta = lonRef.current * DEG2RAD;

        target.set(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  // Load texture when imageUrl changes
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    setIsLoading(true);
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
        setIsLoading(false);
      }
    );
  }, [imageUrl]);

  const recenter = useCallback(() => {
    // Reset reference: current device orientation = current camera direction
    initialGyroQRef.current = currentGyroQRef.current.clone();
    if (cameraRef.current) {
      // Capture camera quaternion WITHOUT the touch offset
      const cam = cameraRef.current.quaternion.clone();
      // Undo touch offset to get the pure gyro-mapped orientation
      if (gyroOffsetLonRef.current !== 0 || gyroOffsetLatRef.current !== 0) {
        const undoEuler = new THREE.Euler(
          -gyroOffsetLatRef.current * DEG2RAD,
          -gyroOffsetLonRef.current * DEG2RAD,
          0,
          "YXZ"
        );
        const undoQ = new THREE.Quaternion().setFromEuler(undoEuler).invert();
        cam.multiply(undoQ);
      }
      initialCameraQRef.current = cam;
    }
    gyroOffsetLonRef.current = 0;
    gyroOffsetLatRef.current = 0;
  }, []);

  return { isLoading, recenter };
}
