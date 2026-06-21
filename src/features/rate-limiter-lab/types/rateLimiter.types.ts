export type AlgorithmType = "FIXED_WINDOW" | "SLIDING_WINDOW" | "TOKEN_BUCKET";

export type AccountStateType = "ACTIVE" | "WARNED" | "LOCKED" | "COOLING_DOWN";

export interface LoginRequest {
  username: string;
  password: string;
  ipAddress: string;
}

export interface LoginResponse {
  success: boolean;
  username: string;
  ipAddress: string;
  algorithm: AlgorithmType;
  accountState: AccountStateType;
  message: string;
  attemptsUsed: number;
  attemptsRemaining: number;
  warned: boolean;
  locked: boolean;
  autoUnlockInSeconds: number | null;
  windowResetInSeconds: number | null;
  cooldownExpiresAt: string | null;
  vpnBypassBlocked: boolean;
  azureWouldAllow: boolean;
  azureReason: string | null;
  fixedWindowVulnerable: boolean;
  fixedWindowWarning: string | null;
}

export interface AccountStatus {
  username: string;
  accountState: AccountStateType;
  attemptsUsed: number;
  attemptsRemaining: number;
  warned: boolean;
  locked: boolean;
  autoUnlockInSeconds: number | null;
  algorithm: AlgorithmType;
}

export interface RateLimiterConfig {
  algorithm: AlgorithmType;
  maxAttempts: number;
  warnedThreshold: number;
  windowSizeSeconds: number;
  cooldownSeconds: number;
  tokenBucketCapacity: number;
  tokenRefillRate: number;
}

export interface RequestLogEntry {
  id: string;
  timestamp: Date;
  username: string;
  ipAddress: string;
  response: LoginResponse;
  isBot: boolean;
}