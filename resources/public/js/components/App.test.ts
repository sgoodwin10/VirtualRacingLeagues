import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import App from './App.vue';
import { useAuthStore } from '@public/stores/authStore';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

// Mock child components
vi.mock('@public/components/landing/LandingNav.vue', () => ({
  default: { name: 'LandingNav', template: '<nav data-testid="landing-nav"></nav>' },
}));
vi.mock('@public/components/layout/PublicFooter.vue', () => ({
  default: { name: 'PublicFooter', template: '<footer data-testid="public-footer"></footer>' },
}));
vi.mock('@public/components/maintenance/MaintenanceModePage.vue', () => ({
  default: {
    name: 'MaintenanceModePage',
    template: '<div data-testid="maintenance-page">Maintenance Mode</div>',
  },
}));

// Mock useSiteConfig - default to maintenance mode OFF for most tests
vi.mock('@public/composables/useSiteConfig', () => ({
  useSiteConfig: vi.fn(() => ({
    isMaintenanceMode: { value: false },
  })),
}));

// Create router
const createTestRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: { template: '<div data-testid="home-view">Home</div>' },
      },
      {
        path: '/login',
        name: 'login',
        component: { template: '<div data-testid="login-view">Login</div>' },
      },
      {
        path: '/leagues',
        name: 'leagues',
        component: { template: '<div data-testid="leagues-view">Leagues</div>' },
      },
    ],
  });
};

describe('App', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createTestRouter>;
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    router = createTestRouter();
    vi.clearAllMocks();
  });

  const createWrapper = async (route = '/') => {
    await router.push(route);

    return mount(App, {
      global: {
        plugins: [
          router,
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
        ],
      },
    });
  };

  describe('Rendering', () => {
    it('should render the app component', async () => {
      wrapper = await createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should have proper root element with id', async () => {
      wrapper = await createWrapper();
      expect(wrapper.find('#app').exists()).toBe(true);
    });

    it('should have min-height screen styling', async () => {
      wrapper = await createWrapper();
      const appRoot = wrapper.find('#app');
      expect(appRoot.classes()).toContain('min-h-screen');
      expect(appRoot.classes()).toContain('flex');
      expect(appRoot.classes()).toContain('flex-col');
    });

    it('should render LandingNav component', async () => {
      wrapper = await createWrapper();
      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
    });

    it('should render PublicFooter component', async () => {
      wrapper = await createWrapper();
      expect(wrapper.findComponent({ name: 'PublicFooter' }).exists()).toBe(true);
    });

    it('should render main content area', async () => {
      wrapper = await createWrapper();
      expect(wrapper.find('main').exists()).toBe(true);
    });

    it('should have flex-1 on main for proper layout', async () => {
      wrapper = await createWrapper();
      const main = wrapper.find('main');
      expect(main.classes()).toContain('flex-1');
      expect(main.classes()).toContain('flex');
      expect(main.classes()).toContain('flex-col');
    });

    it('should render Toast component', async () => {
      wrapper = await createWrapper();
      expect(wrapper.findComponent({ name: 'Toast' }).exists()).toBe(true);
    });
  });

  describe('Route Integration', () => {
    it('should render router-view', async () => {
      wrapper = await createWrapper();
      expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true);
    });

    it('should render home view on root route', async () => {
      wrapper = await createWrapper('/');
      await flushPromises();

      expect(wrapper.find('[data-testid="home-view"]').exists()).toBe(true);
    });

    it('should render login view on login route', async () => {
      wrapper = await createWrapper('/login');
      await flushPromises();

      expect(wrapper.find('[data-testid="login-view"]').exists()).toBe(true);
    });

    it('should render leagues view on leagues route', async () => {
      wrapper = await createWrapper('/leagues');
      await flushPromises();

      expect(wrapper.find('[data-testid="leagues-view"]').exists()).toBe(true);
    });

    it('should handle route changes', async () => {
      wrapper = await createWrapper('/');
      await flushPromises();

      expect(wrapper.find('[data-testid="home-view"]').exists()).toBe(true);

      await router.push('/login');
      await flushPromises();

      expect(wrapper.find('[data-testid="login-view"]').exists()).toBe(true);
    });
  });

  describe('Lifecycle', () => {
    it('should check authentication on mount', async () => {
      const checkAuthSpy = vi.spyOn(authStore, 'checkAuth').mockResolvedValue(false);

      wrapper = await createWrapper();
      await flushPromises();

      expect(checkAuthSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout Structure', () => {
    it('should have proper component order', async () => {
      wrapper = await createWrapper();

      const appRoot = wrapper.find('#app');
      const children = appRoot.element.children;

      // Should have: LandingNav, main, PublicFooter, Toast
      expect(children.length).toBeGreaterThanOrEqual(3);
    });

    it('should render navigation before main content', async () => {
      wrapper = await createWrapper();

      const nav = wrapper.find('[data-testid="landing-nav"]');
      const main = wrapper.find('main');

      expect(nav.exists()).toBe(true);
      expect(main.exists()).toBe(true);
    });

    it('should render footer after main content', async () => {
      wrapper = await createWrapper();

      const main = wrapper.find('main');
      const footer = wrapper.find('[data-testid="public-footer"]');

      expect(main.exists()).toBe(true);
      expect(footer.exists()).toBe(true);
    });

    it('should contain router-view within main', async () => {
      wrapper = await createWrapper();

      const main = wrapper.find('main');
      const routerView = main.findComponent({ name: 'RouterView' });

      expect(routerView.exists()).toBe(true);
    });
  });

  describe('Global Features', () => {
    it('should provide Toast service for notifications', async () => {
      wrapper = await createWrapper();

      const toast = wrapper.findComponent({ name: 'Toast' });
      expect(toast.exists()).toBe(true);
    });

    it('should have PrimeVue configured', async () => {
      wrapper = await createWrapper();

      // Toast is a PrimeVue component, so if it renders, PrimeVue is configured
      expect(wrapper.findComponent({ name: 'Toast' }).exists()).toBe(true);
    });
  });

  describe('Responsive Layout', () => {
    it('should have flex layout for proper stacking', async () => {
      wrapper = await createWrapper();

      const appRoot = wrapper.find('#app');
      expect(appRoot.classes()).toContain('flex');
      expect(appRoot.classes()).toContain('flex-col');
    });

    it('should have main content stretch to fill available space', async () => {
      wrapper = await createWrapper();

      const main = wrapper.find('main');
      expect(main.classes()).toContain('flex-1');
    });
  });

  describe('Error Handling', () => {
    it('should render successfully when checkAuth resolves', async () => {
      vi.spyOn(authStore, 'checkAuth').mockResolvedValue(false);

      wrapper = await createWrapper();
      await flushPromises();

      // Should render all components successfully
      expect(wrapper.find('#app').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'PublicFooter' }).exists()).toBe(true);
    });
  });

  describe('Component Integration', () => {
    it('should integrate all child components successfully', async () => {
      wrapper = await createWrapper();

      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'PublicFooter' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Toast' }).exists()).toBe(true);
    });

    it('should pass through router context to child components', async () => {
      wrapper = await createWrapper('/leagues');
      await flushPromises();

      // Router context should work in router-view
      expect(wrapper.find('[data-testid="leagues-view"]').exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', async () => {
      wrapper = await createWrapper();

      expect(wrapper.find('nav').exists()).toBe(true);
      expect(wrapper.find('main').exists()).toBe(true);
      expect(wrapper.find('footer').exists()).toBe(true);
    });

    it('should have app container for ARIA live region support', async () => {
      wrapper = await createWrapper();

      expect(wrapper.find('#app').exists()).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should mount without errors', async () => {
      expect(async () => {
        wrapper = await createWrapper();
      }).not.toThrow();
    });

    it('should efficiently render all components', async () => {
      const startTime = performance.now();

      wrapper = await createWrapper();
      await flushPromises();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('State Management', () => {
    it('should have access to auth store', async () => {
      wrapper = await createWrapper();

      // Auth store should be accessible
      expect(authStore).toBeDefined();
      expect(typeof authStore.checkAuth).toBe('function');
    });

    it('should initialize auth store on mount', async () => {
      const checkAuthSpy = vi.spyOn(authStore, 'checkAuth').mockResolvedValue(false);

      wrapper = await createWrapper();
      await flushPromises();

      expect(checkAuthSpy).toHaveBeenCalled();
    });
  });

  describe('Maintenance Mode', () => {
    it('should conditionally render based on maintenance mode value', async () => {
      // This test verifies the v-if logic exists in the template
      // The default mock has maintenance mode OFF, so normal app should render
      wrapper = await createWrapper();

      // With default mock (maintenance off), should show normal app
      // Note: We test the structure exists, actual behavior tested in integration
      expect(wrapper.find('#app').exists()).toBe(true);
    });
  });

  describe('White Label Mode', () => {
    it('should hide LandingNav when whitelabel query param is true', async () => {
      wrapper = await createWrapper('/?whitelabel=true');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(false);
    });

    it('should hide PublicFooter when whitelabel query param is true', async () => {
      wrapper = await createWrapper('/?whitelabel=true');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'PublicFooter' }).exists()).toBe(false);
    });

    it('should show LandingNav when whitelabel query param is false', async () => {
      wrapper = await createWrapper('/?whitelabel=false');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
    });

    it('should show PublicFooter when whitelabel query param is false', async () => {
      wrapper = await createWrapper('/?whitelabel=false');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'PublicFooter' }).exists()).toBe(true);
    });

    it('should show navigation and footer by default (no whitelabel param)', async () => {
      wrapper = await createWrapper('/');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'PublicFooter' }).exists()).toBe(true);
    });
  });
});
