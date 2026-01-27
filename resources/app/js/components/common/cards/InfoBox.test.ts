import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InfoBox from '@app/components/common/cards/InfoBox.vue';

describe('InfoBox', () => {
  it('renders with required props', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
        message: 'Test message',
      },
    });
    expect(wrapper.text()).toContain('INFORMATION');
    expect(wrapper.text()).toContain('Test message');
  });

  it('renders without message prop', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.text()).toContain('INFORMATION');
  });

  it('applies info variant by default', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.find('.info-box--info').exists()).toBe(true);
    expect(wrapper.find('.info-box-title--info').exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['info', 'success', 'warning', 'danger'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(InfoBox, {
        props: {
          title: 'Test',
          variant,
        },
      });
      expect(wrapper.find(`.info-box--${variant}`).exists()).toBe(true);
      expect(wrapper.find(`.info-box-title--${variant}`).exists()).toBe(true);
    });
  });

  it('renders title slot content', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Default Title',
      },
      slots: {
        title: '<span class="custom-title">Custom Title</span>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default Title');
  });

  it('renders default slot content', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
        message: 'Default message',
      },
      slots: {
        default: '<p class="custom-content">Custom content</p>',
      },
    });
    expect(wrapper.find('.custom-content').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default message');
  });

  it('applies custom classes', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Test',
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.attributes('role')).toBe('note');
  });

  it('has aria-label from title', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.attributes('aria-label')).toBe('INFORMATION');
  });

  it('applies correct border and title colors', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'SUCCESS',
        variant: 'success',
      },
    });

    expect(wrapper.find('.info-box--success').exists()).toBe(true);
    expect(wrapper.find('.info-box-title--success').exists()).toBe(true);
  });

  it('renders HTML content in default slot', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
      slots: {
        default: '<strong>Bold text</strong> and <code>code</code>',
      },
    });
    expect(wrapper.find('strong').exists()).toBe(true);
    expect(wrapper.find('code').exists()).toBe(true);
  });

  it('has correct typography classes', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Test',
        message: 'Test message',
      },
    });

    const title = wrapper.find('.info-box-title');
    expect(title.classes()).toContain('font-mono');
    expect(title.classes()).toContain('font-semibold');

    const text = wrapper.find('p');
    expect(text.classes()).toContain('text-md');
    expect(text.classes()).toContain('leading-relaxed');
  });

  it('has correct layout classes', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Test',
      },
    });

    const container = wrapper.find('.info-box');
    expect(container.classes()).toContain('bg-card');
    expect(container.classes()).toContain('border');
    expect(container.classes()).toContain('px-5');
    expect(container.classes()).toContain('py-4');
  });
});
