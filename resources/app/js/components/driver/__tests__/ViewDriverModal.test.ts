import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithStubs } from '@app/__tests__/setup/testUtils';
import ViewDriverModal from '../ViewDriverModal.vue';
import type { LeagueDriver, LeagueDriverSeasonData } from '@app/types/driver';
import { flushPromises } from '@vue/test-utils';
import { getLeagueDriverSeasons } from '@app/services/driverSeasonService';

// Mock DriverStatusBadge component
vi.mock('../DriverStatusBadge.vue', () => ({
  default: {
    name: 'DriverStatusBadge',
    template: '<span class="status-badge">{{ status }}</span>',
    props: ['status'],
  },
}));

// Mock BaseModal component
vi.mock('@app/components/common/modals/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template:
      '<div class="base-modal" v-if="visible"><div class="modal-header-slot"><slot name="header" /></div><slot /><div class="modal-footer"><slot name="footer" /></div></div>',
    props: ['visible', 'width'],
    emits: ['update:visible'],
  },
}));

// Mock BaseModalHeader component
vi.mock('@app/components/common/modals/BaseModalHeader.vue', () => ({
  default: {
    name: 'BaseModalHeader',
    template: '<div class="modal-header"><slot>{{ title }}</slot></div>',
    props: ['title'],
  },
}));

// Mock useDateFormatter composable
const mockFormatDate = vi.fn((date: string) => {
  return new Date(date).toLocaleDateString();
});

vi.mock('@app/composables/useDateFormatter', () => ({
  useDateFormatter: () => ({
    formatDate: mockFormatDate,
  }),
}));

// Mock driverSeasonService
vi.mock('@app/services/driverSeasonService', () => ({
  getLeagueDriverSeasons: vi.fn(),
}));

// Mock Vue Router
const mockPush = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe('ViewDriverModal', () => {
  let mockDriver: LeagueDriver;
  let mockSeasons: LeagueDriverSeasonData[];

  beforeEach(() => {
    mockFormatDate.mockClear();
    vi.mocked(getLeagueDriverSeasons).mockClear();
    mockPush.mockClear();

    mockDriver = {
      id: 1,
      league_id: 1,
      driver_id: 101,
      driver: {
        id: 101,
        first_name: 'John',
        last_name: 'Smith',
        nickname: 'JSmith',
        discord_id: 'john#1234',
        email: 'john@example.com',
        phone: '+1234567890',
        psn_id: 'JohnSmith77',
        iracing_id: 'john_iracing',
        iracing_customer_id: 123456,
        display_name: 'John Smith',
        primary_platform_id: 'psn',
        created_at: '2025-10-18T10:00:00Z',
        updated_at: '2025-10-18T10:00:00Z',
      },
      driver_number: 5,
      status: 'active',
      league_notes: 'Top performer in the league',
      added_to_league_at: '2025-10-18T10:00:00Z',
    };

    mockSeasons = [
      {
        season_id: 1,
        season_name: '2025 Season 1',
        season_slug: '2025-season-1',
        season_status: 'active',
        competition_id: 10,
        competition_name: 'GT Championship',
        competition_slug: 'gt-championship',
        division_name: 'Division A',
        team_name: 'Team Red',
        added_at: '2025-01-01T00:00:00Z',
      },
      {
        season_id: 2,
        season_name: '2024 Season 2',
        season_slug: '2024-season-2',
        season_status: 'completed',
        competition_id: 11,
        competition_name: 'Formula Racing',
        competition_slug: 'formula-racing',
        division_name: null,
        team_name: null,
        added_at: '2024-06-01T00:00:00Z',
      },
    ];

    // Default mock to resolve with empty seasons
    vi.mocked(getLeagueDriverSeasons).mockResolvedValue([]);
  });

  describe('Rendering', () => {
    it('renders the modal when visible is true', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('does not render the modal when visible is false', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: false,
          driver: mockDriver,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(false);
    });

    it('displays the correct header with driver name', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      // The header text is in the mocked BaseModalHeader component
      expect(wrapper.text()).toContain('Driver Details - John Smith');
    });

    it('renders all panels', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('Platform Identifiers');
      expect(wrapper.text()).toContain('Competitions & Seasons');
      expect(wrapper.text()).toContain('League Notes');
    });
  });

  describe('Driver Header Section', () => {
    it('displays full name', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('John Smith');
    });

    it('displays nickname when present', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('"JSmith"');
    });

    it('does not display nickname section when not present', () => {
      const driverWithoutNickname = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          nickname: null,
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithoutNickname,
        },
      });

      const nicknameLabel = wrapper.findAll('label').filter((l) => l.text() === 'Nickname');
      expect(nicknameLabel).toHaveLength(0);
    });
  });

  describe('Platform Identifiers Section', () => {
    it('displays PSN ID when present', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('PSN ID');
      expect(wrapper.text()).toContain('JohnSmith77');
    });

    it('displays iRacing ID when present', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('iRacing ID');
      expect(wrapper.text()).toContain('john_iracing');
    });

    it('displays iRacing Customer ID when present', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('iRacing Customer ID');
      expect(wrapper.text()).toContain('123456');
    });

    it('shows "No platform identifiers available" when no IDs present', () => {
      const driverWithoutPlatformIds = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          psn_id: null,
          iracing_id: null,
          iracing_customer_id: null,
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithoutPlatformIds,
        },
      });

      expect(wrapper.text()).toContain('No platform identifiers available');
    });

    it('displays primary platform badge when platform is primary', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('PRIMARY');
    });
  });

  describe('Competitions & Seasons Section', () => {
    it('fetches driver seasons when modal becomes visible', async () => {
      vi.mocked(getLeagueDriverSeasons).mockResolvedValue(mockSeasons);

      mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      await flushPromises();

      expect(getLeagueDriverSeasons).toHaveBeenCalledWith(1, 1);
    });

    it('displays loading state while fetching seasons', () => {
      vi.mocked(getLeagueDriverSeasons).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('Loading seasons...');
    });

    it('displays seasons when loaded successfully', async () => {
      vi.mocked(getLeagueDriverSeasons).mockResolvedValue(mockSeasons);

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('GT Championship');
      expect(wrapper.text()).toContain('2025 Season 1');
      expect(wrapper.text()).toContain('Formula Racing');
      expect(wrapper.text()).toContain('2024 Season 2');
    });

    it('displays division and team badges when available', async () => {
      vi.mocked(getLeagueDriverSeasons).mockResolvedValue(mockSeasons);

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Division A');
      expect(wrapper.text()).toContain('Team Red');
    });

    it('displays ACTIVE badge for active seasons', async () => {
      vi.mocked(getLeagueDriverSeasons).mockResolvedValue(mockSeasons);

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('ACTIVE');
    });

    it('displays empty state when driver has no seasons', async () => {
      vi.mocked(getLeagueDriverSeasons).mockResolvedValue([]);

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Not participating in any seasons yet');
    });

    it('displays error state when fetching seasons fails', async () => {
      vi.mocked(getLeagueDriverSeasons).mockRejectedValue(new Error('API Error'));

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Failed to load seasons');
    });

    it('navigates to season page when season is clicked', async () => {
      vi.mocked(getLeagueDriverSeasons).mockResolvedValue(mockSeasons);

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      await flushPromises();

      const seasonButtons = wrapper.findAll('button[type="button"]').filter((btn) => {
        return btn.text().includes('GT Championship');
      });

      if (seasonButtons.length > 0) {
        await seasonButtons[0]?.trigger('click');
      }

      expect(mockPush).toHaveBeenCalledWith('/leagues/1/competitions/10/seasons/1');
    });

    it('does not fetch seasons when modal is not visible', () => {
      mountWithStubs(ViewDriverModal, {
        props: {
          visible: false,
          driver: mockDriver,
        },
      });

      expect(getLeagueDriverSeasons).not.toHaveBeenCalled();
    });

    it('does not fetch seasons when driver is null', () => {
      mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: null,
        },
      });

      expect(getLeagueDriverSeasons).not.toHaveBeenCalled();
    });
  });

  describe('League Information Section', () => {
    it('displays driver number', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('Number');
      expect(wrapper.text()).toContain('5');
    });

    it('shows "N/A" when driver number is null', () => {
      const driverWithoutNumber = {
        ...mockDriver,
        driver_number: null,
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithoutNumber,
        },
      });

      expect(wrapper.text()).toContain('N/A');
    });

    it('displays driver status badge', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const statusBadge = wrapper.find('.status-badge');
      expect(statusBadge.exists()).toBe(true);
      expect(statusBadge.text()).toBe('active');
    });

    it('displays added to league date', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('Added');
      expect(mockFormatDate).toHaveBeenCalledWith('2025-10-18T10:00:00Z');
    });

    it('displays league notes when present', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('League Notes');
      expect(wrapper.text()).toContain('Top performer in the league');
    });

    it('does not display league notes panel when not present', () => {
      const driverWithoutNotes = {
        ...mockDriver,
        league_notes: null,
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithoutNotes,
        },
      });

      // Should not contain the League Notes heading when notes are null
      const text = wrapper.text();
      const hasLeagueNotesHeading = text.includes('League Notes');
      expect(hasLeagueNotesHeading).toBe(false);
    });
  });

  describe('Footer Actions', () => {
    it('renders Close and Edit Driver buttons by default', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      // Find buttons in the footer
      const footerButtons = wrapper.findAll('.modal-footer button');
      expect(footerButtons).toHaveLength(2);
      expect(footerButtons[0]?.text()).toBe('Close');
      expect(footerButtons[1]?.text()).toBe('Edit Driver');
    });

    it('renders Close and Edit Driver buttons when showEditButton is true', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
          showEditButton: true,
        },
      });

      // Find buttons in the footer
      const footerButtons = wrapper.findAll('.modal-footer button');
      expect(footerButtons).toHaveLength(2);
      expect(footerButtons[0]?.text()).toBe('Close');
      expect(footerButtons[1]?.text()).toBe('Edit Driver');
    });

    it('renders only Close button when showEditButton is false', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
          showEditButton: false,
        },
      });

      // Find buttons in the footer
      const footerButtons = wrapper.findAll('.modal-footer button');
      expect(footerButtons).toHaveLength(1);
      expect(footerButtons[0]?.text()).toBe('Close');
    });

    it('emits close event when Close button is clicked', async () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const footerButtons = wrapper.findAll('.modal-footer button');
      await footerButtons[0]?.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits edit event when Edit Driver button is clicked', async () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const footerButtons = wrapper.findAll('.modal-footer button');
      await footerButtons[1]?.trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
    });

    it('does not emit edit event when Edit Driver button is hidden', async () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
          showEditButton: false,
        },
      });

      // Verify edit button is not rendered
      const footerButtons = wrapper.findAll('.modal-footer button');
      expect(footerButtons).toHaveLength(1);

      // Should not be able to emit edit event
      expect(wrapper.emitted('edit')).toBeFalsy();
    });
  });

  describe('Computed Properties', () => {
    it('computes driver name correctly', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverName).toBe('John Smith');
    });

    it('returns empty string when driver is null', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: null,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverName).toBe('');
    });

    it('computes driver initials correctly for full name', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverInitials).toBe('JS');
    });

    it('computes driver initials for single name (returns first 2 characters)', () => {
      const driverWithSingleName = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          display_name: 'John',
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithSingleName,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverInitials).toBe('JO');
    });

    it('computes driver initials for single character name', () => {
      const driverWithSingleChar = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          display_name: 'J',
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithSingleChar,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverInitials).toBe('J');
    });

    it('returns "?" for empty display name', () => {
      const driverWithEmptyName = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          display_name: '',
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithEmptyName,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverInitials).toBe('?');
    });

    it('returns "?" for display name with only spaces', () => {
      const driverWithSpacesName = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          display_name: '   ',
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithSpacesName,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverInitials).toBe('?');
    });

    it('computes driver initials for name with multiple spaces', () => {
      const driverWithMultipleSpaces = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          display_name: 'John   Michael   Smith',
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithMultipleSpaces,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverInitials).toBe('JS'); // First and last
    });

    it('computes platform IDs correctly with icons and primary flag', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const component = wrapper.vm as any;
      expect(component.platformIds).toHaveLength(3);
      expect(component.platformIds[0]).toMatchObject({
        label: 'PSN ID',
        value: 'JohnSmith77',
        isPrimary: true, // PSN is the primary platform
      });
      expect(component.platformIds[1]).toMatchObject({
        label: 'iRacing ID',
        value: 'john_iracing',
        isPrimary: false,
      });
      expect(component.platformIds[2]).toMatchObject({
        label: 'iRacing Customer ID',
        value: '123456',
        isPrimary: false,
      });
    });

    it('returns empty array for platform IDs when driver is null', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: null,
        },
      });

      const component = wrapper.vm as any;
      expect(component.platformIds).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('handles null driver gracefully', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: null,
        },
      });

      // Should render with empty driver name in the title
      const text = wrapper.text();
      // The title should contain "Driver Details -" (with empty name)
      expect(text).toContain('Driver Details - ');
    });

    it('handles driver with minimal data', () => {
      const minimalDriver: LeagueDriver = {
        id: 1,
        league_id: 1,
        driver_id: 101,
        driver: {
          id: 101,
          first_name: 'John',
          last_name: 'Smith',
          nickname: null,
          discord_id: null,
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: null,
          iracing_customer_id: null,
          display_name: 'John Smith',
          primary_platform_id: null,
          created_at: '2025-10-18T10:00:00Z',
          updated_at: '2025-10-18T10:00:00Z',
        },
        driver_number: null,
        status: 'active',
        league_notes: null,
        added_to_league_at: '2025-10-18T10:00:00Z',
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: minimalDriver,
        },
      });

      // Should render without errors
      expect(wrapper.find('.base-modal').exists()).toBe(true);
      expect(wrapper.text()).toContain('John Smith');
      expect(wrapper.text()).toContain('No platform identifiers available');
      expect(wrapper.text()).toContain('N/A');
    });

    it('emits update:visible when modal visibility changes', async () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      // Simulate BaseModal component emitting update:visible
      const modal = wrapper.findComponent({ name: 'BaseModal' });
      await modal.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });
  });
});
