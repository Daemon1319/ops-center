"use client";

import { useState, useEffect, useCallback } from "react";
import { useTaskYard } from "./hooks/useTaskYard";
import { useEventStream } from "./hooks/useEventStream";
import { Job, OutboxEntry, StatsResponse, ChaosState, CreateJobRequest, FloodRequest, ChaosRequest } from "./types/taskYard.types";

import StatsBar from "./components/StatsBar";
import CreateJobPanel from "./components/CreateJobPanel";
import FloodPanel from "./components/FloodPanel";
import ChaosPanel from "./components/ChaosPanel";
import JobBoard from "./components/JobBoard";
import DeadLetterInspector from "./components/DeadLetterInspector";
import PipelineVisualizer from "./components/PipelineVisualizer";
import OutboxLedger from "./components/OutboxLedger";

export default function TaskYard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [deadLetterJobs, setDeadLetterJobs] = useState<Job[]>([]);
  const [outboxEntries, setOutboxEntries] = useState<OutboxEntry[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [chaosState, setChaosState] = useState<ChaosState | null>(null);

  const {
    createJob,
    floodJobs,
    listJobs,
    listDeadLetterJobs,
    getOutboxEntries,
    retryJob,
    getStats,
    getChaosState,
    updateChaos,
    reset,
    isLoading,
  } = useTaskYard();

  const { events, connected, clearEvents } = useEventStream();

  // --- Core API Fetchers ---

  const fetchBoard = useCallback(async () => {
    try {
      const [allJobs, dlJobs, jobStats, obEntries] = await Promise.all([
        listJobs(),
        listDeadLetterJobs(),
        getStats(),
        getOutboxEntries(),
      ]);
      setJobs(allJobs);
      setDeadLetterJobs(dlJobs);
      setStats(jobStats);
      setOutboxEntries(obEntries);
    } catch (err) {
      console.error("Failed to poll board", err);
    }
  }, [listJobs, listDeadLetterJobs, getStats, getOutboxEntries]);

  const fetchChaosState = useCallback(async () => {
    try {
      const state = await getChaosState();
      setChaosState(state);
    } catch (err) {
      console.error("Failed to fetch chaos state", err);
    }
  }, [getChaosState]);

  // --- Lifecycles ---

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoard();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChaosState();
  }, [fetchBoard, fetchChaosState]);

  // Background Polling (Every 2 seconds)
  useEffect(() => {
    const interval = setInterval(fetchBoard, 2000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  // --- Event Handlers ---

  const handleCreateJob = async (req: CreateJobRequest) => {
    await createJob(req);
    await fetchBoard();
  };

  const handleFloodJobs = async (req: FloodRequest) => {
    await floodJobs(req);
    await fetchBoard();
  };

  const handleUpdateChaos = async (req: ChaosRequest) => {
    const updated = await updateChaos(req);
    setChaosState(updated);
  };

  const handleRetryJob = async (id: string) => {
    await retryJob(id);
    await fetchBoard();
  };

  const handleReset = async () => {
    await reset();
    clearEvents();
    await fetchBoard();
  };

  return (
    <section className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-6">

      {/* HEADER */}
      <header className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Task Yard</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl font-mono">
            Outbox Pattern, Message Queues — Retry, Backoff &amp; Dead Letter Recovery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-6 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-sm font-bold transition-colors border border-red-900/50 uppercase tracking-widest disabled:opacity-50"
          >
            Reset Everything
          </button>
        </div>
      </header>

      {/* PIPELINE VISUALIZER */}
      <PipelineVisualizer events={events} connected={connected} stats={stats} outboxEntries={outboxEntries} />

      {/* STATS BAR */}
      <StatsBar stats={stats} />

      {/* CONTROL PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CreateJobPanel onCreate={handleCreateJob} isLoading={isLoading} />
        <FloodPanel onFlood={handleFloodJobs} isLoading={isLoading} />
        <ChaosPanel chaosState={chaosState} onUpdate={handleUpdateChaos} isLoading={isLoading} />
      </div>

      {/* JOB BOARD */}
      <JobBoard jobs={jobs} />

      {/* OUTBOX LEDGER */}
      <OutboxLedger entries={outboxEntries} />

      {/* DEAD LETTER INSPECTOR */}
      <DeadLetterInspector
        deadLetterJobs={deadLetterJobs}
        onRetry={handleRetryJob}
        isLoading={isLoading}
      />

    </section>
  );
}