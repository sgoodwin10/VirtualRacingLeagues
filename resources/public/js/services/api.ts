import axios, { type AxiosInstance, type AxiosError } from 'axios';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for CSRF token
    this.client.interceptors.request.use((config) => {
      if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
        const token = this.getCSRFToken();
        if (token && config.headers) {
          config.headers['X-CSRF-TOKEN'] = token;
          config.headers['X-XSRF-TOKEN'] = token;
        }
      }
      return config;
    });

    // Response interceptor for errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419) {
          await this.fetchCSRFToken();
          const originalRequest = error.config;
          if (originalRequest) {
            return this.client.request(originalRequest);
          }
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // If we're on the public site and get 401, just let it bubble up
          // The auth views will handle it appropriately
          console.warn('Unauthorized - authentication required');
        }

        return Promise.reject(error);
      }
    );
  }

  private getCSRFToken(): string | null {
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find((c) => c.trim().startsWith('XSRF-TOKEN='));
    if (!xsrfCookie) return null;
    const tokenValue = xsrfCookie.split('=')[1];
    return tokenValue ? decodeURIComponent(tokenValue) : null;
  }

  async fetchCSRFToken(): Promise<void> {
    await this.client.get('/csrf-cookie');
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();
export const apiClient = apiService.getClient();
