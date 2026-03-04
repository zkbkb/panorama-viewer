import { useCallback, useState } from "react";
import UploadScreen from "./components/UploadScreen";
import PanoramaViewer from "./components/PanoramaViewer";

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }, []);

  const handleBack = useCallback(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
  }, [imageUrl]);

  if (imageUrl) {
    return <PanoramaViewer imageUrl={imageUrl} onBack={handleBack} />;
  }

  return <UploadScreen onImageSelect={handleImageSelect} />;
}

export default App;
