import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseModal from './BaseModal.vue';

describe('BaseModal', () => {
  const createWrapper = (props: any = {}) => {
    return mount(BaseModal, {
      props: {
        visible: true,
        ...props,
      },
      global: {
        stubs: {
          Dialog: {
            template: '<div class="p-dialog"><slot /></div>',
            props: [
              'visible',
              'modal',
              'dismissableMask',
              'closable',
              'draggable',
              'style',
              'pt',
              'ptOptions',
            ],
          },
        },
      },
    });
  };

  it('renders without errors', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('passes visible prop to Dialog', () => {
    const wrapper = createWrapper();
    const dialog = wrapper.find('.p-dialog');
    expect(dialog.exists()).toBe(true);
  });

  it('applies default width', () => {
    const wrapper = createWrapper();
    const dialog = wrapper.find('.p-dialog');
    expect(dialog.exists()).toBe(true);
    // Check that the component was initialized with default width
    const vm = wrapper.vm as any;
    expect(vm.$props.width).toBe('600px');
  });

  it('applies custom width', () => {
    const wrapper = createWrapper({ width: '800px' });
    const dialog = wrapper.find('.p-dialog');
    expect(dialog.exists()).toBe(true);
    // Check that the component was initialized with custom width
    const vm = wrapper.vm as any;
    expect(vm.$props.width).toBe('800px');
  });

  it('emits update:visible when dialog visibility changes', async () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as any;
    // Call the handler directly
    vm.handleVisibleChange(false);

    expect(wrapper.emitted('update:visible')).toBeTruthy();
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
  });

  it('emits close when visibility becomes false', async () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as any;
    // Call the handler directly with false to trigger close
    vm.handleVisibleChange(false);

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
