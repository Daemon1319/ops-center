import { useEffect, useRef, useCallback, useState } from "react";
import { PipelineEvent, PIPELINE_EVENT_TYPES } from "../types/taskYard.types";

interface UseEventStreamOptions {
  onEvent?: (event: PipelineEvent) => void;
  maxHistory?: number;
  flushIntervalMs?: number;
}

const INITIAL_RETRY_DELAY_MS = 3000;
const MAX_RETRY_DELAY_MS = 30000;

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

  // Tracks the current backoff delay; resets to the initial value on
  // every successful connection.
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Cancel any pending reconnect attempt so we don't end up with
    // duplicate connections if connect() is called manually mid-backoff.
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const es = new EventSource(`${baseUrl}/api/queue/events`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      // Reset backoff after a successful connection.
      retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
    };

    es.onerror = () => {
      setConnected(false);
      if (es.readyState === EventSource.CLOSED) {
        const delay = retryDelayRef.current;
        retryTimeoutRef.current = setTimeout(() => connectRef.current?.(), delay);
        retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
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