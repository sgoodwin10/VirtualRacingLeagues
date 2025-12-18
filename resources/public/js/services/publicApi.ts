import axios, { type AxiosInstance } from 'axios';
import type {
  PublicLeague,
  Platform,
  PublicLeagueDetailResponse,
  PublicSeasonDetailResponse,
  PublicRaceResultsResponse,
  PublicDriverProfile,
} from '@public/types/public';

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Error thrown when a resource is not found (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when a network error occurs (no response from server)
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred. Please check your connection.') {
    super(message, 0);
    this.name = 'NetworkError';
  }
}

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

  /**
   * Centralized error handler for API requests
   * @param error - The error object
   * @param context - Description of the action being performed
   * @throws {NotFoundError} When resource is not found (404)
   * @throws {NetworkError} When network error occurs
   * @throws {ApiError} For other API errors
   */
  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message ?? `Failed to ${context}`;
      const statusCode = error.response?.status;

      if (statusCode === 404) {
        throw new NotFoundError(message);
      }

      if (!error.response) {
        throw new NetworkError();
      }

      throw new ApiError(message, statusCode, error);
    }

    throw new ApiError(`Unexpected error while trying to ${context}`, undefined, error);
  }

  async fetchLeagues(
    params: FetchLeaguesParams = {},
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<PublicLeague>> {
    try {
      const response = await this.client.get<{ data: PaginatedResponse<PublicLeague> }>(
        '/leagues',
        {
          params: {
            page: params.page ?? 1,
            per_page: params.per_page ?? 12,
            search: params.search ?? undefined,
            platform_id: params.platform_id ?? undefined,
          },
          signal,
        },
      );
      // Laravel's ApiResponse wraps data in a 'data' property
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'fetch leagues');
    }
  }

  async fetchPlatforms(signal?: AbortSignal): Promise<Platform[]> {
    try {
      const response = await this.client.get<{ data: Platform[] }>('/platforms', { signal });
      // Laravel's ApiResponse wraps data in a 'data' property
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'fetch platforms');
    }
  }

  async fetchLeague(slug: string, signal?: AbortSignal): Promise<PublicLeagueDetailResponse> {
    try {
      const response = await this.client.get<{ data: PublicLeagueDetailResponse }>(
        `/leagues/${slug}`,
        { signal },
      );
      // Laravel's ApiResponse wraps data in a 'data' property
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'fetch league details');
    }
  }

  async fetchSeasonDetail(
    leagueSlug: string,
    seasonSlug: string,
    signal?: AbortSignal,
  ): Promise<PublicSeasonDetailResponse> {
    try {
      const response = await this.client.get<{ data: PublicSeasonDetailResponse }>(
        `/leagues/${leagueSlug}/seasons/${seasonSlug}`,
        { signal },
      );
      // Laravel's ApiResponse wraps data in a 'data' property
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'fetch season details');
    }
  }

  async fetchRaceResults(raceId: number, signal?: AbortSignal): Promise<PublicRaceResultsResponse> {
    try {
      const response = await this.client.get<{ data: PublicRaceResultsResponse }>(
        `/races/${raceId}/results`,
        { signal },
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'fetch race results');
    }
  }

  async fetchDriverProfile(
    seasonDriverId: number,
    signal?: AbortSignal,
  ): Promise<PublicDriverProfile> {
    try {
      const response = await this.client.get<{ data: PublicDriverProfile }>(
        `/drivers/${seasonDriverId}`,
        { signal },
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'fetch driver profile');
    }
  }
}

export const publicApi = new PublicApiService();
