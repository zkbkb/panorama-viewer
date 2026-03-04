import { useEffect, useState } from "react";
import { isMobile } from "../utils/device";

interface HintToastProps {
  gyroEnabled: boolean;
}

export default function HintToast({
  gyroEnabled,
}: HintToastProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  let text: string;
  if (gyroEnabled) {
    text = "Move your phone to explore";
  } else if (isMobile) {
    text = "Drag to look around \u00B7 Pinch to zoom";
  } else {
    text = "Drag to look around \u00B7 Scroll to zoom";
  }

  return (
    <div className={`pointer-events-none transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="rounded-full bg-black/60 px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm">
        {text}
      </div>
    </div>
  );
}
