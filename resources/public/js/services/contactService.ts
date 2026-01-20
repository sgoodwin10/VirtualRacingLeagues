import { apiClient } from '@public/services/api';

export interface ContactFormData {
  name: string;
  email: string;
  reason: string;
  message: string;
  source: 'public';
}

export interface ContactResponse {
  id: number;
  message: string;
}

/**
 * Service for handling contact form submissions
 */
export const contactService = {
  /**
   * Submit a contact form
   */
  async submit(data: ContactFormData): Promise<ContactResponse> {
    const response = await apiClient.post<ContactResponse>('/contact', {
      name: data.name,
      email: data.email,
      reason: data.reason,
      message: data.message,
      source: data.source,
    });
    return response.data;
  },
};
