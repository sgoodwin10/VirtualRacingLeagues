import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
import { useNavigationStore } from '@app/stores/navigationStore';
import { useToast } from 'primevue/usetoast';

// Type-safe route meta fields
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresCompetitionContext?: boolean;
    breadcrumb?: string | ((route: RouteLocationNormalized) => string);
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
    const toast = useToast();

    for (const paramName of paramNames) {
      const paramValue = to.params[paramName];
      const valueToCheck = Array.isArray(paramValue) ? paramValue[0] : paramValue;

      if (valueToCheck && !/^\d+$/.test(valueToCheck)) {
        // Show toast notification before redirecting
        toast.add({
          severity: 'error',
          summary: 'Invalid URL',
          detail: `Invalid parameter: ${paramName} must be a number`,
          life: 5000,
        });

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
      path: '/leagues/:id/drivers',
      name: 'league-drivers',
      component: () => import('@app/views/LeagueDrivers.vue'),
      beforeEnter: validateNumericParams(['id']),
      meta: {
        title: 'Driver Management',
      },
    },
    {
      path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
      name: 'season-detail',
      component: () => import('@app/views/SeasonDetail.vue'),
      beforeEnter: validateNumericParams(['leagueId', 'competitionId', 'seasonId']),
      meta: {
        title: 'Season Details',
        requiresCompetitionContext: true,
      },
      redirect: { name: 'season-rounds' },
      children: [
        {
          path: '',
          name: 'season-rounds',
          component: () => import('@app/views/season/RoundsView.vue'),
          meta: { title: 'Rounds', requiresCompetitionContext: true },
        },
        {
          path: 'standings',
          name: 'season-standings',
          component: () => import('@app/views/season/StandingsView.vue'),
          meta: { title: 'Standings', requiresCompetitionContext: true },
        },
        {
          path: 'drivers',
          name: 'season-drivers',
          component: () => import('@app/views/season/DriversView.vue'),
          meta: { title: 'Drivers', requiresCompetitionContext: true },
        },
        {
          path: 'divisions-teams',
          name: 'season-divisions-teams',
          component: () => import('@app/views/season/DivisionsTeamsView.vue'),
          meta: { title: 'Divisions & Teams', requiresCompetitionContext: true },
        },
        {
          path: 'season-status',
          name: 'season-status',
          component: () => import('@app/views/season/SeasonStatusView.vue'),
          meta: { title: 'Season Status', requiresCompetitionContext: true },
        },
      ],
    },
  ],
});

// Get public site domain from environment
const getPublicDomain = (): string => {
  try {
    const url = new URL(import.meta.env.VITE_APP_URL);
    // Remove 'app.' prefix from hostname if present
    const hostname = url.hostname.replace(/^app\./, '');
    return `${url.protocol}//${hostname}${url.port ? ':' + url.port : ''}`;
  } catch {
    // Fallback to string replacement if URL parsing fails
    return import.meta.env.VITE_APP_URL.replace('//app.', '//');
  }
};

/**
 * Validate that a redirect URL is on an allowed domain
 * Only allows redirects to the current domain or configured app domains
 */
const isValidRedirectUrl = (url: string): boolean => {
  try {
    const redirectUrl = new URL(url);
    const currentHost = window.location.hostname;
    const appUrl = new URL(import.meta.env.VITE_APP_URL);

    // Extract base domain (e.g., "virtualracingleagues.localhost" from "app.virtualracingleagues.localhost")
    const baseDomain = appUrl.hostname.replace(/^app\./, '');

    // Allow redirects to:
    // 1. Current hostname
    // 2. App subdomain
    // 3. Any subdomain of the base domain
    const allowedHosts = [currentHost, appUrl.hostname, baseDomain];

    // Check if the redirect hostname matches allowed hosts or is a subdomain of base domain
    const isAllowed =
      allowedHosts.includes(redirectUrl.hostname) ||
      redirectUrl.hostname.endsWith(`.${baseDomain}`);

    return isAllowed;
  } catch {
    // Invalid URL format - reject it
    return false;
  }
};

// Navigation guard - ALL routes require authentication
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  // Set page title
  const title = to.meta.title as string;
  document.title = title ? `${title} - App Dashboard` : 'App Dashboard';

  // All routes require authentication - check auth status
  const isAuthenticated = await userStore.checkAuth();

  if (!isAuthenticated) {
    // Redirect to public site login with validated return URL
    const publicDomain = getPublicDomain();
    const currentUrl = window.location.href;

    // Validate the return URL before encoding
    const returnUrl = isValidRedirectUrl(currentUrl)
      ? encodeURIComponent(currentUrl)
      : encodeURIComponent(`${import.meta.env.VITE_APP_URL}/`);

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

  // Sidebar visibility management
  const navigationStore = useNavigationStore();
  if (to.meta.requiresCompetitionContext) {
    navigationStore.setShowSidebar(true);
  } else {
    navigationStore.setShowSidebar(false);
  }
});

export default router;
