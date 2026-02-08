import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
} from '@/lib/auth';

// Mock NextRequest
class MockNextRequest {
  private body: any;

  constructor(body: any) {
    this.body = body;
  }

  async json() {
    return this.body;
  }
}

describe('Auth API Endpoints', () => {
  // Cleanup database before and after each test
  beforeEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.verificationToken.deleteMany({});
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.verificationToken.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const mockRequest = new MockNextRequest({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        dateOfBirth: '2000-01-01',
      }) as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User registered successfully');
      expect(data.userId).toBeDefined();
      expect(data.email).toBe('test@example.com');
      expect(data.verificationToken).toBeDefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test User');
      expect(user?.emailVerified).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          password: await hashPassword('Password123!'),
          name: 'Existing User',
        },
      });

      const mockRequest = new MockNextRequest({
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'New User',
      }) as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
    });

    it('should reject registration with invalid email', async () => {
      const mockRequest = new MockNextRequest({
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      }) as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
      expect(data.details).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const mockRequest = new MockNextRequest({
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      }) as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject registration without required fields', async () => {
      const mockRequest = new MockNextRequest({
        email: 'test@example.com',
        // Missing password and name
      }) as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should hash password correctly', async () => {
      const mockRequest = new MockNextRequest({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      }) as any;

      await registerPOST(mockRequest);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      // Password should be hashed, not plain text
      expect(user?.password).not.toBe('Password123!');
      expect(user?.password.length).toBeGreaterThan(20);

      // Verify password hash is valid
      const isValid = await verifyPassword('Password123!', user!.password);
      expect(isValid).toBe(true);
    });

    it('should create verification token', async () => {
      const mockRequest = new MockNextRequest({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      }) as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      const verificationToken = await prisma.verificationToken.findFirst({
        where: { identifier: 'test@example.com' },
      });

      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBe(data.verificationToken);
      expect(verificationToken?.expires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await prisma.user.create({
        data: {
          email: 'login@example.com',
          password: await hashPassword('Password123!'),
          name: 'Login User',
          emailVerified: true,
        },
      });
    });

    it('should successfully login with correct credentials', async () => {
      const mockRequest = new MockNextRequest({
        email: 'login@example.com',
        password: 'Password123!',
      }) as any;

      const response = await loginPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('login@example.com');
      expect(data.user.name).toBe('Login User');

      // Verify JWT token is valid
      const tokenPayload = verifyToken(data.token);
      expect(tokenPayload).toBeDefined();
      expect(tokenPayload?.email).toBe('login@example.com');
    });

    it('should reject login with wrong password', async () => {
      const mockRequest = new MockNextRequest({
        email: 'login@example.com',
        password: 'WrongPassword123!',
      }) as any;

      const response = await loginPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject login with nonexistent email', async () => {
      const mockRequest = new MockNextRequest({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      }) as any;

      const response = await loginPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject login with invalid input', async () => {
      const mockRequest = new MockNextRequest({
        email: 'invalid-email',
        password: 'short',
      }) as any;

      const response = await loginPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should create session after successful login', async () => {
      const mockRequest = new MockNextRequest({
        email: 'login@example.com',
        password: 'Password123!',
      }) as any;

      const response = await loginPOST(mockRequest);
      const data = await response.json();

      const user = await prisma.user.findUnique({
        where: { email: 'login@example.com' },
      });

      const session = await prisma.session.findFirst({
        where: { userId: user!.id },
      });

      expect(session).toBeDefined();
      expect(session?.sessionToken).toBe(data.token);
      expect(session?.expires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should not include password in response', async () => {
      const mockRequest = new MockNextRequest({
        email: 'login@example.com',
        password: 'Password123!',
      }) as any;

      const response = await loginPOST(mockRequest);
      const data = await response.json();

      expect(data.user.password).toBeUndefined();
    });
  });

  describe('Auth Helper Functions', () => {
    describe('hashPassword', () => {
      it('should hash password correctly', async () => {
        const password = 'TestPassword123!';
        const hashed = await hashPassword(password);

        expect(hashed).not.toBe(password);
        expect(hashed.length).toBeGreaterThan(20);
        expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt hash format
      });

      it('should generate different hashes for same password', async () => {
        const password = 'TestPassword123!';
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1).not.toBe(hash2); // bcrypt uses random salt
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const password = 'TestPassword123!';
        const hashed = await hashPassword(password);

        const isValid = await verifyPassword(password, hashed);
        expect(isValid).toBe(true);
      });

      it('should reject incorrect password', async () => {
        const password = 'TestPassword123!';
        const hashed = await hashPassword(password);

        const isValid = await verifyPassword('WrongPassword123!', hashed);
        expect(isValid).toBe(false);
      });

      it('should be case sensitive', async () => {
        const password = 'TestPassword123!';
        const hashed = await hashPassword(password);

        const isValid = await verifyPassword('testpassword123!', hashed);
        expect(isValid).toBe(false);
      });
    });

    describe('generateToken', () => {
      it('should generate valid JWT token', () => {
        const payload = { userId: 'user123', email: 'test@example.com' };
        const token = generateToken(payload);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      });

      it('should include payload data in token', () => {
        const payload = { userId: 'user123', email: 'test@example.com' };
        const token = generateToken(payload);

        const decoded = verifyToken(token);
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe('user123');
        expect(decoded?.email).toBe('test@example.com');
      });
    });

    describe('verifyToken', () => {
      it('should verify valid token', () => {
        const payload = { userId: 'user123', email: 'test@example.com' };
        const token = generateToken(payload);

        const decoded = verifyToken(token);
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe('user123');
        expect(decoded?.email).toBe('test@example.com');
      });

      it('should reject invalid token', () => {
        const invalidToken = 'invalid.jwt.token';

        const decoded = verifyToken(invalidToken);
        expect(decoded).toBeNull();
      });

      it('should reject tampered token', () => {
        const payload = { userId: 'user123', email: 'test@example.com' };
        const token = generateToken(payload);

        // Tamper with the token
        const tamperedToken = token.slice(0, -5) + 'xxxxx';

        const decoded = verifyToken(tamperedToken);
        expect(decoded).toBeNull();
      });

      it('should reject empty token', () => {
        const decoded = verifyToken('');
        expect(decoded).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle registration with SQL injection attempt', async () => {
      const mockRequest = new MockNextRequest({
        email: "test@example.com'; DROP TABLE users; --",
        password: 'Password123!',
        name: 'Hacker',
      }) as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      // Should be rejected by email validation
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');

      // Verify users table still exists
      const users = await prisma.user.findMany();
      expect(users).toBeDefined();
    });

    it('should handle login with very long password', async () => {
      const longPassword = 'a'.repeat(1000);

      await prisma.user.create({
        data: {
          email: 'longpass@example.com',
          password: await hashPassword(longPassword),
          name: 'Long Pass User',
        },
      });

      const mockRequest = new MockNextRequest({
        email: 'longpass@example.com',
        password: longPassword,
      }) as any;

      const response = await loginPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();
    });

    it('should handle concurrent registration attempts', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        new MockNextRequest({
          email: `concurrent${i}@example.com`,
          password: 'Password123!',
          name: `User ${i}`,
        }) as any
      );

      const responses = await Promise.all(
        requests.map(req => registerPOST(req))
      );

      const successfulRegistrations = responses.filter(r => r.status === 201);
      expect(successfulRegistrations).toHaveLength(5);

      const users = await prisma.user.findMany({
        where: {
          email: {
            startsWith: 'concurrent',
          },
        },
      });
      expect(users).toHaveLength(5);
    });

    it('should handle malformed JSON in request', async () => {
      const mockRequest = {
        json: async () => {
          throw new Error('Malformed JSON');
        },
      } as any;

      const response = await registerPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
