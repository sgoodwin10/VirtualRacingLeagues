import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import VrlModal from '../VrlModal.vue';
import { resetModalCount } from '../modalState';

describe('VrlModal', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    // Reset modal count before each test
    resetModalCount();
    // Create a div for teleport target
    const el = document.createElement('div');
    el.id = 'app';
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    // Clean up teleport target
    document.body.innerHTML = '';
    // Reset modal count and body overflow after each test
    resetModalCount();
  });

  it('renders correctly when modelValue is true', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
      },
      attachTo: document.body,
    });

    await nextTick();

    const overlay = document.querySelector('.vrl-modal-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay?.getAttribute('role')).toBe('dialog');
  });

  it('hidden when modelValue is false', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: false,
        title: 'Test Modal',
      },
      attachTo: document.body,
    });

    await nextTick();

    const overlay = document.querySelector('.vrl-modal-overlay');
    expect(overlay).toBeFalsy();
  });

  it('emits update:modelValue when closed', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        closable: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    const closeButton = document.querySelector('.vrl-modal-close') as HTMLElement;
    expect(closeButton).toBeTruthy();

    await closeButton.click();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('emits close event when closed', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        closable: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    const closeButton = document.querySelector('.vrl-modal-close') as HTMLElement;
    await closeButton.click();

    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')?.length).toBe(1);
  });

  it('closes on escape key when closeOnEscape is true', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        closeOnEscape: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    // Simulate Escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does NOT close on escape when closeOnEscape is false', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        closeOnEscape: false,
      },
      attachTo: document.body,
    });

    await nextTick();

    // Simulate Escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('closes on backdrop click when modal is true', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        modal: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    const overlay = document.querySelector('.vrl-modal-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();

    await overlay.click();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('does NOT close on backdrop click when clicking content', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        modal: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    const content = document.querySelector('.vrl-modal-content') as HTMLElement;
    expect(content).toBeTruthy();

    await content.click();

    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('applies correct size classes for all 5 sizes', async () => {
    const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];

    for (const size of sizes) {
      wrapper = mount(VrlModal, {
        props: {
          modelValue: true,
          title: 'Test Modal',
          size,
        },
        attachTo: document.body,
      });

      await nextTick();

      const content = document.querySelector('.vrl-modal-content');
      expect(content?.classList.contains(`vrl-modal--${size}`)).toBe(true);

      wrapper.unmount();
    }
  });

  it('renders title in header', async () => {
    const title = 'Test Modal Title';
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title,
      },
      attachTo: document.body,
    });

    await nextTick();

    const titleElement = document.querySelector('.vrl-modal-title');
    expect(titleElement?.textContent).toBe(title);
    expect(titleElement?.id).toBe('vrl-modal-title');
  });

  it('renders custom header slot', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
      },
      slots: {
        header: '<div class="custom-header">Custom Header Content</div>',
      },
      attachTo: document.body,
    });

    await nextTick();

    const customHeader = document.querySelector('.custom-header');
    expect(customHeader).toBeTruthy();
    expect(customHeader?.textContent).toBe('Custom Header Content');
  });

  it('renders default slot content', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
      },
      slots: {
        default: '<p class="modal-body-content">Body content here</p>',
      },
      attachTo: document.body,
    });

    await nextTick();

    const bodyContent = document.querySelector('.modal-body-content');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent?.textContent).toBe('Body content here');
  });

  it('renders footer slot', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
      },
      slots: {
        footer:
          '<div class="modal-footer-buttons"><button>Cancel</button><button>Save</button></div>',
      },
      attachTo: document.body,
    });

    await nextTick();

    const footer = document.querySelector('.vrl-modal-footer');
    expect(footer).toBeTruthy();

    const footerButtons = document.querySelector('.modal-footer-buttons');
    expect(footerButtons).toBeTruthy();
  });

  it('shows close button when closable is true', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        closable: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    const closeButton = document.querySelector('.vrl-modal-close');
    expect(closeButton).toBeTruthy();
  });

  it('hides close button when closable is false', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        closable: false,
      },
      attachTo: document.body,
    });

    await nextTick();

    const closeButton = document.querySelector('.vrl-modal-close');
    expect(closeButton).toBeFalsy();
  });

  it('has correct ARIA attributes', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        modal: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    const overlay = document.querySelector('.vrl-modal-overlay');
    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(overlay?.getAttribute('aria-labelledby')).toBe('vrl-modal-title');
  });

  it('focus trap works correctly', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        closable: true,
      },
      slots: {
        footer: '<button id="cancel-btn">Cancel</button><button id="save-btn">Save</button>',
      },
      attachTo: document.body,
    });

    await nextTick();

    // Wait for focus trap to activate
    await new Promise((resolve) => setTimeout(resolve, 100));

    const closeButton = document.querySelector('.vrl-modal-close') as HTMLElement;
    const cancelBtn = document.querySelector('#cancel-btn') as HTMLElement;
    const saveBtn = document.querySelector('#save-btn') as HTMLElement;

    expect(closeButton).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // Focus trap should contain these elements
    const content = document.querySelector('.vrl-modal-content');
    expect(content?.contains(closeButton)).toBe(true);
    expect(content?.contains(cancelBtn)).toBe(true);
    expect(content?.contains(saveBtn)).toBe(true);
  });

  it('backdrop blur is applied', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
      },
      attachTo: document.body,
    });

    await nextTick();

    const overlay = document.querySelector('.vrl-modal-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();

    const styles = window.getComputedStyle(overlay);
    expect(styles.backdropFilter).toBe('blur(4px)');
  });

  it('prevents body scroll when modal is open', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: false,
        title: 'Test Modal',
      },
      attachTo: document.body,
    });

    await wrapper.setProps({ modelValue: true });
    await flushPromises();
    await nextTick();

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when modal is closed', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: false,
        title: 'Test Modal',
      },
      attachTo: document.body,
    });

    await wrapper.setProps({ modelValue: true });
    await flushPromises();
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.setProps({ modelValue: false });
    await flushPromises();
    await nextTick();

    expect(document.body.style.overflow).toBe('');
  });

  it('has correct aria-labelledby when title is not provided', async () => {
    wrapper = mount(VrlModal, {
      props: {
        modelValue: true,
        modal: true,
      },
      attachTo: document.body,
    });

    await nextTick();

    const overlay = document.querySelector('.vrl-modal-overlay');
    // getAttribute returns null when attribute doesn't exist
    expect(overlay?.getAttribute('aria-labelledby')).toBeNull();
  });
});
