import { RateLimiterConfig } from "../types/rateLimiter.types";

interface ConfigPanelProps {
  config: RateLimiterConfig | null;
}

export default function ConfigPanel({ config }: ConfigPanelProps) {
  if (!config) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-pulse flex items-center h-16">
        <div className="h-3 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
        <span className="text-xs font-black text-gray-800 uppercase tracking-widest">
          Active Node Config
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 font-medium">
        <div>
          <span className="uppercase tracking-wider opacity-70 mr-2">Max Attempts:</span>
          <span className="text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">
            {config.maxAttempts}
          </span>
        </div>
        
        <div>
          <span className="uppercase tracking-wider opacity-70 mr-2">Window:</span>
          <span className="text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">
            {config.windowSizeSeconds}s
          </span>
        </div>
        
        <div>
          <span className="uppercase tracking-wider opacity-70 mr-2">Cooldown:</span>
          <span className="text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">
            {Math.round(config.cooldownSeconds / 60)} min
          </span>
        </div>

        {config.algorithm === "TOKEN_BUCKET" && (
          <div>
            <span className="uppercase tracking-wider opacity-70 mr-2">Tokens:</span>
            <span className="text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">
              {config.tokenBucketCapacity} cap · 1 per {Math.round(1 / config.tokenRefillRate)}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}