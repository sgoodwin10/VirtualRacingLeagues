import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from 'axios';
import { logger } from '@admin/utils/logger';

/**
 * API Service with CSRF protection and authentication handling
 */
class ApiService {
  private client: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.client = axios.create({
      // Admin dashboard is served from admin.generictemplate.localhost subdomain
      // API routes are at /api/* on the admin subdomain (see routes/subdomain.php line 24)
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true, // Important for cookie-based sessions
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
      }
    );

    // Response interceptor - handle common errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Clear any stored auth data
          localStorage.removeItem('admin_remember');

          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            // Ensure we're on the admin subdomain
            if (!window.location.hostname.includes('admin.')) {
              window.location.href = 'http://admin.generictemplate.localhost/login';
            } else {
              window.location.href = '/login';
            }
          }
        }

        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419) {
          logger.warn('CSRF token expired, refreshing and retrying...');

          // Attempt to refresh CSRF token and retry the request
          return this.fetchCSRFToken()
            .then(() => {
              // Retry the original request with the fresh token
              const originalRequest = error.config;
              if (originalRequest) {
                logger.info('CSRF token refreshed, retrying request...');
                return this.client.request(originalRequest);
              }
              return Promise.reject(error);
            })
            .catch((retryError) => {
              // If retry fails, log and proceed with normal error handling
              logger.error('Failed to retry after CSRF refresh:', retryError);
              return Promise.reject(error);
            });
        }

        return Promise.reject(error);
      }
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
   */
  async fetchCSRFToken(): Promise<void> {
    try {
      await this.client.get('/csrf-cookie');
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
