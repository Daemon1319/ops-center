"use client";

import type { ComparisonResult } from "../types/swiftFlow.types";

interface ComparisonHistoryProps {
  comparisons: ComparisonResult[];
  onClear: () => void;
}

function formatTime(ms: number): string {
  if (ms < 0.01) return "<0.01 ms";
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
  return `${ms.toFixed(2)} ms`;
}

export function ComparisonHistory({ comparisons, onClear }: ComparisonHistoryProps) {
  if (comparisons.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-white">
          History
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 transition hover:text-slate-300"
        >
          Clear
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-slate-500">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Product</th>
              <th className="pb-2 pr-4 text-right font-medium">Direct</th>
              <th className="pb-2 pr-4 text-right font-medium">Cached</th>
              <th className="pb-2 text-right font-medium">Speedup</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c, i) => {
              const isCacheHit = c.cachedTimeMs < c.directTimeMs * 0.5;
              const speedupText =
                c.speedup === Infinity
                  ? "∞×"
                  : c.speedup >= 1000
                    ? `${(c.speedup / 1000).toFixed(1)}K×`
                    : `${c.speedup.toFixed(1)}×`;

              return (
                <tr
                  key={c.key}
                  className="border-b border-slate-700/50 last:border-0"
                >
                  <td className="py-2 pr-4 text-slate-500">
                    {comparisons.length - i}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{c.productName}</td>
                  <td className="py-2 pr-4 text-right font-mono text-indigo-400">
                    {formatTime(c.directTimeMs)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-emerald-400">
                    {formatTime(c.cachedTimeMs)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono font-semibold ${
                      isCacheHit ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {isCacheHit ? speedupText : "miss"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
