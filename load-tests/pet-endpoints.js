import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `loadtest-pet-${timestamp}-${random}@example.com`;
}

function setupUser() {
  const email = generateEmail();
  const payload = JSON.stringify({
    name: 'Load Test User',
    email: email,
    password: 'LoadTest123!',
    dateOfBirth: '2000-01-01',
  });

  const res = http.post(`${BASE_URL}/api/auth/register`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 201) {
    const body = JSON.parse(res.body);
    return { token: body.token, userId: body.user.id };
  }

  return null;
}

export default function () {
  const user = setupUser();
  if (!user) {
    errorRate.add(1);
    return;
  }

  const { token, userId } = user;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  let petId;

  // Test 1: Create Pet
  group('Create Pet', () => {
    const petPayload = JSON.stringify({
      name: `LoadTestPet${Date.now()}`,
    });

    const createRes = http.post(`${BASE_URL}/api/pets`, petPayload, { headers });

    const createSuccess = check(createRes, {
      'create pet status is 201': (r) => r.status === 201,
      'create pet response has pet data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.pet !== undefined && body.pet.id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!createSuccess);

    if (createSuccess) {
      const body = JSON.parse(createRes.body);
      petId = body.pet.id;
    }

    sleep(1);
  });

  // Test 2: Get All Pets
  group('Get All Pets', () => {
    const getPetsRes = http.get(`${BASE_URL}/api/pets?userId=${userId}`, { headers });

    const getPetsSuccess = check(getPetsRes, {
      'get pets status is 200': (r) => r.status === 200,
      'get pets response has pets array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.pets);
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!getPetsSuccess);

    sleep(1);
  });

  // Test 3: Get Single Pet
  if (petId) {
    group('Get Single Pet', () => {
      const getPetRes = http.get(`${BASE_URL}/api/pets/${petId}`, { headers });

      const getPetSuccess = check(getPetRes, {
        'get pet status is 200': (r) => r.status === 200,
        'get pet response has pet data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.pet !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      errorRate.add(!getPetSuccess);

      sleep(1);
    });

    // Test 4: Feed Pet
    group('Feed Pet', () => {
      const feedRes = http.post(`${BASE_URL}/api/pets/feed`, JSON.stringify({ petId }), {
        headers,
      });

      const feedSuccess = check(feedRes, {
        'feed pet status is 200': (r) => r.status === 200 || r.status === 400, // 400 for cooldown is OK
        'feed pet response is valid': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.pet !== undefined || body.error !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      errorRate.add(!feedSuccess);

      sleep(1);
    });

    // Test 5: Update Pet Stats
    group('Update Pet Stats', () => {
      const updatePayload = JSON.stringify({
        petId: petId,
        health: 85,
        happiness: 80,
        energy: 75,
        hunger: 30,
      });

      const updateRes = http.put(`${BASE_URL}/api/pets/${petId}`, updatePayload, { headers });

      const updateSuccess = check(updateRes, {
        'update pet status is 200': (r) => r.status === 200,
        'update pet response has updated pet': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.pet !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      errorRate.add(!updateSuccess);

      sleep(1);
    });
  }

  sleep(2);
}
