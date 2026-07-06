"use client";

import { useState } from "react";
import { useCloudStash } from "./hooks/useCloudStash";
import { BucketManager } from "./components/BucketManager";
import { FileUploader } from "./components/FileUploader";
import { FileTable } from "./components/FileTable";
import { PresignedUrlPanel } from "./components/PresignedUrlPanel";
import type { PresignedUrlResult } from "./types/cloudStash.types";

interface ActiveLink {
  fileName: string;
  result: PresignedUrlResult;
}

export default function CloudStash() {
  const {
    buckets,
    files,
    selectedBucket,
    isLoadingBuckets,
    isLoadingFiles,
    isUploading,
    error,
    selectBucket,
    uploadFile,
    deleteFile,
    generatePresignedUrl,
  } = useCloudStash();

  const [activeLink, setActiveLink] = useState<ActiveLink | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleGenerateLink = async (fileId: string) => {
    const file = files.find((candidate) => candidate.id === fileId);
    if (!file) {
      return;
    }

    setLinkError(null);
    try {
      const result = await generatePresignedUrl(fileId);
      setActiveLink({ fileName: file.originalFileName, result });
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Failed to generate link");
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-6">
      <header className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Cloud Stash</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl font-mono">
            Object Storage — Presigned URLs, Bucket Management &amp; File Metadata
          </p>
        </div>
      </header>

      {(error ?? linkError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
          <span className="font-bold uppercase tracking-widest text-xs">Error:</span>
          {error ?? linkError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 md:col-span-1">
          <BucketManager
            buckets={buckets}
            selectedBucket={selectedBucket}
            isLoading={isLoadingBuckets}
            onSelectBucket={selectBucket}
          />

          <FileUploader
            onUpload={uploadFile}
            isUploading={isUploading}
            disabled={!selectedBucket}
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <FileTable
            files={files}
            isLoading={isLoadingFiles}
            onGenerateLink={handleGenerateLink}
            onDeleteFile={deleteFile}
          />

          {activeLink && (
            <PresignedUrlPanel
              fileName={activeLink.fileName}
              url={activeLink.result.url}
              expiresAt={activeLink.result.expiresAt}
              onClose={() => setActiveLink(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}