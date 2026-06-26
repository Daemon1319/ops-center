import { useState } from "react";
import { FloodRequest } from "../types/taskYard.types";

interface FloodPanelProps {
  onFlood: (req: FloodRequest) => void;
  isLoading: boolean;
}

const BURST_COUNTS = [10, 20, 50];

export default function FloodPanel({ onFlood, isLoading }: FloodPanelProps) {
  const [burstCount, setBurstCount] = useState<number>(10);
  const [lastFlooded, setLastFlooded] = useState<number | null>(null);

  const handleFlood = () => {
    onFlood({ count: burstCount });
    setLastFlooded(burstCount);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        Flood the Queue
      </h3>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Burst Count
          </label>
          <div className="flex gap-2">
            {BURST_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setBurstCount(count)}
                disabled={isLoading}
                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${
                  burstCount === count
                    ? "bg-purple-100 text-purple-700 border-purple-300 ring-1 ring-purple-300"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleFlood}
          disabled={isLoading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black uppercase tracking-widest transition-colors disabled:opacity-50 text-xs"
        >
          {isLoading ? "Flooding..." : `Flood — Fire ${burstCount} Orders At Once`}
        </button>

        {lastFlooded !== null && !isLoading && (
          <div className="bg-purple-50 border border-purple-100 text-purple-700 p-2 rounded-lg text-center text-xs font-bold">
            {lastFlooded} jobs queued
          </div>
        )}
      </div>
    </div>
  );
}