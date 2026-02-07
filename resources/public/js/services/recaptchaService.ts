import { apiClient } from '@public/services/api';

export interface RecaptchaConfig {
  enabled: boolean;
  siteKey: string | null;
}

export const recaptchaService = {
  async getConfig(): Promise<RecaptchaConfig> {
    const response = await apiClient.get<{ data: RecaptchaConfig }>('/recaptcha-config');
    return response.data.data;
  },
};
