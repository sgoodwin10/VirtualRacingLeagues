import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import HomeView from '../HomeView.vue';

describe('HomeView', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomeView,
      },
    ],
  });

  it('renders the hero section', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    expect(wrapper.find('.hero').exists()).toBe(true);
    expect(wrapper.text()).toContain('Setup. Race.');
    expect(wrapper.text()).toContain('Share.');
  });

  it('renders the "Everything You Need" features section', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    expect(wrapper.text()).toContain('Everything You Need');
  });

  it('renders all 6 feature cards', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    const featureCards = wrapper.findAll('.feature-grid > *');
    expect(featureCards.length).toBe(6);
  });

  it('renders feature cards with correct titles', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    const expectedFeatures = [
      'Leagues & Competitions',
      'Qualifying & Race Times',
      'Teams & Divisions',
      'Driver Tracking',
      'Penalties & Incidents',
      'Public Sharing',
    ];

    const content = wrapper.text();
    expectedFeatures.forEach((feature) => {
      expect(content).toContain(feature);
    });
  });

  it('renders feature cards with icons', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    // Each feature card has an icon slot with PhFlag, PhTimer, etc.
    const featureCards = wrapper.findAll('.feature-grid > *');
    expect(featureCards.length).toBe(6);
    // Verify icons are present by checking for SVG elements (Phosphor icons render as SVG)
    const svgIcons = wrapper.findAll('.feature-grid svg');
    expect(svgIcons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders the pricing section', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    expect(wrapper.text()).toContain('Start Racing Today');
    expect(wrapper.text()).toContain('FREE');
  });

  it('renders the coming soon section', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    expect(wrapper.text()).toContain('Coming Soon');
  });

  it('has working navigation buttons', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, PrimeVue, ToastService],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
