import { useCallback, useRef } from "react";
import { usePanoramaRenderer } from "../hooks/usePanoramaRenderer";
import { useGyroscope } from "../hooks/useGyroscope";
import { useFullscreen } from "../hooks/useFullscreen";
import ViewerControls from "./ViewerControls";
import HintToast from "./HintToast";

interface PanoramaViewerProps {
  imageUrl: string;
  onBack: () => void;
}

export default function PanoramaViewer({
  imageUrl,
  onBack,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gyro = useGyroscope();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const { isLoading, recenter } = usePanoramaRenderer({
    containerRef,
    imageUrl,
    gyroEnabled: gyro.isEnabled,
    orientationRef: gyro.orientationRef,
  });

  const handleToggleGyro = useCallback(async () => {
    if (gyro.isEnabled) {
      gyro.disable();
    } else {
      await gyro.enable();
    }
  }, [gyro]);

  return (
    <div className="relative h-full w-full bg-black">
      {/* Three.js canvas container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-400" />
            <p className="text-sm text-zinc-400">Loading panorama...</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <ViewerControls
        onBack={onBack}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        gyroAvailable={gyro.isAvailable}
        gyroEnabled={gyro.isEnabled}
        onToggleGyro={handleToggleGyro}
        onRecenter={recenter}
      />

      {/* Hint toast */}
      <HintToast
        key={String(gyro.isEnabled)}
        gyroEnabled={gyro.isEnabled}
      />
    </div>
  );
}
