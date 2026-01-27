import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SimpleImageUpload from './SimpleImageUpload.vue';

describe('SimpleImageUpload', () => {
  it('renders upload prompt when no image', () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        label: 'Test Logo',
      },
    });

    expect(wrapper.text()).toContain('Test Logo');
    expect(wrapper.find('[data-testid="upload-icon"]').exists()).toBe(true);
  });

  it('renders preview when image selected', async () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        label: 'Test Logo',
      },
    });

    // Create a mock file
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    // Mock FileReader using class
    const originalFileReader = window.FileReader;
    class MockFileReader {
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      result: string | ArrayBuffer | null = 'data:image/png;base64,test';

      readAsDataURL() {
        // Simulate async callback
        setTimeout(() => {
          if (this.onload) {
            this.onload.call(
              this as unknown as FileReader,
              {
                target: this,
              } as ProgressEvent<FileReader>,
            );
          }
        }, 0);
      }
    }

    (window as unknown as { FileReader: typeof MockFileReader }).FileReader = MockFileReader;

    // Trigger file input change
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve, 10));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([file]);

    // Restore original FileReader
    window.FileReader = originalFileReader;
  });

  it('renders preview when existing image URL provided', () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        existingImageUrl: 'https://example.com/logo.png',
        label: 'Test Logo',
      },
    });

    expect(wrapper.find('[data-testid="preview-image"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="preview-image"]').attributes('src')).toBe(
      'https://example.com/logo.png',
    );
  });

  it('shows remove button on preview', () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        existingImageUrl: 'https://example.com/logo.png',
        label: 'Test Logo',
      },
    });

    expect(wrapper.find('[data-testid="remove-btn"]').exists()).toBe(true);
  });

  it('emits remove-existing when remove clicked on existing image', async () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        existingImageUrl: 'https://example.com/logo.png',
        label: 'Test Logo',
      },
    });

    await wrapper.find('[data-testid="remove-btn"]').trigger('click');

    expect(wrapper.emitted('remove-existing')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
  });

  it('validates file size', async () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        label: 'Test Logo',
        maxFileSize: 1024, // 1KB
      },
    });

    // Create a file larger than max size
    const largeFile = new File(['x'.repeat(2000)], 'large.png', { type: 'image/png' });

    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [largeFile],
      writable: false,
    });

    await input.trigger('change');

    expect(wrapper.text()).toContain('File size must be less than');
  });

  it('applies square aspect ratio', () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        label: 'Test Logo',
        aspectRatio: 'square',
      },
    });

    const uploadBox = wrapper.find('[data-testid="upload-box"]');
    expect(uploadBox.attributes('data-aspect')).toBe('square');
    expect(uploadBox.classes()).toContain('aspect-square');
  });

  it('applies wide aspect ratio', () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        label: 'Test Banner',
        aspectRatio: 'wide',
      },
    });

    const uploadBox = wrapper.find('[data-testid="upload-box"]');
    expect(uploadBox.attributes('data-aspect')).toBe('wide');
    expect(uploadBox.classes()).toContain('aspect-video');
  });

  it('disables interaction when disabled prop is true', () => {
    const wrapper = mount(SimpleImageUpload, {
      props: {
        modelValue: null,
        label: 'Test Logo',
        disabled: true,
      },
    });

    const uploadBox = wrapper.find('[data-testid="upload-box"]');
    expect(uploadBox.attributes('data-disabled')).toBe('true');
    expect(uploadBox.classes()).toContain('opacity-60');
    expect(wrapper.find('input[type="file"]').attributes('disabled')).toBeDefined();
  });
});
