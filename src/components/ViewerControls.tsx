import { useEffect, useState } from "react";
import HintToast from "./HintToast";

const isMobile =
  typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

interface ViewerControlsProps {
  onBack: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  gyroAvailable: boolean;
  gyroEnabled: boolean;
  onToggleGyro: () => void;
  onRecenter: () => void;
  horizonLocked: boolean;
  onToggleHorizonLock: () => void;
}

export default function ViewerControls({
  onBack,
  isFullscreen,
  onToggleFullscreen,
  gyroAvailable,
  gyroEnabled,
  onToggleGyro,
  onRecenter,
  horizonLocked,
  onToggleHorizonLock,
}: ViewerControlsProps) {
  // Gyro discovery prompt — shown once per viewer session on mobile
  const [showGyroPrompt, setShowGyroPrompt] = useState(
    isMobile && gyroAvailable
  );

  // Derived: hide when gyro has been enabled (no effect needed)
  const gyroPromptVisible = showGyroPrompt && !gyroEnabled;

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!showGyroPrompt) return;
    const timer = setTimeout(() => setShowGyroPrompt(false), 8000);
    return () => clearTimeout(timer);
  }, [showGyroPrompt]);

  const handleEnableFromPrompt = () => {
    setShowGyroPrompt(false);
    onToggleGyro();
  };

  const btnClass =
    "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 active:bg-black/80";

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Top bar */}
      <div className="flex items-start justify-between p-3">
        {/* Back button */}
        <button onClick={onBack} className={btnClass} title="Back">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>

        {/* Fullscreen button — desktop only */}
        {!isMobile && (
          <button
            onClick={onToggleFullscreen}
            className={btnClass}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Bottom bar — safe-area aware, flex layout prevents overlap */}
      <div
        className="absolute bottom-0 inset-x-0 flex items-end p-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Left spacer to balance center content */}
        <div className="w-11 shrink-0" />

        {/* Center: stacked messages */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          {/* Gyro discovery prompt */}
          {gyroPromptVisible && (
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-black/70 px-4 py-3 backdrop-blur-sm">
              <span className="text-sm text-white/90">
                Enable gyroscope to explore by moving your phone
              </span>
              <button
                onClick={handleEnableFromPrompt}
                className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/80"
              >
                Enable
              </button>
            </div>
          )}

          {/* Hint toast */}
          <HintToast key={String(gyroEnabled)} gyroEnabled={gyroEnabled} />
        </div>

        {/* Right: Gyro + Recenter buttons */}
        {gyroAvailable ? (
          <div className="flex shrink-0 flex-col items-center gap-2">
            {/* Recenter button — only when gyro is active */}
            {gyroEnabled && (
              <button
                onClick={onRecenter}
                className={btnClass}
                title="Recenter view"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    strokeLinecap="round"
                    d="M12 2v4m0 12v4M2 12h4m12 0h4"
                  />
                </svg>
              </button>
            )}

            {/* Horizon lock toggle — only when gyro is active */}
            {gyroEnabled && (
              <button
                onClick={onToggleHorizonLock}
                className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
                  horizonLocked
                    ? "bg-white/90 text-black"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
                title={horizonLocked ? "Unlock horizon" : "Lock horizon"}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="3" y="9" width="18" height="6" rx="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </button>
            )}

            {/* Gyro toggle button */}
            <button
              onClick={onToggleGyro}
              className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
                gyroEnabled
                  ? "bg-white/90 text-black"
                  : "bg-black/50 text-white hover:bg-black/70"
              }`}
              title={gyroEnabled ? "Disable gyroscope" : "Enable gyroscope"}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-11 shrink-0" />
        )}
      </div>
    </div>
  );
}
