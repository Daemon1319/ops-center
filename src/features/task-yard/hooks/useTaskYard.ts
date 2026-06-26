import { useState, useCallback } from "react";
import {
  Job,
  CreateJobRequest,
  FloodRequest,
  ChaosState,
  ChaosRequest,
  StatsResponse,
  JobStatus,
  OutboxEntry,
} from "../types/taskYard.types";

const extractErrorDetail = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string" && body.detail.length > 0) {
      return body.detail;
    }
  } catch {
    // Response body wasn't JSON (or was empty) — fall through to the generic message
  }
  return fallback;
};

export const useTaskYard = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getBaseUrl = () => process.env.NEXT_PUBLIC_TASK_YARD_API_URL;

  const createJob = useCallback(async (req: CreateJobRequest): Promise<Job> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!response.ok) {
        throw new Error(await extractErrorDetail(response, `Server error: ${response.status}`));
      }
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create job";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const floodJobs = useCallback(async (req: FloodRequest): Promise<Job[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/jobs/flood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!response.ok) {
        throw new Error(await extractErrorDetail(response, `Server error: ${response.status}`));
      }
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to flood jobs";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listJobs = useCallback(async (status?: JobStatus, limit?: number): Promise<Job[]> => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (limit) params.set("limit", String(limit));
      const query = params.toString();

      const response = await fetch(`${getBaseUrl()}/api/queue/jobs${query ? `?${query}` : ""}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch jobs";
      setError(msg);
      throw err;
    }
  }, []);

  const listDeadLetterJobs = useCallback(async (limit?: number): Promise<Job[]> => {
    setError(null);
    try {
      const query = limit ? `?limit=${limit}` : "";
      const response = await fetch(`${getBaseUrl()}/api/queue/jobs/dead-letter${query}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch dead-letter jobs";
      setError(msg);
      throw err;
    }
  }, []);

  const retryJob = useCallback(async (id: string): Promise<Job> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/jobs/${id}/retry`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(await extractErrorDetail(response, `Server error: ${response.status}`));
      }
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to retry job";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStats = useCallback(async (): Promise<StatsResponse> => {
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/stats`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch stats";
      setError(msg);
      throw err;
    }
  }, []);

  const getChaosState = useCallback(async (): Promise<ChaosState> => {
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/chaos`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch chaos state";
      setError(msg);
      throw err;
    }
  }, []);

  const updateChaos = useCallback(async (req: ChaosRequest): Promise<ChaosState> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/chaos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!response.ok) {
        throw new Error(await extractErrorDetail(response, `Server error: ${response.status}`));
      }
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update chaos mode";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset queue";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOutboxEntries = useCallback(async (): Promise<OutboxEntry[]> => {
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/queue/outbox`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch outbox entries";
      setError(msg);
      throw err;
    }
  }, []);

  return {
    createJob,
    floodJobs,
    listJobs,
    listDeadLetterJobs,
    retryJob,
    getStats,
    getOutboxEntries,
    getChaosState,
    updateChaos,
    reset,
    isLoading,
    error,
  };
};