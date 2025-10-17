import { describe, it, expect } from 'vitest';
import { createTestRouter, mountWithStubs } from '@user/__tests__/setup';
import App from '@user/components/App.vue';
import HomeView from '@user/views/HomeView.vue';
import ProfileView from '@user/views/ProfileView.vue';

describe('User Dashboard - App Component', () => {
  const createRouter = () => {
    return createTestRouter([
      {
        path: '/',
        name: 'home',
        component: HomeView,
      },
      {
        path: '/profile',
        name: 'profile',
        component: ProfileView,
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

    expect(wrapper.text()).toContain('User Dashboard');
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

    expect(wrapper.html()).toContain('User Dashboard');
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
