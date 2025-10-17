import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@user/stores/userStore';
import HomeView from '@user/views/HomeView.vue';
import ProfileView from '@user/views/ProfileView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Dashboard',
        requiresAuth: true,
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        title: 'Profile',
        requiresAuth: true,
      },
    },
  ],
});

// Get public site domain from environment
const getPublicDomain = (): string => {
  const appUrl = import.meta.env.VITE_APP_URL || 'http://generictemplate.localhost:8000';
  // Extract domain without 'app.' subdomain
  // e.g., http://app.generictemplate.localhost:8000 -> http://generictemplate.localhost:8000
  return appUrl.replace('//app.', '//');
};

// Navigation guard - ALL routes require authentication
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  // Set page title
  const title = to.meta.title as string;
  document.title = title ? `${title} - User Dashboard` : 'User Dashboard';

  // All routes require authentication - check auth status
  const isAuthenticated = await userStore.checkAuth();

  if (!isAuthenticated) {
    // Redirect to public site login with return URL
    const publicDomain = getPublicDomain();
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${publicDomain}/login?redirect=${returnUrl}`;
    next(false); // Cancel navigation since we're doing a full page redirect
    return;
  }

  // User is authenticated, allow navigation
  next();
});

export default router;
