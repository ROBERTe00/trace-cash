# Section 4: Verification Plan - Test Suite

This directory contains automated tests for the trace-cash application as specified in Section 4 of the implementation plan.

## Test Structure

### 1. PDF Upload Tests (`pdf-upload.spec.ts`)
Tests for PDF extraction accuracy, OCR fallback, and error handling:
- ✅ Extract 50+ transactions from Italian bank statements
- ✅ OCR fallback when GPT-4.1 Vision fails
- ✅ Handle large files (8MB+) without timeout
- ✅ Provide user-friendly error messages in Italian

### 2. Excel Upload Tests (`excel-upload.spec.ts`)
Tests for batch AI processing speed and accuracy:
- ✅ Process 100 rows in under 15 seconds
- ✅ Maintain 90%+ categorization accuracy
- ✅ Handle mixed Italian/English descriptions
- ✅ Show real-time progress updates
- ✅ Handle malformed CSV files

### 3. Service Worker Tests (`sw-updates.spec.ts`)
Tests for PWA update flow and offline capabilities:
- ✅ Detect new SW versions without aggressive polling
- ✅ Prevent reload during user interaction
- ✅ Handle SW activation messages
- ✅ Clear old caches on activation
- ✅ Maintain zero layout shifts (CLS < 0.01)
- ✅ Handle offline->online transitions

### 4. Accessibility Tests (`accessibility.spec.ts`)
WCAG 2.1 AA compliance tests:
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ Color contrast (4.5:1 ratio minimum)
- ✅ Focus management and visibility
- ✅ ARIA labels and screen reader support

## Running Tests

### Run all tests
\`\`\`bash
npm run test
\`\`\`

### Run tests in watch mode
\`\`\`bash
npm run test:watch
\`\`\`

### Run tests with coverage
\`\`\`bash
npm run test:coverage
\`\`\`

### Run tests with UI
\`\`\`bash
npm run test:ui
\`\`\`

### Run Lighthouse performance audit
\`\`\`bash
npm run lighthouse
\`\`\`

## Test Helpers

Located in `tests/helpers/test-utils.tsx`:
- `render()` - Custom render with all providers
- `generateCSV(rows)` - Generate test CSV files
- `createTestFile()` - Create File objects for upload tests
- `delay(ms)` - Wait for async operations

## Expected Outcomes

After all tests pass, the application should achieve:

### PDF Reader
- ✅ 95% extraction accuracy for Italian bank statements
- ✅ 80% success rate with OCR fallback
- ✅ Processing time: 5-15 seconds (down from 30-120s)
- ✅ User-friendly error messages in Italian

### Excel Reader
- ✅ 10x faster processing (50 rows in 8s vs. 80s)
- ✅ 90% categorization accuracy with batch AI
- ✅ Real-time progress indicators
- ✅ Cost reduction: $0.05 per upload (down from $0.50)

### Site Speed
- ✅ Lighthouse Performance Score: 92+
- ✅ First Contentful Paint: < 1.5s
- ✅ Largest Contentful Paint: < 2.5s
- ✅ Cumulative Layout Shift: < 0.01
- ✅ Time to Interactive: < 3.5s

### Service Worker
- ✅ Zero layout shifts during updates
- ✅ Smart update detection (no aggressive polling)
- ✅ Smooth offline experience
- ✅ PWA installability maintained (Lighthouse PWA: 100)

### Accessibility
- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation support
- ✅ Color contrast ratios met (4.5:1)
- ✅ Accessibility score: 95+ (Lighthouse)

## Manual Testing Checklist

In addition to automated tests, perform manual verification:

### PDF Reader Manual Tests
- [ ] Upload 5MB Italian bank statement (Intesa Sanpaolo format)
- [ ] Verify 100+ transactions extracted
- [ ] Check confidence scores (80%+ should be >0.8)
- [ ] Test with English bank statement (Chase format)
- [ ] Verify OCR fallback works on scanned PDF
- [ ] Test timeout handling (upload 12MB file)

### Excel Reader Manual Tests
- [ ] Upload 50-row CSV with mixed Italian/English
- [ ] Verify categorization accuracy (>90% correct)
- [ ] Check processing time (<10 seconds for 50 rows)
- [ ] Test with 200-row file (should complete <30s)
- [ ] Verify progress indicator updates smoothly
- [ ] Test with malformed CSV

### Site Speed Manual Tests
- [ ] Run Lighthouse on /dashboard (target: >90 performance)
- [ ] Check First Contentful Paint (<1.5s)
- [ ] Verify Largest Contentful Paint (<2.5s)
- [ ] Test on 3G network (Chrome DevTools throttling)
- [ ] Verify bundle sizes: main < 300KB, vendor < 500KB

### Service Worker Manual Tests
- [ ] Install PWA on Android Chrome
- [ ] Test offline mode (disconnect WiFi, reload app)
- [ ] Verify cached transactions visible offline
- [ ] Deploy new version, verify update prompt
- [ ] Test update flow (click "Refresh", no data loss)

## CI/CD Integration

These tests should be run in your CI/CD pipeline:

\`\`\`yaml
# Example GitHub Actions workflow
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - run: npm run build
      - run: npm run lighthouse
\`\`\`

## Troubleshooting

If tests fail:
1. Check that all dependencies are installed: `npm install`
2. Verify Supabase environment variables are set
3. Check mock data in `tests/helpers/test-utils.tsx`
4. Review test logs for specific error messages
5. Run tests individually to isolate failures

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests cover edge cases
3. Run full test suite before committing
4. Update this README if adding new test files
