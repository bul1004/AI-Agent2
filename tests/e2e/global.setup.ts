// tests/global.setup.ts

// Export default function for Playwright's globalSetup
export default async function globalSetup() {
  // BetterAuth doesn't require special global setup for E2E tests
  // Session handling is done per-test via cookie-based auth
}
