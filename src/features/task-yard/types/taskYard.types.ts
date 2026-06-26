export const JOB_TYPES = ["EMAIL", "INVENTORY", "WAREHOUSE", "ANALYTICS"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ["QUEUED", "PROCESSING", "RETRYING", "COMPLETED", "DEAD_LETTER"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Job {
  id: string;
  jobType: JobType;
  status: JobStatus;
  payload: string | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  nextRetryAt: string | null;
}

export interface CreateJobRequest {
  jobType: JobType;
}

export interface FloodRequest {
  count: number;
}

export interface ChaosState {
  enabled: boolean;
  failureRate: number;
}

export interface ChaosRequest {
  enabled: boolean;
  failureRate: number;
}

export type StatsResponse = Record<JobStatus, number>;

// --- Outbox types ---

export const OUTBOX_STATUSES = ["PENDING", "DISPATCHED", "CONFIRMED", "FAILED"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export interface OutboxEntry {
  id: string;
  jobId: string;
  destination: string;
  status: OutboxStatus;
  payload: string | null;
  createdAt: string;
  dispatchedAt: string | null;
  confirmedAt: string | null;
  error: string | null;
}

// --- Pipeline event types (SSE) ---

export const PIPELINE_EVENT_TYPES = [
  "JOB_CREATED",
  "OUTBOX_PENDING",
  "OUTBOX_DISPATCHED",
  "OUTBOX_CONFIRMED",
  "OUTBOX_FAILED",
  "JOB_PROCESSING",
  "JOB_COMPLETED",
  "JOB_RETRYING",
  "JOB_DEAD_LETTERED",
] as const;
export type PipelineEventType = (typeof PIPELINE_EVENT_TYPES)[number];

export interface PipelineEvent {
  type: PipelineEventType;
  timestamp: string;
  data: Record<string, string | number>;
}