import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ImageUpload from './ImageUpload.vue';

describe('ImageUpload', () => {
  it('renders without errors', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        fileType: 'logo',
      },
      global: {
        stubs: {
          FilePreview: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders label when provided', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        fileType: 'logo',
        label: 'Upload Logo',
      },
      global: {
        stubs: {
          FilePreview: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Upload Logo');
  });

  it('renders help text when provided', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        fileType: 'logo',
        helpText: '512x512px recommended',
      },
      global: {
        stubs: {
          FilePreview: true,
        },
      },
    });

    expect(wrapper.text()).toContain('512x512px recommended');
  });

  it('shows required indicator when required', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        fileType: 'logo',
        label: 'Upload Logo',
        required: true,
      },
      global: {
        stubs: {
          FilePreview: true,
        },
      },
    });

    expect(wrapper.html()).toContain('*');
  });

  it('renders upload area when no file', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        fileType: 'logo',
      },
      global: {
        stubs: {
          FilePreview: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Choose a file');
    expect(wrapper.text()).toContain('or drag and drop');
  });

  it('displays error message when provided', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        fileType: 'logo',
        errorMessage: 'Invalid file type',
      },
      global: {
        stubs: {
          FilePreview: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Invalid file type');
  });
});
