export const APP_LIMITS = {
  authStateTimeoutMs: 10_000,
  orphanedRedirectDelayMs: 500,
  orphanedReauthRedirectDelayMs: 1_000,
  maxTransactionAmount: 1_000_000,
  userNameCacheTtlMs: 5 * 60 * 1000,
} as const;

export const RATE_LIMITS = {
  joinPocket: {
    windowMs: 60_000,
    maxRequests: 5,
  },
  addTransaction: {
    windowMs: 30_000,
    maxRequests: 10,
  },
} as const;

export const SUBSCRIPTION_CONFIG = {
  maxAgeMs: 5 * 60 * 1000,
  maxRetries: 5,
  maxConsecutiveErrors: 3,
  baseRetryDelayMs: 1_000,
  degradedRetryDelayMs: 5_000,
  maxRetryDelayMs: 30_000,
  recoveryRetryDelayMs: 3_000,
  internalAssertionRetryDelayMs: 2_000,
} as const;
