import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';

// Type-safe route meta fields
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
  }
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Validates that route params are numeric
 * @param paramNames - Array of param names to validate
 * @returns Navigation guard function
 */
const validateNumericParams = (paramNames: string[]) => {
  return (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    for (const paramName of paramNames) {
      const paramValue = to.params[paramName];
      const valueToCheck = Array.isArray(paramValue) ? paramValue[0] : paramValue;

      if (valueToCheck && !/^\d+$/.test(valueToCheck)) {
        // Invalid param - redirect to home
        next({ name: 'home' });
        return;
      }
    }
    next();
  };
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@app/views/LeagueList.vue'),
      meta: {
        title: 'My Leagues',
      },
    },
    {
      path: '/leagues/:id',
      name: 'league-detail',
      component: () => import('@app/views/LeagueDetail.vue'),
      beforeEnter: validateNumericParams(['id']),
      meta: {
        title: 'League Details',
      },
    },
    {
      path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
      name: 'season-detail',
      component: () => import('@app/views/SeasonDetail.vue'),
      beforeEnter: validateNumericParams(['leagueId', 'competitionId', 'seasonId']),
      meta: {
        title: 'Season Details',
      },
    },
  ],
});

// Get public site domain from environment
const getPublicDomain = (): string => {
  // Extract domain without 'app.' subdomain
  // e.g., http://app.virtualracingleagues.localhost -> http://virtualracingleagues.localhost
  return import.meta.env.VITE_APP_URL.replace('//app.', '//');
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

// GTM DataLayer push for virtual page view tracking
router.afterEach((to) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'virtual_page_view',
    page_path: to.fullPath,
    page_title: (to.meta.title as string) || document.title,
  });
});

export default router;
