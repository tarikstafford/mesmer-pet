import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'], // Higher thresholds for AI responses
    http_req_failed: ['rate<0.1'],                    // 10% error rate allowed (AI can fail)
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `loadtest-chat-${timestamp}-${random}@example.com`;
}

function setupUserWithPet() {
  const email = generateEmail();

  // Register user
  const registerPayload = JSON.stringify({
    name: 'Load Test Chat User',
    email: email,
    password: 'LoadTest123!',
    dateOfBirth: '2000-01-01',
  });

  const registerRes = http.post(`${BASE_URL}/api/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerRes.status !== 201) {
    return null;
  }

  const { token, user } = JSON.parse(registerRes.body);

  // Create pet
  const petPayload = JSON.stringify({
    name: `ChatPet${Date.now()}`,
  });

  const petRes = http.post(`${BASE_URL}/api/pets`, petPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (petRes.status !== 201) {
    return null;
  }

  const { pet } = JSON.parse(petRes.body);

  return { token, userId: user.id, petId: pet.id };
}

export default function () {
  const data = setupUserWithPet();
  if (!data) {
    errorRate.add(1);
    return;
  }

  const { token, userId, petId } = data;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Test: Send Chat Message
  group('Send Chat Message', () => {
    const messages = [
      'Hello! How are you today?',
      'What is your favorite activity?',
      'Tell me about yourself.',
      'What makes you happy?',
      'Do you like treats?',
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    const chatPayload = JSON.stringify({
      petId: petId,
      userId: userId,
      message: message,
    });

    const chatRes = http.post(`${BASE_URL}/api/chat`, chatPayload, { headers });

    const chatSuccess = check(chatRes, {
      'chat status is 200 or has fallback': (r) =>
        r.status === 200 ||
        (r.status === 400 && r.body.includes('fallback')), // Fallback responses are acceptable
      'chat response has message': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.message !== undefined;
        } catch (e) {
          return false;
        }
      },
      'chat response time under 10s': (r) => r.timings.duration < 10000,
    });

    errorRate.add(!chatSuccess);

    sleep(2); // Longer sleep due to AI processing time
  });

  sleep(3);
}
