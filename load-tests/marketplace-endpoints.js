import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `loadtest-market-${timestamp}-${random}@example.com`;
}

function setupUserWithPet() {
  const email = generateEmail();

  const registerPayload = JSON.stringify({
    name: 'Load Test Market User',
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

  const petPayload = JSON.stringify({
    name: `MarketPet${Date.now()}`,
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

  let listingId;

  // Test 1: Get Marketplace Listings
  group('Get Marketplace Listings', () => {
    const listingsRes = http.get(`${BASE_URL}/api/pets/marketplace/listings`, { headers });

    const listingsSuccess = check(listingsRes, {
      'listings status is 200': (r) => r.status === 200,
      'listings response has listings array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.listings);
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!listingsSuccess);

    sleep(1);
  });

  // Test 2: Create Listing
  group('Create Listing', () => {
    const listingPayload = JSON.stringify({
      petId: petId,
      price: Math.floor(Math.random() * 500) + 100, // Random price 100-600
    });

    const createRes = http.post(`${BASE_URL}/api/pets/marketplace/list`, listingPayload, {
      headers,
    });

    const createSuccess = check(createRes, {
      'create listing status is 201': (r) => r.status === 201,
      'create listing response has listing': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.listing !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!createSuccess);

    if (createSuccess) {
      const body = JSON.parse(createRes.body);
      listingId = body.listing.id;
    }

    sleep(1);
  });

  // Test 3: Get Listings (again, should include new listing)
  group('Get Updated Listings', () => {
    const listingsRes = http.get(`${BASE_URL}/api/pets/marketplace/listings`, { headers });

    const listingsSuccess = check(listingsRes, {
      'updated listings status is 200': (r) => r.status === 200,
      'updated listings has items': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.listings.length > 0;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!listingsSuccess);

    sleep(1);
  });

  // Test 4: Cancel Listing
  if (listingId) {
    group('Cancel Listing', () => {
      const cancelPayload = JSON.stringify({
        listingId: listingId,
      });

      const cancelRes = http.post(`${BASE_URL}/api/pets/marketplace/cancel`, cancelPayload, {
        headers,
      });

      const cancelSuccess = check(cancelRes, {
        'cancel listing status is 200': (r) => r.status === 200,
        'cancel listing response has listing': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.listing !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      errorRate.add(!cancelSuccess);

      sleep(1);
    });
  }

  sleep(2);
}
