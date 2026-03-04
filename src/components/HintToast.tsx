import { useEffect, useState } from "react";

interface HintToastProps {
  gyroEnabled: boolean;
}

export default function HintToast({
  gyroEnabled,
}: HintToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const isMobile =
    typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

  let text: string;
  if (gyroEnabled) {
    text = "Move your phone to explore";
  } else if (isMobile) {
    text = "Drag to look around \u00B7 Pinch to zoom";
  } else {
    text = "Drag to look around \u00B7 Scroll to zoom";
  }

  return (
    <div
      className={`pointer-events-none fixed bottom-12 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="rounded-full bg-black/60 px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm">
        {text}
      </div>
    </div>
  );
}
