import { useState } from "react";
import { LoginResponse } from "../types/rateLimiter.types";

interface BotSimulatorProps {
  username: string;
  currentIp: string;
  onBotAttack: (results: LoginResponse[]) => void | Promise<void>;
  isLoading: boolean;
}

export default function BotSimulator({
  username,
  currentIp,
  onBotAttack,
  isLoading,
}: BotSimulatorProps) {
  const [burstCount, setBurstCount] = useState<number>(10);
  const [isAttacking, setIsAttacking] = useState(false);
  const [summary, setSummary] = useState<{
    allowed: number;
    blocked: number;
    locked: number;
  } | null>(null);

  const handleAttack = async () => {
    setIsAttacking(true);
    setSummary(null);

    const baseUrl = process.env.NEXT_PUBLIC_RATE_LIMITER_API_URL;
    
    // We intentionally use a bad password so the attack registers as failed attempts
    const payload = JSON.stringify({
      username,
      password: "incorrect_bot_password",
      ipAddress: currentIp,
    });

    try {
      // Create an array of identical fetch promises to fire concurrently
      const promises = Array.from({ length: burstCount }).map(async () => {
        const response = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        
        // We catch the standard 401 and 423 responses and parse them normally
        return response.json();
      });

      // Execute all requests simultaneously
      const results = (await Promise.all(promises)) as LoginResponse[];

      let allowed = 0;
      let blocked = 0;
      let locked = 0;

      results.forEach((res) => {
        if (res.success) {
          allowed++;
        } else if (res.locked || res.accountState === "LOCKED" || res.accountState === "COOLING_DOWN") {
          locked++;
        } else {
          blocked++;
        }
      });

      setSummary({ allowed, blocked, locked });
      onBotAttack(results);
    } catch (error) {
      console.error("Bot attack execution failed", error);
    } finally {
      setIsAttacking(false);
    }
  };

  const isBusy = isLoading || isAttacking;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span>🤖</span> Bot Simulator
      </h3>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Concurrent Burst Count
          </label>
          <div className="flex gap-2">
            {[5, 10, 20].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setBurstCount(count)}
                disabled={isBusy}
                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${
                  burstCount === count
                    ? "bg-purple-100 text-purple-700 border-purple-300 ring-1 ring-purple-300"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {count} Req
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAttack}
          disabled={isBusy}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black uppercase tracking-widest transition-colors disabled:opacity-50 text-xs mt-2"
        >
          {isAttacking ? (
            <span className="animate-pulse">Sending {burstCount} concurrent requests...</span>
          ) : (
            "Launch Bot Attack"
          )}
        </button>

        {summary && (
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-2 rounded-lg">
              <div className="font-black text-lg">{summary.allowed}</div>
              <div className="uppercase tracking-wider text-[9px] font-bold mt-1">Allowed</div>
            </div>
            <div className="bg-orange-50 border border-orange-100 text-orange-700 p-2 rounded-lg">
              <div className="font-black text-lg">{summary.blocked}</div>
              <div className="uppercase tracking-wider text-[9px] font-bold mt-1">Blocked</div>
            </div>
            <div className="bg-red-50 border border-red-100 text-red-700 p-2 rounded-lg">
              <div className="font-black text-lg">{summary.locked}</div>
              <div className="uppercase tracking-wider text-[9px] font-bold mt-1">Locked</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}