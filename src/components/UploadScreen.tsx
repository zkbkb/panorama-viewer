import { useCallback, useRef, useState } from "react";

interface UploadScreenProps {
  onImageSelect: (file: File) => void;
}

export default function UploadScreen({ onImageSelect }: UploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#09090b] p-4">
      <div className="w-full max-w-md text-center">
        {/* Globe icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="h-20 w-20 text-violet-400"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="50" cy="50" r="45" strokeWidth="3" />
            <ellipse cx="50" cy="50" rx="45" ry="20" strokeWidth="2" />
            <ellipse cx="50" cy="50" rx="20" ry="45" strokeWidth="2" />
            <line
              x1="5"
              y1="50"
              x2="95"
              y2="50"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">
          360° Panorama Viewer
        </h1>
        <p className="mb-8 text-sm text-zinc-400">
          Upload an equirectangular panorama image to explore it in 360°
        </p>

        {/* Upload zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 transition-colors ${
            isDragOver
              ? "border-violet-400 bg-violet-400/10"
              : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900"
          }`}
        >
          <div className="mb-3 text-4xl">
            <svg
              className="mx-auto h-10 w-10 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p className="text-sm text-zinc-300">
            {isDragOver
              ? "Drop your panorama here"
              : "Click or drag & drop a panorama image"}
          </p>
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          Supports JPG, PNG, WebP
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
