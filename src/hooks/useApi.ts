"use client";

import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";

export function useApi() {
  const { accessToken, refreshAuth, logout, addLog } = useAuth();

  const authFetch = useCallback(async (url: string | Request | URL, options: RequestInit = {}) => {
    // 1. Prepare headers with the current Access Token
    const headers = new Headers(options.headers);
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    // 2. Execute the initial request
    let response = await fetch(url, { ...options, headers });

    // 3. Handle Token Expiration (Intercept 401 Unauthorized)
    if (response.status === 401) {
      addLog("[SYSTEM] 401 Unauthorized detected. Access token expired.", true);
      addLog("[SYSTEM] Attempting silent HttpOnly rotation...");
      
      // Attempt to rotate the HttpOnly refresh token
      const newAccessToken = await refreshAuth();

      if (newAccessToken) {
        // Success! Retry the original request with the brand new token
        addLog("[SYSTEM] Token rotated successfully. Retrying original request.");
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
        
        response = await fetch(url, { ...options, headers: retryHeaders });
      } else {
        // Refresh failed (token was stolen, expired, or completely missing). Force logout.
        addLog("[FATAL] Session unrecoverable or token theft detected. Forcing logout.", true);
        await logout();
      }
    }

    return response;
  }, [accessToken, refreshAuth, logout, addLog]);

  return authFetch;
}