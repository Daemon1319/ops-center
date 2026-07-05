"use client";

import { useState } from "react";
import type { FileMetadata } from "../types/cloudStash.types";

interface FileTableProps {
  files: FileMetadata[];
  isLoading: boolean;
  onGenerateLink: (fileId: string) => void;
  onDeleteFile: (fileId: string) => Promise<void>;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function FileTable({ files, isLoading, onGenerateLink, onDeleteFile }: FileTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (fileId: string, originalFileName: string) => {
    const confirmed = window.confirm(`Delete "${originalFileName}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    setDeletingId(fileId);
    try {
      await onDeleteFile(fileId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Files
      </h2>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-slate-500">No files in this bucket yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Uploaded</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-b border-slate-800 text-slate-200">
                  <td className="max-w-64 truncate py-2 pr-4" title={file.originalFileName}>
                    {file.originalFileName}
                  </td>
                  <td className="py-2 pr-4 text-slate-400">{formatFileSize(file.fileSize)}</td>
                  <td className="py-2 pr-4 text-slate-400">{file.contentType}</td>
                  <td className="py-2 pr-4 text-slate-400">
                    {dateFormatter.format(new Date(file.uploadedAt))}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => onGenerateLink(file.id)}
                        className="text-blue-400 transition hover:text-blue-300"
                      >
                        Generate link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(file.id, file.originalFileName)}
                        disabled={deletingId === file.id}
                        className="text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId === file.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}