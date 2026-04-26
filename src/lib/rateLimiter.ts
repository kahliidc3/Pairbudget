type RateLimitOptions = {
  key: string;
  windowMs: number;
  maxRequests: number;
  errorMessage?: string;
};

const requestLog = new Map<string, number[]>();

export const enforceRateLimit = ({
  key,
  windowMs,
  maxRequests,
  errorMessage = 'Too many requests. Please try again soon.',
}: RateLimitOptions) => {
  const now = Date.now();
  const timestamps = requestLog.get(key) ?? [];
  const filteredTimestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (filteredTimestamps.length >= maxRequests) {
    throw new Error(errorMessage);
  }

  filteredTimestamps.push(now);
  requestLog.set(key, filteredTimestamps);
};
