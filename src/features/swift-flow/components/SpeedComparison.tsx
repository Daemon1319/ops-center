"use client";

import type { ComparisonResult } from "../types/swiftFlow.types";

interface SpeedComparisonProps {
  comparison: ComparisonResult | null;
}

function formatTime(ms: number): string {
  if (ms < 0.01) return "<0.01 ms";
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
  return `${ms.toFixed(2)} ms`;
}

function TimingBar({
  label,
  timeMs,
  maxTimeMs,
  color,
}: {
  label: string;
  timeMs: number;
  maxTimeMs: number;
  color: string;
}) {
  const pct = maxTimeMs > 0 ? Math.max((timeMs / maxTimeMs) * 100, 2) : 2;

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-slate-400">{label}</span>
      <div className="relative h-9 flex-1 overflow-hidden rounded bg-slate-900">
        <div
          className="h-full rounded transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <span className="absolute inset-y-0 right-3 flex items-center font-mono text-xs text-white">
          {formatTime(timeMs)}
        </span>
      </div>
    </div>
  );
}

export function SpeedComparison({ comparison }: SpeedComparisonProps) {
  if (!comparison) {
    return (
      <section className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800 flex flex-col justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <svg
            className="mb-3 h-10 w-10 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="text-sm">Select a product and click Compare to see the speed difference</p>
        </div>
      </section>
    );
  }

  const maxTime = Math.max(comparison.directTimeMs, comparison.cachedTimeMs, 0.01);
  const isCacheHit = comparison.cachedTimeMs < comparison.directTimeMs * 0.5;
  const speedupDisplay =
    comparison.speedup === Infinity
      ? "∞"
      : comparison.speedup >= 1000
        ? `${(comparison.speedup / 1000).toFixed(1)}K`
        : comparison.speedup.toFixed(1);

  return (
    <section className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800 flex flex-col justify-center h-full min-h-[200px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Speed Comparison
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {comparison.productName}
            <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
              {comparison.productCategory}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
              isCacheHit
                ? "bg-emerald-900/50 text-emerald-400"
                : "bg-amber-900/50 text-amber-400"
            }`}
          >
            {isCacheHit ? "Cache Hit" : "Cache Miss"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <TimingBar
          label="Direct"
          timeMs={comparison.directTimeMs}
          maxTimeMs={maxTime}
          color="#6366f1"
        />
        <TimingBar
          label="Cached"
          timeMs={comparison.cachedTimeMs}
          maxTimeMs={maxTime}
          color="#10b981"
        />
      </div>

      {isCacheHit && (
        <div className="mt-4 flex items-baseline justify-center gap-2 rounded-md bg-slate-900 py-3">
          <span className="text-3xl font-bold text-emerald-400">{speedupDisplay}×</span>
          <span className="text-sm text-slate-400">faster with cache</span>
        </div>
      )}

      {!isCacheHit && (
        <p className="mt-3 text-center text-xs text-slate-500">
          This was a cache miss — the value is now cached. Compare again to see the speedup.
        </p>
      )}
    </section>
  );
}
