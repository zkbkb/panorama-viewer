import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import UploadScreen from "./components/UploadScreen";
import PanoramaViewer from "./components/PanoramaViewer";

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    // Revoke previous URL to avoid memory leak on repeated selections
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    imageUrlRef.current = url;
    setImageUrl(url);
  }, []);

  const handleBack = useCallback(() => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    setImageUrl(null);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {imageUrl ? (
        <motion.div
          key="viewer"
          className="h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PanoramaViewer imageUrl={imageUrl} onBack={handleBack} />
        </motion.div>
      ) : (
        <motion.div
          key="upload"
          className="h-full w-full"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35 }}
        >
          <UploadScreen onImageSelect={handleImageSelect} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
