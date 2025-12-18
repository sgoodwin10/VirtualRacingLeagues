/**
 * Axios Type Augmentation
 * Extends AxiosRequestConfig to include custom retry flag
 */

import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}
