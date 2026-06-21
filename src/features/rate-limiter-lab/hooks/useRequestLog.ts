import { useState, useCallback, useMemo } from "react";
import { RequestLogEntry } from "../types/rateLimiter.types";

export const useRequestLog = () => {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);

  const addLog = useCallback((entry: RequestLogEntry) => {
    setLogs((prevLogs) => {
      // Add the new log to the top of the feed and keep only the latest 50
      const updatedLogs = [entry, ...prevLogs];
      return updatedLogs.slice(0, 50);
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // useMemo ensures these derived arrays only recalculate when the logs array actually changes
  const botLogs = useMemo(() => logs.filter((log) => log.isBot), [logs]);
  const manualLogs = useMemo(() => logs.filter((log) => !log.isBot), [logs]);

  return {
    logs,
    addLog,
    clearLogs,
    botLogs,
    manualLogs,
  };
};