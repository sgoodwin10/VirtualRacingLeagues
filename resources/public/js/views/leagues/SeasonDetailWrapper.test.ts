import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import SeasonDetailWrapper from './SeasonDetailWrapper.vue';
import SeasonDetailView from './SeasonDetailView.vue';
import SeasonDetailWhiteLabelView from './SeasonDetailWhiteLabelView.vue';

describe('SeasonDetailWrapper', () => {
  const createMockRouter = () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/leagues/:leagueSlug/:competitionSlug/:seasonSlug',
          name: 'season-detail',
          component: SeasonDetailWrapper,
        },
      ],
    });

    return router;
  };

  it('renders SeasonDetailView by default (no whitelabel param)', async () => {
    const router = createMockRouter();
    await router.push('/leagues/test-league/test-comp/test-season');

    const wrapper = mount(SeasonDetailWrapper, {
      global: {
        plugins: [router],
        stubs: {
          SeasonDetailView: true,
          SeasonDetailWhiteLabelView: true,
        },
      },
    });

    expect(wrapper.findComponent(SeasonDetailView).exists()).toBe(true);
    expect(wrapper.findComponent(SeasonDetailWhiteLabelView).exists()).toBe(false);
  });

  it('renders SeasonDetailView when whitelabel is false', async () => {
    const router = createMockRouter();
    await router.push('/leagues/test-league/test-comp/test-season?whitelabel=false');

    const wrapper = mount(SeasonDetailWrapper, {
      global: {
        plugins: [router],
        stubs: {
          SeasonDetailView: true,
          SeasonDetailWhiteLabelView: true,
        },
      },
    });

    expect(wrapper.findComponent(SeasonDetailView).exists()).toBe(true);
    expect(wrapper.findComponent(SeasonDetailWhiteLabelView).exists()).toBe(false);
  });

  it('renders SeasonDetailWhiteLabelView when whitelabel is true', async () => {
    const router = createMockRouter();
    await router.push('/leagues/test-league/test-comp/test-season?whitelabel=true');

    const wrapper = mount(SeasonDetailWrapper, {
      global: {
        plugins: [router],
        stubs: {
          SeasonDetailView: true,
          SeasonDetailWhiteLabelView: true,
        },
      },
    });

    expect(wrapper.findComponent(SeasonDetailWhiteLabelView).exists()).toBe(true);
    expect(wrapper.findComponent(SeasonDetailView).exists()).toBe(false);
  });

  it('is reactive to query parameter changes', async () => {
    const router = createMockRouter();
    await router.push('/leagues/test-league/test-comp/test-season');

    const wrapper = mount(SeasonDetailWrapper, {
      global: {
        plugins: [router],
        stubs: {
          SeasonDetailView: true,
          SeasonDetailWhiteLabelView: true,
        },
      },
    });

    // Initially renders normal view
    expect(wrapper.findComponent(SeasonDetailView).exists()).toBe(true);
    expect(wrapper.findComponent(SeasonDetailWhiteLabelView).exists()).toBe(false);

    // Navigate with whitelabel param
    await router.push('/leagues/test-league/test-comp/test-season?whitelabel=true');

    // Should now render white label view
    expect(wrapper.findComponent(SeasonDetailWhiteLabelView).exists()).toBe(true);
    expect(wrapper.findComponent(SeasonDetailView).exists()).toBe(false);

    // Navigate back without param
    await router.push('/leagues/test-league/test-comp/test-season');

    // Should render normal view again
    expect(wrapper.findComponent(SeasonDetailView).exists()).toBe(true);
    expect(wrapper.findComponent(SeasonDetailWhiteLabelView).exists()).toBe(false);
  });
});
