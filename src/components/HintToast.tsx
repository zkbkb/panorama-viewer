import { useEffect, useState } from "react";

interface HintToastProps {
  gyroEnabled: boolean;
}

function readHintSeen(): boolean {
  try {
    return localStorage.getItem("panorama.hint.seen") === "1";
  } catch {
    return false;
  }
}

export default function HintToast({
  gyroEnabled,
}: HintToastProps) {
  const [visible, setVisible] = useState(true);
  const [hasSeenHint] = useState(readHintSeen);

  useEffect(() => {
    const duration = hasSeenHint ? 2200 : 4500;
    const timer = setTimeout(() => setVisible(false), duration);

    if (!hasSeenHint) {
      try {
        localStorage.setItem("panorama.hint.seen", "1");
      } catch {
        // Ignore storage failures
      }
    }

    return () => clearTimeout(timer);
  }, [hasSeenHint]);

  const isMobile =
    typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

  let text: string;
  if (gyroEnabled) {
    text = hasSeenHint ? "Move phone" : "Move your phone to explore";
  } else if (isMobile) {
    text = hasSeenHint
      ? "Drag to look \u00B7 Pinch"
      : "Drag to look around \u00B7 Pinch to zoom";
  } else {
    text = hasSeenHint
      ? "Drag to look \u00B7 Scroll"
      : "Drag to look around \u00B7 Scroll to zoom";
  }

  if (!visible) return null;

  return (
    <div className="pointer-events-none transition-opacity duration-700">
      <div className="rounded-full bg-black/60 px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm">
        {text}
      </div>
    </div>
  );
}
