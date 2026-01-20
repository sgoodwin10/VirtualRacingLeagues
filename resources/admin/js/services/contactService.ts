import { apiService } from './api';
import type {
  Contact,
  ContactFilterParams,
  ContactDetailResponse,
  ContactUpdateResponse,
} from '@admin/types/contact';
import type { PaginatedResponse, ApiResponse } from '@admin/types/api';
import { handleServiceError } from '@admin/utils/errorHandler';
import { transformPaginatedResponse, type BackendPaginatedResponse } from '@admin/utils/pagination';

/**
 * Contact Service
 * Handles contact submission management operations
 */
class ContactService {
  /**
   * Get all contact submissions with pagination
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<PaginatedResponse<Contact>>
   */
  async getAll(
    params?: ContactFilterParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<Contact>> {
    try {
      // Build query params
      const queryParams: Record<string, string> = {};
      if (params?.page) queryParams.page = String(params.page);
      if (params?.per_page) queryParams.per_page = String(params.per_page);
      if (params?.status) queryParams.status = params.status;
      if (params?.source) queryParams.source = params.source;
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;
      if (params?.search) queryParams.search = params.search;

      // Backend returns: { success: true, data: [...contacts], meta: {...pagination} }
      const response = await apiService.get<BackendPaginatedResponse<Contact>>('/contacts', {
        params: queryParams,
        signal,
      });

      // Transform backend response using utility function
      return transformPaginatedResponse(response);
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get a single contact by ID
   * @param id - Contact ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Contact>
   */
  async getById(id: number, signal?: AbortSignal): Promise<Contact> {
    try {
      const response = await apiService.get<ContactDetailResponse>(`/contacts/${id}`, {
        signal,
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch contact');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Mark a contact as read
   * @param id - Contact ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Contact>
   */
  async markRead(id: number, signal?: AbortSignal): Promise<Contact> {
    try {
      const response = await apiService.patch<ContactUpdateResponse>(
        `/contacts/${id}/read`,
        {},
        { signal },
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to mark contact as read');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Mark a contact as responded
   * @param id - Contact ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Contact>
   */
  async markResponded(id: number, signal?: AbortSignal): Promise<Contact> {
    try {
      const response = await apiService.patch<ContactUpdateResponse>(
        `/contacts/${id}/responded`,
        {},
        { signal },
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to mark contact as responded');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Archive a contact
   * @param id - Contact ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async archive(id: number, signal?: AbortSignal): Promise<void> {
    try {
      await apiService.patch<ApiResponse<null>>(`/contacts/${id}/archive`, {}, { signal });
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export singleton instance
export const contactService = new ContactService();
export default contactService;
