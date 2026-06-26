import { JOB_STATUSES, JobStatus, StatsResponse } from "../types/taskYard.types";

interface StatsBarProps {
  stats: StatsResponse | null;
}

const STATUS_LABELS: Record<JobStatus, string> = {
  QUEUED: "Queued",
  PROCESSING: "Processing",
  RETRYING: "Retrying",
  COMPLETED: "Completed",
  DEAD_LETTER: "Dead Letter",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  QUEUED: "bg-gray-100 text-gray-700 border-gray-200",
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  RETRYING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEAD_LETTER: "bg-red-100 text-red-700 border-red-200",
};

export default function StatsBar({ stats }: StatsBarProps) {
  if (!stats) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-pulse flex items-center h-16">
        <div className="h-3 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
        <span className="text-xs font-black text-gray-800 uppercase tracking-widest">
          Queue Status
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {JOB_STATUSES.map((status) => (
          <div
            key={status}
            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border flex items-center gap-1.5 ${STATUS_COLORS[status]}`}
          >
            <span>{STATUS_LABELS[status]}</span>
            <span className="font-mono">{stats[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}