"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

// --- Types ---
interface User {
  username: string;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  username: string;
  role: string;
}

interface AuditLog {
  time: string;
  msg: string;
  isError: boolean;
}

interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number; // The crucial expiration timestamp
}

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  tokenExp: number | null;
  isLoading: boolean;
  logs: AuditLog[];
  addLog: (msg: string, isError?: boolean) => void;
  clearLogs: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_API_URL = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tokenExp, setTokenExp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // --- Global Logging System ---
  const addLog = useCallback((msg: string, isError = false) => {
    setLogs(prev => {
      const newLog = { time: new Date().toLocaleTimeString().split(" ")[0], msg, isError };
      return [newLog, ...prev].slice(0, 15); // Keep the last 15 logs in memory
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // --- Core Methods ---
  const handleAuthResponse = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser({ username: data.username, role: data.role });
    
    // Decode the JWT to get the exact expiration timestamp for our UI timer
    try {
      const decoded = jwtDecode<JwtPayload>(data.accessToken);
      setTokenExp(decoded.exp);
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      setTokenExp(null);
    }
  }, []);

  const login = async (username: string, password: string) => {
    addLog(`Attempting login for user: ${username}...`);
    const res = await fetch(`${AUTH_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include", 
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login failed");
    }

    const data: AuthResponse = await res.json();
    handleAuthResponse(data);
    addLog(`[200 OK] Login successful. Access Token acquired.`);
  };

  const register = async (username: string, password: string, role: string) => {
    addLog(`Registering new ${role}: ${username}...`);
    const res = await fetch(`${AUTH_API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
      credentials: "include", 
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Registration failed");
    }

    const data: AuthResponse = await res.json();
    handleAuthResponse(data);
    addLog(`[200 OK] Registration successful. Access Token acquired.`);
  };

  const logout = async () => {
    addLog("Terminating session and burning cookies...");
    try {
      await fetch(`${AUTH_API_URL}/logout`, {
        method: "POST",
        credentials: "include", 
      });
    } catch (err) {
      console.error("Logout request failed.", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setTokenExp(null);
      addLog("Session terminated successfully.");
    }
  };

  const refreshAuth = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${AUTH_API_URL}/refresh`, {
        method: "POST",
        credentials: "include", 
      });

      if (res.ok) {
        const data: AuthResponse = await res.json();
        handleAuthResponse(data);
        return data.accessToken;
      } else {
        setAccessToken(null);
        setUser(null);
        setTokenExp(null);
        return null;
      }
    } catch (err) {
      setAccessToken(null);
      setUser(null);
      setTokenExp(null);
      return null;
    }
  }, [handleAuthResponse]);

  // --- Initial Session Load ---
  useEffect(() => {
    refreshAuth().finally(() => {
      setIsLoading(false);
    });
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ 
      accessToken, user, tokenExp, isLoading, 
      logs, addLog, clearLogs, 
      login, register, logout, refreshAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Custom Hook ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}