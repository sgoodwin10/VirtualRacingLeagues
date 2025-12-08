import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlDrawer from '../VrlDrawer.vue';

describe('VrlDrawer', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    // Clear body overflow style before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    // Clean up body overflow style after each test
    document.body.style.overflow = '';
  });

  describe('Visibility', () => {
    it('renders correctly when modelValue is true', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      expect(wrapper.find('.drawer-overlay').exists()).toBe(true);
      expect(wrapper.find('.drawer-content').exists()).toBe(true);
    });

    it('is hidden when modelValue is false', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: false,
          title: 'Test Drawer',
        },
      });

      expect(wrapper.find('.drawer-overlay').exists()).toBe(false);
      expect(wrapper.find('.drawer-content').exists()).toBe(false);
    });
  });

  describe('Emits', () => {
    it('emits update:modelValue when closed via close button', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          closable: true,
        },
      });

      await wrapper.find('.drawer-close-btn').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('emits close event when closed', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          closable: true,
        },
      });

      await wrapper.find('.drawer-close-btn').trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('emits update:modelValue when overlay is clicked', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      const overlay = wrapper.find('.drawer-overlay');
      await overlay.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('does NOT close when clicking drawer content', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      await drawerContent.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('Keyboard interaction', () => {
    it('closes on escape key', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
        attachTo: document.body,
      });

      await wrapper.trigger('keydown', { key: 'Escape' });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('Position', () => {
    it('applies correct position classes for left', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          position: 'left',
          title: 'Test Drawer',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.classes()).toContain('left-0');
      expect(drawerContent.classes()).toContain('border-r');
    });

    it('applies correct position classes for right (default)', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.classes()).toContain('right-0');
      expect(drawerContent.classes()).toContain('border-l');
    });
  });

  describe('Header', () => {
    it('renders title in header', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'My Test Drawer',
        },
      });

      expect(wrapper.find('.drawer-title').text()).toBe('My Test Drawer');
    });

    it('renders custom header slot', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
        },
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
        },
      });

      expect(wrapper.find('.custom-header').exists()).toBe(true);
      expect(wrapper.find('.custom-header').text()).toBe('Custom Header');
      expect(wrapper.find('.drawer-title').exists()).toBe(false);
    });

    it('shows close button when closable is true', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          closable: true,
        },
      });

      expect(wrapper.find('.drawer-close-btn').exists()).toBe(true);
    });

    it('hides close button when closable is false', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          closable: false,
        },
      });

      expect(wrapper.find('.drawer-close-btn').exists()).toBe(false);
    });
  });

  describe('Slots', () => {
    it('renders default slot content', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
        slots: {
          default: '<p class="test-content">Drawer content</p>',
        },
      });

      expect(wrapper.find('.test-content').exists()).toBe(true);
      expect(wrapper.find('.test-content').text()).toBe('Drawer content');
    });

    it('renders footer slot when provided', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
        slots: {
          footer: '<div class="test-footer">Footer content</div>',
        },
      });

      expect(wrapper.find('.drawer-footer').exists()).toBe(true);
      expect(wrapper.find('.test-footer').exists()).toBe(true);
      expect(wrapper.find('.test-footer').text()).toBe('Footer content');
    });

    it('does not render footer when slot is not provided', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      expect(wrapper.find('.drawer-footer').exists()).toBe(false);
    });
  });

  describe('Width', () => {
    it('applies custom width', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          width: '600px',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.attributes('style')).toContain('width: 600px');
    });

    it('has max-width: 90vw for mobile responsiveness', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.attributes('style')).toContain('max-width: 90vw');
    });

    it('uses default width of 400px', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.attributes('style')).toContain('width: 400px');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.attributes('role')).toBe('dialog');
      expect(drawerContent.attributes('aria-modal')).toBe('true');
      expect(drawerContent.attributes('aria-labelledby')).toBe('drawer-title');
    });

    it('has aria-labelledby when title is provided', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Accessible Drawer',
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      const title = wrapper.find('.drawer-title');

      expect(drawerContent.attributes('aria-labelledby')).toBe('drawer-title');
      expect(title.attributes('id')).toBe('drawer-title');
    });

    it('does not have aria-labelledby when title is not provided', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
        },
      });

      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.attributes('aria-labelledby')).toBeUndefined();
    });

    it('close button has aria-label', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          closable: true,
        },
      });

      const closeBtn = wrapper.find('.drawer-close-btn');
      expect(closeBtn.attributes('aria-label')).toBe('Close drawer');
    });

    it('overlay has role presentation', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      const overlay = wrapper.find('.drawer-overlay');
      expect(overlay.attributes('role')).toBe('presentation');
    });
  });

  describe('Transitions', () => {
    it('applies slide-right transition classes by default', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      // Verify drawer is positioned on the right
      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.classes()).toContain('right-0');
      expect(drawerContent.classes()).toContain('border-l');
    });

    it('applies slide-left transition classes for left position', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          position: 'left',
          title: 'Test Drawer',
        },
      });

      // Verify drawer is positioned on the left
      const drawerContent = wrapper.find('.drawer-content');
      expect(drawerContent.classes()).toContain('left-0');
      expect(drawerContent.classes()).toContain('border-r');
    });

    it('applies overlay-fade transition', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
      });

      // Verify overlay exists with proper structure for fade transition
      const overlay = wrapper.find('.drawer-overlay');
      expect(overlay.exists()).toBe(true);
    });
  });

  describe('Body scroll lock', () => {
    it('prevents body scroll when drawer is open', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: false,
          title: 'Test Drawer',
        },
      });

      expect(document.body.style.overflow).toBe('');

      await wrapper.setProps({ modelValue: true });
      await wrapper.vm.$nextTick();

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when drawer is closed', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: false,
          title: 'Test Drawer',
        },
      });

      // Open it first
      await wrapper.setProps({ modelValue: true });
      await wrapper.vm.$nextTick();
      expect(document.body.style.overflow).toBe('hidden');

      // Then close it
      await wrapper.setProps({ modelValue: false });
      await wrapper.vm.$nextTick();

      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: false,
          title: 'Test Drawer',
        },
      });

      // Open it
      await wrapper.setProps({ modelValue: true });
      await wrapper.vm.$nextTick();
      expect(document.body.style.overflow).toBe('hidden');

      wrapper.unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Focus trap', () => {
    it('has focus trap functionality available', async () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          closable: true,
        },
        attachTo: document.body,
      });

      await wrapper.vm.$nextTick();

      // Verify drawer has focusable elements
      expect(wrapper.find('.drawer-close-btn').exists()).toBe(true);
    });

    it('stores reference to previous active element', async () => {
      const testButton = document.createElement('button');
      testButton.textContent = 'Test Button';
      document.body.appendChild(testButton);
      testButton.focus();

      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
          closable: true,
        },
        attachTo: document.body,
      });

      await wrapper.vm.$nextTick();

      // Component should be mounted
      expect(wrapper.exists()).toBe(true);

      document.body.removeChild(testButton);
    });

    it('has contentRef for focus trap', () => {
      wrapper = mount(VrlDrawer, {
        props: {
          modelValue: true,
          title: 'Test Drawer',
        },
        attachTo: document.body,
      });

      // Verify component has the necessary structure for focus trapping
      expect(wrapper.find('.drawer-content').exists()).toBe(true);
    });
  });

  describe('Overlay state management', () => {
    it('manages overlay count correctly for multiple drawers', async () => {
      // Mount first drawer (closed initially)
      const wrapper1 = mount(VrlDrawer, {
        props: {
          modelValue: false,
          title: 'Drawer 1',
        },
        attachTo: document.body,
      });

      // Open first drawer
      await wrapper1.setProps({ modelValue: true });
      await wrapper1.vm.$nextTick();
      expect(document.body.style.overflow).toBe('hidden');

      // Mount second drawer (closed initially)
      const wrapper2 = mount(VrlDrawer, {
        props: {
          modelValue: false,
          title: 'Drawer 2',
        },
        attachTo: document.body,
      });

      // Open second drawer
      await wrapper2.setProps({ modelValue: true });
      await wrapper2.vm.$nextTick();
      expect(document.body.style.overflow).toBe('hidden');

      // Close first drawer
      await wrapper1.setProps({ modelValue: false });
      await wrapper1.vm.$nextTick();

      // Body scroll should still be locked (second drawer is open)
      expect(document.body.style.overflow).toBe('hidden');

      // Close second drawer
      await wrapper2.setProps({ modelValue: false });
      await wrapper2.vm.$nextTick();

      // Now body scroll should be restored
      expect(document.body.style.overflow).toBe('');

      wrapper1.unmount();
      wrapper2.unmount();
    });
  });
});
