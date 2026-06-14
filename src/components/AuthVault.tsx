"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";

export default function AuthVault() {
  // THE FIX: Extracted clearLogs from the context
  const { user, accessToken, tokenExp, logs, addLog, clearLogs, login, register, logout, isLoading } = useAuth();
  const authFetch = useApi();

  // Form State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(100);

  // --- Real-time Countdown Timer ---
  useEffect(() => {
    if (!tokenExp) {
      setTimeLeft(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const expTime = tokenExp * 1000;
      const remaining = Math.max(0, Math.floor((expTime - now) / 1000));
      
      setTimeLeft(remaining);
      // Assuming a standard 15-minute (900 seconds) token life for the progress bar visual
      setProgress((remaining / 30) * 100); 

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenExp]);

  // --- Core Handlers ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginMode) {
        await login(username, password);
      } else {
        await register(username, password, role);
      }
      setUsername("");
      setPassword("");
    } catch (err: any) {
      addLog(err.message || "Authentication failed", true);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (url: string) => {
    addLog(`GET ${url}...`);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}${url}`);
      
      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : { error: "Access Denied / Forbidden" };
      } catch (parseError) {
        data = { error: "Access Denied / Forbidden" };
      }
      
      if (res.ok) {
        addLog(`[200 OK] ${data.message || data.status}`);
      } else {
        addLog(`[${res.status}] ${data.error || "Access Denied"}`, true);
      }
    } catch (err) {
      addLog("[FATAL] Network error or server offline", true);
    }
  };

  // --- Quick-Seed Helpers ---
  const seedAdmin = () => { setIsLoginMode(true); setUsername("admin"); setPassword("admin123"); };
  const seedUser = () => { setIsLoginMode(true); setUsername("user"); setPassword("user123"); };

  if (isLoading) {
    return <div className="text-blue-500 font-bold animate-pulse p-10 flex justify-center w-full">Checking session securely...</div>;
  }

  return (
    <section className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6">
      
      {/* HEADER */}
      <header className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Identity Vault</h2>
          <p className="text-slate-400 text-sm mt-1">JWT Access & HttpOnly Refresh Rotation Architecture</p>
        </div>
        <div className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase border ${
          user ? "bg-emerald-950/50 text-emerald-400 border-emerald-800" : "bg-slate-800 text-slate-400 border-slate-700"
        }`}>
          {user ? `SECURED: ${user.username}` : "UNAUTHENTICATED"}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: AUTHENTICATION & PROFILE (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {!user ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-4">
                {isLoginMode ? "Authenticate" : "Register Credentials"}
              </h3>
              
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                
                {!isLoginMode && (
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="USER">ROLE: USER</option>
                    <option value="ADMIN">ROLE: ADMIN</option>
                  </select>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : (isLoginMode ? "Log In" : "Register")}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Quick-Seed Test Accounts</p>
                <div className="flex gap-2">
                  <button onClick={seedAdmin} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors">Fill Admin</button>
                  <button onClick={seedUser} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors">Fill User</button>
                </div>
              </div>

              <button
                onClick={() => { setIsLoginMode(!isLoginMode); }}
                className="mt-4 text-sm text-blue-600 hover:underline w-full text-center font-medium"
              >
                {isLoginMode ? "Need an account? Register" : "Already have an account? Log in"}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl text-white font-black mb-4 shadow-inner ring-4 ring-blue-900/30">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-black text-white">{user.username}</h3>
              <p className={`mt-2 text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full border ${
                user.role === "ADMIN" ? "bg-red-950/30 text-red-400 border-red-800/50" : "bg-blue-950/30 text-blue-400 border-blue-800/50"
              }`}>
                ROLE: {user.role}
              </p>

              {/* LIVE TIMER COMPONENT */}
              <div className="w-full mt-8 bg-slate-950 p-4 rounded-lg border border-slate-800 text-left">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Token Expiry</span>
                  <span className={`font-mono text-lg font-black ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 60 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
              </div>

              <button
                onClick={logout}
                className="mt-6 w-full py-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-sm font-bold transition-colors border border-red-900/50 uppercase tracking-widest"
              >
                Terminate Session
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TOOLS & TERMINAL (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* JWT Decoder Panel */}
          {accessToken && (
            <div className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800">
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center justify-between">
                <span>JWT Payload Decoder</span>
                <span className="text-xs text-slate-500 font-mono font-normal">base64 decoded</span>
              </h3>
              <div className="bg-black/50 p-4 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 break-all overflow-hidden">
                <span className="text-slate-500">{"{"}</span><br/>
                <span className="ml-4 text-emerald-400">"sub"</span><span className="text-slate-400">: </span><span className="text-yellow-300">"{user?.username}"</span>,<br/>
                <span className="ml-4 text-emerald-400">"role"</span><span className="text-slate-400">: </span><span className="text-yellow-300">"{user?.role}"</span>,<br/>
                <span className="ml-4 text-emerald-400">"exp"</span><span className="text-slate-400">: </span><span className="text-purple-400">{tokenExp}</span><br/>
                <span className="text-slate-500">{"}"}</span>
              </div>
            </div>
          )}

          {/* RBAC Toolset */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Network Activity Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => testEndpoint("/api/public/status")}
                className="p-3 bg-gray-50 hover:bg-gray-100 text-left rounded-lg border border-gray-200 transition-colors"
              >
                <div className="text-[10px] font-bold text-gray-500 mb-1">GET /api/public/status</div>
                <div className="text-xs font-bold text-gray-800">Public Route</div>
              </button>
              <button
                onClick={() => testEndpoint("/api/user/dashboard")}
                className="p-3 bg-blue-50 hover:bg-blue-100 text-left rounded-lg border border-blue-200 transition-colors"
              >
                <div className="text-[10px] font-bold text-blue-500/70 mb-1">GET /api/user/dashboard</div>
                <div className="text-xs font-bold text-blue-700">User Route</div>
              </button>
              <button
                onClick={() => testEndpoint("/api/admin/settings")}
                className="p-3 bg-red-50 hover:bg-red-100 text-left rounded-lg border border-red-200 transition-colors"
              >
                <div className="text-[10px] font-bold text-red-500/70 mb-1">GET /api/admin/settings</div>
                <div className="text-xs font-bold text-red-700">Admin Route</div>
              </button>
            </div>
          </div>

          {/* Global Audit Terminal */}
          <div className="bg-black rounded-xl p-4 shadow-lg border border-slate-800 flex flex-col h-full min-h-[250px]">
            {/* THE FIX: Added the flex-between layout and Clear button */}
            <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                System Audit Terminal
              </h3>
              <button 
                onClick={clearLogs} 
                className="text-slate-500 hover:text-white text-[10px] uppercase font-bold tracking-wider transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="flex-1 font-mono text-[11px] sm:text-xs overflow-y-auto space-y-1.5 custom-scrollbar">
              {logs.length === 0 ? (
                <span className="text-slate-600 italic">Listening for network events...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`${log.isError ? "text-red-400" : log.msg.includes("[SYSTEM]") ? "text-blue-400 font-bold" : "text-emerald-400"}`}>
                    <span className="opacity-40 mr-3 text-slate-500 select-none">[{log.time}]</span>
                    <span className="break-words">{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}