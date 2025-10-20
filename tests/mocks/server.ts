import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server Setup for Node.js (Vitest)
 *
 * This server intercepts HTTP requests during tests and returns mock responses.
 * Import this in your test setup file to enable API mocking globally.
 */

export const server = setupServer(...handlers);

// Establish API mocking before all tests
export function setupMockServer() {
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn', // Warn on unhandled requests instead of erroring
    });
  });

  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });
}
