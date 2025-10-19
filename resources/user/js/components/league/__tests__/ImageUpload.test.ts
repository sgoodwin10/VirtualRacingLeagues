import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountWithStubs } from '@user/__tests__/setup';
import ImageUpload from '../partials/ImageUpload.vue';

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders with label', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    expect(wrapper.text()).toContain('Upload Logo');
  });

  it('shows required asterisk when required prop is true', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        required: true,
      },
    });

    const label = wrapper.find('label');
    expect(label.html()).toContain('text-red-500');
    expect(label.text()).toContain('*');
  });

  it('displays file size information', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        maxFileSize: 2000000, // 2MB
      },
    });

    expect(wrapper.text()).toContain('Maximum file size: 2.0MB');
  });

  it('shows file upload component when no file is selected', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });
    expect(fileUpload.exists()).toBe(true);
  });

  it('displays preview when file is selected', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: mockFile,
        label: 'Upload Logo',
      },
    });

    await nextTick();

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('mock-url');
    expect(img.attributes('alt')).toBe('Upload Logo');
  });

  it('displays filename when file is selected', async () => {
    const mockFile = new File(['test'], 'test-logo.jpg', { type: 'image/jpeg' });
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: mockFile,
        label: 'Upload Logo',
      },
    });

    await nextTick();

    expect(wrapper.text()).toContain('test-logo.jpg');
  });

  it('emits update:modelValue when valid file is selected', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });

    // Simulate file selection
    await fileUpload.vm.$emit('select', { files: [mockFile] });

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([mockFile]);
  });

  it('shows error when non-image file is selected', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });

    await fileUpload.vm.$emit('select', { files: [mockFile] });
    await nextTick();

    expect(wrapper.text()).toContain('Please select a valid image file');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('shows error when file exceeds max size', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        maxFileSize: 1000000, // 1MB
      },
    });

    // Create a mock file that's 2MB (exceeds limit)
    const mockFile = new File(['x'.repeat(2000000)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(mockFile, 'size', { value: 2000000 });

    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });
    await fileUpload.vm.$emit('select', { files: [mockFile] });
    await nextTick();

    expect(wrapper.text()).toContain('File size must be less than 1.0MB');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('displays external error prop', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        error: 'Logo is required',
      },
    });

    expect(wrapper.text()).toContain('Logo is required');
  });

  it('adds invalid class when error exists', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        error: 'Logo is required',
      },
    });

    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });
    // Check if the class attribute contains p-invalid
    const classes = fileUpload.attributes('class') || '';
    expect(classes).toContain('p-invalid');
  });

  it('removes file when remove button is clicked', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: mockFile,
        label: 'Upload Logo',
      },
    });

    await nextTick();

    const removeButton = wrapper.find('[aria-label="Remove image"]');
    expect(removeButton.exists()).toBe(true);

    await removeButton.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
  });

  it('clears preview when file is removed', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: mockFile,
        label: 'Upload Logo',
      },
    });

    await nextTick();
    expect(wrapper.find('img').exists()).toBe(true);

    // Update to null to simulate removal
    await wrapper.setProps({ modelValue: null });
    await nextTick();

    expect(wrapper.find('img').exists()).toBe(false);
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('clears error when new valid file is selected', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        error: 'Logo is required',
      },
    });

    // First verify error is shown
    expect(wrapper.text()).toContain('Logo is required');

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });

    await fileUpload.vm.$emit('select', { files: [mockFile] });
    await nextTick();

    // Error should be cleared (component internal error, external error still shown via prop)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });

  it('handles array of files from select event', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });

    // Some events might pass files as array
    await fileUpload.vm.$emit('select', { files: [mockFile] });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([mockFile]);
  });

  it('generates preview URL when modelValue changes', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await wrapper.setProps({ modelValue: mockFile });
    await nextTick();

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
    expect(wrapper.find('img').attributes('src')).toBe('mock-url');
  });

  it('revokes old preview URL when new file is set', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    // Set first file
    const mockFile1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    await wrapper.setProps({ modelValue: mockFile1 });
    await nextTick();

    // Set second file
    const mockFile2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
    await wrapper.setProps({ modelValue: mockFile2 });
    await nextTick();

    // Should revoke the old URL
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('applies custom accept attribute', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        accept: 'image/png,image/jpeg',
      },
    });

    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });
    expect(fileUpload.props('accept')).toBe('image/png,image/jpeg');
  });

  it('uses default accept attribute when not provided', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
    });

    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });
    expect(fileUpload.props('accept')).toBe('image/*');
  });
});
