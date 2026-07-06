"use client";

import { useState, Fragment } from "react";
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
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 shrink-0">
        Files
      </h3>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading files…</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
          <p className="text-sm font-bold text-gray-500 mb-1">Bucket is Empty</p>
          <p className="text-xs text-gray-400">No files in this bucket yet.</p>
        </div>
      ) : (
        <div className="flex-1 -mx-6 px-6">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs font-black uppercase tracking-widest text-gray-500 bg-white sticky top-0">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4 hidden lg:table-cell">Size</th>
                <th className="py-3 pr-4 hidden lg:table-cell">Type</th>
                <th className="py-3 pr-4 hidden lg:table-cell">Uploaded</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <Fragment key={file.id}>
                  <tr className="border-b border-gray-100 text-gray-700 hover:bg-gray-50/80 transition-colors group">
                    <td 
                      className="max-w-[12rem] sm:max-w-64 py-3 pr-4 cursor-pointer hover:text-blue-600 transition-colors" 
                      title={file.originalFileName}
                      onClick={() => setExpandedFileId(expandedFileId === file.id ? null : file.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] text-gray-400 transition-transform lg:hidden ${expandedFileId === file.id ? "rotate-90 text-blue-500" : ""}`}>
                          &#9654;
                        </span>
                        <span className="truncate font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{file.originalFileName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 font-mono text-xs hidden lg:table-cell">{formatFileSize(file.fileSize)}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs hidden lg:table-cell">
                      <span 
                        className="inline-block max-w-[120px] truncate bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200 align-middle"
                        title={file.contentType}
                      >
                        {file.contentType}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap hidden lg:table-cell">
                      {dateFormatter.format(new Date(file.uploadedAt))}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => onGenerateLink(file.id)}
                          className="text-xs font-bold text-blue-600 transition hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
                        >
                          LINK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(file.id, file.originalFileName)}
                          disabled={deletingId === file.id}
                          className="text-xs font-bold text-red-600 transition hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === file.id ? "DELETING…" : "DELETE"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedFileId === file.id && (
                    <tr className="bg-blue-50/30 border-b border-gray-100 lg:hidden shadow-inner">
                      <td colSpan={5} className="py-3 px-4">
                        <div className="flex flex-col gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-400 uppercase tracking-widest w-20">Size</span> 
                            <span className="text-gray-700 font-mono">{formatFileSize(file.fileSize)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-400 uppercase tracking-widest w-20">Type</span> 
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 inline-block max-w-[200px] truncate">
                              {file.contentType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-400 uppercase tracking-widest w-20">Uploaded</span> 
                            <span className="text-gray-700">
                              {dateFormatter.format(new Date(file.uploadedAt))}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}