"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ApiProblem,
  Bucket,
  FileMetadata,
  PresignedUrlResult,
  UploadResult,
} from "../types/cloudStash.types";

const API_URL = process.env.NEXT_PUBLIC_CLOUD_STASH_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new Error(problem?.detail ?? `Request failed with status ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export interface UseCloudStashResult {
  buckets: Bucket[];
  files: FileMetadata[];
  selectedBucket: string | null;
  isLoadingBuckets: boolean;
  isLoadingFiles: boolean;
  isUploading: boolean;
  error: string | null;
  selectBucket: (name: string | null) => void;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  generatePresignedUrl: (fileId: string) => Promise<PresignedUrlResult>;
}

export function useCloudStash(): UseCloudStashResult {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBuckets = useCallback(async () => {
    setIsLoadingBuckets(true);
    setError(null);
    try {
      const result = await request<Bucket[]>("/api/buckets");
      setBuckets(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load buckets");
    } finally {
      setIsLoadingBuckets(false);
    }
  }, []);

  const refreshFiles = useCallback(async (bucketName: string) => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const result = await request<FileMetadata[]>(
        `/api/files?bucketName=${encodeURIComponent(bucketName)}`
      );
      setFiles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    void refreshBuckets();
  }, [refreshBuckets]);

  useEffect(() => {
    if (selectedBucket) {
      void refreshFiles(selectedBucket);
    } else {
      setFiles([]);
    }
  }, [selectedBucket, refreshFiles]);

  const selectBucket = useCallback((name: string | null) => {
    setSelectedBucket(name);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!selectedBucket) {
        setError("Select a bucket before uploading");
        return;
      }

      const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
      if (file.size > MAX_UPLOAD_BYTES) {
        setError("File exceeds the 50 MB upload limit");
        return;
      }

      setIsUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucketName", selectedBucket);

        await request<UploadResult>("/api/files/upload", {
          method: "POST",
          body: formData,
        });
        await refreshFiles(selectedBucket);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [selectedBucket, refreshFiles]
  );

  const deleteFile = useCallback(
    async (fileId: string) => {
      setError(null);
      await request<void>(`/api/files/${fileId}`, { method: "DELETE" });
      if (selectedBucket) {
        await refreshFiles(selectedBucket);
      }
    },
    [selectedBucket, refreshFiles]
  );

  const generatePresignedUrl = useCallback(async (fileId: string) => {
    setError(null);
    return request<PresignedUrlResult>(`/api/files/${fileId}/presigned-url`);
  }, []);

  return {
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
  };
}