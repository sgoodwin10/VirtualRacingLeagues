import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import { apiService } from './api';
import { createMockUser } from '@admin/__tests__/helpers/mockFactories';
import { faker } from '@faker-js/faker';

vi.mock('./api');

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = createMockUser();

  it('should fetch all users', async () => {
    const mockResponse = {
      success: true,
      data: { data: [mockUser] },
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await userService.getAllUsers();

    expect(result).toEqual([mockUser]);
    expect(apiService.get).toHaveBeenCalledWith('/users', { params: undefined, signal: undefined });
  });

  it('should fetch paginated users', async () => {
    const mockResponse = {
      success: true,
      data: [mockUser],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 15,
        to: 1,
        total: 1,
      },
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await userService.getUsers();

    expect(result.data).toEqual([mockUser]);
    expect(result.total).toBe(1);
    expect(apiService.get).toHaveBeenCalledWith('/users', { params: undefined, signal: undefined });
  });

  it('should fetch single user', async () => {
    const mockResponse = {
      success: true,
      data: { user: mockUser, activities: [] },
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await userService.getUser(mockUser.id);

    expect(result).toEqual({ ...mockUser, activities: [] });
    expect(apiService.get).toHaveBeenCalledWith(`/users/${mockUser.id}`, { signal: undefined });
  });

  it('should create user', async () => {
    const newUserData = {
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      password: 'password123',
    };

    const mockResponse = {
      success: true,
      data: { ...mockUser, ...newUserData },
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await userService.createUser(newUserData);

    expect(result).toEqual(mockResponse.data);
    expect(apiService.post).toHaveBeenCalledWith('/users', newUserData, { signal: undefined });
  });

  it('should update user', async () => {
    const updateData = { first_name: 'Updated', last_name: 'Name' };
    const mockResponse = {
      success: true,
      data: { ...mockUser, ...updateData },
    };

    vi.mocked(apiService.put).mockResolvedValue(mockResponse);

    const result = await userService.updateUser(mockUser.id, updateData);

    expect(result).toEqual(mockResponse.data);
    expect(apiService.put).toHaveBeenCalledWith(`/users/${mockUser.id}`, updateData, {
      signal: undefined,
    });
  });

  it('should delete user', async () => {
    vi.mocked(apiService.delete).mockResolvedValue({ success: true });

    await userService.deleteUser(mockUser.id);

    expect(apiService.delete).toHaveBeenCalledWith(`/users/${mockUser.id}`, { signal: undefined });
  });

  it('should restore user', async () => {
    const mockResponse = {
      success: true,
      data: mockUser,
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await userService.restoreUser(mockUser.id);

    expect(result).toEqual(mockUser);
    expect(apiService.post).toHaveBeenCalledWith(
      `/users/${mockUser.id}/restore`,
      {},
      { signal: undefined },
    );
  });

  it('should verify email', async () => {
    const mockResponse = {
      success: true,
      data: { ...mockUser, email_verified_at: new Date().toISOString() },
    };

    vi.mocked(apiService.patch).mockResolvedValue(mockResponse);

    const result = await userService.verifyEmail(mockUser.id);

    expect(result).toEqual(mockResponse.data);
    expect(apiService.patch).toHaveBeenCalledWith(
      `/users/${mockUser.id}/verify-email`,
      {},
      { signal: undefined },
    );
  });

  it('should resend verification email', async () => {
    vi.mocked(apiService.post).mockResolvedValue({ success: true });

    await userService.resendVerification(mockUser.id);

    expect(apiService.post).toHaveBeenCalledWith(
      `/users/${mockUser.id}/resend-verification`,
      {},
      { signal: undefined },
    );
  });

  it('should login as user', async () => {
    const mockResponse = {
      success: true,
      data: { token: 'test-token' },
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await userService.loginAsUser(mockUser.id);

    expect(result).toEqual({ token: 'test-token' });
    expect(apiService.post).toHaveBeenCalledWith(
      `/users/${mockUser.id}/login-as`,
      {},
      { signal: undefined },
    );
  });
});
