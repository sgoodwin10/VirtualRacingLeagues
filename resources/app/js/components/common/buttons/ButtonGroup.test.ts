import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ButtonGroup from '@app/components/common/buttons/ButtonGroup.vue';
import Button from '@app/components/common/buttons/Button.vue';
import PrimeVue from 'primevue/config';

describe('ButtonGroup', () => {
  it('renders children buttons', () => {
    const wrapper = mount(ButtonGroup, {
      slots: {
        default: `
          <Button label="Button 1" />
          <Button label="Button 2" />
        `,
      },
      global: {
        components: {
          Button,
        },
        plugins: [PrimeVue],
      },
    });

    expect(wrapper.find('.app-button-group').exists()).toBe(true);
  });

  it('applies horizontal orientation class by default', () => {
    const wrapper = mount(ButtonGroup);
    expect(wrapper.find('.app-button-group--horizontal').exists()).toBe(true);
  });

  it('applies vertical orientation class when specified', () => {
    const wrapper = mount(ButtonGroup, {
      props: { orientation: 'vertical' },
    });
    expect(wrapper.find('.app-button-group--vertical').exists()).toBe(true);
  });
});
