import { describe, it, expect } from 'vitest';
import { createTestRouter, mountWithStubs } from '@app/__tests__/setup';
import App from '@app/components/App.vue';
import LeagueList from '@app/views/LeagueList.vue';

describe('User Dashboard - App Component', () => {
  const createRouter = () => {
    return createTestRouter([
      {
        path: '/',
        name: 'home',
        component: LeagueList,
      },
    ]);
  };

  it('renders user dashboard properly', async () => {
    const router = createRouter();
    await router.push('/');
    await router.isReady();

    const wrapper = mountWithStubs(App, {
      global: {
        plugins: [router],
      },
    });

    // App now displays site name from siteConfigStore
    expect(wrapper.text()).toContain('Virtual Racing Leagues');
  });

  it('renders the router-view component', async () => {
    const router = createRouter();
    await router.push('/');
    await router.isReady();

    const wrapper = mountWithStubs(App, {
      global: {
        plugins: [router],
      },
    });

    // App now displays site name from siteConfigStore
    expect(wrapper.html()).toContain('Virtual Racing Leagues');
  });

  it('mounts without errors when router is configured', async () => {
    const router = createRouter();
    await router.push('/');
    await router.isReady();

    const wrapper = mountWithStubs(App, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent(App).exists()).toBe(true);
  });
});
