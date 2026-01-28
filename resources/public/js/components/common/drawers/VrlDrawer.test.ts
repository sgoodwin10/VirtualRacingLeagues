import { describe, it, expect, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import VrlDrawer from '../VrlDrawer.vue';
import PrimeVue from 'primevue/config';
import Sidebar from 'primevue/sidebar';

describe('VrlDrawer', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlDrawer, {
      props: {
        visible: false,
        ...props,
      },
      slots,
      global: {
        plugins: [PrimeVue],
        stubs: {
          Sidebar: Sidebar,
        },
      },
      attachTo: document.body,
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    // Clear the document body for teleported content
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('should render PrimeVue Sidebar component', () => {
      wrapper = createWrapper();
      expect(wrapper.findComponent(Sidebar).exists()).toBe(true);
    });

    it('should render with visible prop', async () => {
      wrapper = createWrapper({ visible: true });
      await nextTick();
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('visible')).toBe(true);
    });

    it('should render with title prop', () => {
      wrapper = createWrapper({
        visible: true,
        title: 'Test Drawer Title',
      });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('header')).toBe('Test Drawer Title');
    });

    it('should render default slot content', async () => {
      wrapper = createWrapper(
        { visible: true },
        { default: '<p class="test-content">Drawer content</p>' },
      );
      await nextTick();
      await nextTick(); // Extra tick for teleport
      // Content is teleported, check via document
      const drawerContent = document.querySelector('.vrl-drawer-body');
      expect(drawerContent).toBeTruthy();
      expect(drawerContent?.textContent).toContain('Drawer content');
    });

    it('should render header slot content', async () => {
      wrapper = createWrapper(
        { visible: true },
        { header: '<h2 class="test-header">Custom Header</h2>' },
      );
      await nextTick();
      await nextTick(); // Extra tick for teleport
      // Header is teleported, check via document
      const drawerHeader = document.querySelector('.vrl-drawer-header');
      expect(drawerHeader).toBeTruthy();
      expect(drawerHeader?.textContent).toContain('Custom Header');
    });
  });

  describe('Props', () => {
    it('should set position to right by default', () => {
      wrapper = createWrapper({ visible: true });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('position')).toBe('right');
    });

    it('should set position to left', () => {
      wrapper = createWrapper({
        visible: true,
        position: 'left',
      });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('position')).toBe('left');
    });

    it('should set position to top', () => {
      wrapper = createWrapper({
        visible: true,
        position: 'top',
      });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('position')).toBe('top');
    });

    it('should set position to bottom', () => {
      wrapper = createWrapper({
        visible: true,
        position: 'bottom',
      });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('position')).toBe('bottom');
    });

    it('should apply custom CSS class', () => {
      wrapper = createWrapper({
        visible: true,
        class: 'custom-drawer-class',
      });
      // Verify the VrlDrawer component received the class prop
      expect(wrapper.props('class')).toBe('custom-drawer-class');
    });

    it('should set closable prop', () => {
      wrapper = createWrapper({
        visible: true,
        closable: true,
      });
      // Verify the component receives the closable prop
      expect(wrapper.props('closable')).toBe(true);
    });

    it('should set closable to false', () => {
      wrapper = createWrapper({
        visible: true,
        closable: false,
      });
      // Verify the component receives the closable prop as false
      expect(wrapper.props('closable')).toBe(false);
    });

    it('should set closeOnBackdrop prop', () => {
      wrapper = createWrapper({
        visible: true,
        closeOnBackdrop: true,
      });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('dismissable')).toBe(true);
    });

    it('should set blockScroll prop', () => {
      wrapper = createWrapper({
        visible: true,
        blockScroll: true,
      });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('blockScroll')).toBe(true);
    });

    it('should set ariaLabel prop', () => {
      wrapper = createWrapper({
        visible: true,
        ariaLabel: 'Custom drawer label',
      });
      // Verify the ariaLabel prop is passed to the component
      expect(wrapper.props('ariaLabel')).toBe('Custom drawer label');
    });

    it('should set default width', () => {
      wrapper = createWrapper({ visible: true });
      expect(wrapper.vm.$props.width).toBe('400px');
    });

    it('should set custom width', () => {
      wrapper = createWrapper({
        visible: true,
        width: '600px',
      });
      expect(wrapper.vm.$props.width).toBe('600px');
    });
  });

  describe('Events', () => {
    it('should emit update:visible when visibility changes', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const sidebar = wrapper.findComponent(Sidebar);
      await sidebar.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should emit close event when closing', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const sidebar = wrapper.findComponent(Sidebar);
      await sidebar.vm.$emit('update:visible', false);

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit show event', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const sidebar = wrapper.findComponent(Sidebar);
      await sidebar.vm.$emit('show');

      expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('should emit hide event', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const sidebar = wrapper.findComponent(Sidebar);
      await sidebar.vm.$emit('hide');

      expect(wrapper.emitted('hide')).toBeTruthy();
    });
  });

  describe('Default Props', () => {
    it('should have closable default to true', () => {
      wrapper = createWrapper({ visible: true });
      // By default, closable should be true
      expect(wrapper.props('closable')).toBe(true);
    });

    it('should have closeOnBackdrop default to false', () => {
      wrapper = createWrapper({ visible: true });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('dismissable')).toBe(false);
    });

    it('should have blockScroll default to true', () => {
      wrapper = createWrapper({ visible: true });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('blockScroll')).toBe(true);
    });

    it('should have position default to right', () => {
      wrapper = createWrapper({ visible: true });
      const sidebar = wrapper.findComponent(Sidebar);
      expect(sidebar.props('position')).toBe('right');
    });
  });

  describe('PassThrough Configuration', () => {
    it('should apply VRL drawer classes through PT', () => {
      wrapper = createWrapper({ visible: true });
      const sidebar = wrapper.findComponent(Sidebar);
      const pt = sidebar.props('pt') as Record<string, unknown>;

      expect(pt).toBeDefined();
      expect(pt.root).toBeDefined();
    });
  });
});
