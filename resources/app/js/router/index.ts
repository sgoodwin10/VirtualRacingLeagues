import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
import LeagueList from '@app/views/LeagueList.vue';
import LeagueDetail from '@app/views/LeagueDetail.vue';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LeagueList,
      meta: {
        title: 'My Leagues',
        requiresAuth: true,
      },
    },
    {
      path: '/leagues/:id',
      name: 'league-detail',
      component: LeagueDetail,
      meta: {
        title: 'League Details',
        requiresAuth: true,
      },
    },
    {
      path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
      name: 'season-detail',
      component: () => import('@app/views/SeasonDetail.vue'),
      meta: {
        title: 'Season Details',
        requiresAuth: true,
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
