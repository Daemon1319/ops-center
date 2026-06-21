import { useState, useCallback } from "react";
import {
  LoginRequest,
  LoginResponse,
  AccountStatus,
  AlgorithmType,
  RateLimiterConfig,
} from "../types/rateLimiter.types";

export const useRateLimiter = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getBaseUrl = () => process.env.NEXT_PUBLIC_RATE_LIMITER_API_URL;

  const login = useCallback(async (req: LoginRequest): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      // 401 (Invalid) and 423 (Locked) are expected business responses, so we parse them normally
      if (!response.ok && response.status !== 401 && response.status !== 423) {
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Rate Limiter API";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStatus = useCallback(async (username: string): Promise<AccountStatus> => {
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/rate-limiter/status/${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch account status";
      setError(msg);
      throw err;
    }
  }, []);

  const switchAlgorithm = useCallback(async (algorithm: AlgorithmType): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/rate-limiter/algorithm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to switch algorithm";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetAll = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/rate-limiter/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset rate limiter";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getConfig = useCallback(async (): Promise<RateLimiterConfig> => {
    setError(null);
    try {
      const response = await fetch(`${getBaseUrl()}/api/rate-limiter/config`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch config";
      setError(msg);
      throw err;
    }
  }, []);

  return {
    login,
    getStatus,
    switchAlgorithm,
    resetAll,
    getConfig,
    isLoading,
    error,
  };
};