import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlDrawerHeader from './VrlDrawerHeader.vue';
import VrlCloseButton from '@public/components/common/buttons/VrlCloseButton.vue';

describe('VrlDrawerHeader', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlDrawerHeader, {
      props: {
        ...props,
      },
      slots,
      global: {
        stubs: {
          VrlCloseButton: VrlCloseButton,
        },
      },
    });
  };

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render drawer header', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-test="vrl-drawer-header"]').exists()).toBe(true);
    });

    it('should render title prop', () => {
      wrapper = createWrapper({ title: 'Test Title' });
      expect(wrapper.find('[data-test="vrl-drawer-title"]').text()).toBe('Test Title');
    });

    it('should render title slot content', () => {
      wrapper = createWrapper({}, { title: 'Custom Title Content' });
      expect(wrapper.find('[data-test="vrl-drawer-title"]').text()).toBe('Custom Title Content');
    });

    it('should render close button', () => {
      wrapper = createWrapper();
      expect(wrapper.findComponent(VrlCloseButton).exists()).toBe(true);
    });

    it('should render custom close button slot', () => {
      wrapper = createWrapper({}, { close: '<span class="custom-close">X</span>' });
      expect(wrapper.html()).toContain('custom-close');
    });

    it('should render back button when showBack is true', () => {
      wrapper = createWrapper({ showBack: true });
      expect(wrapper.find('[data-test="vrl-drawer-back"]').exists()).toBe(true);
    });

    it('should not render back button when showBack is false', () => {
      wrapper = createWrapper({ showBack: false });
      expect(wrapper.find('[data-test="vrl-drawer-back"]').exists()).toBe(false);
    });

    it('should render custom back button slot', () => {
      wrapper = createWrapper(
        { showBack: true },
        { 'back-button': '<span class="custom-back">Back</span>' },
      );
      expect(wrapper.html()).toContain('custom-back');
    });
  });

  describe('Props', () => {
    it('should apply custom CSS class', () => {
      wrapper = createWrapper({ class: 'custom-header-class' });
      expect(wrapper.classes()).toContain('custom-header-class');
    });

    it('should have showBack default to false', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-test="vrl-drawer-back"]').exists()).toBe(false);
    });
  });

  describe('Events', () => {
    it('should emit close event when close button is clicked', async () => {
      wrapper = createWrapper();
      const closeButton = wrapper.findComponent(VrlCloseButton);

      await closeButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit back event when back button is clicked', async () => {
      wrapper = createWrapper({ showBack: true });
      const backButton = wrapper.find('[data-test="vrl-drawer-back"]');

      await backButton.trigger('click');

      expect(wrapper.emitted('back')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should apply VRL drawer header classes', () => {
      wrapper = createWrapper();
      expect(wrapper.attributes('data-test')).toBe('vrl-drawer-header');
      expect(wrapper.classes()).toContain('flex');
      expect(wrapper.classes()).toContain('items-center');
      expect(wrapper.classes()).toContain('gap-4');
    });

    it('should apply VRL drawer title classes', () => {
      wrapper = createWrapper({ title: 'Test' });
      const title = wrapper.find('[data-test="vrl-drawer-title"]');
      expect(title.classes()).toContain('font-display');
      expect(title.classes()).toContain('flex-1');
    });

    it('should apply back button styles', () => {
      wrapper = createWrapper({ showBack: true });
      const backButton = wrapper.find('[data-test="vrl-drawer-back"]');
      expect(backButton.classes()).toContain('w-8');
      expect(backButton.classes()).toContain('h-8');
      expect(backButton.classes()).toContain('inline-flex');
      expect(backButton.classes()).toContain('items-center');
      expect(backButton.classes()).toContain('justify-center');
      expect(backButton.classes()).toContain('rounded-md');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on back button', () => {
      wrapper = createWrapper({ showBack: true });
      const backButton = wrapper.find('[data-test="vrl-drawer-back"]');
      expect(backButton.attributes('aria-label')).toBe('Go back');
    });

    it('should have type="button" on back button', () => {
      wrapper = createWrapper({ showBack: true });
      const backButton = wrapper.find('[data-test="vrl-drawer-back"]');
      expect(backButton.attributes('type')).toBe('button');
    });
  });
});
