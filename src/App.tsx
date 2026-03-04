import { useCallback, useEffect, useRef, useState } from "react";
import UploadScreen from "./components/UploadScreen";
import PanoramaViewer from "./components/PanoramaViewer";

type ViewState =
  | { screen: "upload" }
  | { screen: "viewer"; imageUrl: string }
  | { screen: "transition-to-viewer"; imageUrl: string }
  | { screen: "transition-to-upload"; imageUrl: string };

function App() {
  const [view, setView] = useState<ViewState>({ screen: "upload" });
  const imageUrlRef = useRef<string | null>(null);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    const url = URL.createObjectURL(file);
    imageUrlRef.current = url;
    // Start fade-out of upload screen
    setView({ screen: "transition-to-viewer", imageUrl: url });
  }, []);

  const handleBack = useCallback(() => {
    if (view.screen === "viewer") {
      setView({ screen: "transition-to-upload", imageUrl: (view as { imageUrl: string }).imageUrl });
    }
  }, [view]);

  // Handle transition completion
  const handleTransitionEnd = useCallback(() => {
    if (view.screen === "transition-to-viewer") {
      setView({ screen: "viewer", imageUrl: (view as { imageUrl: string }).imageUrl });
    } else if (view.screen === "transition-to-upload") {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
      setView({ screen: "upload" });
    }
  }, [view]);

  const isUpload = view.screen === "upload" || view.screen === "transition-to-viewer";
  const isViewer = view.screen === "viewer" || view.screen === "transition-to-upload";
  const imageUrl = "imageUrl" in view ? view.imageUrl : null;

  const fadeOut =
    view.screen === "transition-to-viewer" || view.screen === "transition-to-upload";

  return (
    <div className="relative h-full w-full">
      {isUpload && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}
          onTransitionEnd={view.screen === "transition-to-viewer" ? handleTransitionEnd : undefined}
        >
          <UploadScreen onImageSelect={handleImageSelect} />
        </div>
      )}
      {isViewer && imageUrl && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}
          onTransitionEnd={view.screen === "transition-to-upload" ? handleTransitionEnd : undefined}
        >
          <PanoramaViewer imageUrl={imageUrl} onBack={handleBack} />
        </div>
      )}
    </div>
  );
}

export default App;
