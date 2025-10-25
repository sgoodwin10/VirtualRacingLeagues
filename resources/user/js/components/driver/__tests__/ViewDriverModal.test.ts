import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithStubs } from '@user/__tests__/setup/testUtils';
import ViewDriverModal from '../ViewDriverModal.vue';
import type { LeagueDriver } from '@user/types/driver';

// Mock DriverStatusBadge component
vi.mock('../DriverStatusBadge.vue', () => ({
  default: {
    name: 'DriverStatusBadge',
    template: '<span class="status-badge">{{ status }}</span>',
    props: ['status'],
  },
}));

// Mock useDateFormatter composable
const mockFormatDate = vi.fn((date: string) => {
  return new Date(date).toLocaleDateString();
});

vi.mock('@user/composables/useDateFormatter', () => ({
  useDateFormatter: () => ({
    formatDate: mockFormatDate,
  }),
}));

describe('ViewDriverModal', () => {
  let mockDriver: LeagueDriver;

  beforeEach(() => {
    mockFormatDate.mockClear();

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
        primary_platform_id: 'PSN',
        created_at: '2025-10-18T10:00:00Z',
        updated_at: '2025-10-18T10:00:00Z',
      },
      driver_number: 5,
      status: 'active',
      league_notes: 'Top performer in the league',
      added_to_league_at: '2025-10-18T10:00:00Z',
    };
  });

  describe('Rendering', () => {
    it('renders the modal when visible is true', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.find('.p-dialog').exists()).toBe(true);
    });

    it('does not render the modal when visible is false', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: false,
          driver: mockDriver,
        },
      });

      expect(wrapper.find('.p-dialog').exists()).toBe(false);
    });

    it('displays the correct header with driver name', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const header = wrapper.find('.p-dialog-header');
      expect(header.text()).toContain('Driver Details - John Smith');
    });

    it('renders all sections', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const sections = wrapper.findAll('section');
      expect(sections).toHaveLength(3);
      expect(sections[0]?.text()).toContain('Personal Information');
      expect(sections[1]?.text()).toContain('Platform Identifiers');
      expect(sections[2]?.text()).toContain('League Information');
    });
  });

  describe('Personal Information Section', () => {
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

    it('displays email as a mailto link', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const emailLink = wrapper.find('a[href="mailto:john@example.com"]');
      expect(emailLink.exists()).toBe(true);
      expect(emailLink.text()).toBe('john@example.com');
    });

    it('displays phone number', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('+1234567890');
    });

    it('shows "No contact information available" when no contact info', () => {
      const driverWithoutContact = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          email: null,
          phone: null,
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithoutContact,
        },
      });

      expect(wrapper.text()).toContain('No contact information available');
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

    it('shows "No platform IDs available" when no IDs present', () => {
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

      expect(wrapper.text()).toContain('No platform IDs available');
    });

    it('displays primary platform when present', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      expect(wrapper.text()).toContain('Primary Platform');
      const chip = wrapper.find('.p-chip');
      expect(chip.text()).toBe('PSN');
    });

    it('does not display primary platform section when not set', () => {
      const driverWithoutPrimaryPlatform = {
        ...mockDriver,
        driver: {
          ...mockDriver.driver,
          primary_platform_id: null,
        },
      };

      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: driverWithoutPrimaryPlatform,
        },
      });

      const primaryPlatformLabel = wrapper
        .findAll('label')
        .filter((l) => l.text() === 'Primary Platform');
      expect(primaryPlatformLabel).toHaveLength(0);
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

      expect(wrapper.text()).toContain('Driver Number');
      expect(wrapper.text()).toContain('5');
    });

    it('shows "Not assigned" when driver number is null', () => {
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

      expect(wrapper.text()).toContain('Not assigned');
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

      expect(wrapper.text()).toContain('Added to League');
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

    it('does not display league notes section when not present', () => {
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

      const notesLabel = wrapper.findAll('label').filter((l) => l.text() === 'League Notes');
      expect(notesLabel).toHaveLength(0);
    });
  });

  describe('Footer Actions', () => {
    it('renders Close and Edit Driver buttons', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      // Find buttons in the footer only (exclude the header close button)
      const footerButtons = wrapper.findAll('.p-dialog-footer button');
      expect(footerButtons).toHaveLength(2);
      expect(footerButtons[0]?.text()).toBe('Close');
      expect(footerButtons[1]?.text()).toBe('Edit Driver');
    });

    it('emits close event when Close button is clicked', async () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const footerButtons = wrapper.findAll('.p-dialog-footer button');
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

      const footerButtons = wrapper.findAll('.p-dialog-footer button');
      await footerButtons[1]?.trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
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

    it('returns "Unknown Driver" when driver is null', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: null,
        },
      });

      const component = wrapper.vm as any;
      expect(component.driverName).toBe('Unknown Driver');
    });

    it('computes contact info correctly', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const component = wrapper.vm as any;
      expect(component.contactInfo).toHaveLength(2);
      expect(component.contactInfo[0]).toEqual({
        label: 'Email',
        value: 'john@example.com',
        type: 'email',
      });
      expect(component.contactInfo[1]).toEqual({
        label: 'Phone',
        value: '+1234567890',
        type: 'text',
      });
    });

    it('computes platform IDs correctly', () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      const component = wrapper.vm as any;
      expect(component.platformIds).toHaveLength(3);
      expect(component.platformIds[0]).toEqual({
        label: 'PSN ID',
        value: 'JohnSmith77',
      });
      expect(component.platformIds[1]).toEqual({
        label: 'iRacing ID',
        value: 'john_iracing',
      });
      expect(component.platformIds[2]).toEqual({
        label: 'iRacing Customer ID',
        value: '123456',
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

      // Should not render driver content when driver is null
      const sections = wrapper.findAll('section');
      expect(sections).toHaveLength(0);
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
      expect(wrapper.find('.p-dialog').exists()).toBe(true);
      expect(wrapper.text()).toContain('John Smith');
      expect(wrapper.text()).toContain('No contact information available');
      expect(wrapper.text()).toContain('No platform IDs available');
      expect(wrapper.text()).toContain('Not assigned');
    });

    it('emits update:visible when dialog visibility changes', async () => {
      const wrapper = mountWithStubs(ViewDriverModal, {
        props: {
          visible: true,
          driver: mockDriver,
        },
      });

      // Simulate Dialog component emitting update:visible
      const dialog = wrapper.findComponent({ name: 'Dialog' });
      await dialog.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });
  });
});
