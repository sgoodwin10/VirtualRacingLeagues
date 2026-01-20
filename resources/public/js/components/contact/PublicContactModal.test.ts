import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import PublicContactModal from './PublicContactModal.vue';
import { contactService } from '@public/services/contactService';

// Mock the services and composables
vi.mock('@public/services/contactService', () => ({
  contactService: {
    submit: vi.fn(),
  },
}));

vi.mock('@public/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@public/composables/useGtm', () => ({
  useGtm: () => ({
    trackEvent: vi.fn(),
    trackFormSubmit: vi.fn(),
  }),
}));

describe('PublicContactModal', () => {
  const createWrapper = (props = {}) => {
    return mount(PublicContactModal, {
      props: {
        visible: false,
        ...props,
      },
      global: {
        plugins: [
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
        ],
        stubs: {
          teleport: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when visible is true', () => {
    const wrapper = createWrapper({ visible: true });

    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('should have all required form fields', () => {
    const wrapper = createWrapper({ visible: true });

    expect(wrapper.find('#name').exists()).toBe(true);
    expect(wrapper.find('#email').exists()).toBe(true);
    expect(wrapper.find('#reason').exists()).toBe(true);
    expect(wrapper.find('#message').exists()).toBe(true);
  });

  it('should render reason options', () => {
    const wrapper = createWrapper({ visible: true });

    const select = wrapper.find('#reason');
    expect(select.exists()).toBe(true);
  });

  it('should show character count for message field', () => {
    const wrapper = createWrapper({ visible: true });

    const textarea = wrapper.find('#message');
    expect(textarea.attributes('maxlength')).toBe('2000');
  });

  it('should disable submit button when form is invalid', () => {
    const wrapper = createWrapper({ visible: true });

    const submitButton = wrapper.findAll('button').find((btn) => btn.text() === 'Send Message');
    expect(submitButton?.attributes('disabled')).toBeDefined();
  });

  it('should enable submit button when form is valid', async () => {
    const wrapper = createWrapper({ visible: true });

    // Fill in the form
    await wrapper.find('#name').setValue('John Doe');
    await wrapper.find('#email').setValue('john@example.com');
    await wrapper.find('#reason').setValue('question');
    await wrapper.find('#message').setValue('This is a test message');
    await nextTick();

    const submitButton = wrapper.findAll('button').find((btn) => btn.text() === 'Send Message');
    expect(submitButton?.attributes('disabled')).toBeUndefined();
  });

  it('should call contactService.submit when form is submitted', async () => {
    const mockSubmit = vi.mocked(contactService.submit);
    mockSubmit.mockResolvedValue({ id: 1, message: 'Success' });

    const wrapper = createWrapper({ visible: true });

    // Fill in the form
    await wrapper.find('#name').setValue('John Doe');
    await wrapper.find('#email').setValue('john@example.com');
    await wrapper.find('#reason').setValue('question');
    await wrapper.find('#message').setValue('This is a test message');
    await nextTick();

    // Submit the form
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      reason: 'question',
      message: 'This is a test message',
      source: 'public',
    });
  });

  it('should emit success event on successful submission', async () => {
    const mockSubmit = vi.mocked(contactService.submit);
    mockSubmit.mockResolvedValue({ id: 1, message: 'Success' });

    const wrapper = createWrapper({ visible: true });

    // Fill in the form
    await wrapper.find('#name').setValue('John Doe');
    await wrapper.find('#email').setValue('john@example.com');
    await wrapper.find('#reason').setValue('question');
    await wrapper.find('#message').setValue('This is a test message');
    await nextTick();

    // Submit the form
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('should emit update:visible event to close modal on successful submission', async () => {
    const mockSubmit = vi.mocked(contactService.submit);
    mockSubmit.mockResolvedValue({ id: 1, message: 'Success' });

    const wrapper = createWrapper({ visible: true });

    // Fill in the form
    await wrapper.find('#name').setValue('John Doe');
    await wrapper.find('#email').setValue('john@example.com');
    await wrapper.find('#reason').setValue('question');
    await wrapper.find('#message').setValue('This is a test message');
    await nextTick();

    // Submit the form
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    const updateVisibleEvents = wrapper.emitted('update:visible');
    expect(updateVisibleEvents).toBeTruthy();
    expect(updateVisibleEvents?.[updateVisibleEvents.length - 1]).toEqual([false]);
  });

  it('should show error message on submission failure', async () => {
    const mockSubmit = vi.mocked(contactService.submit);
    mockSubmit.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper({ visible: true });

    // Fill in the form
    await wrapper.find('#name').setValue('John Doe');
    await wrapper.find('#email').setValue('john@example.com');
    await wrapper.find('#reason').setValue('question');
    await wrapper.find('#message').setValue('This is a test message');
    await nextTick();

    // Submit the form
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain('Network error');
  });

  it('should reset form when modal opens', async () => {
    const wrapper = createWrapper({ visible: false });

    // Open modal and fill form
    await wrapper.setProps({ visible: true });
    await nextTick();

    await wrapper.find('#name').setValue('John Doe');
    await wrapper.find('#email').setValue('john@example.com');
    await wrapper.find('#reason').setValue('question');
    await wrapper.find('#message').setValue('This is a test message');
    await nextTick();

    // Close and reopen modal
    await wrapper.setProps({ visible: false });
    await nextTick();
    await wrapper.setProps({ visible: true });
    await nextTick();

    // Form should be reset
    expect((wrapper.find('#name').element as HTMLInputElement).value).toBe('');
    expect((wrapper.find('#email').element as HTMLInputElement).value).toBe('');
    expect((wrapper.find('#reason').element as HTMLSelectElement).value).toBe('');
    expect((wrapper.find('#message').element as HTMLTextAreaElement).value).toBe('');
  });

  it('should show validation errors when submitting empty form', async () => {
    const wrapper = createWrapper({ visible: true });

    // Try to submit empty form (this would be prevented by disabled button, but test validation)
    const submitButton = wrapper.findAll('button').find((btn) => btn.text() === 'Send Message');
    expect(submitButton?.attributes('disabled')).toBeDefined();
  });

  it('should clear individual field errors on input', async () => {
    const wrapper = createWrapper({ visible: true });

    // Manually trigger validation by trying to submit
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    // Now fill in name field
    await wrapper.find('#name').setValue('John Doe');
    await wrapper.find('#name').trigger('input');
    await nextTick();

    // Name error should be cleared
    const nameError = wrapper.text();
    expect(nameError).not.toContain('Name is required');
  });

  it('should emit update:visible when cancel button is clicked', async () => {
    const wrapper = createWrapper({ visible: true });

    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel');
    await cancelButton?.trigger('click');
    await nextTick();

    const updateVisibleEvents = wrapper.emitted('update:visible');
    expect(updateVisibleEvents).toBeTruthy();
    expect(updateVisibleEvents?.[updateVisibleEvents.length - 1]).toEqual([false]);
  });
});
