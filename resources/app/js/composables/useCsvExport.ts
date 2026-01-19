import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@app/services/api';
import type { AxiosError } from 'axios';

export type CrossDivisionType = 'fastest-laps' | 'race-times' | 'qualifying-times';

/**
 * Composable for CSV export functionality
 * Provides methods to download CSV files from the API with proper error handling
 */
export function useCsvExport() {
  const toast = useToast();
  const isDownloading = ref(false);

  /**
   * Extract filename from Content-Disposition header
   * Falls back to default filename if header is not present
   */
  function extractFilename(
    contentDisposition: string | undefined,
    defaultFilename: string,
  ): string {
    if (!contentDisposition) {
      return defaultFilename;
    }

    // Try to extract filename from Content-Disposition header
    // Format: attachment; filename="filename.csv"
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      // Remove quotes if present
      return filenameMatch[1].replace(/['"]/g, '');
    }

    return defaultFilename;
  }

  /**
   * Download CSV file from the API
   * Creates a temporary anchor element to trigger the download
   */
  async function downloadCsv(url: string, defaultFilename: string): Promise<void> {
    isDownloading.value = true;

    try {
      // Make GET request with blob response type
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      const filename = extractFilename(contentDisposition, defaultFilename);

      // Create blob URL
      const blob = new Blob([response.data], { type: 'text/csv' });
      const blobUrl = window.URL.createObjectURL(blob);

      // Create temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Show success toast
      toast.add({
        severity: 'success',
        summary: 'Download Complete',
        detail: `Successfully downloaded ${filename}`,
        life: 3000,
      });
    } catch (error) {
      console.error('CSV download failed:', error);

      // Extract error message from API response
      let errorMessage = 'Failed to download CSV file. Please try again.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      // Show error toast
      toast.add({
        severity: 'error',
        summary: 'Download Failed',
        detail: errorMessage,
        life: 5000,
      });
    } finally {
      isDownloading.value = false;
    }
  }

  /**
   * Download race results CSV
   */
  function downloadRaceResultsCsv(raceId: number): Promise<void> {
    return downloadCsv(`/export/races/${raceId}/csv`, `race-${raceId}-results.csv`);
  }

  /**
   * Download round standings CSV
   */
  function downloadRoundStandingsCsv(roundId: number): Promise<void> {
    return downloadCsv(`/export/rounds/${roundId}/standings/csv`, `round-${roundId}-standings.csv`);
  }

  /**
   * Download cross-division results CSV (fastest laps, race times, or qualifying times)
   */
  function downloadCrossDivisionCsv(roundId: number, type: CrossDivisionType): Promise<void> {
    return downloadCsv(`/export/rounds/${roundId}/${type}/csv`, `round-${roundId}-${type}.csv`);
  }

  /**
   * Download season standings CSV
   * @param seasonId - Season ID
   * @param divisionId - Optional division ID to filter by specific division
   */
  function downloadSeasonStandingsCsv(seasonId: number, divisionId?: number): Promise<void> {
    const params = divisionId ? `?division_id=${divisionId}` : '';
    return downloadCsv(
      `/export/seasons/${seasonId}/standings/csv${params}`,
      `season-${seasonId}-standings${divisionId ? `-division-${divisionId}` : ''}.csv`,
    );
  }

  return {
    isDownloading,
    downloadRaceResultsCsv,
    downloadRoundStandingsCsv,
    downloadCrossDivisionCsv,
    downloadSeasonStandingsCsv,
  };
}
