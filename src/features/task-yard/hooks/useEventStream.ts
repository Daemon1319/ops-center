import { useEffect, useRef, useCallback, useState } from "react";
import { PipelineEvent, PIPELINE_EVENT_TYPES } from "../types/taskYard.types";

interface UseEventStreamOptions {
  onEvent?: (event: PipelineEvent) => void;
  maxHistory?: number;
  flushIntervalMs?: number;
}

/**
 * Connects to the SSE pipeline event stream and returns a rolling history
 * of events.  Incoming events are **batched** and flushed on a timer to
 * avoid a render-storm when the backend emits hundreds of events in a
 * short burst (e.g. flooding 50 jobs at once).
 */
export function useEventStream({
  onEvent,
  maxHistory = 200,
  flushIntervalMs = 250,
}: UseEventStreamOptions = {}) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Fix recursive connect reference
  const connectRef = useRef<(() => void) | null>(null);

  // Accumulator: SSE listeners push here, the flush timer drains it.
  const bufferRef = useRef<PipelineEvent[]>([]);

  // --- Flush timer (single setEvents call per tick) ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (bufferRef.current.length === 0) return;

      const batch = bufferRef.current;
      bufferRef.current = [];

      setEvents((prev) => {
        const next = [...batch, ...prev];
        return next.length > maxHistory ? next.slice(0, maxHistory) : next;
      });
    }, flushIntervalMs);

    return () => clearInterval(timer);
  }, [maxHistory, flushIntervalMs]);

  // --- SSE connection ---
  const connect = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_TASK_YARD_API_URL;
    if (!baseUrl) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${baseUrl}/api/queue/events`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
      if (es.readyState === EventSource.CLOSED) {
        setTimeout(() => connectRef.current?.(), 3000);
      }
    };

    // Push into the buffer — never call setEvents directly here.
    for (const eventType of PIPELINE_EVENT_TYPES) {
      es.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const parsed: PipelineEvent = JSON.parse(e.data);
          bufferRef.current.push(parsed);
          onEventRef.current?.(parsed);
        } catch {
          // Ignore malformed events
        }
      });
    }
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect]);

  const clearEvents = useCallback(() => {
    bufferRef.current = [];
    setEvents([]);
  }, []);

  return { events, connected, clearEvents };
}
