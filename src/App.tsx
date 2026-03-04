import { useCallback, useRef, useState } from "react";
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

  if (imageUrl) {
    return <PanoramaViewer imageUrl={imageUrl} onBack={handleBack} />;
  }

  return <UploadScreen onImageSelect={handleImageSelect} />;
}

export default App;
