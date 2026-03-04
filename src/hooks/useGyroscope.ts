import { useCallback, useEffect, useRef, useState } from "react";
import { isMobile } from "../utils/device";

export interface GyroscopeOrientation {
  alpha: number;
  beta: number;
  gamma: number;
}

export function useGyroscope() {
  // Only consider gyroscope available on mobile devices with the API present
  const [isAvailable, setIsAvailable] = useState(
    () => isMobile && !!window.DeviceOrientationEvent
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const orientationRef = useRef<GyroscopeOrientation | null>(null);
  const initialAlphaRef = useRef<number | null>(null);
  const listenerAttachedRef = useRef(false);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.alpha === null) return;

    // Confirm hardware is actually available on first real event
    setIsAvailable(true);

    if (initialAlphaRef.current === null) {
      initialAlphaRef.current = event.alpha;
    }

    orientationRef.current = {
      alpha: event.alpha,
      beta: event.beta ?? 0,
      gamma: event.gamma ?? 0,
    };
  }, []);

  const enable = useCallback(async () => {
    // iOS 13+ permission request
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DOE.requestPermission === "function") {
      try {
        const permission = await DOE.requestPermission();
        if (permission !== "granted") {
          return false;
        }
      } catch {
        return false;
      }
    }

    if (!listenerAttachedRef.current) {
      window.addEventListener("deviceorientation", handleOrientation);
      listenerAttachedRef.current = true;
    }
    initialAlphaRef.current = null;
    setIsEnabled(true);
    return true;
  }, [handleOrientation]);

  const disable = useCallback(() => {
    // Keep listener attached so orientationRef stays fresh for seamless re-enable
    setIsEnabled(false);
    initialAlphaRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerAttachedRef.current) {
        window.removeEventListener("deviceorientation", handleOrientation);
        listenerAttachedRef.current = false;
      }
    };
  }, [handleOrientation]);

  return {
    isAvailable,
    isEnabled,
    orientationRef,
    initialAlphaRef,
    enable,
    disable,
  };
}
