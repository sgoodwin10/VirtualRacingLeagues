import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCsvExport } from '../useCsvExport';
import { apiClient } from '@app/services/api';
import type { Mock } from 'vitest';

// Mock dependencies
vi.mock('@app/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('useCsvExport', () => {
  let mockApiGet: Mock;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Get reference to mocked functions
    mockApiGet = apiClient.get as Mock;

    // Mock window.URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document methods
    document.createElement = vi.fn((tag: string) => {
      const element = {
        tagName: tag.toUpperCase(),
        click: vi.fn(),
        remove: vi.fn(),
        href: '',
        download: '',
      };
      return element as unknown as HTMLElement;
    });

    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadRaceResultsCsv', () => {
    it('should successfully download race results CSV', async () => {
      const { downloadRaceResultsCsv, isDownloading } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="race-123-results.csv"',
        },
      });

      expect(isDownloading.value).toBe(false);

      const promise = downloadRaceResultsCsv(123);
      expect(isDownloading.value).toBe(true);

      await promise;

      expect(mockApiGet).toHaveBeenCalledWith('/export/races/123/csv', {
        responseType: 'blob',
      });
      expect(isDownloading.value).toBe(false);
    });

    it('should use default filename when Content-Disposition header is missing', async () => {
      const { downloadRaceResultsCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      await downloadRaceResultsCsv(456);

      expect(mockApiGet).toHaveBeenCalledWith('/export/races/456/csv', {
        responseType: 'blob',
      });
    });

    it('should handle download errors gracefully', async () => {
      const { downloadRaceResultsCsv, isDownloading } = useCsvExport();

      mockApiGet.mockRejectedValue({
        response: {
          data: {
            message: 'File not found',
          },
        },
      });

      await downloadRaceResultsCsv(999);

      expect(isDownloading.value).toBe(false);
    });
  });

  describe('downloadRoundStandingsCsv', () => {
    it('should successfully download round standings CSV', async () => {
      const { downloadRoundStandingsCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="round-5-standings.csv"',
        },
      });

      await downloadRoundStandingsCsv(5);

      expect(mockApiGet).toHaveBeenCalledWith('/export/rounds/5/standings/csv', {
        responseType: 'blob',
      });
    });
  });

  describe('downloadCrossDivisionCsv', () => {
    it('should download fastest laps CSV', async () => {
      const { downloadCrossDivisionCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      await downloadCrossDivisionCsv(10, 'fastest-laps');

      expect(mockApiGet).toHaveBeenCalledWith('/export/rounds/10/fastest-laps/csv', {
        responseType: 'blob',
      });
    });

    it('should download race times CSV', async () => {
      const { downloadCrossDivisionCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      await downloadCrossDivisionCsv(10, 'race-times');

      expect(mockApiGet).toHaveBeenCalledWith('/export/rounds/10/race-times/csv', {
        responseType: 'blob',
      });
    });

    it('should download qualifying times CSV', async () => {
      const { downloadCrossDivisionCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      await downloadCrossDivisionCsv(10, 'qualifying-times');

      expect(mockApiGet).toHaveBeenCalledWith('/export/rounds/10/qualifying-times/csv', {
        responseType: 'blob',
      });
    });
  });

  describe('downloadSeasonStandingsCsv', () => {
    it('should download season standings without division filter', async () => {
      const { downloadSeasonStandingsCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      await downloadSeasonStandingsCsv(20);

      expect(mockApiGet).toHaveBeenCalledWith('/export/seasons/20/standings/csv', {
        responseType: 'blob',
      });
    });

    it('should download season standings with division filter', async () => {
      const { downloadSeasonStandingsCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      await downloadSeasonStandingsCsv(20, 3);

      expect(mockApiGet).toHaveBeenCalledWith('/export/seasons/20/standings/csv?division_id=3', {
        responseType: 'blob',
      });
    });
  });

  describe('isDownloading state', () => {
    it('should set isDownloading to true during download', async () => {
      const { downloadRaceResultsCsv, isDownloading } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockApiGet.mockReturnValue(promise);

      expect(isDownloading.value).toBe(false);

      const downloadPromise = downloadRaceResultsCsv(123);
      expect(isDownloading.value).toBe(true);

      resolvePromise!({
        data: mockBlob,
        headers: {},
      });

      await downloadPromise;
      expect(isDownloading.value).toBe(false);
    });

    it('should reset isDownloading even on error', async () => {
      const { downloadRaceResultsCsv, isDownloading } = useCsvExport();

      mockApiGet.mockRejectedValue(new Error('Network error'));

      expect(isDownloading.value).toBe(false);

      await downloadRaceResultsCsv(123);

      expect(isDownloading.value).toBe(false);
    });
  });

  describe('filename extraction', () => {
    it('should extract filename from Content-Disposition header', async () => {
      const { downloadRaceResultsCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="custom-filename.csv"',
        },
      });

      await downloadRaceResultsCsv(123);

      // Verify that document.createElement was called to create the download link
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle filename with quotes', async () => {
      const { downloadRaceResultsCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="file-with-quotes.csv"',
        },
      });

      await downloadRaceResultsCsv(123);

      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('blob creation and download', () => {
    it('should create blob URL and trigger download', async () => {
      const { downloadRaceResultsCsv } = useCsvExport();

      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiGet.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      await downloadRaceResultsCsv(123);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
