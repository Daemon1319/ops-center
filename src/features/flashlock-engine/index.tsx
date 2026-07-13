"use client";

import { useState, useEffect, useCallback } from "react";

interface ProductDto {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface OrderDto {
  id: number;
  productId: number;
  username: string;
  createdAt: string;
}

interface PurchaseResponse {
  status: string;
  message: string;
  lockMode: string;
  remainingStock: number;
  attempts: number;
}

interface ErrorResponse {
  error: string;
  message: string;
}

type LockMode = "PESSIMISTIC" | "OPTIMISTIC" | "VULNERABLE" | "LOADING";

interface LogEntry {
  time: string;
  message: string;
}

interface StressTestResults {
  stockBefore: number;
  requestsSent: number;
  succeeded: number;
  rejected: number;
  finalStock: number | null;
  oversold: boolean;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_FLASHSALE_API_URL}/api/flashsale`;

export default function FlashlockEngine() {
  const [productData, setProductData] = useState<ProductDto | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [lockMode, setLockMode] = useState<LockMode>("LOADING");
  const [stressTestResults, setStressTestResults] = useState<StressTestResults | null>(null);
  
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: new Date().toLocaleTimeString().split(" ")[0], message: "[SYSTEM] Ops Center UI Initialized. Awaiting connections..." }
  ]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString().split(" ")[0], message }]);
  }, []);

  // --- API CALLS ---
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      if (res.ok) setOrders(await res.json());
    } catch (err) {}
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/product`);
      if (res.ok) {
        setProductData(await res.json());
      } else if (res.status === 404) {
        setProductData(null); 
      }
    } catch (err) {}
  }, []);

  const fetchLockStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lock-status`);
      if (res.ok) {
        const body = await res.json();
        setLockMode(body.lockMode as LockMode);
      }
    } catch (err) {}
  }, []);

  const handleCycleLock = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cycle-lock`, { method: "POST" });
      if (res.ok) {
        const body = await res.json();
        setLockMode(body.lockMode as LockMode);
        addLog(`[SYSTEM] Lock Mode dynamically updated to: ${body.lockMode}`);
      }
    } catch (err) {}
  };

  // Background Auto-Sync 
  useEffect(() => {
    fetchOrders();
    fetchProduct();
    fetchLockStatus(); 

    const interval = setInterval(() => {
      fetchOrders();
      fetchProduct();
      fetchLockStatus(); 
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchOrders, fetchProduct, fetchLockStatus]);

  // --- ACTIONS ---
  const handleRestock = async () => {
    addLog("[ADMIN] Restocking inventory...");
    try {
      const res = await fetch(`${API_BASE_URL}/setup`, { method: "POST" });
      if (res.ok) {
        const product: ProductDto = await res.json();
        addLog(`[RESTORED] ${product.name} (ID: ${product.id}) is stocked to ${product.stock} units.`);
        fetchProduct(); 
        fetchOrders();
        setStressTestResults(null);
      }
    } catch (err) {
      addLog("[FATAL] Network connection to Engine refused.");
    }
  };

  const handleClearDB = async () => {
    addLog("[ADMIN] Sending database wipe command...");
    try {
      const res = await fetch(`${API_BASE_URL}/clear`, { method: "POST" });
      if (res.ok) {
        const body = await res.json();
        addLog(`[WIPED] ${body.message}`);
        fetchProduct();
        fetchOrders();
        setStressTestResults(null);
      }
    } catch (err) {
      addLog("[FATAL] Network connection to Engine refused.");
    }
  };

  const handleClearTerminal = () => {
    setLogs([{ time: new Date().toLocaleTimeString().split(" ")[0], message: "[SYSTEM] Log buffer cleared." }]);
  };

  const handleBuy = async (username: string) => {
    const targetId = productData ? productData.id.toString() : "1"; 
    
    try {
      const res = await fetch(`${API_BASE_URL}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ productId: targetId, username }),
      });
      
      if (res.ok) {
        const body: PurchaseResponse = await res.json();
        const attemptInfo = body.attempts > 1 ? ` [retried ${body.attempts - 1}x]` : "";
        addLog(`[SUCCESS] ${body.message} | Remaining: ${body.remainingStock}${attemptInfo}`);
        fetchProduct(); 
      } else {
        const errBody: ErrorResponse = await res.json();
        addLog(`[${errBody.error}] ${errBody.message}`);
      }
    } catch (err) {
      addLog(`[FATAL] Engine connection dropped for user: ${username}`);
    }
  };

  const handleStressTest = async () => {
    const stockBefore = productData?.stock ?? 0;
    const requestCount = 15;
    addLog(`[TEST] Sending ${requestCount} concurrent purchase requests...`);
    setStressTestResults(null);

    const targetId = productData ? productData.id.toString() : "1";

    const promises = Array.from({ length: requestCount }).map(async (_, i) => {
      try {
        const res = await fetch(`${API_BASE_URL}/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ productId: targetId, username: `StressBot_${i}` }),
        });

        if (res.ok) {
          const body: PurchaseResponse = await res.json();
          const attemptInfo = body.attempts > 1 ? ` [retried ${body.attempts - 1}x]` : "";
          addLog(`[SUCCESS] ${body.message} | Remaining: ${body.remainingStock}${attemptInfo}`);
          return "success" as const;
        } else {
          const errBody: ErrorResponse = await res.json();
          addLog(`[${errBody.error}] ${errBody.message}`);
          return "rejected" as const;
        }
      } catch {
        addLog(`[FATAL] Engine connection dropped for user: StressBot_${i}`);
        return "rejected" as const;
      }
    });

    const results = await Promise.all(promises);
    const succeeded = results.filter(r => r === "success").length;
    const rejected = results.filter(r => r === "rejected").length;

    // Fetch final product state directly for accurate metrics
    let finalStock: number | null = null;
    try {
      const res = await fetch(`${API_BASE_URL}/product`);
      if (res.ok) {
        const product: ProductDto = await res.json();
        finalStock = product.stock;
      }
    } catch {}

    const oversold = succeeded > stockBefore || (finalStock !== null && finalStock < 0);

    setStressTestResults({
      stockBefore,
      requestsSent: requestCount,
      succeeded,
      rejected,
      finalStock,
      oversold,
    });

    addLog(`[TEST] Stress test completed. ${succeeded} succeeded, ${rejected} rejected.`);
    fetchOrders();
    fetchProduct();
  };

  // --- UI HELPERS ---
  const getLockStyle = () => {
    switch (lockMode) {
      case "PESSIMISTIC": return "bg-green-900/20 text-green-400 border-green-700 hover:bg-green-900/40";
      case "OPTIMISTIC": return "bg-yellow-900/20 text-yellow-500 border-yellow-700 hover:bg-yellow-900/40";
      case "VULNERABLE": return "bg-red-900/20 text-red-500 border-red-700 hover:bg-red-900/40 animate-pulse";
      default: return "bg-gray-800 text-gray-400 border-gray-600";
    }
  };

  const getLockIndicatorColor = () => {
    switch (lockMode) {
      case "PESSIMISTIC": return "bg-green-400";
      case "OPTIMISTIC": return "bg-yellow-500";
      case "VULNERABLE": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getExplainerContent = () => {
    switch (lockMode) {
      case "PESSIMISTIC": return {
        title: "Row-Level Lock",
        sql: "SELECT * FROM products WHERE id = ? FOR UPDATE",
        desc: "Acquires an exclusive lock on the row. All other transactions block and queue until this one commits. Guarantees no overselling but serializes throughput under contention."
      };
      case "OPTIMISTIC": return {
        title: "Version Check (@Version)",
        sql: "UPDATE products SET stock=?, version=version+1\nWHERE id=? AND version=?",
        desc: "Reads freely without blocking. On write, checks if the @Version column still matches. If another transaction already committed, throws a conflict and retries (up to 5 attempts). Same safety, different mechanism."
      };
      case "VULNERABLE": return {
        title: "No Protection (Raw SQL)",
        sql: "SELECT stock FROM products WHERE id = ?\n-- gap: other threads read same value --\nUPDATE products SET stock = ? WHERE id = ?",
        desc: "Reads stock and updates in separate steps with no lock or version check. Under concurrency, multiple threads read the same stock value and all decrement — causing overselling and potentially negative stock."
      };
      default: return { title: "Loading...", sql: "", desc: "Connecting to backend..." };
    }
  };

  const getStressHint = () => {
    switch (lockMode) {
      case "PESSIMISTIC": return "Expect: 10 succeed, 5 rejected. No overselling.";
      case "OPTIMISTIC": return "Expect: 10 succeed (some with retries), 5 rejected. No overselling.";
      case "VULNERABLE": return "⚠ Expect: More than 10 may succeed. Stock may go negative.";
      default: return "";
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col gap-6 font-sans text-gray-800 bg-gray-50">
      
      {/* 1. PRODUCT STOREFRONT */}
      <section className="bg-white rounded-xl shadow-sm flex flex-col md:flex-row border border-gray-200 overflow-hidden" aria-labelledby="product-title">
        <header className="bg-slate-900 md:w-1/3 p-6 flex flex-col items-center justify-center text-white text-center shadow-inner">
          <h1 id="product-title" className="font-black text-2xl sm:text-3xl tracking-tight">
            {productData ? productData.name.split(" ")[0] : "LOADING"}
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl font-bold mt-1">{productData ? "Mechanical" : "..."}</p>
        </header>
        
        <div className="p-6 md:w-2/3 flex flex-col justify-center bg-linear-to-br from-white to-gray-50">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1 leading-tight">
            {productData ? productData.name : "Loading product data..."}
          </h2>
          <p className="text-xl sm:text-2xl font-black text-red-600 mb-5 tracking-tight" aria-live="polite">
            ${productData?.price ? productData.price.toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00"}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => { addLog("[USER] Requesting block..."); handleBuy("NextJsUser"); fetchOrders(); }}
              disabled={!productData || productData.stock === 0}
              aria-label="Buy Item"
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-black text-sm sm:text-base text-white transition-transform active:scale-95 ${
                productData && productData.stock > 0 
                  ? "bg-blue-600 hover:bg-blue-700 shadow-md" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              BUY NOW
            </button>
            <div 
              className={`w-full sm:w-auto px-5 py-3 rounded-lg text-center text-xs sm:text-sm font-black tracking-widest uppercase border-2 ${
                productData && productData.stock > 0 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
              role="status"
            >
              {productData && productData.stock > 0 ? `${productData.stock} UNITS REMAINING` : "SOLD OUT"}
            </div>
          </div>
        </div>
      </section>

      {/* 2. DASHBOARD PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Operations Center */}
        <section className="bg-slate-900 rounded-xl p-5 shadow-lg flex flex-col gap-4 border border-slate-800" aria-labelledby="controls-title">
          <header className="flex justify-between items-center border-b border-slate-700 pb-2">
            <h3 id="controls-title" className="text-white font-black tracking-widest text-xs sm:text-sm uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true"></span>
              Lock Controls
            </h3>
          </header>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleCycleLock} 
              aria-live="polite"
              className={`w-full py-3.5 rounded-lg text-sm font-black tracking-widest uppercase border-2 transition-all flex justify-center items-center gap-3 shadow-sm active:scale-[0.98] ${getLockStyle()}`}
            >
              <span className={`w-3 h-3 rounded-full ${getLockIndicatorColor()}`} aria-hidden="true"></span>
              MODE: {lockMode}
            </button>

            {/* Explainer Card */}
            <div className={`rounded-lg border p-3 text-xs transition-all ${
              lockMode === "PESSIMISTIC" ? "border-green-800/50 bg-green-950/30" :
              lockMode === "OPTIMISTIC" ? "border-yellow-800/50 bg-yellow-950/30" :
              lockMode === "VULNERABLE" ? "border-red-800/50 bg-red-950/30" :
              "border-slate-700 bg-slate-800/50"
            }`}>
              <span className={`font-black uppercase tracking-wider text-[10px] ${
                lockMode === "PESSIMISTIC" ? "text-green-400" :
                lockMode === "OPTIMISTIC" ? "text-yellow-400" :
                lockMode === "VULNERABLE" ? "text-red-400" :
                "text-slate-400"
              }`}>
                {getExplainerContent().title}
              </span>
              {getExplainerContent().sql && (
                <pre className="bg-black/50 rounded p-2 my-2 text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                  {getExplainerContent().sql}
                </pre>
              )}
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {getExplainerContent().desc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button onClick={handleRestock} className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[10px] sm:text-xs font-bold tracking-wider border border-slate-700 transition-colors shadow-sm">
                RESTOCK INVENTORY
              </button>
              <button onClick={handleClearDB} className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-md text-[10px] sm:text-xs font-bold tracking-wider border border-slate-700 transition-colors shadow-sm">
                CLEAR DATABASE
              </button>
              <button onClick={handleStressTest} className="col-span-2 px-4 py-3 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded-md text-xs sm:text-sm font-black tracking-widest border border-red-800/50 transition-colors shadow-sm">
                RUN STRESS TEST (x15)
              </button>
              <p className="col-span-2 text-[10px] text-slate-500 text-center italic -mt-1">
                {getStressHint()}
              </p>
            </div>
          </div>

          {/* Stress Test Results */}
          {stressTestResults && (
            <div className={`rounded-lg border p-4 font-mono text-xs ${
              stressTestResults.oversold 
                ? "border-red-700/50 bg-red-950/30" 
                : "border-green-700/50 bg-green-950/30"
            }`}>
              <h4 className="text-white font-black text-[10px] tracking-widest uppercase mb-3">Stress Test Results</h4>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px]">
                <span className="text-slate-400">Stock Before:</span>
                <span className="text-white font-bold">{stressTestResults.stockBefore}</span>
                <span className="text-slate-400">Requests Sent:</span>
                <span className="text-white font-bold">{stressTestResults.requestsSent}</span>
                <span className="text-slate-400">✓ Succeeded:</span>
                <span className={`font-bold ${stressTestResults.oversold ? "text-red-400" : "text-green-400"}`}>
                  {stressTestResults.succeeded}
                  {stressTestResults.succeeded > stressTestResults.stockBefore && " ← OVERSOLD"}
                </span>
                <span className="text-slate-400">✗ Rejected:</span>
                <span className="text-white font-bold">{stressTestResults.rejected}</span>
                <span className="text-slate-400">Final Stock:</span>
                <span className={`font-bold ${
                  stressTestResults.finalStock !== null && stressTestResults.finalStock < 0 
                    ? "text-red-400" : "text-white"
                }`}>
                  {stressTestResults.finalStock ?? "N/A"}
                  {stressTestResults.finalStock !== null && stressTestResults.finalStock < 0 && " ← NEGATIVE"}
                </span>
                <span className="text-slate-400">Oversold:</span>
                <span className={`font-bold ${stressTestResults.oversold ? "text-red-400" : "text-green-400"}`}>
                  {stressTestResults.oversold ? "YES 🔴" : "NO ✅"}
                </span>
              </div>
            </div>
          )}
          
          {/* Terminal */}
          <div 
            className="bg-black rounded-lg border border-slate-800 h-72 flex flex-col shadow-inner font-mono text-[10px] sm:text-xs"
            role="log"
            aria-label="System Logs"
          >
            <div className="flex justify-between items-center p-3 border-b border-slate-800 bg-[#0a0a0a] shrink-0 rounded-t-lg">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">System Logs</span>
              <button onClick={handleClearTerminal} className="text-slate-400 hover:text-white text-[10px] uppercase font-bold tracking-wider transition-colors">
                Clear
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {logs.map((log, i) => {
                const messageLower = log.message.toLowerCase();
                const isError = messageLower.includes("rejected") || messageLower.includes("error") || messageLower.includes("conflict") || messageLower.includes("sold_out");
                
                return (
                  <div key={i} className={`mb-1 ${isError ? "text-red-500" : log.message.includes("SUCCESS") ? "text-green-400" : "text-slate-400"}`}>
                    <span className="opacity-50 mr-2">{log.time}</span> 
                    {log.message}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: Live Order Ledger */}
        <aside className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col" aria-labelledby="ledger-title">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 border-b border-gray-100 pb-3 mb-3">
            <h3 id="ledger-title" className="font-black tracking-widest text-xs sm:text-sm text-gray-900 uppercase">Live Order History</h3>
            <div className="text-[10px] sm:text-xs font-bold text-gray-500 flex items-center gap-2">
              <span className="animate-pulse text-green-500 text-lg leading-none">&#11044;</span> POLLING /2s
            </div>
          </header>
          
          {orders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic py-10">
              No orders placed yet
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto h-[28rem] pr-2 custom-scrollbar">
              <ul className="space-y-3" role="list">
                {orders.map((order, i) => (
                  <li 
                    key={order.id} 
                    className="flex items-center justify-between bg-white p-3 border-l-4 border-green-500 rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    role="listitem"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900 text-white rounded-full h-10 w-10 flex items-center justify-center font-black text-sm shadow-inner shrink-0" aria-hidden="true">
                        {order.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">
                          {order.username} <span className="text-gray-500 font-medium">secured the bag!</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 font-bold">
                          TX_REF_00{order.id} • {new Date(order.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border border-green-200 shadow-sm" aria-label="Status: Winner">
                      Winner
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

      </div>
    </main>
  );
}