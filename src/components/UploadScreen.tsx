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

        {/* GitHub link */}
        <a
          href="https://github.com/zkbkb/panorama-viewer"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  );
}
