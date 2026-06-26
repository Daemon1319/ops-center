import { useEffect, useState } from "react";
import { Job, JobType, JobStatus } from "../types/taskYard.types";

interface JobCardProps {
  job: Job;
}

const TYPE_INFO: Record<JobType, { label: string; abbr: string }> = {
  EMAIL: { label: "Email", abbr: "EML" },
  INVENTORY: { label: "Inventory", abbr: "INV" },
  WAREHOUSE: { label: "Warehouse", abbr: "WRH" },
  ANALYTICS: { label: "Analytics", abbr: "ANL" },
};

const STATUS_BORDER: Record<JobStatus, string> = {
  QUEUED: "border-l-gray-400",
  PROCESSING: "border-l-blue-500",
  RETRYING: "border-l-yellow-500",
  COMPLETED: "border-l-emerald-500",
  DEAD_LETTER: "border-l-red-500",
};

export default function JobCard({ job }: JobCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Seed the countdown only when nextRetryAt itself changes (a new retry
  // attempt started) or the job leaves RETRYING — never on a plain poll
  // tick, or the countdown would stutter every 2 seconds.
  useEffect(() => {
    if (job.status === "RETRYING" && job.nextRetryAt) {
      const target = new Date(job.nextRetryAt).getTime();
      const secondsLeft = Math.max(0, Math.round((target - Date.now()) / 1000));
      setTimeLeft(secondsLeft);

      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [job.status, job.nextRetryAt]);

  const { label, abbr } = TYPE_INFO[job.jobType];
  const shortId = job.id.slice(-6);

  return (
    <div
      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 border-l-4 ${STATUS_BORDER[job.status]} flex flex-col gap-2`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black tracking-wider text-white bg-slate-800 px-1.5 py-0.5 rounded">
            {abbr}
          </span>
          <span className="text-xs font-bold text-gray-700">{label}</span>
        </div>
        <span className="font-mono text-[10px] text-gray-400">#{shortId}</span>
      </div>

      {job.retryCount > 0 && (
        <div className="self-start px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[9px] font-bold font-mono">
          {job.retryCount}/{job.maxRetries} retries
        </div>
      )}

      {job.status === "RETRYING" && timeLeft !== null && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded px-2 py-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-700">
            Next try in
          </span>
          <span className="font-mono font-black text-xs text-yellow-700">{timeLeft}s</span>
        </div>
      )}

      {job.status === "DEAD_LETTER" && job.lastError && (
        <div
          className="bg-red-50 border border-red-100 rounded px-2 py-1 text-[10px] text-red-700 font-mono truncate"
          title={job.lastError}
        >
          {job.lastError}
        </div>
      )}
    </div>
  );
}