import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from './userStore';
import { userService } from '@admin/services/userService';
import type { User } from '@admin/types/user';
import type { PaginatedResponse } from '@admin/types/api';
import { createMockUser } from '@admin/__tests__/helpers/mockFactories';

vi.mock('@admin/services/userService');

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockUser = createMockUser();

  const mockPaginatedResponse: PaginatedResponse<User> = {
    current_page: 1,
    data: [mockUser],
    first_page_url: '/api/users?page=1',
    from: 1,
    last_page: 1,
    last_page_url: '/api/users?page=1',
    links: [],
    next_page_url: null,
    path: '/api/users',
    per_page: 15,
    prev_page_url: null,
    to: 1,
    total: 1,
  };

  it('should initialize with default state', () => {
    const store = useUserStore();

    expect(store.users).toEqual([]);
    expect(store.isLoading).toBe(false);
    expect(store.searchQuery).toBe('');
    expect(store.statusFilter).toBe('all');
    expect(store.currentPage).toBe(1);
    expect(store.rowsPerPage).toBe(15);
  });

  it('should fetch users successfully', async () => {
    const store = useUserStore();

    vi.mocked(userService.getUsers).mockResolvedValue(mockPaginatedResponse);

    await store.fetchUsers();

    expect(store.users).toEqual([mockUser]);
    expect(store.totalRecords).toBe(1);
    expect(store.isLoading).toBe(false);
  });

  it('should handle fetch error', async () => {
    const store = useUserStore();

    vi.mocked(userService.getUsers).mockRejectedValue(new Error('Failed to fetch'));

    await store.fetchUsers();

    expect(store.error).toBe('Failed to fetch');
    expect(store.users).toEqual([]);
  });

  it('should return activeUsers getter', () => {
    const store = useUserStore();
    const activeUser = { ...mockUser, status: 'active' as const };
    const inactiveUser = { ...mockUser, id: '2', status: 'inactive' as const };

    store.users = [activeUser, inactiveUser];

    expect(store.activeUsers).toEqual([activeUser]);
  });

  it('should return suspendedUsers getter', () => {
    const store = useUserStore();
    const activeUser = { ...mockUser, status: 'active' as const };
    const suspendedUser = { ...mockUser, id: '2', status: 'suspended' as const };

    store.users = [activeUser, suspendedUser];

    expect(store.suspendedUsers).toEqual([suspendedUser]);
  });

  it('should delete user (soft delete)', async () => {
    const store = useUserStore();

    vi.mocked(userService.deleteUser).mockResolvedValue();
    vi.mocked(userService.getUsers).mockResolvedValue(mockPaginatedResponse);

    await store.deleteUser(mockUser.id);

    expect(userService.deleteUser).toHaveBeenCalledWith(mockUser.id, undefined);
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should hard delete user (permanent deletion)', async () => {
    const store = useUserStore();

    vi.mocked(userService.hardDeleteUser).mockResolvedValue();
    vi.mocked(userService.getUsers).mockResolvedValue(mockPaginatedResponse);

    await store.hardDeleteUser(mockUser.id);

    expect(userService.hardDeleteUser).toHaveBeenCalledWith(mockUser.id, undefined);
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should reactivate user', async () => {
    const store = useUserStore();

    vi.mocked(userService.restoreUser).mockResolvedValue(mockUser);
    vi.mocked(userService.getUsers).mockResolvedValue(mockPaginatedResponse);

    const result = await store.reactivateUser(mockUser.id);

    expect(result).toEqual(mockUser);
    expect(userService.restoreUser).toHaveBeenCalledWith(mockUser.id, undefined);
  });

  it('should update user', async () => {
    const store = useUserStore();
    store.users = [mockUser];

    const updatedUser = { ...mockUser, first_name: 'Updated' };
    vi.mocked(userService.updateUser).mockResolvedValue(updatedUser);

    const result = await store.updateUser(mockUser.id, { first_name: 'Updated' });

    expect(result).toEqual(updatedUser);
    expect(store.users[0]?.first_name).toBe('Updated');
  });

  it('should set search query and reset page', () => {
    const store = useUserStore();
    store.currentPage = 5;

    store.setSearchQuery('test');

    expect(store.searchQuery).toBe('test');
    expect(store.currentPage).toBe(1);
  });

  it('should set status filter and reset page', () => {
    const store = useUserStore();
    store.currentPage = 5;

    store.setStatusFilter('inactive');

    expect(store.statusFilter).toBe('inactive');
    expect(store.currentPage).toBe(1);
  });

  it('should set page', () => {
    const store = useUserStore();

    store.setPage(3);

    expect(store.currentPage).toBe(3);
  });

  it('should set rows per page and reset page', () => {
    const store = useUserStore();
    store.currentPage = 5;

    store.setRowsPerPage(50);

    expect(store.rowsPerPage).toBe(50);
    expect(store.currentPage).toBe(1);
  });

  it('should reset filters', () => {
    const store = useUserStore();
    store.searchQuery = 'test';
    store.statusFilter = 'inactive';
    store.currentPage = 5;
    store.rowsPerPage = 50;

    store.resetFilters();

    expect(store.searchQuery).toBe('');
    expect(store.statusFilter).toBe('all');
    expect(store.currentPage).toBe(1);
    expect(store.rowsPerPage).toBe(15);
  });

  it('should clear users', () => {
    const store = useUserStore();
    store.users = [mockUser];
    store.totalRecords = 10;
    store.error = 'Some error';

    store.clearUsers();

    expect(store.users).toEqual([]);
    expect(store.totalRecords).toBe(0);
    expect(store.error).toBeNull();
  });

  it('should get user by ID', () => {
    const store = useUserStore();
    store.users = [mockUser];

    const found = store.getUserById(mockUser.id);
    expect(found).toEqual(mockUser);

    const notFound = store.getUserById('non-existent');
    expect(notFound).toBeUndefined();
  });
});
