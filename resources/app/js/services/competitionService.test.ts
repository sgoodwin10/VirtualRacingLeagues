import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from './api';
import {
  getLeagueCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  archiveCompetition,
  deleteCompetition,
  checkSlugAvailability,
  buildCompetitionFormData,
  buildUpdateCompetitionFormData,
} from './competitionService';
import type { Competition, CompetitionFilters, SlugCheckResponse } from '@app/types/competition';

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('competitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCompetition: Competition = {
    id: 1,
    league_id: 1,
    name: 'GT3 Championship',
    slug: 'gt3-championship',
    description: 'A competitive GT3 racing series',
    platform_id: 1,
    platform_name: 'iRacing',
    platform_slug: 'iracing',
    platform: {
      id: 1,
      name: 'iRacing',
      slug: 'iracing',
    },
    logo_url: 'https://example.com/logo.png',
    has_own_logo: true,
    competition_colour: null,
    status: 'active',
    is_active: true,
    is_archived: false,
    is_deleted: false,
    archived_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    deleted_at: null,
    created_by_user_id: 1,
    stats: {
      total_seasons: 2,
      active_seasons: 1,
      total_rounds: 10,
      total_drivers: 20,
      total_races: 15,
      next_race_date: '2025-02-01T00:00:00Z',
    },
  };

  describe('getLeagueCompetitions', () => {
    it('should fetch all competitions for a league', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: [mockCompetition],
        },
      });

      const result = await getLeagueCompetitions(1);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/competitions', { params: undefined });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockCompetition);
    });

    it('should fetch competitions with filters', async () => {
      const filters: CompetitionFilters = {
        status: 'active',
        platform_id: 1,
        search: 'GT3',
      };

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: [mockCompetition],
        },
      });

      const result = await getLeagueCompetitions(1, filters);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/competitions', { params: filters });
      expect(result).toHaveLength(1);
    });
  });

  describe('getCompetition', () => {
    it('should fetch a specific competition', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: mockCompetition,
        },
      });

      const result = await getCompetition(1);

      expect(apiClient.get).toHaveBeenCalledWith('/competitions/1');
      expect(result).toEqual(mockCompetition);
    });
  });

  describe('createCompetition', () => {
    it('should create a new competition with FormData', async () => {
      const formData = new FormData();
      formData.append('name', 'GT3 Championship');
      formData.append('platform_id', '1');
      formData.append('description', 'A competitive GT3 racing series');

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: mockCompetition,
        },
      });

      const result = await createCompetition(1, formData);

      expect(apiClient.post).toHaveBeenCalledWith('/leagues/1/competitions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(result).toEqual(mockCompetition);
    });
  });

  describe('updateCompetition', () => {
    it('should update an existing competition with FormData', async () => {
      const formData = new FormData();
      formData.append('name', 'Updated GT3 Championship');

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: { ...mockCompetition, name: 'Updated GT3 Championship' },
        },
      });

      const result = await updateCompetition(1, formData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/competitions/1',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
      );
      expect(result.name).toBe('Updated GT3 Championship');
    });

    it('should append _method=PUT for Laravel method spoofing', async () => {
      const formData = new FormData();
      formData.append('name', 'Updated GT3 Championship');

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: mockCompetition,
        },
      });

      await updateCompetition(1, formData);

      // Verify _method was appended
      const callArgs = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls[0];
      const sentFormData = callArgs?.[1] as FormData;
      expect(sentFormData.get('_method')).toBe('PUT');
    });
  });

  describe('archiveCompetition', () => {
    it('should archive a competition', async () => {
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

      await archiveCompetition(1);

      expect(apiClient.post).toHaveBeenCalledWith('/competitions/1/archive');
    });
  });

  describe('deleteCompetition', () => {
    it('should delete a competition permanently', async () => {
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

      await deleteCompetition(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/competitions/1');
    });
  });

  describe('checkSlugAvailability', () => {
    it('should check if slug is available', async () => {
      const mockResponse: SlugCheckResponse = {
        available: true,
        slug: 'gt3-championship',
        suggestion: null,
      };

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: mockResponse,
        },
      });

      const result = await checkSlugAvailability(1, 'GT3 Championship');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/leagues/1/competitions/check-slug',
        {
          name: 'GT3 Championship',
          exclude_id: undefined,
        },
        { signal: undefined },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should check slug availability with exclude_id', async () => {
      const mockResponse: SlugCheckResponse = {
        available: false,
        slug: 'gt3-championship',
        suggestion: 'gt3-championship-02',
      };

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          data: mockResponse,
        },
      });

      const result = await checkSlugAvailability(1, 'GT3 Championship', 5);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/leagues/1/competitions/check-slug',
        {
          name: 'GT3 Championship',
          exclude_id: 5,
        },
        { signal: undefined },
      );
      expect(result.suggestion).toBe('gt3-championship-02');
    });
  });

  describe('buildCompetitionFormData', () => {
    it('should build FormData with all fields', () => {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const form = {
        name: 'GT3 Championship',
        description: 'A competitive GT3 racing series',
        platform_id: 1,
        logo: file,
      };

      const formData = buildCompetitionFormData(form);

      expect(formData.get('name')).toBe('GT3 Championship');
      expect(formData.get('description')).toBe('A competitive GT3 racing series');
      expect(formData.get('platform_id')).toBe('1');
      expect(formData.get('logo')).toBe(file);
    });

    it('should build FormData without optional fields', () => {
      const form = {
        name: 'GT3 Championship',
        description: '',
        platform_id: 1,
        logo: null,
      };

      const formData = buildCompetitionFormData(form);

      expect(formData.get('name')).toBe('GT3 Championship');
      expect(formData.get('description')).toBe(''); // FormData returns empty string for empty values
      expect(formData.get('platform_id')).toBe('1');
      expect(formData.get('logo')).toBeNull();
    });
  });

  describe('buildUpdateCompetitionFormData', () => {
    it('should build FormData with provided fields only', () => {
      const form = {
        name: 'Updated GT3 Championship',
        description: 'Updated description',
      };

      const formData = buildUpdateCompetitionFormData(form);

      expect(formData.get('name')).toBe('Updated GT3 Championship');
      expect(formData.get('description')).toBe('Updated description');
      expect(formData.get('logo')).toBeNull();
    });

    it('should handle empty description', () => {
      const form = {
        description: null,
      };

      const formData = buildUpdateCompetitionFormData(form);

      expect(formData.get('description')).toBe('');
    });

    it('should include logo file when provided', () => {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const form = {
        logo: file,
      };

      const formData = buildUpdateCompetitionFormData(form);

      expect(formData.get('logo')).toBe(file);
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle network timeout on getLeagueCompetitions', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(getLeagueCompetitions(1)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on getCompetition', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(getCompetition(1, 1)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on createCompetition', async () => {
      const formData = new FormData();

      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(createCompetition(1, formData)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle partial response on getCompetition', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      await expect(getCompetition(1, 1)).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });

    it('should handle network connection error on updateCompetition', async () => {
      // Use buildUpdateCompetitionFormData to create proper FormData with append method
      const formData = buildUpdateCompetitionFormData({
        name: 'Test Competition',
      });

      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      });

      await expect(updateCompetition(1, formData)).rejects.toMatchObject({
        code: 'ERR_NETWORK',
      });
    });

    it('should handle 404 error on getCompetition', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Competition not found' },
        },
      });

      await expect(getCompetition(1, 999)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });

    it('should handle network timeout on archiveCompetition', async () => {
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(archiveCompetition(1, 1)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on checkSlugAvailability', async () => {
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(checkSlugAvailability(1, 'test-slug')).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });
  });
});
