"use client";

import { useState } from "react";
import AuthVault from "@/features/auth-vault/index";
import FlashSale from "@/features/flashsale-engine";
import RateLimiterLab from "@/features/rate-limiter-lab/index";
import TaskYard from "@/features/task-yard/index";
import CloudStash from "@/features/cloud-stash/index";
import SwiftFlow from "@/features/swift-flow/index";

export default function OpsCenter() {
  // THE MEMORY: This tells React which project to display.
  const [activeTab, setActiveTab] = useState("auth");
  
  // NEW MEMORY: Tracks if the mobile hamburger menu is open or closed.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* ── MOBILE HEADER ── */}
      {/* Visible only on mobile (md:hidden), houses the Title and the Hamburger Button */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white p-4 shadow-md z-20">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Ops Center
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {/* SVG Hamburger Icon / X Close Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* ── MOBILE OVERLAY ── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 md:hidden backdrop-blur-sm bg-white/10"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. The Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white p-6 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Title hidden on mobile because it's in the top bar, visible on desktop */}
        <h1 className="hidden md:block text-xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Ops Center
        </h1>
        
        <nav className="flex flex-col gap-2 mt-4 md:mt-0">
          {/* Button 1: Identity Vault */}
          <button 
            onClick={() => {
              setActiveTab("auth");
              setIsMobileMenuOpen(false); // Auto-close menu on mobile
            }}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "auth" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            1. Identity Vault
          </button>
          
          {/* Button 2: Flash Sale */}
          <button 
            onClick={() => {
              setActiveTab("flashsale");
              setIsMobileMenuOpen(false); // Auto-close menu on mobile
            }}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "flashsale" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            2. High-Concurrency Locks
          </button>

          {/* 2. Button 3: Rate Limiter Lab */}
          <button 
            onClick={() => {
              setActiveTab("ratelimiter");
              setIsMobileMenuOpen(false); // Auto-close menu on mobile
            }}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "ratelimiter" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            3. Rate Limiter Lab
          </button>

          {/* Button 4: Task Yard */}
          <button
            onClick={() => {
              setActiveTab("taskyard");
              setIsMobileMenuOpen(false);
            }}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "taskyard" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            4. Task Yard
          </button>

          {/* Button 5: Cloud Stash */}
          <button
            onClick={() => {
              setActiveTab("cloudstash");
              setIsMobileMenuOpen(false);
            }}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "cloudstash" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            5. Cloud Stash
          </button>

          {/* Button 6: Swift Flow */}
          <button
            onClick={() => {
              setActiveTab("swiftflow");
              setIsMobileMenuOpen(false);
            }}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "swiftflow" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            6. Swift Flow
          </button>
        </nav>
      </aside>

      {/* 2. The Main Stage */}
      <main className="flex-1 p-4 md:p-10 flex flex-col items-center justify-center overflow-y-auto">
        
        {/* Conditional Rendering: Auth Vault */}
        {activeTab === "auth" && (
          <AuthVault />
        )}

        {/* Conditional Rendering: Flash Sale */}
        {activeTab === "flashsale" && (
          <FlashSale />
        )}

        {/* 3. Conditional Rendering: Rate Limiter Lab */}
        {activeTab === "ratelimiter" && (
          <RateLimiterLab />
        )}

        {/* 4. Conditional Rendering: Task Yard */}
        {activeTab === "taskyard" && (
          <TaskYard />
        )}

        {/* 5. Conditional Rendering: Cloud Stash */}
        {activeTab === "cloudstash" && (
          <CloudStash />
        )}

        {/* 6. Conditional Rendering: Swift Flow */}
        {activeTab === "swiftflow" && (
          <SwiftFlow />
        )}

      </main>

    </div>
  );
}