import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LeaguesTable from '../LeaguesTable.vue';
import { mountWithStubs } from '@admin/__tests__/setup/testUtils';
import { createMockLeague } from '@admin/__tests__/helpers/mockFactories';
import userService from '@admin/services/userService';
import type { League } from '@admin/types/league';

// Mock services
vi.mock('@admin/services/userService');
vi.mock('@admin/utils/logger');

describe('LeaguesTable', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  /**
   * Helper function to mount LeaguesTable with proper configuration
   */
  const mountLeaguesTable = (props = {}) => {
    return mountWithStubs(LeaguesTable, {
      props,
      global: {
        plugins: [pinia],
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders empty state when no leagues provided', () => {
      const wrapper = mountLeaguesTable({ leagues: [] });

      expect(wrapper.text()).toContain('No leagues found');
    });

    it('renders loading state when loading prop is true', () => {
      const wrapper = mountLeaguesTable({ loading: true });

      expect(wrapper.text()).toContain('Loading leagues...');
    });

    it('renders table with league data', () => {
      const leagues = [
        createMockLeague({ name: 'Test League 1' }),
        createMockLeague({ name: 'Test League 2' }),
      ];

      const wrapper = mountLeaguesTable({ leagues });

      expect(wrapper.text()).toContain('Test League 1');
      expect(wrapper.text()).toContain('Test League 2');
    });

    it('displays league ID column', () => {
      const league = createMockLeague({ id: 123 });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('123');
    });

    it('displays league name and slug', () => {
      const league = createMockLeague({
        name: 'Virtual Racing League',
        slug: 'virtual-racing-league',
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('Virtual Racing League');
      expect(wrapper.text()).toContain('virtual-racing-league');
    });

    it('displays platform badges', () => {
      const league = createMockLeague({
        platforms: [
          { id: 1, name: 'PlayStation', slug: 'playstation' },
          { id: 2, name: 'iRacing', slug: 'iracing' },
        ],
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('PlayStation');
      expect(wrapper.text()).toContain('iRacing');
    });

    it('displays manager information when owner exists', () => {
      const league = createMockLeague({
        owner: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('john@example.com');
    });

    it('shows dash when no manager exists', () => {
      const league = createMockLeague({ owner: undefined });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      // The manager column should contain a dash
      const managerCells = wrapper.findAll('td').filter((td) => td.text().includes('-'));
      expect(managerCells.length).toBeGreaterThan(0);
    });
  });

  describe('League Visibility', () => {
    it('displays public visibility with correct badge', () => {
      const league = createMockLeague({ visibility: 'public' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('Public');
    });

    it('displays private visibility with correct badge', () => {
      const league = createMockLeague({ visibility: 'private' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('Private');
    });

    it('displays unlisted visibility with correct badge', () => {
      const league = createMockLeague({ visibility: 'unlisted' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('Unlisted');
    });
  });

  describe('League Status', () => {
    it('displays active status with success badge', () => {
      const league = createMockLeague({ status: 'active' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('Active');
    });

    it('displays archived status with danger badge', () => {
      const league = createMockLeague({ status: 'archived' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('Archived');
    });
  });

  describe('Action Buttons', () => {
    it('renders view button for all leagues', () => {
      const league = createMockLeague();
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const viewButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-eye');
        return icon.exists();
      });

      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('renders login as manager button when owner exists', () => {
      const league = createMockLeague({
        owner: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const loginButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-sign-in');
        return icon.exists();
      });

      expect(loginButtons.length).toBeGreaterThan(0);
    });

    it('does not render login as manager button when no owner', () => {
      const league = createMockLeague({ owner: undefined });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const loginButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-sign-in');
        return icon.exists();
      });

      expect(loginButtons.length).toBe(0);
    });

    it('renders archive button for active leagues', () => {
      const league = createMockLeague({ status: 'active' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const archiveButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-archive');
        return icon.exists();
      });

      expect(archiveButtons.length).toBeGreaterThan(0);
    });

    it('does not render archive button for archived leagues', () => {
      const league = createMockLeague({ status: 'archived' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const archiveButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-archive');
        return icon.exists();
      });

      expect(archiveButtons.length).toBe(0);
    });

    it('renders delete button for archived leagues', () => {
      const league = createMockLeague({ status: 'archived' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('does not render delete button for active leagues', () => {
      const league = createMockLeague({ status: 'active' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      expect(deleteButtons.length).toBe(0);
    });
  });

  describe('Event Emissions', () => {
    it('emits view event when view button clicked', async () => {
      const league = createMockLeague();
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const viewButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-eye');
        return icon.exists();
      });

      await viewButtons[0].trigger('click');

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([league]);
    });

    it('emits archive event when archive button clicked', async () => {
      const league = createMockLeague({ status: 'active' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const archiveButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-archive');
        return icon.exists();
      });

      await archiveButtons[0].trigger('click');

      expect(wrapper.emitted('archive')).toBeTruthy();
      expect(wrapper.emitted('archive')?.[0]).toEqual([league]);
    });

    it('emits delete event when delete button clicked', async () => {
      const league = createMockLeague({ status: 'archived' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      await deleteButtons[0].trigger('click');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual([league]);
    });
  });

  describe('Login As Manager', () => {
    it('calls userService.loginAsUser with correct user ID', async () => {
      const league = createMockLeague({
        owner_user_id: 123,
        owner: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      });

      vi.mocked(userService.loginAsUser).mockResolvedValue({ token: 'test-token' });
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const wrapper = mountLeaguesTable({ leagues: [league] });

      const loginButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-sign-in');
        return icon.exists();
      });

      await loginButtons[0].trigger('click');
      await flushPromises();

      expect(userService.loginAsUser).toHaveBeenCalledWith('123');
      expect(windowOpenSpy).toHaveBeenCalled();

      windowOpenSpy.mockRestore();
    });

    it('opens new tab with correct login URL', async () => {
      const league = createMockLeague({
        owner_user_id: 123,
        owner: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      });

      vi.mocked(userService.loginAsUser).mockResolvedValue({ token: 'test-token' });
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const wrapper = mountLeaguesTable({ leagues: [league] });

      const loginButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-sign-in');
        return icon.exists();
      });

      await loginButtons[0].trigger('click');
      await flushPromises();

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('/login-as?token=test-token'),
        '_blank',
      );

      windowOpenSpy.mockRestore();
    });

    it('handles login as manager error gracefully', async () => {
      const league = createMockLeague({
        owner_user_id: 123,
        owner: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      });

      vi.mocked(userService.loginAsUser).mockRejectedValue(new Error('Failed to login'));

      const wrapper = mountLeaguesTable({ leagues: [league] });

      const loginButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-sign-in');
        return icon.exists();
      });

      await loginButtons[0].trigger('click');
      await flushPromises();

      // Button should not remain in loading state after error
      expect(loginButtons[0].attributes('loading')).toBeUndefined();
    });

    it('does not call loginAsUser when owner is missing', async () => {
      const league = createMockLeague({ owner: undefined, owner_user_id: 0 });

      const wrapper = mountLeaguesTable({ leagues: [league] });

      // No login button should be rendered
      const loginButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-sign-in');
        return icon.exists();
      });

      expect(loginButtons.length).toBe(0);
      expect(userService.loginAsUser).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Leagues', () => {
    it('renders multiple leagues correctly', () => {
      const leagues = [
        createMockLeague({ name: 'League 1', id: 1 }),
        createMockLeague({ name: 'League 2', id: 2 }),
        createMockLeague({ name: 'League 3', id: 3 }),
      ];

      const wrapper = mountLeaguesTable({ leagues });

      expect(wrapper.text()).toContain('League 1');
      expect(wrapper.text()).toContain('League 2');
      expect(wrapper.text()).toContain('League 3');
    });

    it('handles mixed statuses correctly', () => {
      const leagues = [
        createMockLeague({ status: 'active' }),
        createMockLeague({ status: 'archived' }),
      ];

      const wrapper = mountLeaguesTable({ leagues });

      // Should show archive button for active league
      const archiveButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-archive');
        return icon.exists();
      });
      expect(archiveButtons.length).toBeGreaterThan(0);

      // Should show delete button for archived league
      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Default Props', () => {
    it('uses empty array as default for leagues prop', () => {
      const wrapper = mountLeaguesTable();

      expect(wrapper.text()).toContain('No leagues found');
    });

    it('uses false as default for loading prop', () => {
      const wrapper = mountLeaguesTable();

      expect(wrapper.text()).not.toContain('Loading leagues...');
    });
  });

  describe('Logo Display', () => {
    it('displays league logo when logo_url is provided', () => {
      const league = createMockLeague({ logo_url: 'https://example.com/logo.png' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      const images = wrapper.findAll('img');
      const logoImage = images.find((img) => img.attributes('src') === league.logo_url);

      expect(logoImage).toBeDefined();
    });

    it('displays placeholder when logo_url is null', () => {
      const league = createMockLeague({ logo_url: '' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.html()).toContain('N/A');
    });
  });

  describe('Platform Display', () => {
    it('shows dash when no platforms', () => {
      const league = createMockLeague({ platforms: [] });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('-');
    });

    it('displays multiple platforms as badges', () => {
      const league = createMockLeague({
        platforms: [
          { id: 1, name: 'PlayStation', slug: 'playstation' },
          { id: 2, name: 'Xbox', slug: 'xbox' },
          { id: 3, name: 'PC', slug: 'pc' },
        ],
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      expect(wrapper.text()).toContain('PlayStation');
      expect(wrapper.text()).toContain('Xbox');
      expect(wrapper.text()).toContain('PC');
    });
  });
});
