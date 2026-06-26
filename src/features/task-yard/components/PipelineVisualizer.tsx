import { useEffect, useRef, useState } from "react";
import { PipelineEvent, PipelineEventType, StatsResponse, OutboxEntry } from "../types/taskYard.types";

interface PipelineVisualizerProps {
  events: PipelineEvent[];
  connected: boolean;
  stats: StatsResponse | null;
  outboxEntries: OutboxEntry[];
}

/* ── Stage definitions ──────────────────────────────────────────────── */

interface Stage {
  id: string;
  label: string;
  color: string;      // bg + text for the node
  glow: string;       // box-shadow color
  dotColor: string;   // animated particle / badge color
}

const STAGES: Stage[] = [
  { id: "db",       label: "DB Write",  color: "bg-slate-700  text-slate-200", glow: "rgba(100,116,139,0.5)", dotColor: "#94a3b8" },
  { id: "outbox",   label: "Outbox",    color: "bg-amber-900/60 text-amber-200",  glow: "rgba(217,119,6,0.4)",   dotColor: "#f59e0b" },
  { id: "queue",    label: "Message Queue", color: "bg-blue-900/60 text-blue-200",   glow: "rgba(59,130,246,0.4)",  dotColor: "#60a5fa" },
  { id: "worker",   label: "Worker",    color: "bg-cyan-900/60 text-cyan-200",   glow: "rgba(6,182,212,0.4)",   dotColor: "#22d3ee" },
  { id: "done",     label: "Complete",  color: "bg-emerald-900/60 text-emerald-200", glow: "rgba(16,185,129,0.4)", dotColor: "#34d399" },
];

const BRANCH_STAGES: { retry: Stage; dlq: Stage } = {
  retry: { id: "retry", label: "Retry Queue", color: "bg-yellow-900/60 text-yellow-200", glow: "rgba(234,179,8,0.4)",  dotColor: "#facc15" },
  dlq:   { id: "dlq",   label: "Dead Letter", color: "bg-red-900/60 text-red-200",     glow: "rgba(239,68,68,0.5)", dotColor: "#f87171" },
};

/* ── Particle (animated dot) ────────────────────────────────────────── */

interface Particle {
  id: string;
  from: string;
  to: string;
  color: string;
  createdAt: number;
}

/* ── Map an SSE event to a particle (from → to + color) ─────────────── */

function eventToParticle(event: PipelineEvent): Particle | null {
  const map: Partial<Record<PipelineEventType, { from: string; to: string; color: string }>> = {
    JOB_CREATED:       { from: "db",       to: "outbox",   color: "#94a3b8" },
    OUTBOX_PENDING:    { from: "outbox",   to: "outbox",   color: "#f59e0b" },
    OUTBOX_DISPATCHED: { from: "outbox",   to: "queue",    color: "#60a5fa" },
    OUTBOX_CONFIRMED:  { from: "queue",    to: "queue",    color: "#60a5fa" },
    JOB_PROCESSING:    { from: "queue",    to: "worker",   color: "#22d3ee" },
    JOB_COMPLETED:     { from: "worker",   to: "done",     color: "#34d399" },
    JOB_RETRYING:      { from: "worker",   to: "retry",    color: "#facc15" },
    JOB_DEAD_LETTERED: { from: "worker",   to: "dlq",      color: "#f87171" },
  };

  const spec = map[event.type];
  if (!spec) return null;

  return {
    id: `${event.type}-${event.timestamp}-${Math.random().toString(36).slice(2, 6)}`,
    ...spec,
    createdAt: Date.now(),
  };
}

/* ── Build current-state counters from stats + outbox ────────────────── */

function buildCounters(
  stats: StatsResponse | null,
  outboxEntries: OutboxEntry[]
): Record<string, number> {
  if (!stats) return {};

  const total =
    (stats.QUEUED ?? 0) +
    (stats.PROCESSING ?? 0) +
    (stats.RETRYING ?? 0) +
    (stats.COMPLETED ?? 0) +
    (stats.DEAD_LETTER ?? 0);

  // Count outbox entries currently in transient states
  const outboxPending = outboxEntries.filter((e) => e.status === "PENDING").length;
  const outboxDispatched = outboxEntries.filter((e) => e.status === "DISPATCHED").length;

  // The DB immediately marks jobs as QUEUED, but physically they haven't 
  // reached RabbitMQ yet if they are still stuck in the Outbox.
  // We subtract the outbox backlog from the queue count so the visualizer 
  // correctly shows 0 in the Queue until the background relay actually sends them.
  const physicalQueue = Math.max(0, (stats.QUEUED ?? 0) - outboxPending - outboxDispatched);

  return {
    db: total,                               // total jobs ever created
    outbox: outboxPending,                    // currently pending dispatch
    queue: physicalQueue,                     // actually waiting in RabbitMQ
    worker: stats.PROCESSING ?? 0,            // currently being processed
    done: stats.COMPLETED ?? 0,               // successfully completed
    retry: stats.RETRYING ?? 0,               // waiting in retry queue
    dlq: stats.DEAD_LETTER ?? 0,              // dead-lettered
  };
}

/* ── Component ──────────────────────────────────────────────────────── */

const PARTICLE_LIFETIME_MS = 800;

export default function PipelineVisualizer({ events, connected, stats, outboxEntries }: PipelineVisualizerProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevEventsLength = useRef(events.length);

  // Spawn particles for new events
  useEffect(() => {
    if (events.length <= prevEventsLength.current) {
      prevEventsLength.current = events.length;
      return;
    }

    const newEvents = events.slice(0, events.length - prevEventsLength.current);
    prevEventsLength.current = events.length;

    const newParticles = newEvents
      .map(eventToParticle)
      .filter((p): p is Particle => p !== null);

    if (newParticles.length > 0) {
      setParticles((prev) => [...newParticles, ...prev].slice(0, 60));
    }
  }, [events]);

  // Garbage-collect old particles
  useEffect(() => {
    const timer = setInterval(() => {
      setParticles((prev) => {
        if (prev.length === 0) return prev;
        const now = Date.now();
        const alive = prev.filter((p) => now - p.createdAt < PARTICLE_LIFETIME_MS);
        return alive.length === prev.length ? prev : alive;
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  const counters = buildCounters(stats, outboxEntries);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
            Message Pipeline
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"
            }`}
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {connected ? "Live" : "Reconnecting…"}
          </span>
        </div>
      </div>

      {/* Main pipeline (happy path) */}
      <div className="relative flex items-center justify-between gap-1 mb-6">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="flex items-center flex-1 min-w-0">
            <StageNode stage={stage} count={counters[stage.id] ?? 0} particles={particles} />
            {i < STAGES.length - 1 && <Arrow />}
          </div>
        ))}
      </div>

      {/* Branch lines */}
      <div className="flex items-start justify-center gap-16">
        <BranchNode stage={BRANCH_STAGES.retry} count={counters["retry"] ?? 0} label="Failed → Retry" particles={particles} />
        <BranchNode stage={BRANCH_STAGES.dlq} count={counters["dlq"] ?? 0} label="Exhausted → DLQ" particles={particles} />
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function StageNode({ stage, count, particles }: { stage: Stage; count: number; particles: Particle[] }) {
  // eslint-disable-next-line react-hooks/purity
  const isTarget = particles.some((p) => p.to === stage.id && Date.now() - p.createdAt < PARTICLE_LIFETIME_MS);

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-700/50 transition-all duration-300 ${stage.color} ${
        isTarget ? "scale-105" : ""
      }`}
      style={{
        boxShadow: isTarget ? `0 0 20px ${stage.glow}, 0 0 40px ${stage.glow}` : `0 0 0px transparent`,
        minWidth: 80,
      }}
    >
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap pt-1">
        {stage.label}
      </span>
      {count > 0 && (
        <span
          className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center rounded-full text-[9px] font-black text-white px-1"
          style={{ backgroundColor: stage.dotColor }}
        >
          {count}
        </span>
      )}

      {/* Pulse ring when receiving a particle */}
      {isTarget && (
        <span
          className="absolute inset-0 rounded-xl animate-ping opacity-20"
          style={{ backgroundColor: stage.dotColor }}
        />
      )}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex-1 flex items-center mx-1">
      <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-slate-600" />
      <svg className="w-2 h-2 text-slate-600 -ml-px shrink-0" viewBox="0 0 8 8" fill="currentColor">
        <path d="M0 0 L8 4 L0 8 Z" />
      </svg>
    </div>
  );
}

function BranchNode({ stage, count, label, particles }: { stage: Stage; count: number; label: string; particles: Particle[] }) {
  // eslint-disable-next-line react-hooks/purity
  const isTarget = particles.some((p) => p.to === stage.id && Date.now() - p.createdAt < PARTICLE_LIFETIME_MS);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="h-4 w-px bg-slate-700" />
      <div
        className={`relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl border border-slate-700/50 transition-all duration-300 ${stage.color} ${
          isTarget ? "scale-105" : ""
        }`}
        style={{
          boxShadow: isTarget ? `0 0 20px ${stage.glow}, 0 0 40px ${stage.glow}` : `0 0 0px transparent`,
          minWidth: 100,
        }}
      >
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap pt-1">
        {stage.label}
      </span>
        {count > 0 && (
          <span
            className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center rounded-full text-[9px] font-black text-white px-1"
            style={{ backgroundColor: stage.dotColor }}
          >
            {count}
          </span>
        )}
        {isTarget && (
          <span
            className="absolute inset-0 rounded-xl animate-ping opacity-20"
            style={{ backgroundColor: stage.dotColor }}
          />
        )}
      </div>
    </div>
  );
}
