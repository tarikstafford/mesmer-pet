# Visual Regression Testing with Percy

This project uses Percy for visual regression testing to catch unintended UI changes.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Percy project:
   - Create account at https://percy.io
   - Create new project
   - Get PERCY_TOKEN from project settings

3. Set environment variable:
```bash
export PERCY_TOKEN=your_token_here
```

## Running Visual Tests

### Local Testing (without Percy)
```bash
npm run test:e2e -- e2e/visual-regression.spec.ts
```

### With Percy Integration
```bash
npx percy exec -- npm run test:e2e -- e2e/visual-regression.spec.ts
```

### CI Integration
Percy is configured to run in the CI pipeline. Set `PERCY_TOKEN` secret in your CI environment.

## Review Process

1. **Baseline Capture**: First run creates baseline screenshots
2. **Change Detection**: Subsequent runs compare against baseline
3. **Review Changes**:
   - Visit Percy dashboard at https://percy.io
   - Review visual diffs highlighted in red/green
   - Approve changes if intentional
   - Reject and fix if unintended

## Best Practices

### Consistent Test Data
- Use timestamp-based unique identifiers for test users
- Reset database state between test runs if needed
- Mock dynamic content (dates, times, random IDs)

### Handling Dynamic Content
- Use `percyCSS` in `.percy.yml` to hide animations
- Add data-testid attributes to elements with dynamic content
- Wait for content to load before capturing (use `page.waitForTimeout()`)

### Responsive Testing
Tests capture snapshots at multiple breakpoints:
- 375px: Mobile
- 768px: Tablet
- 1280px: Desktop
- 1920px: Large Desktop

### What to Test
✅ **Do test:**
- Page layouts and structure
- Component rendering
- Responsive breakpoints
- Error states
- Loading states
- User flows (login, registration, etc.)

❌ **Don't test:**
- Animations mid-frame
- Real-time timestamps
- Random generated content
- Third-party widgets

## Troubleshooting

### False Positives
If tests fail due to non-visual changes (animations, timestamps):
1. Add CSS rules to `.percy.yml` to normalize elements
2. Use Percy's ignore regions feature
3. Add data-testid attributes for hiding dynamic content

### Missing Snapshots
If snapshots aren't appearing:
1. Check PERCY_TOKEN is set correctly
2. Verify `npx percy exec` wraps the test command
3. Check network connectivity to percy.io
4. Review Percy CLI logs for errors

### Slow Tests
Percy snapshots add overhead:
1. Run visual tests separately from functional tests
2. Use `widths` option to capture multiple breakpoints in one snapshot
3. Limit number of snapshots per test run
4. Use Percy's parallel processing in CI

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Percy Visual Tests
  run: npx percy exec -- npm run test:e2e -- e2e/visual-regression.spec.ts
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

### Required Environment Variables
- `PERCY_TOKEN`: Percy project token

### Optional Configuration
- `PERCY_BRANCH`: Git branch name (auto-detected)
- `PERCY_COMMIT`: Git commit SHA (auto-detected)
- `PERCY_PARALLEL_TOTAL`: Number of parallel CI nodes
- `PERCY_PARALLEL_NONCE`: Unique ID for parallel run

## Snapshot Management

### Approving Changes
1. Review build in Percy dashboard
2. Click "Approve" to update baseline
3. Future runs compare against new baseline

### Reverting Baselines
If you accidentally approved bad changes:
1. Go to Percy build history
2. Find last good build
3. Click "Use as baseline"

### Cleaning Up
Old builds are automatically cleaned up after 30 days. You can manually delete builds from the Percy dashboard.

## Resources

- [Percy Documentation](https://docs.percy.io)
- [Percy Playwright Integration](https://docs.percy.io/docs/playwright)
- [Percy CI/CD Guide](https://docs.percy.io/docs/ci-cd)
- [Best Practices](https://docs.percy.io/docs/best-practices)
