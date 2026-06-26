import { Job, JobStatus, JOB_STATUSES } from "../types/taskYard.types";
import JobCard from "./JobCard";

interface JobBoardProps {
  jobs: Job[];
}

const STATUS_LABELS: Record<JobStatus, string> = {
  QUEUED: "Queued",
  PROCESSING: "Processing",
  RETRYING: "Retrying",
  COMPLETED: "Completed",
  DEAD_LETTER: "Dead Letter",
};

const COLUMN_HEADER: Record<JobStatus, string> = {
  QUEUED: "bg-gray-100 text-gray-600 border-gray-200",
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  RETRYING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEAD_LETTER: "bg-red-100 text-red-700 border-red-200",
};

const COLUMN_DOT: Record<JobStatus, string> = {
  QUEUED: "bg-gray-400",
  PROCESSING: "bg-blue-500",
  RETRYING: "bg-yellow-500",
  COMPLETED: "bg-emerald-500",
  DEAD_LETTER: "bg-red-500",
};

interface ColumnProps {
  status: JobStatus;
  jobs: Job[];
}

function Column({ status, jobs }: ColumnProps) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest ${COLUMN_HEADER[status]}`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${COLUMN_DOT[status]}`}></span>
          <span>{STATUS_LABELS[status]}</span>
        </div>
        <span className="font-mono">{jobs.length}</span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-1">
        {jobs.length === 0 ? (
          <div className="text-center text-[10px] text-gray-400 font-medium py-6 border border-dashed border-gray-200 rounded-lg">
            Empty
          </div>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}

export default function JobBoard({ jobs }: JobBoardProps) {
  const byStatus = JOB_STATUSES.reduce<Record<JobStatus, Job[]>>(
    (acc, status) => {
      acc[status] = jobs.filter((j) => j.status === status);
      return acc;
    },
    { QUEUED: [], PROCESSING: [], RETRYING: [], COMPLETED: [], DEAD_LETTER: [] }
  );

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="grid grid-cols-5 gap-3">
        {JOB_STATUSES.map((status) => (
          <Column key={status} status={status} jobs={byStatus[status]} />
        ))}
      </div>
    </div>
  );
}