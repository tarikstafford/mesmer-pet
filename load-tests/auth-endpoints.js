import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'],                  // Less than 5% errors
    errors: ['rate<0.05'],                           // Custom error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Helper to generate unique email
function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `loadtest-${timestamp}-${random}@example.com`;
}

export default function () {
  let authToken;

  // Test 1: Registration
  group('User Registration', () => {
    const email = generateEmail();
    const payload = JSON.stringify({
      name: 'Load Test User',
      email: email,
      password: 'LoadTest123!',
      dateOfBirth: '2000-01-01',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const registerRes = http.post(`${BASE_URL}/api/auth/register`, payload, params);

    const registerSuccess = check(registerRes, {
      'registration status is 201': (r) => r.status === 201,
      'registration response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!registerSuccess);

    if (registerSuccess) {
      const body = JSON.parse(registerRes.body);
      authToken = body.token;
    }

    sleep(1);
  });

  // Test 2: Login
  group('User Login', () => {
    // Create a new user for login test
    const email = generateEmail();
    const password = 'LoadTest123!';

    // Register first
    const registerPayload = JSON.stringify({
      name: 'Load Test User',
      email: email,
      password: password,
      dateOfBirth: '2000-01-01',
    });

    http.post(`${BASE_URL}/api/auth/register`, registerPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    sleep(0.5);

    // Then login
    const loginPayload = JSON.stringify({
      email: email,
      password: password,
    });

    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!loginSuccess);

    if (loginSuccess) {
      const body = JSON.parse(loginRes.body);
      authToken = body.token;
    }

    sleep(1);
  });

  // Test 3: Get User Profile (Authenticated)
  if (authToken) {
    group('Get User Profile', () => {
      const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const profileSuccess = check(profileRes, {
        'profile status is 200': (r) => r.status === 200,
        'profile has user data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.user !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      errorRate.add(!profileSuccess);

      sleep(1);
    });
  }

  sleep(2);
}
