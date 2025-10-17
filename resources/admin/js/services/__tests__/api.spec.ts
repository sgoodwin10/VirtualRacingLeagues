import { describe, it, expect, beforeEach } from 'vitest';
import { apiService } from '../api';

describe('apiService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
  });

  it('should be defined', () => {
    expect(apiService).toBeDefined();
  });

  it('should have get method', () => {
    expect(typeof apiService.get).toBe('function');
  });

  it('should have post method', () => {
    expect(typeof apiService.post).toBe('function');
  });

  it('should have put method', () => {
    expect(typeof apiService.put).toBe('function');
  });

  it('should have patch method', () => {
    expect(typeof apiService.patch).toBe('function');
  });

  it('should have delete method', () => {
    expect(typeof apiService.delete).toBe('function');
  });

  it('should have fetchCSRFToken method', () => {
    expect(typeof apiService.fetchCSRFToken).toBe('function');
  });

  it('should have getClient method', () => {
    expect(typeof apiService.getClient).toBe('function');
  });

  it('should return axios client instance', () => {
    const client = apiService.getClient();
    expect(client).toBeDefined();
    expect(client.defaults.baseURL).toBe('/api');
  });
});
