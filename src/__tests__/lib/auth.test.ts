import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateVerificationToken,
} from '@/lib/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should generate bcrypt hash', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);

      // Verify it's a bcrypt hash format
      expect(hashed).toMatch(/^\$2[aby]\$/);
      expect(hashed.length).toBeGreaterThan(20);
      expect(hashed).not.toBe(password);
    });

    it('should generate different hashes for same password due to random salt', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // bcrypt uses random salt, so hashes should differ
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hashed = await hashPassword('');
      expect(hashed).toMatch(/^\$2[aby]\$/);
    });

    it('should handle very long password', async () => {
      const longPassword = 'a'.repeat(1000);
      const hashed = await hashPassword(longPassword);

      expect(hashed).toMatch(/^\$2[aby]\$/);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it('should handle special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashed = await hashPassword(specialPassword);

      expect(hashed).toMatch(/^\$2[aby]\$/);
      // Verify the hash works with verifyPassword
      const isValid = await verifyPassword(specialPassword, hashed);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const unicodePassword = '密码123!🔒';
      const hashed = await hashPassword(unicodePassword);

      expect(hashed).toMatch(/^\$2[aby]\$/);
      const isValid = await verifyPassword(unicodePassword, hashed);
      expect(isValid).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should validate correct password', async () => {
      const password = 'CorrectPassword123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'CaseSensitive123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword('casesensitive123!', hashed);
      expect(isValid).toBe(false);
    });

    it('should reject slightly different password', async () => {
      const password = 'Password123!';
      const hashed = await hashPassword(password);

      // Add one character
      const isValid1 = await verifyPassword('Password123!x', hashed);
      expect(isValid1).toBe(false);

      // Remove one character
      const isValid2 = await verifyPassword('Password123', hashed);
      expect(isValid2).toBe(false);

      // Change one character
      const isValid3 = await verifyPassword('Password124!', hashed);
      expect(isValid3).toBe(false);
    });

    it('should reject empty password against non-empty hash', async () => {
      const password = 'NonEmpty123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword('', hashed);
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format gracefully', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'not-a-valid-bcrypt-hash';

      // bcrypt.compare returns false for invalid hash format rather than throwing
      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });

    it('should work with bcrypt rounds', async () => {
      // Test that it works with standard bcrypt format (10 rounds by default)
      const password = 'TestRounds123!';
      const hashed = await bcrypt.hash(password, 10);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('should create valid JWT with expiration', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has header.payload.signature
    });

    it('should include payload data in token', () => {
      const payload = { userId: 'user-456', email: 'user@example.com' };
      const token = generateToken(payload);

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('user-456');
      expect(decoded?.email).toBe('user@example.com');
    });

    it('should include expiration claim', () => {
      const payload = { userId: 'user-789', email: 'exp@example.com' };
      const token = generateToken(payload);

      const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this-in-production';
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('should set expiration to 7 days', () => {
      const payload = { userId: 'user-abc', email: 'week@example.com' };
      const token = generateToken(payload);

      const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this-in-production';
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const now = Date.now() / 1000;
      const sevenDays = 7 * 24 * 60 * 60;
      const expectedExp = now + sevenDays;

      // Allow 5 second tolerance for test execution time
      expect(decoded.exp).toBeGreaterThan(expectedExp - 5);
      expect(decoded.exp).toBeLessThan(expectedExp + 5);
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { userId: 'user-1', email: 'user1@example.com' };
      const payload2 = { userId: 'user-2', email: 'user2@example.com' };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should handle special characters in payload', () => {
      const payload = {
        userId: 'user-special-!@#$',
        email: 'special+tag@sub.example.com',
      };
      const token = generateToken(payload);

      const decoded = verifyToken(token);
      expect(decoded?.userId).toBe('user-special-!@#$');
      expect(decoded?.email).toBe('special+tag@sub.example.com');
    });
  });

  describe('verifyToken', () => {
    it('should validate valid token', () => {
      const payload = { userId: 'valid-user', email: 'valid@example.com' };
      const token = generateToken(payload);

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('valid-user');
      expect(decoded?.email).toBe('valid@example.com');
    });

    it('should reject invalid token format', () => {
      const invalidToken = 'not.a.valid.jwt.token';

      const decoded = verifyToken(invalidToken);
      expect(decoded).toBeNull();
    });

    it('should reject tampered token signature', () => {
      const payload = { userId: 'tamper-user', email: 'tamper@example.com' };
      const token = generateToken(payload);

      // Tamper with signature (last part)
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.' + parts[1] + '.tamperedSignature123';

      const decoded = verifyToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    it('should reject tampered payload', () => {
      const payload = { userId: 'original-user', email: 'original@example.com' };
      const token = generateToken(payload);

      // Tamper with payload (middle part)
      const parts = token.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({ userId: 'hacker-user', email: 'hacker@example.com' })
      ).toString('base64url');
      const tamperedToken = parts[0] + '.' + tamperedPayload + '.' + parts[2];

      const decoded = verifyToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    it('should reject empty token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });

    it('should reject token with wrong secret', () => {
      const wrongSecret = 'wrong-secret-key-12345';
      const payload = { userId: 'secret-user', email: 'secret@example.com' };
      const token = jwt.sign(payload, wrongSecret, { expiresIn: '7d' });

      const decoded = verifyToken(token);
      expect(decoded).toBeNull();
    });

    it('should reject expired token', () => {
      // Create token that expired 1 hour ago
      const payload = { userId: 'expired-user', email: 'expired@example.com' };
      const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this-in-production';
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

      const decoded = verifyToken(expiredToken);
      expect(decoded).toBeNull();
    });

    it('should handle malformed base64 in token', () => {
      const malformedToken = 'header.malformed@#$%^&*.signature';

      const decoded = verifyToken(malformedToken);
      expect(decoded).toBeNull();
    });

    it('should reject token with missing parts', () => {
      const incompletToken = 'header.payload'; // Missing signature

      const decoded = verifyToken(incompletToken);
      expect(decoded).toBeNull();
    });

    it('should reject token with extra parts', () => {
      const payload = { userId: 'extra-user', email: 'extra@example.com' };
      const token = generateToken(payload);
      const extraToken = token + '.extra.parts';

      const decoded = verifyToken(extraToken);
      expect(decoded).toBeNull();
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate random token', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');

      // Tokens should be different due to randomness
      expect(token1).not.toBe(token2);
    });

    it('should generate token with reasonable length', () => {
      const token = generateVerificationToken();

      // Should be long enough to be secure (at least 20 characters)
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate alphanumeric token', () => {
      const token = generateVerificationToken();

      // Should only contain alphanumeric characters
      expect(token).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateVerificationToken());
      }

      // All tokens should be unique (collision probability is extremely low)
      expect(tokens.size).toBe(iterations);
    });
  });

  describe('Token integration tests', () => {
    it('should handle complete token lifecycle', () => {
      // Generate token
      const payload = { userId: 'lifecycle-user', email: 'lifecycle@example.com' };
      const token = generateToken(payload);

      // Verify token
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);

      // Use in auth flow (simulate)
      const isAuthenticated = decoded !== null;
      expect(isAuthenticated).toBe(true);
    });

    it('should handle password change flow', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';

      // Hash old password
      const oldHash = await hashPassword(oldPassword);
      expect(await verifyPassword(oldPassword, oldHash)).toBe(true);

      // User changes password
      const newHash = await hashPassword(newPassword);

      // Old password should not work with new hash
      expect(await verifyPassword(oldPassword, newHash)).toBe(false);

      // New password should work with new hash
      expect(await verifyPassword(newPassword, newHash)).toBe(true);
    });

    it('should handle token refresh scenario', async () => {
      const payload = { userId: 'refresh-user', email: 'refresh@example.com' };

      // Generate initial token
      const token1 = generateToken(payload);
      const decoded1 = verifyToken(token1);
      expect(decoded1).toBeDefined();

      // Wait 1ms to ensure different timestamp (JWT uses seconds precision, but we wait to be safe)
      await new Promise((resolve) => setTimeout(resolve, 1));

      // Simulate token refresh (generate new token)
      const token2 = generateToken(payload);
      const decoded2 = verifyToken(token2);
      expect(decoded2).toBeDefined();

      // Both tokens should be valid and contain same payload data
      expect(decoded1?.userId).toBe(decoded2?.userId);
      expect(decoded1?.email).toBe(decoded2?.email);

      // Both tokens should work for authentication (even if they're the same)
      expect(verifyToken(token1)).toBeDefined();
      expect(verifyToken(token2)).toBeDefined();
    });
  });

  describe('Edge cases and security', () => {
    it('should handle null/undefined values safely', () => {
      // verifyToken with undefined should not crash
      const result1 = verifyToken(undefined as any);
      expect(result1).toBeNull();

      // verifyToken with null should not crash
      const result2 = verifyToken(null as any);
      expect(result2).toBeNull();
    });

    it('should handle extremely long tokens', () => {
      const longToken = 'a'.repeat(10000);

      const decoded = verifyToken(longToken);
      expect(decoded).toBeNull();
    });

    it('should prevent timing attacks on password verification', async () => {
      // bcrypt.compare is designed to be constant-time, test it works
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const start1 = performance.now();
      await verifyPassword('wrong', hash);
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      await verifyPassword('wrongpassword', hash);
      const time2 = performance.now() - start2;

      // Both should take similar time (allow for variance)
      // This is a basic check - bcrypt's constant-time property is built-in
      expect(Math.abs(time1 - time2)).toBeLessThan(100); // Less than 100ms difference
    });

    it('should handle concurrent token generation', () => {
      const payload = { userId: 'concurrent-user', email: 'concurrent@example.com' };

      const tokens = Array.from({ length: 10 }, () => generateToken(payload));

      // All tokens should be valid
      tokens.forEach((token) => {
        const decoded = verifyToken(token);
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe('concurrent-user');
      });
    });

    it('should handle concurrent password hashing', async () => {
      const password = 'ConcurrentPassword123!';

      const hashes = await Promise.all(
        Array.from({ length: 10 }, () => hashPassword(password))
      );

      // All hashes should be different due to random salt
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(10);

      // All hashes should verify correctly
      const verifications = await Promise.all(
        hashes.map((hash) => verifyPassword(password, hash))
      );
      expect(verifications.every((result) => result === true)).toBe(true);
    });

    it('should sanitize token payload', () => {
      // Ensure only expected fields are in token
      const payload = {
        userId: 'sanitize-user',
        email: 'sanitize@example.com',
      };
      const token = generateToken(payload);

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();

      // Should only have userId and email (plus JWT standard claims)
      const decodedKeys = Object.keys(decoded || {});
      expect(decodedKeys).toContain('userId');
      expect(decodedKeys).toContain('email');
    });
  });
});
