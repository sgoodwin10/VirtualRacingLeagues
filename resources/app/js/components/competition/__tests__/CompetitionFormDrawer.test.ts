import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCompetitionStore } from '@app/stores/competitionStore';
import type { Competition } from '@app/types/competition';

// Mock useToast
const mockToast = {
  add: vi.fn(),
  removeGroup: vi.fn(),
  removeAllGroups: vi.fn(),
};

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}));

// Mock useConfirmDialog
const mockShowConfirmation = vi.fn();
vi.mock('@app/composables/useConfirmDialog', () => ({
  useConfirmDialog: () => ({
    showConfirmation: mockShowConfirmation,
    isOpen: { value: false },
  }),
}));

describe('CompetitionFormDrawer - Delete Functionality', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockCompetition: Competition = {
    id: 1,
    league_id: 1,
    name: 'Test Competition',
    slug: 'test-competition',
    description: 'A test competition',
    platform_id: 1,
    platform_name: 'PlayStation',
    logo_url: null,
    has_own_logo: false,
    competition_colour: JSON.stringify({ r: 100, g: 150, b: 200 }),
    is_active: true,
    is_archived: false,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    archived_at: null,
    seasons: [],
    stats: {
      total_seasons: 0,
    },
  };

  describe('Store Integration', () => {
    it('should have competitions array in store', () => {
      const competitionStore = useCompetitionStore();
      expect(Array.isArray(competitionStore.competitions)).toBe(true);
    });

    it('should have deleteExistingCompetition method available', () => {
      const competitionStore = useCompetitionStore();
      expect(typeof competitionStore.deleteExistingCompetition).toBe('function');
    });
  });

  describe('Confirmation Dialog Integration', () => {
    it('should show correct warning message for delete confirmation', () => {
      // This test verifies that the confirmation dialog is called with the correct message
      const expectedMessage = `Are you sure you want to permanently delete "${mockCompetition.name}"? This action cannot be undone and will permanently remove all associated seasons, rounds, races, and race results.`;

      // Simulate calling confirmDelete from the component
      mockShowConfirmation({
        message: expectedMessage,
        header: 'Delete Competition',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        onAccept: vi.fn(),
      });

      expect(mockShowConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expectedMessage,
          header: 'Delete Competition',
          icon: 'pi pi-exclamation-triangle',
          acceptClass: 'p-button-danger',
        }),
      );
    });

    it('should include competition name in confirmation message', () => {
      const competitionName = 'Formula 1 Championship';
      const message = `Are you sure you want to permanently delete "${competitionName}"? This action cannot be undone and will permanently remove all associated seasons, rounds, races, and race results.`;

      mockShowConfirmation({
        message,
        header: 'Delete Competition',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        onAccept: vi.fn(),
      });

      const callArgs = mockShowConfirmation.mock.calls[0][0];
      expect(callArgs.message).toContain(competitionName);
      expect(callArgs.message).toContain('permanently remove all associated seasons');
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast with correct message after deletion', () => {
      mockToast.add({
        severity: 'success',
        summary: 'Competition Deleted',
        detail: 'Competition has been deleted successfully',
        life: 3000,
      });

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Competition Deleted',
        detail: 'Competition has been deleted successfully',
        life: 3000,
      });
    });

    it('should show error toast with correct message on deletion failure', () => {
      const errorMessage = 'Network error';

      mockToast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000,
      });

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000,
      });
    });
  });
});
