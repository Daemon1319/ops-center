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
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Presigned Link
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 transition hover:text-slate-300"
        >
          Close
        </button>
      </div>

      <p className="mb-2 truncate text-sm text-slate-300" title={fileName}>
        {fileName}
      </p>

      {isExpired ? (
        <p className="text-sm text-red-400">This link has expired. Generate a new one.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 truncate rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-300"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md border border-slate-600 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-700"
            >
              Open
            </a>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Expires in <span className="font-mono text-slate-300">{formatCountdown(secondsRemaining)}</span>
          </p>
        </>
      )}
    </section>
  );
}