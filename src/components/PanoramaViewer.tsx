import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePanoramaRenderer } from "../hooks/usePanoramaRenderer";
import { useGyroscope } from "../hooks/useGyroscope";
import { useFullscreen } from "../hooks/useFullscreen";
import ViewerControls from "./ViewerControls";
import DecryptedText from "./ui/DecryptedText";

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
  const [horizonLocked, setHorizonLocked] = useState(true);

  const { isLoading, error, recenter } = usePanoramaRenderer({
    containerRef,
    imageUrl,
    gyroEnabled: gyro.isEnabled,
    horizonLocked,
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
            {/* Pulse ring loader */}
            <div className="relative mx-auto mb-4 h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-violet-400/30 animate-ping" />
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-violet-400 animate-spin" />
              <div className="absolute inset-2.5 rounded-full border border-transparent border-t-violet-300/60 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
            </div>
            <DecryptedText
              text="Loading panorama..."
              speed={40}
              sequential
              animateOn="view"
              className="text-sm text-zinc-400"
              encryptedClassName="text-sm text-violet-400/60"
            />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80">
          <motion.div
            className="text-center max-w-sm px-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <svg
              className="mx-auto mb-4 h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm text-zinc-300 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="rounded-full bg-white/10 px-6 py-2 text-sm text-white transition-colors hover:bg-white/20"
            >
              Go back
            </button>
          </motion.div>
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
        horizonLocked={horizonLocked}
        onToggleHorizonLock={() => setHorizonLocked((v) => !v)}
      />
    </div>
  );
}
