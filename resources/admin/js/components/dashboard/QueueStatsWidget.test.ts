import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import QueueStatsWidget from './QueueStatsWidget.vue';
import { queueService } from '@admin/services/queueService';

// Mock the queue service
vi.mock('@admin/services/queueService', () => ({
  queueService: {
    getStats: vi.fn(),
  },
}));

// Mock logger
vi.mock('@admin/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock PrimeVue components
vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="card"><slot name="title" /><slot name="content" /></div>',
  },
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag">{{ value }}</span>',
    props: ['severity', 'value', 'icon'],
  },
}));

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div class="message"><slot /><slot /></div>',
    props: ['severity', 'closable'],
  },
}));

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="progress-spinner" />',
  },
}));

describe('QueueStatsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render loading state initially', () => {
    // Arrange
    vi.mocked(queueService.getStats).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    // Act
    const wrapper = mount(QueueStatsWidget);

    // Assert
    expect(wrapper.find('.progress-spinner').exists()).toBe(true);
  });

  it('should display queue stats when loaded', async () => {
    // Arrange
    const mockStats = {
      status: 'running',
      jobsPerMinute: 12.5,
      failedJobs: 2,
      processes: 4,
      recentJobs: 150,
    };

    vi.mocked(queueService.getStats).mockResolvedValue(mockStats);

    // Act
    const wrapper = mount(QueueStatsWidget);
    await flushPromises();

    // Assert
    expect(wrapper.text()).toContain('12.5');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('4');
  });

  it('should display error message when fetch fails', async () => {
    // Arrange
    vi.mocked(queueService.getStats).mockRejectedValue(new Error('Network error'));

    // Act
    const wrapper = mount(QueueStatsWidget);
    await flushPromises();

    // Assert
    expect(wrapper.find('.message').exists()).toBe(true);
    expect(wrapper.text()).toContain('Queue monitoring unavailable');
  });

  it('should show "Running" status when queue is active', async () => {
    // Arrange
    const mockStats = {
      status: 'running',
      jobsPerMinute: 10,
      failedJobs: 0,
      processes: 2,
      recentJobs: 100,
    };

    vi.mocked(queueService.getStats).mockResolvedValue(mockStats);

    // Act
    const wrapper = mount(QueueStatsWidget);
    await flushPromises();

    // Assert
    expect(wrapper.text()).toContain('Running');
  });

  it('should show "Inactive" status when queue is stopped', async () => {
    // Arrange
    const mockStats = {
      status: 'inactive',
      jobsPerMinute: 0,
      failedJobs: 0,
      processes: 0,
      recentJobs: 0,
    };

    vi.mocked(queueService.getStats).mockResolvedValue(mockStats);

    // Act
    const wrapper = mount(QueueStatsWidget);
    await flushPromises();

    // Assert
    expect(wrapper.text()).toContain('Inactive');
  });

  it('should highlight failed jobs in red when > 0', async () => {
    // Arrange
    const mockStats = {
      status: 'running',
      jobsPerMinute: 10,
      failedJobs: 5,
      processes: 2,
      recentJobs: 100,
    };

    vi.mocked(queueService.getStats).mockResolvedValue(mockStats);

    // Act
    const wrapper = mount(QueueStatsWidget);
    await flushPromises();

    // Assert
    const failedJobsElement = wrapper.findAll('.stat-value').find((el) => el.text() === '5');
    expect(failedJobsElement?.classes()).toContain('text-red-500');
  });

  it('should include link to Horizon dashboard', async () => {
    // Arrange
    const mockStats = {
      status: 'running',
      jobsPerMinute: 10,
      failedJobs: 0,
      processes: 2,
      recentJobs: 100,
    };

    vi.mocked(queueService.getStats).mockResolvedValue(mockStats);

    // Act
    const wrapper = mount(QueueStatsWidget);
    await flushPromises();

    // Assert
    const link = wrapper.find('a[href="/admin/horizon"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });

  it('should auto-refresh stats every 30 seconds', async () => {
    // Arrange
    const mockStats = {
      status: 'running',
      jobsPerMinute: 10,
      failedJobs: 0,
      processes: 2,
      recentJobs: 100,
    };

    vi.mocked(queueService.getStats).mockResolvedValue(mockStats);

    // Act
    mount(QueueStatsWidget);
    await flushPromises();

    // Initial call
    expect(queueService.getStats).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);
    await flushPromises();

    // Assert
    expect(queueService.getStats).toHaveBeenCalledTimes(2);
  });

  it('should cleanup interval on unmount', async () => {
    // Arrange
    const mockStats = {
      status: 'running',
      jobsPerMinute: 10,
      failedJobs: 0,
      processes: 2,
      recentJobs: 100,
    };

    vi.mocked(queueService.getStats).mockResolvedValue(mockStats);

    // Act
    const wrapper = mount(QueueStatsWidget);
    await flushPromises();

    // Initial call
    expect(queueService.getStats).toHaveBeenCalledTimes(1);

    // Unmount
    wrapper.unmount();

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);
    await flushPromises();

    // Assert - should not have been called again
    expect(queueService.getStats).toHaveBeenCalledTimes(1);
  });
});
