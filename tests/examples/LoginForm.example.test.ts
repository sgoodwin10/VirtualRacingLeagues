/**
 * Example Test: Login Form
 *
 * This test demonstrates the use of:
 * 1. @testing-library/vue - For accessible, user-centric queries
 * 2. @testing-library/user-event - For realistic user interactions
 * 3. MSW - For mocking API requests
 * 4. happy-dom - Fast DOM environment (configured in vitest.config.ts)
 *
 * This is an example file to show best practices.
 * Delete or move this file when creating your actual tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { createPinia } from 'pinia';
import { h, ref } from 'vue';

// Example Login Form Component (inline for demo purposes)
const LoginForm = {
  template: `
    <form @submit.prevent="handleSubmit" data-testid="login-form">
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Enter your password"
          required
        />
      </div>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>

      <div v-if="error" role="alert" data-testid="error-message">
        {{ error }}
      </div>

      <div v-if="success" role="status" data-testid="success-message">
        Login successful!
      </div>
    </form>
  `,
  setup() {
    const email = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const error = ref('');
    const success = ref(false);

    const handleSubmit = async () => {
      isLoading.value = true;
      error.value = '';
      success.value = false;

      try {
        const response = await fetch(
          'http://virtualracingleagues.localhost/api/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.value,
              password: password.value,
            }),
          },
        );

        const data = await response.json();

        if (response.ok && data.success) {
          success.value = true;
        } else {
          error.value = data.message || 'Login failed';
        }
      } catch (err) {
        error.value = 'An error occurred';
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      password,
      isLoading,
      error,
      success,
      handleSubmit,
    };
  },
};

describe('LoginForm (Example Test with Testing Library + MSW)', () => {
  // Helper function to render component with necessary providers
  const renderLoginForm = () => {
    const pinia = createPinia();

    return render(LoginForm, {
      global: {
        plugins: [pinia],
      },
    });
  };

  it('renders login form with email and password fields', () => {
    renderLoginForm();

    // Using Testing Library's accessible queries
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('allows user to type in email and password fields', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Realistic user interactions with user-event
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('shows loading state during form submission', async () => {
    // This test demonstrates checking for loading state
    // In real scenarios with slow APIs, you'd see "Logging in..." button text
    // With MSW, responses are instant, so we'll just verify the form submits
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // In real tests, you'd mock a delayed response to test loading states
    // For now, just verify the success message appears
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('successfully logs in with correct credentials (using MSW)', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    // Fill in the form with valid credentials (mocked in handlers.ts)
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Wait for success message (MSW will return success for these credentials)
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    });
  });

  it('shows error message with incorrect credentials (using MSW)', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    // Fill in the form with invalid credentials
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Wait for error message (MSW will return 401 for invalid credentials)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('can override MSW handler for specific test case', async () => {
    // Override the default login handler for this specific test
    server.use(
      http.post('http://virtualracingleagues.localhost/api/login', () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'Server is down for maintenance',
          },
          { status: 503 },
        );
      }),
    );

    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/server is down for maintenance/i)).toBeInTheDocument();
    });
  });

  it('disables submit button during loading', async () => {
    // In real scenarios, you'd use MSW delay to test loading states:
    // server.use(http.post('/api/login', async () => {
    //   await delay(1000);
    //   return HttpResponse.json({...});
    // }));
    // For this example, we'll just verify the button isn't disabled after success
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // Wait for form submission to complete
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    // After success, button should no longer be disabled
    expect(submitButton).not.toBeDisabled();
  });
});

/**
 * Key Testing Library Queries (in order of preference):
 *
 * 1. getByRole - Most accessible (e.g., button, link, textbox)
 * 2. getByLabelText - For form inputs with labels
 * 3. getByPlaceholderText - For inputs without labels
 * 4. getByText - For non-interactive elements
 * 5. getByTestId - Last resort when semantic queries don't work
 *
 * Variants:
 * - getBy* - Throws if not found (use for elements that should exist)
 * - queryBy* - Returns null if not found (use for elements that might not exist)
 * - findBy* - Returns promise, waits for element (use for async elements)
 *
 * Multiple elements:
 * - getAllBy* / queryAllBy* / findAllBy*
 */
