declare module 'playwright-lighthouse' {
  import { Page, Browser } from '@playwright/test';

  interface LighthouseOptions {
    port?: number;
    disableStorageReset?: boolean;
    logLevel?: 'info' | 'error' | 'warn';
  }

  interface ThresholdOptions {
    performance?: number;
    accessibility?: number;
    'best-practices'?: number;
    seo?: number;
    pwa?: number;
  }

  export function playAudit(options: {
    page: Page;
    port?: number;
    thresholds?: ThresholdOptions;
    reports?: {
      formats?: {
        json?: boolean;
        html?: boolean;
        csv?: boolean;
      };
      name?: string;
      directory?: string;
    };
    opts?: LighthouseOptions;
  }): Promise<void>;
}
