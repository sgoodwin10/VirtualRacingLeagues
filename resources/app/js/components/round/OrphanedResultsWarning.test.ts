import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import OrphanedResultsWarning from './OrphanedResultsWarning.vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import * as raceService from '@app/services/raceService';

const mockToastAdd = vi.fn();

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockToastAdd,
  }),
}));

vi.mock('@app/services/raceService', () => ({
  deleteOrphanedResults: vi.fn(),
  getOrphanedResults: vi.fn(),
}));

describe('OrphanedResultsWarning', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = (props: {
    hasOrphanedResults?: boolean;
    isCompleted: boolean;
    isQualifying?: boolean;
    raceId: number;
  }) => {
    return mount(OrphanedResultsWarning, {
      props,
      global: {
        plugins: [PrimeVue, ToastService],
        directives: {
          tooltip: Tooltip,
        },
        stubs: {
          Tag: {
            template:
              '<span @click="$emit(\'click\')" class="test-tag"><slot>{{ value }}</slot></span>',
            props: ['value', 'severity', 'icon'],
          },
          Dialog: {
            template:
              '<div v-if="visible" class="test-dialog"><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>',
            props: ['visible', 'modal', 'style'],
          },
          Button: {
            template:
              '<button @click="$emit(\'click\')" :disabled="disabled || loading" class="test-button">{{ label }}</button>',
            props: ['label', 'severity', 'outlined', 'loading', 'disabled'],
          },
          Message: {
            template: '<div class="test-message"><slot></slot></div>',
            props: ['severity', 'closable'],
          },
        },
      },
    });
  };

  it('does not render when hasOrphanedResults is false', () => {
    wrapper = mountComponent({
      hasOrphanedResults: false,
      isCompleted: true,
      raceId: 1,
    });

    expect(wrapper.find('.test-tag').exists()).toBe(false);
  });

  it('does not render when hasOrphanedResults is undefined', () => {
    wrapper = mountComponent({
      isCompleted: true,
      raceId: 1,
    });

    expect(wrapper.find('.test-tag').exists()).toBe(false);
  });

  it('does not render when isCompleted is false', () => {
    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: false,
      raceId: 1,
    });

    expect(wrapper.find('.test-tag').exists()).toBe(false);
  });

  it('renders warning tag when both hasOrphanedResults and isCompleted are true', () => {
    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain('Orphaned Results');
  });

  it('has correct styling and appearance when rendered', () => {
    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain('Orphaned Results');
  });

  it('opens dialog when tag is clicked', async () => {
    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    expect(tag.exists()).toBe(true);

    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.test-dialog').exists()).toBe(true);
  });

  it('displays correct event type in description for race', async () => {
    vi.mocked(raceService.getOrphanedResults).mockResolvedValue({
      drivers: [],
      count: 0,
    });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('This race has results for drivers');
  });

  it('displays correct event type in description for qualifying', async () => {
    vi.mocked(raceService.getOrphanedResults).mockResolvedValue({
      drivers: [],
      count: 0,
    });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: true,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('This qualifying session has results for drivers');
  });

  it('successfully removes orphaned results', async () => {
    const mockDeleteOrphanedResults = vi
      .mocked(raceService.deleteOrphanedResults)
      .mockResolvedValue({ message: '5 orphaned results removed' });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('.test-button');
    const removeButton = buttons.find((btn) => btn.text() === 'Remove Orphans');
    expect(removeButton).toBeDefined();

    await removeButton!.trigger('click');

    // Wait for promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(mockDeleteOrphanedResults).toHaveBeenCalledWith(1);
    expect(mockToastAdd).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Orphans Removed',
      detail: '5 orphaned results removed',
      life: 3000,
    });
    expect(wrapper.emitted('orphans-removed')).toBeTruthy();
  });

  it('handles error when removing orphaned results', async () => {
    const mockDeleteOrphanedResults = vi
      .mocked(raceService.deleteOrphanedResults)
      .mockRejectedValue(new Error('API error'));

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('.test-button');
    const removeButton = buttons.find((btn) => btn.text() === 'Remove Orphans');

    await removeButton!.trigger('click');

    // Wait for promise to reject
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(mockDeleteOrphanedResults).toHaveBeenCalledWith(1);
    expect(mockToastAdd).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'API error',
      life: 5000,
    });
    expect(wrapper.emitted('orphans-removed')).toBeUndefined();
  });

  it('closes dialog when close button is clicked', async () => {
    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.test-dialog').exists()).toBe(true);

    const buttons = wrapper.findAll('.test-button');
    const closeButton = buttons.find((btn) => btn.text() === 'Close');
    await closeButton!.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.test-dialog').exists()).toBe(false);
  });

  it('fetches and displays orphaned drivers when dialog opens', async () => {
    const mockGetOrphanedResults = vi.mocked(raceService.getOrphanedResults).mockResolvedValue({
      drivers: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Bob Wilson' },
      ],
      count: 3,
    });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(mockGetOrphanedResults).toHaveBeenCalledWith(1);
    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('John Doe');
    expect(dialog.text()).toContain('Jane Smith');
    expect(dialog.text()).toContain('Bob Wilson');
    expect(dialog.text()).toContain('3');
    expect(dialog.text()).toContain('drivers without division assignment');
  });

  it('displays loading state while fetching orphaned drivers', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(raceService.getOrphanedResults).mockReturnValue(promise as any);

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('Loading drivers');

    // Resolve the promise
    resolvePromise!({ drivers: [], count: 0 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();
  });

  it('displays error message when fetching orphaned drivers fails', async () => {
    const mockGetOrphanedResults = vi
      .mocked(raceService.getOrphanedResults)
      .mockRejectedValue(new Error('Network error'));

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to fail
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(mockGetOrphanedResults).toHaveBeenCalledWith(1);
    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('Network error');
  });

  it('displays correct singular/plural text for driver count', async () => {
    vi.mocked(raceService.getOrphanedResults).mockResolvedValue({
      drivers: [{ id: 1, name: 'John Doe' }],
      count: 1,
    });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('1');
    expect(dialog.text()).toContain('driver without division assignment');
    expect(dialog.text()).not.toContain('drivers without division assignment');
  });

  it('displays message when no orphaned drivers are found', async () => {
    const mockGetOrphanedResults = vi.mocked(raceService.getOrphanedResults).mockResolvedValue({
      drivers: [],
      count: 0,
    });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(mockGetOrphanedResults).toHaveBeenCalledWith(1);
    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('No orphaned drivers found');
  });

  it('resets driver state when dialog is closed', async () => {
    const mockGetOrphanedResults = vi.mocked(raceService.getOrphanedResults).mockResolvedValue({
      drivers: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ],
      count: 2,
    });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 1,
    });

    // Open dialog
    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.test-dialog').text()).toContain('John Doe');

    // Close dialog
    const buttons = wrapper.findAll('.test-button');
    const closeButton = buttons.find((btn) => btn.text() === 'Close');
    await closeButton!.trigger('click');
    await wrapper.vm.$nextTick();

    // Reopen dialog - should fetch drivers again
    mockGetOrphanedResults.mockClear();
    mockGetOrphanedResults.mockResolvedValue({
      drivers: [{ id: 3, name: 'New Driver' }],
      count: 1,
    });

    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(mockGetOrphanedResults).toHaveBeenCalledTimes(1);
  });

  it('displays "Affected Drivers" heading instead of race ID', async () => {
    vi.mocked(raceService.getOrphanedResults).mockResolvedValue({
      drivers: [{ id: 1, name: 'John Doe' }],
      count: 1,
    });

    wrapper = mountComponent({
      hasOrphanedResults: true,
      isCompleted: true,
      isQualifying: false,
      raceId: 123,
    });

    const tag = wrapper.find('.test-tag');
    await tag.trigger('click');
    await wrapper.vm.$nextTick();

    // Wait for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('.test-dialog');
    expect(dialog.text()).toContain('Affected Drivers');
    expect(dialog.text()).not.toContain('Affected Race');
    expect(dialog.text()).not.toContain('ID: 123');
  });
});
