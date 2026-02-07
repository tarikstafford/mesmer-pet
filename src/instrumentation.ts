// Next.js Instrumentation - Runs on server startup
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startBackgroundJobs } = await import('@/lib/backgroundJobs');
    startBackgroundJobs();
  }
}
