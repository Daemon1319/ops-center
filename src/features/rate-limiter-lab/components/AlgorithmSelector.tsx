import { AlgorithmType } from "../types/rateLimiter.types";

interface AlgorithmSelectorProps {
  currentAlgorithm: AlgorithmType;
  onSwitch: (algo: AlgorithmType) => void;
  isLoading: boolean;
}

const ALGORITHMS: { id: AlgorithmType; label: string; description: string }[] = [
  {
    id: "FIXED_WINDOW",
    label: "Fixed Window",
    description: "Resets every 60s. Vulnerable to boundary exploit.",
  },
  {
    id: "SLIDING_WINDOW",
    label: "Sliding Window",
    description: "Tracks last 60s rolling. No exploit possible.",
  },
  {
    id: "TOKEN_BUCKET",
    label: "Token Bucket",
    description: "Refills over time. Allows short bursts.",
  },
];

export default function AlgorithmSelector({
  currentAlgorithm,
  onSwitch,
  isLoading,
}: AlgorithmSelectorProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">
        Active Algorithm
      </h3>
      <div className="flex flex-col sm:flex-row gap-3">
        {ALGORITHMS.map((algo) => {
          const isActive = currentAlgorithm === algo.id;
          return (
            <button
              key={algo.id}
              onClick={() => onSwitch(algo.id)}
              disabled={isLoading || isActive}
              className={`flex-1 p-4 rounded-lg border text-left transition-all ${
                isActive
                  ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              } ${isLoading && !isActive ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`font-bold text-sm mb-1 ${
                  isActive ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {algo.label}
              </div>
              <div
                className={`text-xs ${
                  isActive ? "text-blue-600/80" : "text-gray-500"
                }`}
              >
                {algo.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}