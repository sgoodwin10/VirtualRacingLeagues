import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NoteBox from '@app/components/common/cards/NoteBox.vue';

describe('NoteBox', () => {
  it('renders with required props', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'USAGE GUIDELINES',
      },
      slots: {
        default: '<p>Test content</p>',
      },
    });
    expect(wrapper.text()).toContain('USAGE GUIDELINES');
    expect(wrapper.text()).toContain('Test content');
  });

  it('renders title correctly', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'TEST TITLE',
      },
    });
    expect(wrapper.text()).toContain('TEST TITLE');
  });

  it('renders default slot content', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<p class="test-content">Custom content</p>',
      },
    });
    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Custom content');
  });

  it('renders title slot content', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Default',
      },
      slots: {
        title: '<span class="custom-title">Custom Title</span>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default');
  });

  it('applies custom classes', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    expect(wrapper.attributes('role')).toBe('note');
  });

  it('has aria-label from title', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'USAGE GUIDELINES',
      },
    });
    expect(wrapper.attributes('aria-label')).toBe('USAGE GUIDELINES');
  });

  it('renders HTML content in slot', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<p>Text with <code>code</code> and <strong>bold</strong>.</p>',
      },
    });
    expect(wrapper.find('code').exists()).toBe(true);
    expect(wrapper.find('strong').exists()).toBe(true);
  });

  it('renders lists in content', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<ul><li>Item 1</li><li>Item 2</li></ul>',
      },
    });
    expect(wrapper.find('ul').exists()).toBe(true);
    expect(wrapper.findAll('li').length).toBe(2);
  });

  it('renders pre/code blocks', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<pre><code>const x = 10;</code></pre>',
      },
    });
    expect(wrapper.find('pre').exists()).toBe(true);
    expect(wrapper.find('code').exists()).toBe(true);
  });

  it('has correct layout classes', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    const noteBox = wrapper.find('.note-box');
    expect(noteBox.classes()).toContain('bg-card');
    expect(noteBox.classes()).toContain('border');
    expect(noteBox.classes()).toContain('px-5');
    expect(noteBox.classes()).toContain('py-4');
  });

  it('has correct title typography', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    const title = wrapper.find('.font-mono');
    expect(title.exists()).toBe(true);
    expect(title.classes()).toContain('font-semibold');
    expect(title.classes()).toContain('tracking-wide');
  });

  it('styles inline code elements', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<p>Use <code>inline code</code> here.</p>',
      },
    });
    expect(wrapper.find('code').exists()).toBe(true);
  });

  it('applies cyan accent color to title', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    const title = wrapper.find('.font-mono');
    expect(title.classes()).toContain('text-[var(--cyan)]');
  });
});
