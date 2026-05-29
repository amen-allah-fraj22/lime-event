import { test, expect } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:3001';

test.describe('API Integration', () => {
  test('GET /health returns ok', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('lime-api');
  });

  test('GET /health/db returns connected', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health/db`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');
  });

  test('GET /artists returns array', async ({ request }) => {
    const response = await request.get(`${API_BASE}/artists`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /booking-requests/fake-id returns 401 without auth', async ({ request }) => {
    const response = await request.get(`${API_BASE}/booking-requests/fake-id`);
    expect(response.status()).toBe(401);
  });

  test('POST /booking-requests returns 401 without auth', async ({ request }) => {
    const response = await request.post(`${API_BASE}/booking-requests`, {
      data: { event_id: 'fake', artist_id: 'fake' },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /events returns 401 without auth', async ({ request }) => {
    const response = await request.post(`${API_BASE}/events`, {
      data: { title: 'Test' },
    });
    expect(response.status()).toBe(401);
  });

  test('GET /notifications returns 401 without auth', async ({ request }) => {
    const response = await request.get(`${API_BASE}/notifications`);
    expect(response.status()).toBe(401);
  });

  test('GET /admin/users returns 401 without auth', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/users`);
    expect(response.status()).toBe(401);
  });
});
