import { RequestLogEntry } from "../types/rateLimiter.types";

interface RequestLogProps {
  logs: RequestLogEntry[];
  onClear: () => void;
}

export default function RequestLog({ logs, onClear }: RequestLogProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div className="bg-black rounded-xl p-4 shadow-lg border border-slate-800 flex flex-col h-full min-h-[300px]">
      <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Live Network Telemetry
        </h3>
        <div className="flex gap-4 items-center">
          <span className="text-[10px] text-slate-600 font-mono">
            {logs.length} / 50 events tracked
          </span>
          <button
            onClick={onClear}
            className="text-slate-500 hover:text-white text-[10px] uppercase font-bold tracking-wider transition-colors"
          >
            Clear Log
          </button>
        </div>
      </div>

      <div className="flex-1 font-mono text-[11px] sm:text-xs overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
        {logs.length === 0 ? (
          <span className="text-slate-600 italic">Listening for network events...</span>
        ) : (
          logs.map((log) => {
            const { response, isBot } = log;
            
            // Determine Color Scheme
            let statusColor = "text-emerald-400";
            let statusText = "ALLOWED";
            
            if (response.locked || response.accountState === "LOCKED" || response.accountState === "COOLING_DOWN") {
              statusColor = "text-red-400";
              statusText = "LOCKED";
            } else if (!response.success) {
              if (response.accountState === "WARNED") {
                statusColor = "text-yellow-400";
                statusText = "WARNED";
              } else {
                statusColor = "text-orange-400";
                statusText = "BLOCKED";
              }
            }

            return (
              <div
                key={log.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 py-1 border-b border-slate-900/50 ${statusColor}`}
              >
                <div className="flex items-center gap-2 opacity-70 w-28 shrink-0">
                  <span className="text-slate-500 select-none">[{formatTime(log.timestamp)}]</span>
                </div>
                
                <div className="flex items-center gap-2 w-20 shrink-0">
                  <span title={isBot ? "Bot Request" : "Manual Request"}>
                    {isBot ? "🤖" : "👤"}
                  </span>
                  <span className="font-bold">{statusText}</span>
                </div>

                <div className="flex gap-3 flex-wrap flex-1">
                  <span className="text-slate-400">
                    user:<span className="text-blue-300">{log.username}</span>
                  </span>
                  <span className="text-slate-400">
                    ip:<span className="text-blue-300">{log.ipAddress}</span>
                  </span>
                  <span className="text-slate-400">
                    algo:<span className="text-purple-300">{response.algorithm}</span>
                  </span>
                  <span className="text-slate-400">
                    attempts:<span className="text-yellow-300">{response.attemptsUsed}</span>
                  </span>
                </div>

                {response.fixedWindowVulnerable && !response.success && (
                  <span 
                    className="text-red-500 font-bold ml-auto shrink-0 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/50"
                    title={response.fixedWindowWarning || "Boundary Exploit Detected"}
                  >
                    ⚠️ EXPLOIT
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}