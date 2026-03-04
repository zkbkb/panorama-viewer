import { useCallback, useEffect, useRef, useState } from "react";
import Squares from "./ui/Squares";
import BlurText from "./ui/BlurText";
import ShinyText from "./ui/ShinyText";
import StarBorder from "./ui/StarBorder";

interface UploadScreenProps {
  onImageSelect: (file: File) => void;
}

export default function UploadScreen({ onImageSelect }: UploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aspectWarning, setAspectWarning] = useState<{ file: File } | null>(null);
  const validationIdRef = useRef(0);

  // Cancel any pending validation on unmount
  useEffect(() => {
    return () => { validationIdRef.current++; };
  }, []);

  const validateAndSelect = useCallback(
    (file: File) => {
      const id = ++validationIdRef.current;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (id !== validationIdRef.current) return; // stale
        const ratio = img.width / img.height;
        if (ratio < 1.8 || ratio > 2.2) {
          setAspectWarning({ file });
        } else {
          onImageSelect(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        if (id !== validationIdRef.current) return; // stale
        onImageSelect(file);
      };
      img.src = url;
    },
    [onImageSelect]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        validateAndSelect(file);
      }
    },
    [validateAndSelect]
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
    <div className="relative flex h-full w-full items-center justify-center bg-[#09090b] p-4">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="rgba(139, 92, 246, 0.12)"
          squareSize={44}
          hoverFillColor="rgba(139, 92, 246, 0.06)"
        />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
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

        {/* Animated title */}
        <BlurText
          text="360° Panorama Viewer"
          className="mb-2 text-2xl font-bold text-white justify-center"
          delay={80}
          animateBy="words"
          direction="bottom"
        />

        {/* Shiny subtitle */}
        <p className="mb-8 text-sm">
          <ShinyText
            text="Upload an equirectangular panorama image to explore it in 360°"
            speed={4}
            className="text-zinc-400"
          />
        </p>

        {/* Upload zone with animated border */}
        <StarBorder
          className="w-full"
          color={isDragOver ? "#8b5cf6" : "#6d28d9"}
          speed={isDragOver ? "3s" : "6s"}
          thickness={2}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`cursor-pointer rounded-[10px] p-10 transition-colors ${
              isDragOver
                ? "bg-violet-400/10"
                : "bg-[#09090b] hover:bg-zinc-900/80"
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
        </StarBorder>

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

        {/* Aspect ratio warning dialog */}
        {aspectWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="mx-4 max-w-sm rounded-2xl bg-zinc-900 p-6 text-center">
              <svg
                className="mx-auto mb-3 h-10 w-10 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="mb-1 text-sm font-medium text-white">
                Non-standard aspect ratio
              </p>
              <p className="mb-5 text-xs text-zinc-400">
                This image doesn't appear to be an equirectangular panorama (expected 2:1 ratio). It may appear distorted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAspectWarning(null)}
                  className="flex-1 rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onImageSelect(aspectWarning.file);
                    setAspectWarning(null);
                  }}
                  className="flex-1 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-400"
                >
                  Continue anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social links */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="https://github.com/zkbkb/panorama-viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition-colors hover:text-zinc-300"
            title="GitHub"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/kaibin-zhang"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition-colors hover:text-zinc-300"
            title="LinkedIn"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
