import * as Sentry from '@sentry/nextjs';

/**
 * Performance monitoring utilities for critical paths
 */

export interface PerformanceMetrics {
  duration: number;
  userId?: string;
  petId?: string;
  [key: string]: unknown;
}

/**
 * Monitor pet loading performance
 */
export async function monitorPetLoad<T>(
  userId: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startSpan(
    {
      name: 'pet.load',
      op: 'db.query',
      attributes: {
        userId,
      },
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        // Log slow queries
        if (duration > 1000) {
          console.warn('[SLOW_QUERY] Pet load took', duration, 'ms for user', userId);
          Sentry.captureMessage('Slow pet load', {
            level: 'warning',
            extra: { duration, userId },
          });
        }

        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );

  return transaction;
}

/**
 * Monitor breeding calculation performance
 */
export async function monitorBreedingCalculation<T>(
  parent1Id: string,
  parent2Id: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startSpan(
    {
      name: 'breeding.calculate',
      op: 'computation',
      attributes: {
        parent1Id,
        parent2Id,
      },
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        // Log slow breeding calculations
        if (duration > 2000) {
          console.warn('[SLOW_BREEDING] Breeding calculation took', duration, 'ms');
          Sentry.captureMessage('Slow breeding calculation', {
            level: 'warning',
            extra: { duration, parent1Id, parent2Id },
          });
        }

        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );

  return transaction;
}

/**
 * Monitor LLM API performance
 */
export async function monitorLLMRequest<T>(
  userId: string,
  petId: string,
  model: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startSpan(
    {
      name: 'llm.request',
      op: 'http.client',
      attributes: {
        userId,
        petId,
        model,
      },
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        // Log slow LLM requests
        if (duration > 5000) {
          console.warn('[SLOW_LLM] LLM request took', duration, 'ms');
          Sentry.captureMessage('Slow LLM request', {
            level: 'warning',
            extra: { duration, userId, petId, model },
          });
        }

        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );

  return transaction;
}

/**
 * Monitor stat degradation job performance
 */
export async function monitorStatDegradation<T>(
  petCount: number,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startSpan(
    {
      name: 'stats.degradation',
      op: 'job',
      attributes: {
        petCount,
      },
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        // Log if degradation job is taking too long
        if (duration > 10000) {
          console.warn('[SLOW_JOB] Stat degradation took', duration, 'ms for', petCount, 'pets');
          Sentry.captureMessage('Slow stat degradation job', {
            level: 'warning',
            extra: { duration, petCount },
          });
        }

        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );

  return transaction;
}

/**
 * Monitor API endpoint performance
 */
export async function monitorAPIEndpoint<T>(
  endpoint: string,
  method: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startSpan(
    {
      name: `api.${method}.${endpoint}`,
      op: 'http.server',
      attributes: {
        endpoint,
        method,
      },
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        // Log slow API responses
        if (duration > 3000) {
          console.warn('[SLOW_API] API endpoint', endpoint, 'took', duration, 'ms');
          Sentry.captureMessage('Slow API endpoint', {
            level: 'warning',
            extra: { duration, endpoint, method },
          });
        }

        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );

  return transaction;
}

/**
 * Track custom performance metric
 */
export function trackPerformance(name: string, duration: number, context?: Record<string, unknown>) {
  // Log to console
  console.log(`[PERFORMANCE] ${name}: ${duration}ms`, context);

  // Send to Sentry as measurement
  Sentry.getCurrentScope().setTag('performance_metric', name);
  Sentry.captureMessage(`Performance: ${name}`, {
    level: 'info',
    extra: {
      duration,
      ...context,
    },
  });
}

/**
 * Simple timer utility for manual performance tracking
 */
export class PerformanceTimer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
  }

  end(context?: Record<string, unknown>) {
    const duration = Date.now() - this.startTime;
    trackPerformance(this.name, duration, context);
    return duration;
  }
}
