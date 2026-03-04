import { useCallback, useEffect, useMemo, useState } from "react";
import HintToast from "./HintToast";
import Dock, { type DockItemData } from "./ui/Dock";
import { isMobile } from "../utils/device";

interface ViewerControlsProps {
  onBack: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  gyroAvailable: boolean;
  gyroEnabled: boolean;
  onToggleGyro: () => void | Promise<void>;
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

  const handleGyroToggle = useCallback(() => {
    Promise.resolve(onToggleGyro()).catch(console.error);
  }, [onToggleGyro]);

  const handleEnableFromPrompt = () => {
    setShowGyroPrompt(false);
    handleGyroToggle();
  };

  const btnClass =
    "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70 active:bg-black/80 hover:scale-105";

  // Build dock items dynamically based on state
  const dockItems = useMemo(() => {
    const items: DockItemData[] = [];

    // Fullscreen toggle
    if (document.fullscreenEnabled) {
      items.push({
        icon: isFullscreen ? (
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        ),
        label: isFullscreen ? "Exit fullscreen" : "Fullscreen",
        onClick: onToggleFullscreen,
      });
    }

    // Gyro toggle
    if (gyroAvailable) {
      items.push({
        icon: (
          <svg className={`h-5 w-5 ${gyroEnabled ? "text-violet-400" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" strokeLinecap="round" />
            <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        ),
        label: gyroEnabled ? "Disable gyroscope" : "Enable gyroscope",
        onClick: handleGyroToggle,
        className: gyroEnabled ? "!bg-white/15 !border-violet-400/50" : "",
      });

      // Recenter — only when gyro active
      if (gyroEnabled) {
        items.push({
          icon: (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
          ),
          label: "Recenter view",
          onClick: onRecenter,
        });

        // Horizon lock
        items.push({
          icon: (
            <svg className={`h-5 w-5 ${horizonLocked ? "text-violet-400" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="9" width="18" height="6" rx="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          ),
          label: horizonLocked ? "Unlock horizon" : "Lock horizon",
          onClick: onToggleHorizonLock,
          className: horizonLocked ? "!bg-white/15 !border-violet-400/50" : "",
        });
      }
    }

    return items;
  }, [isFullscreen, gyroAvailable, gyroEnabled, horizonLocked, onToggleFullscreen, handleGyroToggle, onRecenter, onToggleHorizonLock]);

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Top bar — back button only */}
      <div className="flex items-start justify-between p-3">
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
      </div>

      {/* Bottom area — safe-area aware */}
      <div
        className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-3 p-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Center: stacked messages */}
        <div className="flex flex-col items-center gap-2">
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

        {/* Dock toolbar */}
        {dockItems.length > 0 && (
          <div className="pointer-events-auto">
            <Dock
              items={dockItems}
              magnification={58}
              distance={120}
              panelHeight={52}
              baseItemSize={44}
            />
          </div>
        )}
      </div>
    </div>
  );
}
