import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminUserService } from '../adminUserService';
import { apiService } from '../api';
import type { AdminUserListResponse } from '@admin/types/admin';
import { createMockAdmin } from '@admin/__tests__/helpers/mockFactories';
import { faker } from '@faker-js/faker';

vi.mock('../api');

describe('adminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdmin = createMockAdmin();

  it('should fetch paginated admin users', async () => {
    const mockResponse: AdminUserListResponse = {
      data: [mockAdmin],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 15,
        to: 1,
        total: 1,
      },
      links: {
        first: '/api/admins?page=1',
        last: '/api/admins?page=1',
        prev: null,
        next: null,
      },
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await adminUserService.getAdminUsers(1, 15);

    expect(result).toEqual(mockResponse);
    expect(apiService.get).toHaveBeenCalledWith('/admins', {
      params: { page: 1, per_page: 15 },
      signal: undefined,
    });
  });

  it('should fetch all admin users with pagination', async () => {
    const mockPage1: AdminUserListResponse = {
      data: [mockAdmin],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        per_page: 100,
        to: 100,
        total: 150,
      },
      links: { first: '', last: '', prev: null, next: null },
    };

    const mockPage2: AdminUserListResponse = {
      ...mockPage1,
      data: [{ ...mockAdmin, id: 2 }],
      meta: { ...mockPage1.meta, current_page: 2, last_page: 2 },
    };

    vi.mocked(apiService.get).mockResolvedValueOnce(mockPage1).mockResolvedValueOnce(mockPage2);

    const result = await adminUserService.getAllAdminUsers();

    expect(result).toHaveLength(2);
    expect(apiService.get).toHaveBeenCalledTimes(2);
  });

  it('should fetch single admin user', async () => {
    const mockResponse = {
      success: true,
      data: mockAdmin,
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await adminUserService.getAdminUser(mockAdmin.id);

    expect(result).toEqual(mockAdmin);
    expect(apiService.get).toHaveBeenCalledWith(`/admins/${mockAdmin.id}`, { signal: undefined });
  });

  it('should create admin user', async () => {
    const newAdminData = {
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      password: 'password123',
      role: 'moderator' as const,
    };

    const mockResponse = {
      success: true,
      data: { ...mockAdmin, ...newAdminData },
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await adminUserService.createAdminUser(newAdminData);

    expect(result).toEqual(mockResponse.data);
    expect(apiService.post).toHaveBeenCalledWith('/admins', newAdminData, { signal: undefined });
  });

  it('should update admin user', async () => {
    const updateData = {
      first_name: 'Updated',
      last_name: 'Name',
      email: mockAdmin.email,
      role: mockAdmin.role,
    };
    const mockResponse = {
      success: true,
      data: { ...mockAdmin, ...updateData },
    };

    vi.mocked(apiService.put).mockResolvedValue(mockResponse);

    const result = await adminUserService.updateAdminUser(mockAdmin.id, updateData);

    expect(result).toEqual(mockResponse.data);
    expect(apiService.put).toHaveBeenCalledWith(`/admins/${mockAdmin.id}`, updateData, {
      signal: undefined,
    });
  });

  it('should delete admin user', async () => {
    const mockResponse = { success: true, message: 'Admin deleted' };

    vi.mocked(apiService.delete).mockResolvedValue(mockResponse);

    await adminUserService.deleteAdminUser(mockAdmin.id);

    expect(apiService.delete).toHaveBeenCalledWith(`/admins/${mockAdmin.id}`, {
      signal: undefined,
    });
  });

  it('should restore admin user', async () => {
    const mockResponse = {
      success: true,
      data: mockAdmin,
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await adminUserService.restoreAdminUser(mockAdmin.id);

    expect(result).toEqual(mockAdmin);
    expect(apiService.post).toHaveBeenCalledWith(
      `/admins/${mockAdmin.id}/restore`,
      {},
      { signal: undefined },
    );
  });
});
