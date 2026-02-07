export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  recaptcha_token?: string | null;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  recaptcha_token?: string | null;
}
