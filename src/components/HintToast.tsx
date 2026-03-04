import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isMobile } from "../utils/device";

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

  let text: string;
  if (gyroEnabled) {
    text = "Move your phone to explore";
  } else if (isMobile) {
    text = "Drag to look around \u00B7 Pinch to zoom";
  } else {
    text = "Drag to look around \u00B7 Scroll to zoom";
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="rounded-full bg-black/60 px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm">
            {text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
