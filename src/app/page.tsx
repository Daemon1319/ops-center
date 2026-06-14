"use client";

import { useState } from "react";
import FlashSale from "@/components/FlashSale";
import AuthVault from "@/components/AuthVault";

export default function OpsCenter() {
  // THE MEMORY: This tells React which project to display. Default is "flashsale".
  const [activeTab, setActiveTab] = useState("auth");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* 1. The Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col shadow-2xl">
        <h1 className="text-xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Ops Center
        </h1>
        <nav className="flex flex-col gap-2">

          {/* Button 1: Identity Vault */}
          <button 
            onClick={() => setActiveTab("auth")}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "auth" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            1. Identity Vault
          </button>
          
          {/* Button 2: Flash Sale */}
          <button 
            onClick={() => setActiveTab("flashsale")}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "flashsale" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            2. High-Concurrency Locks
          </button>

        </nav>
      </aside>

      {/* 2. The Main Stage */}
      <main className="flex-1 p-10 flex flex-col items-center justify-center">
        
        {/* Conditional Rendering: Auth Vault */}
        {activeTab === "auth" && (
          <AuthVault />
        )}

        {/* Conditional Rendering: Flash Sale */}
        {activeTab === "flashsale" && (
          <FlashSale />
        )}

      </main>

    </div>
  );
}