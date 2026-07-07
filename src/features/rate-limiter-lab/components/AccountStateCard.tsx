import { useEffect, useState } from "react";
import { AccountStatus } from "../types/rateLimiter.types";

interface AccountStateCardProps {
  username: string;
  status: AccountStatus | null;
}

export default function AccountStateCard({ username, status }: AccountStateCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Sync the local countdown timer with the backend's autoUnlockInSeconds
  useEffect(() => {
    if (status?.locked && status.autoUnlockInSeconds !== null && status.autoUnlockInSeconds > 0) {
      // Seed the timer ONCE when lock state becomes true.
      // Local interval takes over from here — polling updates to autoUnlockInSeconds
      // are intentionally ignored so the countdown does not stutter every 2 seconds.
      setTimeLeft(status.autoUnlockInSeconds);

      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [status?.locked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading skeleton state
  if (!status) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse h-full min-h-[160px] flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
        </div>
      </div>
    );
  }

  const totalAttempts = status.attemptsUsed + status.attemptsRemaining;
  const progressPercent = totalAttempts > 0 ? (status.attemptsUsed / totalAttempts) * 100 : 0;

  // Determine dynamic UI styling based on account state
  let badgeColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
  let progressColor = "bg-emerald-500";

  if (status.accountState === "WARNED") {
    badgeColor = "bg-yellow-100 text-yellow-700 border-yellow-200";
    progressColor = "bg-yellow-500";
  } else if (status.accountState === "LOCKED" || status.accountState === "COOLING_DOWN") {
    badgeColor = "bg-red-100 text-red-700 border-red-200";
    progressColor = "bg-red-500";
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between h-full min-h-[160px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1">
            Target Account
          </h3>
          <div className="font-mono text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded inline-block">
            {username}
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${badgeColor}`}
        >
          {status.accountState}
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          <span>Failed Attempts</span>
          <span className="text-gray-900">
            {status.attemptsUsed} / {totalAttempts}
          </span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Live Cooldown Timer */}
      {timeLeft !== null && timeLeft > 0 && (
        <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3 flex justify-between items-center text-red-700">
          <span className="text-[10px] font-black uppercase tracking-widest">Cooldown Active</span>
          <span className="font-mono font-black text-lg animate-pulse">
            {formatTime(timeLeft)}
          </span>
        </div>
      )}
    </div>
  );
}