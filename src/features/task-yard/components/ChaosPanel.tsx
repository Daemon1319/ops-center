import { useEffect, useState } from "react";
import { ChaosState, ChaosRequest } from "../types/taskYard.types";

interface ChaosPanelProps {
  chaosState: ChaosState | null;
  onUpdate: (req: ChaosRequest) => void;
  isLoading: boolean;
}

export default function ChaosPanel({ chaosState, onUpdate, isLoading }: ChaosPanelProps) {
  const [localRate, setLocalRate] = useState<number>(30);

  useEffect(() => {
    if (chaosState) {
      setLocalRate(Math.round(chaosState.failureRate * 100));
    }
  }, [chaosState?.failureRate]); // eslint-disable-line react-hooks/exhaustive-deps

  const enabled = chaosState?.enabled ?? false;

  const handleToggle = () => {
    onUpdate({ enabled: !enabled, failureRate: localRate / 100 });
  };

  const commitRate = () => {
    onUpdate({ enabled, failureRate: localRate / 100 });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        Chaos Mode
      </h3>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Make Worker Unreliable
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={handleToggle}
              disabled={isLoading || !chaosState}
            />
            <div className="w-11 h-6 bg-gray-200 peer-checked:bg-red-600 rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
          </label>
        </div>

        <div className={enabled ? "" : "opacity-50"}>
          <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            <span>Failure Rate</span>
            <span className="text-gray-900 font-mono">{localRate}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={localRate}
            onChange={(e) => setLocalRate(Number(e.target.value))}
            onMouseUp={commitRate}
            onTouchEnd={commitRate}
            onKeyUp={commitRate}
            disabled={!enabled || isLoading || !chaosState}
            className="w-full accent-red-600 disabled:cursor-not-allowed"
          />
        </div>

        <div
          className={`p-2 rounded-lg text-center text-xs font-bold ${
            enabled
              ? "bg-red-50 border border-red-100 text-red-700"
              : "bg-emerald-50 border border-emerald-100 text-emerald-700"
          }`}
        >
          {enabled ? `${localRate}% of jobs will randomly fail` : "Worker is healthy"}
        </div>
      </div>
    </div>
  );
}