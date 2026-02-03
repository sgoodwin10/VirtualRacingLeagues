import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contactService, type ContactFormData, type ContactResponse } from './contactService';
import { apiClient } from './api';

// Mock dependencies
vi.mock('./api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('contactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submit', () => {
    const formData: ContactFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      reason: 'general',
      message: 'This is a test message',
      source: 'public',
    };

    const mockResponse: ContactResponse = {
      id: 1,
      message: 'Your message has been received',
    };

    it('should call contact endpoint with all form data', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      await contactService.submit(formData);

      expect(apiClient.post).toHaveBeenCalledWith('/contact', {
        name: formData.name,
        email: formData.email,
        reason: formData.reason,
        message: formData.message,
        source: formData.source,
      });
    });

    it('should return response data', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      const result = await contactService.submit(formData);

      expect(result).toEqual(mockResponse);
    });

    it('should include all required fields', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      await contactService.submit(formData);

      const callArgs = vi.mocked(apiClient.post).mock.calls[0]?.[1];
      expect(callArgs).toHaveProperty('name');
      expect(callArgs).toHaveProperty('email');
      expect(callArgs).toHaveProperty('reason');
      expect(callArgs).toHaveProperty('message');
      expect(callArgs).toHaveProperty('source');
    });

    it('should always set source to public', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      await contactService.submit(formData);

      const callArgs = vi.mocked(apiClient.post).mock.calls[0]?.[1] as ContactFormData;
      expect(callArgs?.source).toBe('public');
    });

    it('should handle different reasons', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      const reasons = ['general', 'support', 'feedback', 'bug'];

      for (const reason of reasons) {
        const data = { ...formData, reason };
        await contactService.submit(data);

        const callArgs = vi.mocked(apiClient.post).mock.calls[
          vi.mocked(apiClient.post).mock.calls.length - 1
        ]?.[1] as ContactFormData;
        expect(callArgs?.reason).toBe(reason);
      }
    });

    it('should handle validation errors (422)', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email field is required'],
              message: ['The message must be at least 10 characters'],
            },
          },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(contactService.submit(formData)).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(contactService.submit(formData)).rejects.toEqual(error);
    });

    it('should handle server errors (500)', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(contactService.submit(formData)).rejects.toEqual(error);
    });

    it('should handle rate limiting (429)', async () => {
      const error = {
        response: {
          status: 429,
          data: { message: 'Too many requests. Please try again later.' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(contactService.submit(formData)).rejects.toEqual(error);
    });

    it('should transform data correctly', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      const inputData: ContactFormData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        reason: 'support',
        message: 'Help me please',
        source: 'public',
      };

      await contactService.submit(inputData);

      expect(apiClient.post).toHaveBeenCalledWith('/contact', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        reason: 'support',
        message: 'Help me please',
        source: 'public',
      });
    });

    it('should handle long messages', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      const longMessage = 'A'.repeat(5000);
      const data = { ...formData, message: longMessage };

      await contactService.submit(data);

      const callArgs = vi.mocked(apiClient.post).mock.calls[0]?.[1] as ContactFormData;
      expect(callArgs?.message).toBe(longMessage);
    });

    it('should handle special characters in message', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      const specialMessage = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      const data = { ...formData, message: specialMessage };

      await contactService.submit(data);

      const callArgs = vi.mocked(apiClient.post).mock.calls[0]?.[1] as ContactFormData;
      expect(callArgs?.message).toBe(specialMessage);
    });

    it('should handle unicode characters', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      const unicodeData: ContactFormData = {
        name: 'José García',
        email: 'jose@example.com',
        reason: 'general',
        message: '你好世界 🌍 Olá',
        source: 'public',
      };

      await contactService.submit(unicodeData);

      const callArgs = vi.mocked(apiClient.post).mock.calls[0]?.[1] as ContactFormData;
      expect(callArgs?.name).toBe('José García');
      expect(callArgs?.message).toBe('你好世界 🌍 Olá');
    });
  });
});
