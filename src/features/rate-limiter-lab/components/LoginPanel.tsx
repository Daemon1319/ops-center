import { useState } from "react";
import { LoginRequest } from "../types/rateLimiter.types";

interface LoginPanelProps {
  onLogin: (req: LoginRequest) => Promise<boolean>;
  isLoading: boolean;
  currentIp: string;
}

export default function LoginPanel({ onLogin, isLoading, currentIp }: LoginPanelProps) {
  const [username, setUsername] = useState("john@demo.com");
  const [password, setPassword] = useState("demo123");
  const [flash, setFlash] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      const isSuccess = await onLogin({ username, password, ipAddress: currentIp });
      
      setFlash(isSuccess ? "success" : "error");
      setTimeout(() => setFlash(null), 600);
    } catch {
      setFlash("error");
      setTimeout(() => setFlash(null), 600);
    }
  };

  let flashStyles = "border-gray-200 bg-white";
  if (flash === "success") {
    flashStyles = "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/20";
  } else if (flash === "error") {
    flashStyles = "border-red-500 bg-red-50 ring-4 ring-red-500/20";
  }

  return (
    <div className={`rounded-xl p-6 shadow-sm border transition-all duration-300 ${flashStyles}`}>
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">
        Manual Authentication
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Target Username
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Origin IP Address (Read-only)
          </label>
          <input
            type="text"
            readOnly
            value={currentIp}
            className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm font-mono cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-black uppercase tracking-widest transition-colors disabled:opacity-50 text-xs"
        >
          {isLoading ? "Authenticating..." : "Attempt Login"}
        </button>
      </form>
    </div>
  );
}