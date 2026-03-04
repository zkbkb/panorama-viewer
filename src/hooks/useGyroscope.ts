import { useCallback, useEffect, useRef, useState } from "react";

export interface GyroscopeOrientation {
  alpha: number;
  beta: number;
  gamma: number;
}

export function useGyroscope() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const orientationRef = useRef<GyroscopeOrientation>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const initialAlphaRef = useRef<number | null>(null);
  const listenerAttachedRef = useRef(false);

  // Check availability on mount
  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      setIsAvailable(true);
    }
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.alpha === null) return;

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
    if (listenerAttachedRef.current) {
      window.removeEventListener("deviceorientation", handleOrientation);
      listenerAttachedRef.current = false;
    }
    setIsEnabled(false);
    initialAlphaRef.current = null;
  }, [handleOrientation]);

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
