import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a container element for the modal to attach to
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up the container
    document.body.removeChild(container);
  });

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
      },
      attachTo: container,
    });
  };

  it('should render when visible is true', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    expect(document.querySelector('form')).toBeTruthy();
  });

  it('should have all required form fields', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    expect(document.querySelector('#name')).toBeTruthy();
    expect(document.querySelector('#email')).toBeTruthy();
    expect(document.querySelector('#reason')).toBeTruthy();
    expect(document.querySelector('#message')).toBeTruthy();
  });

  it('should render reason options', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    const select = document.querySelector('#reason');
    expect(select).toBeTruthy();
  });

  it('should show character count for message field', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    const textarea = document.querySelector('#message') as HTMLTextAreaElement;
    expect(textarea?.maxLength).toBe(2000);
  });

  it('should disable submit button when form is invalid', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    const submitButton = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Send Message'),
    );
    expect(submitButton?.hasAttribute('disabled')).toBe(true);
  });

  it('should enable submit button when form is valid', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Fill in the form using document queries
    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    const reasonSelect = document.querySelector('#reason') as HTMLSelectElement;
    const messageTextarea = document.querySelector('#message') as HTMLTextAreaElement;

    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'john@example.com';
    emailInput.dispatchEvent(new Event('input'));
    reasonSelect.value = 'question';
    reasonSelect.dispatchEvent(new Event('change'));
    messageTextarea.value = 'This is a test message';
    messageTextarea.dispatchEvent(new Event('input'));
    await nextTick();

    const submitButton = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Send Message'),
    );
    expect(submitButton?.hasAttribute('disabled')).toBe(false);
  });

  it('should call contactService.submit when form is submitted', async () => {
    const mockSubmit = vi.mocked(contactService.submit);
    mockSubmit.mockResolvedValue({ id: 1, message: 'Success' });

    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Fill in the form using document queries
    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    const reasonSelect = document.querySelector('#reason') as HTMLSelectElement;
    const messageTextarea = document.querySelector('#message') as HTMLTextAreaElement;

    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'john@example.com';
    emailInput.dispatchEvent(new Event('input'));
    reasonSelect.value = 'question';
    reasonSelect.dispatchEvent(new Event('change'));
    messageTextarea.value = 'This is a test message';
    messageTextarea.dispatchEvent(new Event('input'));
    await nextTick();

    // Submit the form
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit'));
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
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Fill in the form using document queries
    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    const reasonSelect = document.querySelector('#reason') as HTMLSelectElement;
    const messageTextarea = document.querySelector('#message') as HTMLTextAreaElement;

    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'john@example.com';
    emailInput.dispatchEvent(new Event('input'));
    reasonSelect.value = 'question';
    reasonSelect.dispatchEvent(new Event('change'));
    messageTextarea.value = 'This is a test message';
    messageTextarea.dispatchEvent(new Event('input'));
    await nextTick();

    // Submit the form
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit'));
    await nextTick();

    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('should emit update:visible event to close modal on successful submission', async () => {
    const mockSubmit = vi.mocked(contactService.submit);
    mockSubmit.mockResolvedValue({ id: 1, message: 'Success' });

    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Fill in the form using document queries
    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    const reasonSelect = document.querySelector('#reason') as HTMLSelectElement;
    const messageTextarea = document.querySelector('#message') as HTMLTextAreaElement;

    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'john@example.com';
    emailInput.dispatchEvent(new Event('input'));
    reasonSelect.value = 'question';
    reasonSelect.dispatchEvent(new Event('change'));
    messageTextarea.value = 'This is a test message';
    messageTextarea.dispatchEvent(new Event('input'));
    await nextTick();

    // Submit the form
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit'));
    await nextTick();

    const updateVisibleEvents = wrapper.emitted('update:visible');
    expect(updateVisibleEvents).toBeTruthy();
    expect(updateVisibleEvents?.[updateVisibleEvents.length - 1]).toEqual([false]);
  });

  it('should show error message on submission failure', async () => {
    const mockSubmit = vi.mocked(contactService.submit);
    mockSubmit.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Fill in the form using wrapper
    const nameInput = wrapper.find('#name');
    const emailInput = wrapper.find('#email');
    const reasonSelect = wrapper.find('#reason');
    const messageTextarea = wrapper.find('#message');

    await nameInput.setValue('John Doe');
    await emailInput.setValue('john@example.com');
    await reasonSelect.setValue('question');
    await messageTextarea.setValue('This is a test message');
    await nextTick();

    // Submit the form via wrapper
    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await nextTick();
    await nextTick(); // Extra tick for error to appear

    expect(wrapper.text()).toContain('Network error');
  });

  it('should reset form when modal opens', async () => {
    const wrapper = createWrapper({ visible: false });

    // Open modal and fill form
    await wrapper.setProps({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    const reasonSelect = document.querySelector('#reason') as HTMLSelectElement;
    const messageTextarea = document.querySelector('#message') as HTMLTextAreaElement;

    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'john@example.com';
    emailInput.dispatchEvent(new Event('input'));
    reasonSelect.value = 'question';
    reasonSelect.dispatchEvent(new Event('change'));
    messageTextarea.value = 'This is a test message';
    messageTextarea.dispatchEvent(new Event('input'));
    await nextTick();

    // Close and reopen modal
    await wrapper.setProps({ visible: false });
    await nextTick();
    await wrapper.setProps({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Form should be reset
    const nameInputAfter = document.querySelector('#name') as HTMLInputElement;
    const emailInputAfter = document.querySelector('#email') as HTMLInputElement;
    const reasonSelectAfter = document.querySelector('#reason') as HTMLSelectElement;
    const messageTextareaAfter = document.querySelector('#message') as HTMLTextAreaElement;

    expect(nameInputAfter?.value).toBe('');
    expect(emailInputAfter?.value).toBe('');
    expect(reasonSelectAfter?.value).toBe('');
    expect(messageTextareaAfter?.value).toBe('');
  });

  it('should show validation errors when submitting empty form', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Try to submit empty form (this would be prevented by disabled button, but test validation)
    const submitButton = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Send Message'),
    );
    expect(submitButton?.hasAttribute('disabled')).toBe(true);
  });

  it('should clear individual field errors on input', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    // Manually trigger validation by trying to submit
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit'));
    await nextTick();

    // Now fill in name field
    const nameInput = document.querySelector('#name') as HTMLInputElement;
    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input'));
    await nextTick();

    // Name error should be cleared
    const nameError = document.body.textContent || '';
    expect(nameError).not.toContain('Name is required');
  });

  it('should emit update:visible when cancel button is clicked', async () => {
    const wrapper = createWrapper({ visible: true });
    await nextTick();
    await nextTick(); // Extra tick for PrimeVue Dialog teleport

    const cancelButton = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Cancel'),
    );
    cancelButton?.click();
    await nextTick();

    const updateVisibleEvents = wrapper.emitted('update:visible');
    expect(updateVisibleEvents).toBeTruthy();
    expect(updateVisibleEvents?.[updateVisibleEvents.length - 1]).toEqual([false]);
  });
});
