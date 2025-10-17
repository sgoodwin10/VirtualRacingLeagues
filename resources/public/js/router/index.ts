import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@public/stores/authStore';
import HomeView from '@public/views/HomeView.vue';
import LoginView from '@public/views/auth/LoginView.vue';
import RegisterView from '@public/views/auth/RegisterView.vue';
import ForgotPasswordView from '@public/views/auth/ForgotPasswordView.vue';
import ResetPasswordView from '@public/views/auth/ResetPasswordView.vue';
import VerifyEmailView from '@public/views/VerifyEmailView.vue';
import VerifyEmailResultView from '@public/views/VerifyEmailResultView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Home',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Login',
        isAuthRoute: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        title: 'Register',
        isAuthRoute: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: {
        title: 'Forgot Password',
        isAuthRoute: true,
      },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: {
        title: 'Reset Password',
        isAuthRoute: true,
      },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmailView,
      meta: {
        title: 'Verify Email',
      },
    },
    {
      path: '/verify-email-result',
      name: 'verify-email-result',
      component: VerifyEmailResultView,
      meta: {
        title: 'Email Verification',
      },
    },
  ],
});

// Helper to get app subdomain URL
const getAppSubdomainUrl = (): string => {
  const domain = import.meta.env.VITE_APP_DOMAIN || 'generictemplate.localhost:8000';
  return `http://app.${domain}`;
};

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Set page title
  const title = to.meta.title as string;
  const appName = import.meta.env.VITE_APP_NAME || 'Your App';
  document.title = title ? `${title} - ${appName}` : appName;

  // Check if this is a logout redirect from user dashboard
  if (to.query.logout === '1') {
    // Clear the auth store to prevent redirect loop
    authStore.clearAuth();

    // If already on login page, just remove query param and allow navigation
    if (to.path === '/login') {
      // Replace the URL to remove the query parameter
      window.history.replaceState({}, '', '/login');
      next();
      return;
    }

    // Otherwise navigate to login
    next({ path: '/login', replace: true });
    return;
  }

  // Check if the route is an auth route (login, register, etc.)
  const isAuthRoute = to.meta.isAuthRoute === true;

  // If user is authenticated and trying to access auth routes, redirect to app subdomain
  if (isAuthRoute && authStore.isAuthenticated) {
    const appUrl = getAppSubdomainUrl();
    window.location.href = appUrl;
    next(false); // Cancel navigation since we're doing a full page redirect
    return;
  }

  // Allow navigation
  next();
});

export default router;
