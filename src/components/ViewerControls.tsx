interface ViewerControlsProps {
  onBack: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  gyroAvailable: boolean;
  gyroEnabled: boolean;
  onToggleGyro: () => void;
}

export default function ViewerControls({
  onBack,
  isFullscreen,
  onToggleFullscreen,
  gyroAvailable,
  gyroEnabled,
  onToggleGyro,
}: ViewerControlsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Top bar */}
      <div className="flex items-start justify-between p-3">
        {/* Back button */}
        <button
          onClick={onBack}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 active:bg-black/80"
          title="Back"
        >
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

        {/* Fullscreen button */}
        <button
          onClick={onToggleFullscreen}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 active:bg-black/80"
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
      </div>

      {/* Bottom right: Gyro button (mobile only) */}
      {gyroAvailable && (
        <div className="absolute bottom-4 right-3">
          <button
            onClick={onToggleGyro}
            className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              gyroEnabled
                ? "bg-violet-500/80 text-white"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
