import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from 'axios';
import { logger } from '@admin/utils/logger';

/**
 * Custom event for unauthorized access
 * Dispatched when a 401 response is received
 */
export const UNAUTHORIZED_EVENT = 'api:unauthorized';

/**
 * Symbol to track retry count on request config
 */
const CSRF_RETRY_COUNT = Symbol('csrfRetryCount');

/**
 * Extended Axios request config with retry tracking
 */
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  [CSRF_RETRY_COUNT]?: number;
}

/**
 * API Service with CSRF protection and authentication handling
 */
class ApiService {
  private client: AxiosInstance;
  private csrfToken: string | null = null;
  private readonly MAX_CSRF_RETRIES = 1; // Maximum number of CSRF retry attempts

  constructor() {
    this.client = axios.create({
      // Admin dashboard is served from admin.virtualracingleagues.localhost subdomain
      // API routes are at /api/* on the admin subdomain (see routes/subdomain.php line 45)
      // Note: The admin subdomain uses /api, while main domain fallback uses /api/admin
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true, // Important for cookie-based sessions
      timeout: 30000, // 30 second timeout to prevent hanging requests
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add CSRF token to requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add CSRF token for state-changing requests
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
          const token = this.getCSRFToken();
          if (token && config.headers) {
            // Laravel checks both X-CSRF-TOKEN and X-XSRF-TOKEN
            config.headers['X-CSRF-TOKEN'] = token;
            config.headers['X-XSRF-TOKEN'] = token;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - handle common errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Clear any stored auth data
          localStorage.removeItem('admin_remember');

          // Dispatch custom event for unauthorized access
          // This allows the router to handle navigation without breaking SPA state
          const event = new CustomEvent(UNAUTHORIZED_EVENT, {
            detail: {
              returnUrl:
                window.location.pathname !== '/login' ? window.location.pathname : undefined,
            },
          });
          window.dispatchEvent(event);

          logger.info('401 Unauthorized - dispatched unauthorized event');
        }

        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419) {
          const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

          if (!originalRequest) {
            return Promise.reject(error);
          }

          // Check retry count to prevent infinite loops
          const retryCount = originalRequest[CSRF_RETRY_COUNT] || 0;

          if (retryCount >= this.MAX_CSRF_RETRIES) {
            logger.error(
              `CSRF retry limit exceeded (${this.MAX_CSRF_RETRIES} attempts). Rejecting request.`,
            );
            return Promise.reject(error);
          }

          logger.warn(`CSRF token expired, refreshing and retrying (attempt ${retryCount + 1})...`);

          // Increment retry count
          originalRequest[CSRF_RETRY_COUNT] = retryCount + 1;

          // Attempt to refresh CSRF token and retry the request
          return this.fetchCSRFToken()
            .then(() => {
              logger.info('CSRF token refreshed, retrying request...');
              return this.client.request(originalRequest);
            })
            .catch((retryError) => {
              // If retry fails, log and proceed with normal error handling
              logger.error('Failed to retry after CSRF refresh:', retryError);
              return Promise.reject(error);
            });
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Get CSRF token from meta tag or cookie
   */
  private getCSRFToken(): string | null {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // Try to get from meta tag
    const metaTag = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    if (metaTag?.content) {
      this.csrfToken = metaTag.content;
      return this.csrfToken;
    }

    // Try to get from cookie
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    if (cookieValue) {
      this.csrfToken = decodeURIComponent(cookieValue);
      return this.csrfToken;
    }

    return null;
  }

  /**
   * Fetch a fresh CSRF token from the server
   * Uses the standard Laravel Sanctum CSRF cookie endpoint
   */
  async fetchCSRFToken(): Promise<void> {
    try {
      // Use Sanctum's CSRF cookie endpoint (bypasses baseURL)
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
      // Token should be in cookie now
      this.csrfToken = null; // Reset to force re-reading
    } catch (error) {
      logger.error('Failed to fetch CSRF token:', error);
    }
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the underlying Axios instance
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
