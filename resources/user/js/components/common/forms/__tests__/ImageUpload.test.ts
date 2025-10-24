import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountWithStubs } from '@user/__tests__/setup';
import ImageUpload from '../ImageUpload.vue';

// Stub custom form components
const FormLabelStub = {
  name: 'FormLabel',
  props: ['text', 'required'],
  template:
    '<label><span>{{ text }}</span><span v-if="required" class="text-red-500">*</span></label>',
};

const FormErrorStub = {
  name: 'FormError',
  props: ['error'],
  template: '<div v-if="error" class="form-error text-red-500">{{ error }}</div>',
};

const FormHelperStub = {
  name: 'FormHelper',
  props: ['text'],
  template: '<div v-if="text" class="form-helper">{{ text }}</div>',
};

describe('ImageUpload', () => {
  const commonStubs = {
    FormLabel: FormLabelStub,
    FormError: FormErrorStub,
    FormHelper: FormHelperStub,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('displays file size information', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        maxFileSize: 2000000, // 2MB
      },
      global: {
        stubs: commonStubs,
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
      global: {
        stubs: commonStubs,
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

  it('shows optional indicator when required is false', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        labelText: 'Upload Logo',
        required: false,
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();

    expect(wrapper.text()).toContain('(optional)');
  });

  it('emits update:modelValue when valid file is selected', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
      global: {
        stubs: commonStubs,
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
      global: {
        stubs: commonStubs,
      },
    });

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });

    await fileUpload.vm.$emit('select', { files: [mockFile] });
    await nextTick();

    expect(wrapper.text()).toContain('Please select a valid image file');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('adds invalid class when error exists', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        error: 'Logo is required',
      },
      global: {
        stubs: commonStubs,
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

  it('handles array of files from select event', async () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
      global: {
        stubs: commonStubs,
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
      global: {
        stubs: commonStubs,
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
      global: {
        stubs: commonStubs,
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
      global: {
        stubs: commonStubs,
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
      global: {
        stubs: commonStubs,
      },
    });

    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });
    expect(fileUpload.props('accept')).toBe('image/*');
  });

  it('displays helper text when provided', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        helperText: 'A square logo that represents your league',
      },
      global: {
        stubs: commonStubs,
      },
    });

    expect(wrapper.text()).toContain('A square logo that represents your league');
  });

  it('does not show optional indicator when required is true', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
        labelText: 'Upload Logo',
        required: true,
      },
      global: {
        stubs: commonStubs,
      },
    });

    expect(wrapper.text()).not.toContain('(optional)');
  });
});
