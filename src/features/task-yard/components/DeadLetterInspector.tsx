import { Job, JobType } from "../types/taskYard.types";

interface DeadLetterInspectorProps {
  deadLetterJobs: Job[];
  onRetry: (id: string) => void;
  isLoading: boolean;
}

const TYPE_INFO: Record<JobType, { label: string; abbr: string }> = {
  EMAIL: { label: "Email", abbr: "EML" },
  INVENTORY: { label: "Inventory", abbr: "INV" },
  WAREHOUSE: { label: "Warehouse", abbr: "WRH" },
  ANALYTICS: { label: "Analytics", abbr: "ANL" },
};

export default function DeadLetterInspector({
  deadLetterJobs,
  onRetry,
  isLoading,
}: DeadLetterInspectorProps) {
  return (
    <div className="bg-gray-950 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          <span className="text-xs font-black text-gray-100 uppercase tracking-widest">
            Dead Letter Inspector
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-500">
          {deadLetterJobs.length} job{deadLetterJobs.length !== 1 ? "s" : ""} awaiting recovery
        </span>
      </div>

      {deadLetterJobs.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-500 font-medium">
          No dead-lettered jobs. Nothing to recover right now.
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {deadLetterJobs.map((job) => {
            const { label, abbr } = TYPE_INFO[job.jobType];
            const shortId = job.id.slice(-6);

            return (
              <div
                key={job.id}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-[9px] font-black tracking-wider text-white bg-slate-800 px-1.5 py-0.5 rounded">
                    {abbr}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-200">{label}</span>
                    <span className="font-mono text-[10px] text-gray-500">#{shortId}</span>
                  </div>
                </div>

                <div className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2">
                  <p className="text-[11px] font-mono text-red-400 break-words">
                    {job.lastError ?? "No error message recorded"}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] font-mono text-gray-500">
                    {job.retryCount}/{job.maxRetries} retries
                  </span>
                  <button
                    onClick={() => onRetry(job.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Retrying..." : "Retry"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}