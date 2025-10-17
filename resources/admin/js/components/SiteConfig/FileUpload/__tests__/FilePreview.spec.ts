import { describe, it, expect, vi, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import FilePreview from '../FilePreview.vue';
import type { SiteConfigFile } from '@admin/types/siteConfig';

// Mock URL.createObjectURL
beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

describe('FilePreview', () => {
  const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

  const mockSiteConfigFile: SiteConfigFile = {
    id: 1,
    file_name: 'test.png',
    file_size: 1024,
    mime_type: 'image/png',
    url: 'http://example.com/uploads/test.png',
  };

  it('renders without errors', () => {
    const wrapper = mount(FilePreview, {
      props: {
        file: mockFile,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders image preview', () => {
    const wrapper = mount(FilePreview, {
      props: {
        file: mockSiteConfigFile,
      },
    });

    expect(wrapper.find('img').exists()).toBe(true);
  });

  it('displays file name', () => {
    const wrapper = mount(FilePreview, {
      props: {
        file: mockSiteConfigFile,
      },
    });

    expect(wrapper.text()).toContain('test.png');
  });

  it('displays file size', () => {
    const wrapper = mount(FilePreview, {
      props: {
        file: mockSiteConfigFile,
      },
    });

    expect(wrapper.text()).toContain('KB');
  });

  it('shows remove button when not readonly', () => {
    const wrapper = mount(FilePreview, {
      props: {
        file: mockSiteConfigFile,
        readonly: false,
      },
    });

    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('hides remove button when readonly', () => {
    const wrapper = mount(FilePreview, {
      props: {
        file: mockSiteConfigFile,
        readonly: true,
      },
    });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits remove event when remove button clicked', async () => {
    const wrapper = mount(FilePreview, {
      props: {
        file: mockSiteConfigFile,
      },
    });

    const vm = wrapper.vm as any;
    vm.handleRemove();

    expect(wrapper.emitted('remove')).toBeTruthy();
  });
});
