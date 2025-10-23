import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@user/stores/userStore';
import HomeView from '@user/views/HomeView.vue';
import ProfileView from '@user/views/ProfileView.vue';
import LeagueList from '@user/views/LeagueList.vue';
import LeagueDetail from '@user/views/LeagueDetail.vue';

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
    {
      path: '/leagues',
      name: 'leagues',
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
      path: '/leagues/:leagueId/competitions/:competitionId',
      name: 'competition-detail',
      component: () => import('@user/views/CompetitionDetail.vue'),
      meta: {
        title: 'Competition Details',
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

export default router;
