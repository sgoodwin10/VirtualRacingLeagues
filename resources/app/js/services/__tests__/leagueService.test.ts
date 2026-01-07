import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../api';
import {
  getPlatforms,
  getTimezones,
  checkSlugAvailability,
  createLeague,
  getUserLeagues,
  getLeague,
  updateLeague,
  deleteLeague,
  buildLeagueFormData,
  buildUpdateLeagueFormData,
} from '../leagueService';
import type {
  Platform,
  Timezone,
  League,
  CreateLeagueForm,
  UpdateLeagueForm,
} from '@app/types/league';

vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('leagueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlatforms', () => {
    it('should fetch platforms successfully', async () => {
      const mockPlatforms: Platform[] = [{ id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' }];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockPlatforms },
      });

      const result = await getPlatforms();

      expect(apiClient.get).toHaveBeenCalledWith('/platforms');
      expect(result).toEqual(mockPlatforms);
    });
  });

  describe('getTimezones', () => {
    it('should fetch timezones successfully', async () => {
      const mockTimezones: Timezone[] = [{ value: 'UTC', label: 'UTC' }];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockTimezones },
      });

      const result = await getTimezones();

      expect(apiClient.get).toHaveBeenCalledWith('/timezones');
      expect(result).toEqual(mockTimezones);
    });
  });

  describe('checkSlugAvailability', () => {
    it('should check slug availability', async () => {
      const mockResponse = {
        available: true,
        slug: 'test-league',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockResponse },
      });

      const result = await checkSlugAvailability('Test League');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/leagues/check-slug',
        { name: 'Test League', league_id: undefined },
        { signal: undefined },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createLeague', () => {
    it('should create league with multipart/form-data', async () => {
      const mockLeague: League = {
        id: 1,
        name: 'Test League',
      } as League;

      const formData = new FormData();

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockLeague },
      });

      const result = await createLeague(formData);

      expect(apiClient.post).toHaveBeenCalledWith('/leagues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(result).toEqual(mockLeague);
    });
  });

  describe('getUserLeagues', () => {
    it('should fetch user leagues', async () => {
      const mockLeagues: League[] = [
        { id: 1, name: 'League 1' } as League,
        { id: 2, name: 'League 2' } as League,
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockLeagues },
      });

      const result = await getUserLeagues();

      expect(apiClient.get).toHaveBeenCalledWith('/leagues');
      expect(result).toEqual(mockLeagues);
    });
  });

  describe('getLeague', () => {
    it('should fetch a specific league', async () => {
      const mockLeague: League = { id: 1, name: 'League 1' } as League;

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockLeague },
      });

      const result = await getLeague(1);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1');
      expect(result).toEqual(mockLeague);
    });
  });

  describe('updateLeague', () => {
    it('should update league with multipart/form-data', async () => {
      const mockLeague: League = {
        id: 1,
        name: 'Updated League',
      } as League;

      const formData = new FormData();
      formData.append('name', 'Updated League');

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockLeague },
      });

      const result = await updateLeague(1, formData);

      // updateLeague uses POST with _method=PUT for method spoofing
      expect(apiClient.post).toHaveBeenCalledWith('/leagues/1', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(result).toEqual(mockLeague);
    });
  });

  describe('deleteLeague', () => {
    it('should delete a league', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      await deleteLeague(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/leagues/1');
    });
  });

  describe('buildLeagueFormData', () => {
    it('should build FormData with all required fields', () => {
      const form: CreateLeagueForm = {
        name: 'Test League',
        logo: new File([''], 'logo.png'),
        platform_ids: [1, 2],
        timezone: 'UTC',
        visibility: 'public',
        tagline: 'Test tagline',
        description: '<p>Test description</p>',
        banner: null,
        header_image: new File([''], 'header.png'),
        contact_email: 'test@example.com',
        organizer_name: 'Test Organizer',
        discord_url: 'https://discord.gg/test',
        website_url: 'https://test.com',
        twitter_handle: 'testleague',
        instagram_handle: 'testleague',
        youtube_url: 'https://youtube.com/@test',
        twitch_url: 'https://twitch.tv/test',
      };

      const formData = buildLeagueFormData(form);

      expect(formData.get('name')).toBe('Test League');
      expect(formData.get('timezone')).toBe('UTC');
      expect(formData.get('visibility')).toBe('public');
      expect(formData.get('contact_email')).toBe('test@example.com');
      expect(formData.get('organizer_name')).toBe('Test Organizer');
      expect(formData.get('tagline')).toBe('Test tagline');
      expect(formData.get('discord_url')).toBe('https://discord.gg/test');
    });

    it('should handle optional fields correctly', () => {
      const form: CreateLeagueForm = {
        name: 'Test League',
        logo: new File([''], 'logo.png'),
        platform_ids: [1],
        timezone: 'UTC',
        visibility: 'public',
        tagline: '',
        description: '',
        banner: null,
        header_image: null,
        contact_email: 'test@example.com',
        organizer_name: 'Test Organizer',
        discord_url: '',
        website_url: '',
        twitter_handle: '',
        instagram_handle: '',
        youtube_url: '',
        twitch_url: '',
      };

      const formData = buildLeagueFormData(form);

      expect(formData.get('name')).toBe('Test League');
      expect(formData.get('tagline')).toBeNull();
      expect(formData.get('description')).toBeNull();
      expect(formData.get('discord_url')).toBeNull();
    });
  });

  describe('buildUpdateLeagueFormData', () => {
    const originalLeague: League = {
      id: 1,
      name: 'Original League',
      slug: 'original-league',
      tagline: 'Original tagline',
      description: 'Original description',
      logo_url: '/storage/logos/original.png',
      banner_url: null,
      header_image_url: '/storage/headers/original.png',
      platform_ids: [1, 2],
      platforms: [],
      discord_url: 'https://discord.gg/original',
      website_url: 'https://original.com',
      twitter_handle: 'original',
      instagram_handle: 'original',
      youtube_url: 'https://youtube.com/@original',
      twitch_url: 'https://twitch.tv/original',
      visibility: 'public',
      timezone: 'UTC',
      owner_user_id: 1,
      contact_email: 'original@example.com',
      competitions_count: 0,
      drivers_count: 0,
      active_seasons_count: 0,
      total_races_count: 0,
      organizer_name: 'Original Organizer',
      status: 'active',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    it('should only include changed fields in FormData', () => {
      const updateForm: UpdateLeagueForm = {
        name: 'Updated League',
        tagline: 'Updated tagline',
      };

      const formData = buildUpdateLeagueFormData(updateForm, originalLeague);

      expect(formData.get('name')).toBe('Updated League');
      expect(formData.get('tagline')).toBe('Updated tagline');
      expect(formData.get('timezone')).toBeNull();
      expect(formData.get('visibility')).toBeNull();
      expect(formData.get('contact_email')).toBeNull();
    });

    it('should include file uploads when provided', () => {
      const updateForm: UpdateLeagueForm = {
        logo: new File([''], 'new-logo.png'),
        header_image: new File([''], 'new-header.png'),
      };

      const formData = buildUpdateLeagueFormData(updateForm, originalLeague);

      expect(formData.get('logo')).toBeInstanceOf(File);
      expect(formData.get('header_image')).toBeInstanceOf(File);
    });

    it('should handle platform_ids changes correctly', () => {
      const updateForm: UpdateLeagueForm = {
        platform_ids: [1, 2, 3],
      };

      const formData = buildUpdateLeagueFormData(updateForm, originalLeague);

      expect(formData.getAll('platform_ids[]')).toHaveLength(3);
    });

    it('should not include platform_ids if unchanged', () => {
      const updateForm: UpdateLeagueForm = {
        platform_ids: [1, 2],
      };

      const formData = buildUpdateLeagueFormData(updateForm, originalLeague);

      expect(formData.getAll('platform_ids[]')).toHaveLength(0);
    });

    it('should handle social media field changes', () => {
      const updateForm: UpdateLeagueForm = {
        discord_url: 'https://discord.gg/updated',
        twitter_handle: 'updated',
      };

      const formData = buildUpdateLeagueFormData(updateForm, originalLeague);

      expect(formData.get('discord_url')).toBe('https://discord.gg/updated');
      expect(formData.get('twitter_handle')).toBe('updated');
      expect(formData.get('website_url')).toBeNull();
    });

    it('should handle empty strings as changes', () => {
      const updateForm: UpdateLeagueForm = {
        tagline: '',
        discord_url: '',
      };

      const formData = buildUpdateLeagueFormData(updateForm, originalLeague);

      expect(formData.get('tagline')).toBe('');
      expect(formData.get('discord_url')).toBe('');
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle network timeout on getPlatforms', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(getPlatforms()).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on getUserLeagues', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(getUserLeagues()).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on createLeague', async () => {
      const formData = new FormData();

      vi.mocked(apiClient.post).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(createLeague(formData)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle partial response on getLeague', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      await expect(getLeague(1)).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });

    it('should handle network connection error on updateLeague', async () => {
      const formData = new FormData();

      vi.mocked(apiClient.post).mockRejectedValue({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      });

      await expect(updateLeague(1, formData)).rejects.toMatchObject({
        code: 'ERR_NETWORK',
      });
    });

    it('should handle network timeout on checkSlugAvailability', async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(checkSlugAvailability('Test League')).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle 404 error on getLeague', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'League not found' },
        },
      });

      await expect(getLeague(999)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });
});
