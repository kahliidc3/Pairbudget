type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: Record<string, unknown>;
  error?: unknown;
}

const isBrowser = typeof window !== 'undefined';
const isDevelopment = process.env.NODE_ENV !== 'production';
const REMOTE_LOG_ENDPOINT = process.env.NEXT_PUBLIC_LOGGER_ENDPOINT;

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return error;
  }

  return { message: String(error) };
};

const sendToRemote = (level: LogLevel, message: string, options?: LogOptions) => {
  if (!REMOTE_LOG_ENDPOINT) {
    return;
  }

  try {
    const payload = {
      level,
      message,
      ...options,
      error: options?.error ? serializeError(options.error) : undefined,
      timestamp: new Date().toISOString(),
      userAgent: isBrowser ? window.navigator.userAgent : undefined,
    };

    if (isBrowser && typeof window.navigator?.sendBeacon === 'function') {
      window.navigator.sendBeacon(REMOTE_LOG_ENDPOINT, JSON.stringify(payload));
    } else {
      void fetch(REMOTE_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (remoteError) {
    if (isDevelopment) {
      console.error('[logger] Failed to forward log payload', remoteError);
    }
  }
};

const baseLog = (level: LogLevel, message: string, options?: LogOptions) => {
  const { context, error } = options || {};

  switch (level) {
    case 'debug':
      if (isDevelopment) {
        console.debug(message, context ?? '');
      }
      break;
    case 'info':
      console.info(message, context ?? '');
      break;
    case 'warn':
      console.warn(message, context ?? '');
      break;
    case 'error':
      console.error(message, context ?? '', error ?? '');
      break;
    default:
      console.log(message, context ?? '');
  }

  if (level === 'warn' || level === 'error') {
    sendToRemote(level, message, options);
  }
};

export const logger = {
  debug: (message: string, options?: LogOptions) => baseLog('debug', message, options),
  info: (message: string, options?: LogOptions) => baseLog('info', message, options),
  warn: (message: string, options?: LogOptions) => baseLog('warn', message, options),
  error: (message: string, options?: LogOptions) => baseLog('error', message, options),
};

export type Logger = typeof logger;
