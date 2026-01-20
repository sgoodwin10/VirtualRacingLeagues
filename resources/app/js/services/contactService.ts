/**
 * Contact API Service
 * Handles all HTTP requests related to contact form submissions
 */

import { apiClient } from './api';

export interface ContactFormData {
  name: string;
  email: string;
  reason: string;
  message: string;
  ccUser?: boolean;
  source: 'app' | 'public';
}

export interface ContactResponse {
  id: number;
  message: string;
}

/**
 * Submit a contact form
 * @param data - Contact form data
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function submit(
  data: ContactFormData,
  signal?: AbortSignal,
): Promise<ContactResponse> {
  const response = await apiClient.post<{ data: ContactResponse }>(
    '/contact',
    {
      name: data.name,
      email: data.email,
      reason: data.reason,
      message: data.message,
      cc_user: data.ccUser ?? false,
      source: data.source,
    },
    { signal },
  );
  return response.data.data;
}

/**
 * Grouped export for convenient importing
 */
export const contactService = {
  submit,
};
