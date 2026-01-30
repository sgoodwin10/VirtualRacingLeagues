<template>
  <aside
    :class="[
      'admin-sidebar',
      'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40',
      isCollapsed ? 'w-20' : 'w-64',
    ]"
  >
    <!-- Logo/Brand Section -->
    <div class="flex items-center h-16 px-4 border-b border-gray-200">
      <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500 text-white">
        <i class="pi pi-shield text-2xl"></i>
      </div>
      <transition name="fade">
        <div v-if="!isCollapsed" class="ml-3 flex flex-col min-w-0">
          <span class="text-xs text-gray-500 truncate">
            {{ siteConfigStore.siteName }}
          </span>
          <span class="text-lg font-semibold text-gray-900"> Admin Panel </span>
        </div>
      </transition>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-1 px-3">
        <li v-for="item in menuItems" :key="item.name">
          <!-- Menu item with submenu -->
          <template v-if="item.items && item.items.length > 0">
            <button
              class="sidebar-item w-full"
              :class="{
                'sidebar-item-active': hasActiveChild(item.items),
                'justify-center': isCollapsed,
              }"
              @click="toggleSubmenu(item.name)"
            >
              <i :class="['sidebar-icon', item.icon]"></i>
              <transition name="fade">
                <span v-if="!isCollapsed" class="sidebar-label flex-1 text-left">
                  {{ item.label }}
                </span>
              </transition>
              <transition name="fade">
                <i
                  v-if="!isCollapsed"
                  :class="[
                    'pi text-xs transition-transform',
                    isMenuExpanded(item.name) ? 'pi-chevron-down' : 'pi-chevron-right',
                  ]"
                ></i>
              </transition>
            </button>

            <!-- Submenu items -->
            <transition name="submenu">
              <ul v-if="isMenuExpanded(item.name) && !isCollapsed" class="mt-1 ml-6 space-y-1">
                <li v-for="subItem in item.items" :key="subItem.name">
                  <!-- External link -->
                  <a
                    v-if="subItem.href"
                    :href="subItem.href"
                    :target="subItem.target"
                    :rel="subItem.target === '_blank' ? 'noopener noreferrer' : undefined"
                    class="sidebar-item sidebar-subitem"
                  >
                    <i :class="['sidebar-icon text-sm', subItem.icon]"></i>
                    <span class="sidebar-label">
                      {{ subItem.label }}
                    </span>
                    <i
                      v-if="subItem.target === '_blank'"
                      class="pi pi-external-link text-xs ml-auto opacity-50"
                    ></i>
                  </a>
                  <!-- Internal router link -->
                  <router-link
                    v-else-if="subItem.to"
                    :to="subItem.to"
                    class="sidebar-item sidebar-subitem"
                    :class="{
                      'sidebar-item-active': isActiveRoute(subItem.to),
                    }"
                  >
                    <i :class="['sidebar-icon text-sm', subItem.icon]"></i>
                    <span class="sidebar-label">
                      {{ subItem.label }}
                    </span>
                  </router-link>
                </li>
              </ul>
            </transition>
          </template>

          <!-- Regular menu item without submenu -->
          <router-link
            v-else-if="item.to"
            :to="item.to"
            class="sidebar-item"
            :class="{
              'sidebar-item-active': isActiveRoute(item.to),
              'justify-center': isCollapsed,
            }"
          >
            <i :class="['sidebar-icon', item.icon]"></i>
            <transition name="fade">
              <span v-if="!isCollapsed" class="sidebar-label">
                {{ item.label }}
              </span>
            </transition>
            <transition name="fade">
              <span
                v-if="!isCollapsed && item.badge"
                class="ml-auto px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full"
              >
                {{ item.badge }}
              </span>
            </transition>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>

  <!-- Overlay for mobile -->
  <div
    v-if="isMobileSidebarOpen"
    class="fixed inset-0 bg-black/50 z-30 lg:hidden"
    @click="closeMobileSidebar"
  ></div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useBreakpoints } from '@vueuse/core';
import { useLayoutStore } from '@admin/stores/layoutStore';
import { useAdminStore } from '@admin/stores/adminStore';
import { useSiteConfigStore } from '@admin/stores/siteConfigStore';

const route = useRoute();
const layoutStore = useLayoutStore();
const adminStore = useAdminStore();
const siteConfigStore = useSiteConfigStore();

// Responsive breakpoints
const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
});

const isMobile = breakpoints.smaller('desktop');

// State for expanded menu items
const expandedMenus = ref<Set<string>>(new Set());

// Computed properties
const isCollapsed = computed(() => layoutStore.sidebarCollapsed);
const isMobileSidebarOpen = computed(() => !layoutStore.sidebarCollapsed && isMobile.value);

// Menu item types
interface MenuItem {
  name: string;
  label: string;
  icon: string;
  to?: string;
  href?: string;
  target?: string;
  badge?: string | null;
  items?: MenuItem[];
}

// Menu items configuration
const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    {
      name: 'dashboard',
      label: 'Dashboard',
      icon: 'pi pi-home',
      to: '/',
      badge: null,
    },
    {
      name: 'users',
      label: 'Users',
      icon: 'pi pi-users',
      to: '/users',
      badge: null,
    },
    {
      name: 'leagues',
      label: 'Leagues',
      icon: 'pi pi-trophy',
      to: '/leagues',
      badge: null,
    },
    {
      name: 'drivers',
      label: 'Drivers',
      icon: 'pi pi-id-card',
      to: '/drivers',
      badge: null,
    },
  ];

  // System menu - only show to Admins and Super Admins
  if (adminStore.isAdmin) {
    const systemItems: MenuItem[] = [
      {
        name: 'notifications',
        label: 'Notifications',
        icon: 'pi pi-bell',
        to: '/notifications',
      },
      {
        name: 'contacts',
        label: 'Contacts',
        icon: 'pi pi-envelope',
        to: '/contacts',
      },
    ];

    // Activity Logs - only for Super Admins
    if (adminStore.adminRole === 'super_admin') {
      systemItems.push({
        name: 'activity-logs',
        label: 'Activity Logs',
        icon: 'pi pi-clock',
        to: '/activity-logs',
      });
    }

    items.push({
      name: 'system',
      label: 'System',
      icon: 'pi pi-server',
      badge: null,
      items: systemItems,
    });
  }

  // Settings menu - only show to Admins and Super Admins
  if (adminStore.isAdmin) {
    const settingsItems: MenuItem[] = [
      {
        name: 'admin-users',
        label: 'Admin Users',
        icon: 'pi pi-users',
        to: '/admin-users',
      },
    ];

    // Site Config - only for Super Admins
    if (adminStore.adminRole === 'super_admin') {
      settingsItems.push({
        name: 'site-config',
        label: 'Site Configuration',
        icon: 'pi pi-sliders-h',
        to: '/site-config',
      });
    }

    // Telescope - only for Super Admins
    if (adminStore.adminRole === 'super_admin') {
      settingsItems.push({
        name: 'telescope',
        label: 'Telescope',
        icon: 'ph ph-binoculars',
        href: `${import.meta.env.VITE_APP_URL}/telescope`,
        target: '_blank',
      });
    }

    // Horizon - only for Super Admins
    if (adminStore.adminRole === 'super_admin') {
      settingsItems.push({
        name: 'horizon',
        label: 'Queue Monitor',
        icon: 'ph ph-queue',
        href: '/admin/horizon',
        target: '_blank',
      });
    }

    items.push({
      name: 'settings',
      label: 'Settings',
      icon: 'pi pi-cog',
      badge: null,
      items: settingsItems,
    });
  }

  return items;
});

// Methods
const isActiveRoute = (path: string): boolean => {
  // For the dashboard ('/'), only match exactly
  if (path === '/') {
    return route.path === '/';
  }

  // For other routes, match the exact path or any sub-routes
  return route.path === path || route.path.startsWith(path + '/');
};

const isMenuExpanded = (menuName: string): boolean => {
  return expandedMenus.value.has(menuName);
};

const toggleSubmenu = (menuName: string): void => {
  if (expandedMenus.value.has(menuName)) {
    expandedMenus.value.delete(menuName);
  } else {
    expandedMenus.value.add(menuName);
  }
};

const hasActiveChild = (items: Array<{ to?: string }>): boolean => {
  return items.some((item) => item.to && isActiveRoute(item.to));
};

const closeMobileSidebar = (): void => {
  if (isMobile.value) {
    layoutStore.setSidebarCollapsed(true);
  }
};
</script>

<style scoped>
.admin-sidebar {
  transition: width 0.3s ease;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  color: #6b7280;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  border: none;
  background: transparent;
}

.sidebar-item:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.sidebar-item-active {
  background-color: #dbeafe;
  color: #1d4ed8;
  font-weight: 500;
}

.sidebar-subitem {
  padding-left: 0.5rem;
  font-size: 0.875rem;
}

.sidebar-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.sidebar-label {
  font-size: 0.875rem;
  white-space: nowrap;
}

/* Fade transition for labels */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Submenu transition */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}
</style>
