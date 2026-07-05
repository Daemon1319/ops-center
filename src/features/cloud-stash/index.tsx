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
    <div className="flex flex-col gap-6 bg-slate-900 p-6 text-white">
      <header>
        <h1 className="text-xl font-bold">Cloud Stash</h1>
        <p className="text-sm text-slate-400">
          Object Storage — Presigned URLs, Bucket Management &amp; File Metadata
        </p>
      </header>

      {(error ?? linkError) && (
        <div className="rounded-md border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300">
          {error ?? linkError}
        </div>
      )}

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
  );
}