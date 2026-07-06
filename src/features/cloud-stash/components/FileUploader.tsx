"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  disabled: boolean;
}

export function FileUploader({ onUpload, isUploading, disabled }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (fileList: FileList) => {
      for (const file of Array.from(fileList)) {
        await onUpload(file);
      }
    },
    [onUpload]
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) {
      return;
    }
    if (event.dataTransfer.files.length > 0) {
      void uploadFiles(event.dataTransfer.files);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      void uploadFiles(event.target.files);
    }
    event.target.value = "";
  };

  const isInteractive = !disabled && !isUploading;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex-1">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">
        Upload File
      </h3>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (isInteractive) {
            setIsDragOver(true);
          }
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => isInteractive && inputRef.current?.click()}
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        onKeyDown={(event) => {
          if (isInteractive && (event.key === "Enter" || event.key === " ")) {
            inputRef.current?.click();
          }
        }}
        className={`flex min-h-[12rem] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition-all ${
          isDragOver
            ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
        } ${isInteractive ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          disabled={!isInteractive}
          onChange={handleInputChange}
        />

        {isUploading ? (
          <p className="text-blue-600 font-bold animate-pulse tracking-wide">Uploading…</p>
        ) : disabled ? (
          <p className="text-gray-500 font-medium">Select a bucket to enable uploads</p>
        ) : (
          <>
            <p className="text-gray-700 font-bold mb-2">Drag and drop files here, or click to browse</p>
            <p className="mt-1 text-xs text-gray-500 font-mono">Max 50MB per file</p>
          </>
        )}
      </div>
    </div>
  );
}