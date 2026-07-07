"use client";

import { useState, useEffect, useCallback } from "react";
import { useRateLimiter } from "./hooks/useRateLimiter";
import { useRequestLog } from "./hooks/useRequestLog";
import { 
  AlgorithmType, 
  AccountStatus, 
  RateLimiterConfig, 
  LoginRequest, 
  LoginResponse 
} from "./types/rateLimiter.types";

// Components
import AlgorithmSelector from "./components/AlgorithmSelector";
import AccountStateCard from "./components/AccountStateCard";
import LoginPanel from "./components/LoginPanel";
import BotSimulator from "./components/BotSimulator";
import VpnBypassDemo from "./components/VpnBypassDemo";
import RequestLog from "./components/RequestLog";
import ConfigPanel from "./components/ConfigPanel";

export default function RateLimiterLab() {
  // Global Feature State
  const [currentAlgorithm, setCurrentAlgorithm] = useState<AlgorithmType>("FIXED_WINDOW");
  const [currentIp, setCurrentIp] = useState("192.168.1.1");
  const [activeUsername] = useState("john@demo.com");
  
  // NEW: Tracker to forcefully remount and clear the BotSimulator's internal state
  const [resetKey, setResetKey] = useState(0);
  
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [config, setConfig] = useState<RateLimiterConfig | null>(null);

  // Hooks
  const { login, getStatus, switchAlgorithm, resetAll, getConfig, isLoading } = useRateLimiter();
  const { logs, addLog, clearLogs } = useRequestLog();

  // --- Core API Fetchers ---
  const fetchStatus = useCallback(async () => {
    try {
      const status = await getStatus(activeUsername);
      setAccountStatus(status);
    } catch (err) {
      console.error("Failed to poll status", err);
    }
  }, [getStatus, activeUsername]);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await getConfig();
      setConfig(data);
      setCurrentAlgorithm(data.algorithm);
    } catch (err) {
      console.error("Failed to fetch config", err);
    }
  }, [getConfig]);

  // --- Lifecycles ---
  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, [fetchConfig, fetchStatus]);

  // Background Polling (Every 2 seconds)
  useEffect(() => {
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // --- Event Handlers ---
  const handleAlgorithmSwitch = async (algo: AlgorithmType) => {
    await switchAlgorithm(algo);
    setCurrentAlgorithm(algo);
    clearLogs(); // Start fresh visual log for the new algorithm
    setResetKey((prev) => prev + 1); // Trigger BotSimulator wipe
    await fetchConfig();
    await fetchStatus();
  };

  const handleManualLogin = async (req: LoginRequest): Promise<boolean> => {
    const response = await login(req);
    
    addLog({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      username: req.username,
      ipAddress: req.ipAddress,
      response,
      isBot: false,
    });
    
    await fetchStatus(); // Instantly update the attempt bar
    return response.success;
  };

  const handleBotAttack = async (results: LoginResponse[]) => {
    results.forEach((response) => {
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        username: response.username,
        ipAddress: response.ipAddress,
        response,
        isBot: true,
      });
    });
    
    await fetchStatus(); // Instantly update the attempt bar after attack
  };

  const handleReset = async () => {
    await resetAll();
    clearLogs();
    setCurrentIp("192.168.1.1"); // Reset the VPN proxy too
    setResetKey((prev) => prev + 1); // Trigger BotSimulator wipe
    await fetchStatus();
  };

  const isLocked = accountStatus?.accountState === "LOCKED" || accountStatus?.accountState === "COOLING_DOWN";

  return (
    <section className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Rate Limiter Lab</h2>
          <p className="text-slate-400 text-sm mt-1">Distributed Botnet & WAF Evasion Telemetry</p>
        </div>
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-sm font-bold transition-colors border border-red-900/50 uppercase tracking-widest disabled:opacity-50"
        >
          Reset All Nodes
        </button>
      </header>

      {/* TOP ROW: Algorithm Selection */}
      <AlgorithmSelector 
        currentAlgorithm={currentAlgorithm}
        onSwitch={handleAlgorithmSwitch}
        isLoading={isLoading}
      />

      {/* MIDDLE ROW: The Core Demonstration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Attack Vectors */}
        <div className="flex flex-col gap-6">
          <LoginPanel 
            onLogin={handleManualLogin}
            isLoading={isLoading}
            currentIp={currentIp}
          />
          <BotSimulator 
            key={resetKey} // Attaches the remount tracker
            username={activeUsername}
            currentIp={currentIp}
            onBotAttack={handleBotAttack}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: Defense & State */}
        <div className="flex flex-col gap-6">
          <AccountStateCard 
            username={activeUsername}
            status={accountStatus}
          />
          
          {/* Conditional rendering: Only expose the VPN tool when the WAF locks the account */}
          {isLocked && (
            <div className="animate-in slide-in-from-top-4 duration-500 fade-in">
              <VpnBypassDemo 
                currentIp={currentIp}
                onIpChange={setCurrentIp}
              />
            </div>
          )}
        </div>
        
      </div>

      {/* BOTTOM ROW: System Telemetry */}
      <ConfigPanel config={config} />
      <RequestLog logs={logs} onClear={clearLogs} />

    </section>
  );
}