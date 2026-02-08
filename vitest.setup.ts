import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'file:./test.db';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-x';
