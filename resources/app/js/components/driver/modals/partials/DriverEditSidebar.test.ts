import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverEditSidebar from './DriverEditSidebar.vue';
import { PhUser, PhNotepad, PhWarning } from '@phosphor-icons/vue';

describe('DriverEditSidebar', () => {
  describe('Sections Navigation', () => {
    it('renders all sections', () => {
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
        },
      });

      expect(wrapper.text()).toContain('Basic Info');
      expect(wrapper.text()).toContain('Additional');
    });

    it('highlights the active section', () => {
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
        },
      });

      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);

      const basicButton = buttons[0];
      const additionalButton = buttons[1];

      expect(basicButton?.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(basicButton?.classes()).toContain('text-[var(--cyan)]');
      expect(additionalButton?.classes()).toContain('text-[var(--text-secondary)]');
    });

    it('emits change-section event when clicking a section', async () => {
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
        },
      });

      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);

      const additionalButton = buttons[1];
      expect(additionalButton).toBeDefined();
      await additionalButton?.trigger('click');

      expect(wrapper.emitted('change-section')).toBeTruthy();
      expect(wrapper.emitted('change-section')?.[0]).toEqual(['additional']);
    });

    it('renders correct icons for each section', () => {
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
        },
      });

      // Check that icons are rendered (PhUser and PhNotepad components)
      const userIcon = wrapper.findComponent(PhUser);
      const notepadIcon = wrapper.findComponent(PhNotepad);

      expect(userIcon.exists()).toBe(true);
      expect(notepadIcon.exists()).toBe(true);
    });
  });

  describe('General Error Display', () => {
    it('does not render error section when no error is provided', () => {
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
        },
      });

      expect(wrapper.findComponent(PhWarning).exists()).toBe(false);
      expect(wrapper.text()).not.toContain('Driver with platform ID');
    });

    it('renders error section when generalError is provided', () => {
      const errorMessage = "Driver with platform ID 'Nik_Makozi' is already in league 1";
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
          generalError: errorMessage,
        },
      });

      expect(wrapper.findComponent(PhWarning).exists()).toBe(true);
      expect(wrapper.text()).toContain(errorMessage);
    });

    it('renders error with correct styling', () => {
      const errorMessage = 'This is a server error';
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
          generalError: errorMessage,
        },
      });

      const errorContainer = wrapper.find('.bg-\\[var\\(--red-dim\\)\\]');
      expect(errorContainer.exists()).toBe(true);
      expect(errorContainer.classes()).toContain('border-[var(--red)]');
    });

    it('removes error when generalError prop becomes empty', async () => {
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
          generalError: 'Initial error',
        },
      });

      expect(wrapper.findComponent(PhWarning).exists()).toBe(true);

      await wrapper.setProps({ generalError: '' });

      expect(wrapper.findComponent(PhWarning).exists()).toBe(false);
    });

    it('updates error message when generalError prop changes', async () => {
      const initialError = 'First error';
      const updatedError = 'Second error';
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
          generalError: initialError,
        },
      });

      expect(wrapper.text()).toContain(initialError);
      expect(wrapper.text()).not.toContain(updatedError);

      await wrapper.setProps({ generalError: updatedError });

      expect(wrapper.text()).not.toContain(initialError);
      expect(wrapper.text()).toContain(updatedError);
    });

    it('renders error at the bottom of the sidebar', () => {
      const wrapper = mount(DriverEditSidebar, {
        props: {
          activeSection: 'basic',
          generalError: 'Error message',
        },
      });

      const aside = wrapper.find('aside');
      const children = aside.element.children;
      // The last child should be the error container (second div in aside)
      expect(children.length).toBe(2);
      const lastChild = children[1];
      expect(lastChild).toBeDefined();
      expect(lastChild?.classList.contains('border-t')).toBe(true);
    });
  });
});
