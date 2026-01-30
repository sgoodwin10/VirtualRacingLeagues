import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueService } from './queueService';
import { apiService } from './api';

// Mock the API module
vi.mock('./api', () => ({
  apiService: {
    get: vi.fn(),
  },
}));

// Mock error handler
vi.mock('@admin/utils/errorHandler', () => ({
  handleServiceError: vi.fn((error) => {
    throw error;
  }),
}));

describe('queueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStats', () => {
    it('should fetch queue statistics successfully', async () => {
      // Arrange
      const mockStats = {
        status: 'running',
        jobsPerMinute: 12.5,
        failedJobs: 2,
        processes: 4,
        recentJobs: 150,
      };

      const mockResponse = {
        success: true,
        data: mockStats,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      // Act
      const result = await queueService.getStats();

      // Assert
      expect(apiService.get).toHaveBeenCalledWith('/queue/stats');
      expect(result).toEqual(mockStats);
    });

    it('should handle inactive queue status', async () => {
      // Arrange
      const mockStats = {
        status: 'inactive',
        jobsPerMinute: 0,
        failedJobs: 0,
        processes: 0,
        recentJobs: 0,
      };

      const mockResponse = {
        success: true,
        data: mockStats,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      // Act
      const result = await queueService.getStats();

      // Assert
      expect(result.status).toBe('inactive');
      expect(result.jobsPerMinute).toBe(0);
      expect(result.processes).toBe(0);
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('Network error');
      vi.mocked(apiService.get).mockRejectedValue(error);

      // Act & Assert
      await expect(queueService.getStats()).rejects.toThrow('Network error');
    });

    it('should handle 503 Service Unavailable (Horizon not running)', async () => {
      // Arrange
      const error = {
        response: {
          status: 503,
          data: {
            message: 'Queue monitoring unavailable',
          },
        },
      };
      vi.mocked(apiService.get).mockRejectedValue(error);

      // Act & Assert
      await expect(queueService.getStats()).rejects.toEqual(error);
    });
  });
});
