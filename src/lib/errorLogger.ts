import * as Sentry from '@sentry/nextjs';

/**
 * Error logging and monitoring utilities using Sentry
 */

export interface ErrorContext {
  userId?: string;
  petId?: string;
  skillId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Log an error to Sentry with additional context
 */
export function logError(error: Error, context?: ErrorContext) {
  console.error('[ERROR]', error.message, context);

  Sentry.captureException(error, {
    extra: context,
    tags: {
      component: context?.component,
      action: context?.action,
    },
  });
}

/**
 * Log LLM API failures with detailed context
 */
export function logLLMFailure(error: Error, context: {
  userId: string;
  petId: string;
  provider: 'openai' | 'other';
  model: string;
  promptLength?: number;
  responseLength?: number;
  statusCode?: number;
}) {
  console.error('[LLM_FAILURE]', error.message, context);

  Sentry.captureException(error, {
    extra: {
      ...context,
      errorType: 'llm_failure',
    },
    tags: {
      component: 'llm',
      provider: context.provider,
      model: context.model,
    },
    level: 'error',
  });
}

/**
 * Log AR session crashes with device and session context
 */
export function logARSessionCrash(error: Error, context: {
  userId: string;
  petId: string;
  sessionDuration?: number;
  deviceType?: string;
  browserAgent?: string;
  sessionActions?: string[];
}) {
  console.error('[AR_CRASH]', error.message, context);

  Sentry.captureException(error, {
    extra: {
      ...context,
      errorType: 'ar_crash',
    },
    tags: {
      component: 'ar_viewer',
      deviceType: context.deviceType,
    },
    level: 'error',
  });
}

/**
 * Log payment failures with anonymized user data
 */
export function logPaymentFailure(error: Error, context: {
  userId: string; // Will be anonymized by Sentry
  skillId?: string;
  amount?: number;
  currency?: string;
  provider: 'stripe' | 'other';
  errorCode?: string;
  failureReason?: string;
}) {
  // Remove sensitive payment details before logging
  const anonymizedContext = {
    userId: context.userId, // Sentry will hash this
    skillId: context.skillId,
    amount: context.amount,
    currency: context.currency,
    provider: context.provider,
    errorCode: context.errorCode,
    failureReason: context.failureReason,
    errorType: 'payment_failure',
  };

  console.error('[PAYMENT_FAILURE]', error.message, anonymizedContext);

  Sentry.captureException(error, {
    extra: anonymizedContext,
    tags: {
      component: 'payments',
      provider: context.provider,
      errorCode: context.errorCode,
    },
    level: 'error',
  });
}

/**
 * Log a warning (non-critical error)
 */
export function logWarning(message: string, context?: ErrorContext) {
  console.warn('[WARNING]', message, context);

  Sentry.captureMessage(message, {
    level: 'warning',
    extra: context,
    tags: {
      component: context?.component,
    },
  });
}

/**
 * Log informational events (for debugging and monitoring)
 */
export function logInfo(message: string, context?: ErrorContext) {
  console.log('[INFO]', message, context);

  // Only log info events in production if they're significant
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      level: 'info',
      extra: context,
    });
  }
}

/**
 * Set user context for error tracking (call after authentication)
 */
export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email: email,
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions leading to errors
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
