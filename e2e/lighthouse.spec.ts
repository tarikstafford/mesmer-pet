import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import fs from 'fs';
import path from 'path';

test.describe('Lighthouse Performance Testing', () => {
  let testEmail: string;
  let testPassword: string;
  let authToken: string;

  // Setup authenticated user for testing protected pages
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const timestamp = Date.now();
    testEmail = `test-lighthouse-${timestamp}@example.com`;
    testPassword = 'TestPassword123!';

    // Register
    await page.goto('/auth/register');
    await page.fill('#name', 'Lighthouse User');
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#dateOfBirth', '2000-01-01');
    await page.click('button[type="submit"]');

    // Login
    await page.waitForURL(/\/auth\/login/);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // Wait for dashboard and get auth token
    await page.waitForURL('/dashboard');
    authToken = await page.evaluate(() => localStorage.getItem('authToken') || '');

    // Create a pet for testing
    await page.goto('/pets/create');
    await page.fill('#petName', `LighthousePet${timestamp}`);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await context.close();
  });

  test('should run Lighthouse audit on login page', async ({ page, context }, testInfo) => {
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Run Lighthouse audit
    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 80,
      },
      reports: {
        formats: {
          json: true,
          html: true,
        },
        name: 'lighthouse-login-page',
        directory: path.join(process.cwd(), 'lighthouse-reports'),
      },
    });
  });

  test('should run Lighthouse audit on registration page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 80,
      },
      reports: {
        formats: {
          json: true,
          html: true,
        },
        name: 'lighthouse-register-page',
        directory: path.join(process.cwd(), 'lighthouse-reports'),
      },
    });
  });

  test('should run Lighthouse audit on dashboard page', async ({ browser }) => {
    // Create new context with auth token
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'authToken',
        value: authToken,
        domain: 'localhost',
        path: '/',
      },
    ]);

    const page = await context.newPage();

    // Set localStorage
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for dynamic content

    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 85, // Slightly lower for heavy page with 3D models
        accessibility: 95,
        'best-practices': 90,
        seo: 80,
      },
      reports: {
        formats: {
          json: true,
          html: true,
        },
        name: 'lighthouse-dashboard-page',
        directory: path.join(process.cwd(), 'lighthouse-reports'),
      },
    });

    await context.close();
  });

  test('should run Lighthouse audit on pet creation page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/pets/create');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/create');
    await page.waitForLoadState('networkidle');

    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 80,
      },
      reports: {
        formats: {
          json: true,
          html: true,
        },
        name: 'lighthouse-pet-creation-page',
        directory: path.join(process.cwd(), 'lighthouse-reports'),
      },
    });

    await context.close();
  });

  test('should run Lighthouse audit on marketplace page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/pets/marketplace');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/marketplace');
    await page.waitForLoadState('networkidle');

    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 80,
      },
      reports: {
        formats: {
          json: true,
          html: true,
        },
        name: 'lighthouse-marketplace-page',
        directory: path.join(process.cwd(), 'lighthouse-reports'),
      },
    });

    await context.close();
  });

  test('should run Lighthouse audit on breeding page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/breed');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/breed');
    await page.waitForLoadState('networkidle');

    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 85, // Lower for 3D model rendering
        accessibility: 95,
        'best-practices': 90,
        seo: 80,
      },
      reports: {
        formats: {
          json: true,
          html: true,
        },
        name: 'lighthouse-breeding-page',
        directory: path.join(process.cwd(), 'lighthouse-reports'),
      },
    });

    await context.close();
  });

  test('should analyze and document performance bottlenecks', async () => {
    const reportsDir = path.join(process.cwd(), 'lighthouse-reports');

    // Check if reports exist
    if (!fs.existsSync(reportsDir)) {
      console.log('⚠️ No Lighthouse reports found. Run the tests first to generate reports.');
      return;
    }

    const reportFiles = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));

    const performanceAnalysis: Record<string, any> = {};

    for (const reportFile of reportFiles) {
      const reportPath = path.join(reportsDir, reportFile);
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

      const pageName = reportFile.replace('lighthouse-', '').replace('.report.json', '');

      performanceAnalysis[pageName] = {
        performance: reportData.categories?.performance?.score * 100 || 0,
        accessibility: reportData.categories?.accessibility?.score * 100 || 0,
        bestPractices: reportData.categories?.['best-practices']?.score * 100 || 0,
        seo: reportData.categories?.seo?.score * 100 || 0,
        firstContentfulPaint: reportData.audits?.['first-contentful-paint']?.numericValue || 0,
        largestContentfulPaint: reportData.audits?.['largest-contentful-paint']?.numericValue || 0,
        totalBlockingTime: reportData.audits?.['total-blocking-time']?.numericValue || 0,
        cumulativeLayoutShift: reportData.audits?.['cumulative-layout-shift']?.numericValue || 0,
        speedIndex: reportData.audits?.['speed-index']?.numericValue || 0,
      };
    }

    // Write performance summary
    const summaryPath = path.join(reportsDir, 'performance-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(performanceAnalysis, null, 2));

    console.log('\n📊 Performance Analysis Summary:');
    console.log(JSON.stringify(performanceAnalysis, null, 2));

    // Identify bottlenecks
    const bottlenecks: string[] = [];

    for (const [page, metrics] of Object.entries(performanceAnalysis)) {
      if (metrics.performance < 90) {
        bottlenecks.push(`${page}: Low performance score (${metrics.performance})`);
      }
      if (metrics.largestContentfulPaint > 2500) {
        bottlenecks.push(`${page}: Slow LCP (${Math.round(metrics.largestContentfulPaint)}ms)`);
      }
      if (metrics.totalBlockingTime > 300) {
        bottlenecks.push(`${page}: High TBT (${Math.round(metrics.totalBlockingTime)}ms)`);
      }
      if (metrics.cumulativeLayoutShift > 0.1) {
        bottlenecks.push(`${page}: High CLS (${metrics.cumulativeLayoutShift.toFixed(3)})`);
      }
    }

    if (bottlenecks.length > 0) {
      console.log('\n⚠️ Performance Bottlenecks Identified:');
      bottlenecks.forEach(b => console.log(`  - ${b}`));

      // Write bottlenecks to file
      const bottlenecksPath = path.join(reportsDir, 'bottlenecks.txt');
      fs.writeFileSync(bottlenecksPath, bottlenecks.join('\n'));
    } else {
      console.log('\n✅ No significant performance bottlenecks detected!');
    }
  });
});
