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
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Upload
      </h2>

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
        className={`flex min-h-32 flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-8 text-center text-sm transition ${
          isDragOver
            ? "border-blue-500 bg-blue-950/40"
            : "border-slate-600 bg-slate-900"
        } ${isInteractive ? "cursor-pointer hover:border-slate-500" : "cursor-not-allowed opacity-50"}`}
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
          <p className="text-slate-300">Uploading…</p>
        ) : disabled ? (
          <p className="text-slate-500">Select a bucket to enable uploads</p>
        ) : (
          <>
            <p className="text-slate-300">Drag and drop files here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Max 50MB per file</p>
          </>
        )}
      </div>
    </section>
  );
}