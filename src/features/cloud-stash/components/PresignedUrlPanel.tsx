"use client";

import { useEffect, useState } from "react";

interface PresignedUrlPanelProps {
  fileName: string;
  url: string;
  expiresAt: string;
  onClose: () => void;
}

function secondsUntil(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PresignedUrlPanel({ fileName, url, expiresAt, onClose }: PresignedUrlPanelProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(() => secondsUntil(expiresAt));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSecondsRemaining(secondsUntil(expiresAt));
    const interval = setInterval(() => {
      setSecondsRemaining(secondsUntil(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const isExpired = secondsRemaining <= 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 shadow-sm mt-6 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-4 flex items-center justify-between border-b border-blue-100 pb-3">
        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Presigned Link Generated
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] font-bold text-blue-400 uppercase tracking-wider transition hover:text-blue-700 bg-white px-2 py-1 rounded border border-blue-200"
        >
          Close
        </button>
      </div>

      <p className="mb-3 truncate text-sm font-bold text-gray-800" title={fileName}>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-2">File:</span>
        {fileName}
      </p>

      {isExpired ? (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2 text-sm font-bold">
          <span className="text-lg leading-none">&#9888;</span> This link has expired. Generate a new one.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 truncate rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-xs font-mono text-gray-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-700 active:scale-95 shadow-sm"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-white border border-blue-200 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-blue-700 transition hover:bg-blue-50 hover:border-blue-300 active:scale-95 shadow-sm"
            >
              Open
            </a>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-500">
            Expires in:
            <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {formatCountdown(secondsRemaining)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}