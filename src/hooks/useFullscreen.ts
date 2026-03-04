import { useCallback, useEffect, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        // Attempt landscape lock (non-blocking)
        try {
          await (screen.orientation as any)?.lock?.("landscape");
        } catch {
          // Ignore if unsupported
        }
      } catch {
        // Fullscreen not supported
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore
      }
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
