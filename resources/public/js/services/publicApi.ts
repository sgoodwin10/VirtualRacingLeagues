import axios, { type AxiosInstance } from 'axios';
import type { PublicLeague, Platform } from '@public/types/public';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface FetchLeaguesParams {
  page?: number;
  per_page?: number;
  search?: string;
  platform_id?: number;
}

class PublicApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/public',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  async fetchLeagues(params: FetchLeaguesParams = {}): Promise<PaginatedResponse<PublicLeague>> {
    try {
      const response = await this.client.get<{ data: PaginatedResponse<PublicLeague> }>(
        '/leagues',
        {
          params: {
            page: params.page ?? 1,
            per_page: params.per_page ?? 12,
            search: params.search || undefined,
            platform_id: params.platform_id || undefined,
          },
        },
      );
      // Laravel's ApiResponse wraps data in a 'data' property
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch leagues';
        throw new Error(message);
      }
      throw error;
    }
  }

  async fetchPlatforms(): Promise<Platform[]> {
    try {
      const response = await this.client.get<{ data: Platform[] }>('/platforms');
      // Laravel's ApiResponse wraps data in a 'data' property
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch platforms';
        throw new Error(message);
      }
      throw error;
    }
  }
}

export const publicApi = new PublicApiService();
