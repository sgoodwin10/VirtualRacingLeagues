import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '@app/components/common/buttons/Button.vue';
import { PhHouse } from '@phosphor-icons/vue';
import PrimeVue from 'primevue/config';

describe('Button', () => {
  const mountButton = (props = {}) => {
    return mount(Button, {
      props,
      global: {
        plugins: [PrimeVue],
      },
    });
  };

  it('renders with label', () => {
    const wrapper = mountButton({ label: 'Click Me' });
    expect(wrapper.text()).toContain('Click Me');
  });

  it('applies correct variant class', () => {
    const wrapper = mountButton({ variant: 'primary' });
    expect(wrapper.find('.app-button--primary').exists()).toBe(true);
  });

  it('applies correct size class', () => {
    const wrapper = mountButton({ size: 'lg' });
    expect(wrapper.find('.app-button--lg').exists()).toBe(true);
  });

  it('renders icon when provided', () => {
    const wrapper = mountButton({ icon: PhHouse });
    expect(wrapper.findComponent(PhHouse).exists()).toBe(true);
  });

  it('passes currentColor to icon component', () => {
    const wrapper = mountButton({ icon: PhHouse });
    const iconComponent = wrapper.findComponent(PhHouse);
    expect(iconComponent.props('color')).toBe('currentColor');
  });

  it('emits click event when clicked', async () => {
    const wrapper = mountButton({ label: 'Click Me' });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mountButton({ label: 'Click Me', disabled: true });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeFalsy();
  });

  it('shows loading state', () => {
    const wrapper = mountButton({ label: 'Loading', loading: true });
    expect(wrapper.find('.p-button-loading-icon').exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['primary', 'secondary', 'ghost', 'outline', 'danger', 'success', 'warning'];

    variants.forEach((variant) => {
      const wrapper = mountButton({ variant: variant as any });
      expect(wrapper.find(`.app-button--${variant}`).exists()).toBe(true);
    });
  });

  it('applies all size classes correctly', () => {
    const sizes = ['sm', 'default', 'lg', 'xl'];

    sizes.forEach((size) => {
      const wrapper = mountButton({ size: size as any });
      expect(wrapper.find(`.app-button--${size}`).exists()).toBe(true);
    });
  });
});
