import { useEffect, useRef } from "react";
import { OutboxEntry, OutboxStatus } from "../types/taskYard.types";

interface OutboxLedgerProps {
  entries: OutboxEntry[];
}

/* ── Status badge config ────────────────────────────────────────────── */

const STATUS_CONFIG: Record<OutboxStatus, { label: string; bg: string; text: string; dot: string; glow: string }> = {
  PENDING:    { label: "Pending",    bg: "bg-slate-800", text: "text-slate-300", dot: "bg-slate-400",   glow: "" },
  DISPATCHED: { label: "Dispatched", bg: "bg-blue-950",  text: "text-blue-300",  dot: "bg-blue-400",    glow: "shadow-[0_0_6px_rgba(96,165,250,0.5)]" },
  CONFIRMED:  { label: "Confirmed",  bg: "bg-emerald-950", text: "text-emerald-300", dot: "bg-emerald-400", glow: "shadow-[0_0_6px_rgba(52,211,153,0.5)]" },
  FAILED:     { label: "Failed",     bg: "bg-red-950",   text: "text-red-300",   dot: "bg-red-400",     glow: "shadow-[0_0_6px_rgba(248,113,113,0.5)]" },
};

/* ── Relative time helper ───────────────────────────────────────────── */

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 1000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

/* ── 3-step progress dots ───────────────────────────────────────────── */

function ProgressDots({ status }: { status: OutboxStatus }) {
  const steps: OutboxStatus[] = ["PENDING", "DISPATCHED", "CONFIRMED"];
  const currentIdx = status === "FAILED" ? -1 : steps.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        let dotClass = "bg-slate-700";
        if (status === "FAILED" && i === 0) {
          dotClass = "bg-red-500";
        } else if (i <= currentIdx) {
          dotClass = i === currentIdx ? STATUS_CONFIG[status].dot : "bg-emerald-500";
        }

        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full transition-all duration-500 ${dotClass} ${
                i === currentIdx ? STATUS_CONFIG[status].glow : ""
              }`}
            />
            {i < steps.length - 1 && (
              <div
                className={`w-4 h-px transition-colors duration-500 ${
                  i < currentIdx ? "bg-emerald-600" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function OutboxLedger({ entries }: OutboxLedgerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(entries.length);

  // Auto-scroll to top when new entries arrive
  useEffect(() => {
    if (entries.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevCountRef.current = entries.length;
  }, [entries.length]);

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
            Outbox Ledger
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">
            {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
          </span>
          <div className="flex items-center gap-1.5">
            {(["PENDING", "DISPATCHED", "CONFIRMED", "FAILED"] as OutboxStatus[]).map((s) => {
              const count = entries.filter((e) => e.status === s).length;
              if (count === 0) return null;
              const cfg = STATUS_CONFIG[s];
              return (
                <span
                  key={s}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black ${cfg.bg} ${cfg.text}`}
                >
                  {count} {cfg.label.toLowerCase()}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500 font-medium">
          No outbox entries yet. Create a job to see the outbox pattern in action.
        </div>
      ) : (
        <div ref={scrollRef} className="overflow-y-auto max-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 sticky top-0">
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Job
                </th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Destination
                </th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Progress
                </th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Timeline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {entries.map((entry, idx) => {
                const cfg = STATUS_CONFIG[entry.status];
                // eslint-disable-next-line react-hooks/purity
                const isNew = idx < 3 && Date.now() - new Date(entry.createdAt).getTime() < 5000;

                return (
                  <tr
                    key={entry.id}
                    className={`transition-all duration-500 ${
                      isNew ? "bg-slate-800/40" : "hover:bg-slate-900/40"
                    }`}
                  >
                    {/* Job ID */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-slate-300 font-bold">
                        #{entry.jobId.slice(-6)}
                      </span>
                    </td>

                    {/* Destination */}
                    <td className="px-3 py-3">
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded">
                        {entry.destination}
                      </span>
                    </td>

                    {/* Progress dots */}
                    <td className="px-3 py-3">
                      <ProgressDots status={entry.status} />
                    </td>

                    {/* Status badge */}
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} ${cfg.glow}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Timeline */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5 text-[9px] font-mono text-slate-500">
                        <span>
                          created {relativeTime(entry.createdAt)}
                        </span>
                        {entry.dispatchedAt && (
                          <span className="text-blue-500">
                            dispatched {relativeTime(entry.dispatchedAt)}
                          </span>
                        )}
                        {entry.confirmedAt && (
                          <span className="text-emerald-500">
                            confirmed {relativeTime(entry.confirmedAt)}
                          </span>
                        )}
                        {entry.error && (
                          <div className="mt-2 text-xs text-red-400 bg-red-950/30 px-3 py-2 rounded-md border border-red-900/50 break-all">
                          <span className="font-bold mr-2">Error:</span> {entry.error}
                        </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
