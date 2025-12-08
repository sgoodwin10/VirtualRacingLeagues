<template>
  <header class="nav-racing" :class="{ scrolled: isScrolled }">
    <div class="container-racing nav-content">
      <!-- Logo -->
      <router-link to="/" class="nav-logo">
        <div class="nav-logo-icon">
          <PhFlag :size="20" weight="fill" :color="theme === 'dark' ? '#0a0a0a' : '#fafafa'" />
        </div>
        <span class="nav-logo-text">Virtual Racing Leagues</span>
      </router-link>

      <!-- Desktop Navigation -->
      <nav class="nav-links desktop-nav">
        <router-link to="/" class="nav-link" :class="{ active: isActive('/') }"> Home </router-link>
        <router-link to="/leagues" class="nav-link" :class="{ active: isActive('/leagues') }">
          Leagues
        </router-link>
        <a href="#features" class="nav-link" @click.prevent="scrollToSection('features')">
          Features
        </a>

        <!-- Theme Toggle -->
        <button
          class="theme-toggle-btn"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <PhSun v-if="theme === 'dark'" :size="20" weight="bold" />
          <PhMoon v-else :size="20" weight="bold" />
        </button>

        <div class="nav-divider"></div>

        <!-- Show when NOT authenticated -->
        <template v-if="!authStore.isAuthenticated">
          <router-link to="/login" class="btn btn-ghost"> Sign In </router-link>
          <router-link to="/register" class="btn btn-primary btn-sm"> Get Started </router-link>
        </template>

        <!-- Show when authenticated -->
        <template v-else>
          <span class="user-greeting">
            {{ authStore.userName }}
          </span>
          <a :href="appSubdomainUrl" class="btn btn-ghost"> Dashboard </a>
          <button :disabled="isLoggingOut" class="btn btn-ghost" @click="handleLogout">
            {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
          </button>
        </template>
      </nav>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" aria-label="Toggle menu" @click="toggleMobileMenu">
        <PhList v-if="!mobileMenuOpen" :size="24" />
        <PhX v-else :size="24" />
      </button>
    </div>

    <!-- Mobile Navigation -->
    <Transition name="slide-down">
      <nav v-if="mobileMenuOpen" class="mobile-nav">
        <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu"> Home </router-link>
        <router-link to="/leagues" class="mobile-nav-link" @click="closeMobileMenu">
          Leagues
        </router-link>
        <a
          href="#features"
          class="mobile-nav-link"
          @click.prevent="
            scrollToSection('features');
            closeMobileMenu();
          "
        >
          Features
        </a>

        <!-- Theme Toggle -->
        <button class="mobile-nav-link theme-toggle-mobile" @click="toggleTheme">
          <PhSun v-if="theme === 'dark'" :size="20" weight="bold" />
          <PhMoon v-else :size="20" weight="bold" />
          <span>{{ theme === 'dark' ? 'Light Mode' : 'Dark Mode' }}</span>
        </button>

        <div class="mobile-nav-divider"></div>

        <template v-if="!authStore.isAuthenticated">
          <router-link to="/login" class="mobile-nav-link" @click="closeMobileMenu">
            Sign In
          </router-link>
          <router-link
            to="/register"
            class="btn btn-primary mobile-nav-cta"
            @click="closeMobileMenu"
          >
            Get Started Free
          </router-link>
        </template>

        <template v-else>
          <span class="mobile-user-greeting"> Welcome, {{ authStore.userName }} </span>
          <a :href="appSubdomainUrl" class="mobile-nav-link" @click="closeMobileMenu">
            Dashboard
          </a>
          <button class="mobile-nav-link" @click="handleLogout">
            {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
          </button>
        </template>
      </nav>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { PhFlag, PhList, PhX, PhSun, PhMoon } from '@phosphor-icons/vue';
import { useAuthStore } from '@public/stores/authStore';
import { useTheme } from '@public/composables/useTheme';

const route = useRoute();
const authStore = useAuthStore();
const { theme, toggleTheme } = useTheme();
const isScrolled = ref(false);
const mobileMenuOpen = ref(false);
const isLoggingOut = ref(false);

const appSubdomainUrl = computed(() => {
  return `http://${import.meta.env.VITE_APP_DOMAIN}`;
});

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const handleLogout = async (): Promise<void> => {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } catch (error) {
    console.error('Logout failed:', error);
    isLoggingOut.value = false;
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.nav-logo-text {
  font-size: 1rem;
  letter-spacing: 0.1em;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: var(--border-primary);
  margin: 0 var(--space-sm);
}

.btn-sm {
  padding: var(--space-sm) var(--space-lg);
  font-size: 0.75rem;
}

.user-greeting {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-right: var(--space-sm);
}

/* Desktop Nav */
.desktop-nav {
  display: flex;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: var(--space-sm);
  transition: color var(--duration-fast);
}

.mobile-menu-btn:hover {
  color: var(--accent-gold);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: var(--space-lg);
  box-shadow: var(--shadow-subtle);
}

.mobile-nav-link {
  display: block;
  padding: var(--space-md);
  font-family: var(--font-display);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  text-decoration: none;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: color var(--duration-fast);
}

.mobile-nav-link:hover {
  color: var(--text-primary);
}

.mobile-nav-divider {
  height: 1px;
  background: var(--border-primary);
  margin: var(--space-md) 0;
}

.mobile-nav-cta {
  display: block;
  text-align: center;
  margin-top: var(--space-md);
}

.mobile-user-greeting {
  display: block;
  padding: var(--space-md);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--accent-gold);
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.theme-toggle-btn:hover {
  color: var(--accent-gold);
  border-color: var(--accent-gold);
}

.theme-toggle-mobile {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* Slide Down Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--duration-normal) var(--ease-racing);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-nav {
    display: block;
  }
}
</style>
