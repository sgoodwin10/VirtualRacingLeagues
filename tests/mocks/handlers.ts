import { http, HttpResponse } from 'msw';

/**
 * MSW Request Handlers
 *
 * Define mock API responses for testing.
 * These handlers intercept HTTP requests and return mock data.
 */

const API_BASE = 'http://virtualracingleagues.localhost/api';
const USER_API_BASE = 'http://app.virtualracingleagues.localhost/api';
const ADMIN_API_BASE = 'http://admin.virtualracingleagues.localhost/admin/api';

export const handlers = [
  // ========================================
  // Public API Handlers (Authentication)
  // ========================================

  // POST /api/login
  http.post(`${API_BASE}/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    // Mock successful login
    if (body.email === 'user@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'user@example.com',
          },
        },
      });
    }

    // Mock failed login
    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid credentials',
      },
      { status: 401 },
    );
  }),

  // POST /api/register
  http.post(`${API_BASE}/register`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 2,
          name: body.name,
          email: body.email,
        },
      },
    });
  }),

  // POST /api/logout
  http.post(`${API_BASE}/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  // POST /api/forgot-password
  http.post(`${API_BASE}/forgot-password`, async ({ request }) => {
    const body = (await request.json()) as { email: string };

    return HttpResponse.json({
      success: true,
      message: `Password reset link sent to ${body.email}`,
    });
  }),

  // POST /api/reset-password
  http.post(`${API_BASE}/reset-password`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  }),

  // ========================================
  // User API Handlers (Dashboard)
  // ========================================

  // GET /api/user
  http.get(`${USER_API_BASE}/user`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: 'Test User',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00.000000Z',
      },
    });
  }),

  // PUT /api/profile
  http.put(`${USER_API_BASE}/profile`, async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string };

    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: body.name,
        email: body.email,
        updated_at: new Date().toISOString(),
      },
    });
  }),

  // GET /api/leagues
  http.get(`${USER_API_BASE}/leagues`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  // GET /api/leagues/:leagueId/driver-columns
  http.get(`${USER_API_BASE}/leagues/:leagueId/driver-columns`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          field: 'psn_id',
          label: 'PSN ID',
          platform: 'Gran Turismo 7',
        },
        {
          field: 'iracing_id',
          label: 'iRacing ID',
          platform: 'iRacing',
        },
      ],
    });
  }),

  // ========================================
  // Admin API Handlers
  // ========================================

  // GET /admin/api/users
  http.get(`${ADMIN_API_BASE}/users`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          created_at: '2024-01-01T00:00:00.000000Z',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'admin',
          created_at: '2024-01-02T00:00:00.000000Z',
        },
      ],
    });
  }),

  // GET /admin/api/users/:id
  http.get(`${ADMIN_API_BASE}/users/:id`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: '2024-01-01T00:00:00.000000Z',
      },
    });
  }),

  // POST /admin/api/users
  http.post(`${ADMIN_API_BASE}/users`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      role: string;
    };

    return HttpResponse.json(
      {
        success: true,
        data: {
          id: 999,
          ...body,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  // PUT /admin/api/users/:id
  http.put(`${ADMIN_API_BASE}/users/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as {
      name: string;
      email: string;
      role: string;
    };

    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        ...body,
        updated_at: new Date().toISOString(),
      },
    });
  }),

  // DELETE /admin/api/users/:id
  http.delete(`${ADMIN_API_BASE}/users/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  }),
];
