# Technical Blueprint Navigation - Implementation Plan

## Overview

This plan outlines the complete migration from the current header-based navigation to the new three-column Technical Blueprint navigation system for the app dashboard (`resources/app`).

**Design Reference**: `docs/designs/app/ideas2/technical-form/navigation.html`

**Current State**: Simple header with logo, profile, and logout buttons (`Header.vue`)

**Target State**: Three-column layout:
- 64px Icon Rail (left) - Primary navigation
- 240px Sidebar (second column) - Contextual sub-navigation (competition-specific)
- Flexible main content area

---

## 1. Component Architecture

### 1.1 New Layout Components

#### **`resources/app/js/components/layout/AppLayout.vue`**
Main layout wrapper that replaces the current App.vue structure.

**Purpose**: Orchestrates the three-column layout and manages global layout state

**Structure**:
```vue
<template>
  <div class="app-layout">
    <IconRail />
    <Sidebar v-if="showSidebar" />
    <main class="main-content">
      <router-view />
    </main>

    <!-- Global components -->
    <Toast />
    <ConfirmDialog />
    <ProfileSettingsModal v-model:visible="showProfile" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNavigationStore } from '@app/stores/navigationStore';
import IconRail from './IconRail.vue';
import Sidebar from './Sidebar.vue';
import ProfileSettingsModal from '@app/components/profile/ProfileSettingsModal.vue';

const navigationStore = useNavigationStore();
const showSidebar = computed(() => navigationStore.showSidebar);
const showProfile = computed({
  get: () => navigationStore.showProfileModal,
  set: (value) => navigationStore.setProfileModal(value)
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-dark);
}

.main-content {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
```

**Key Features**:
- CSS Grid/Flexbox layout for three columns
- Conditionally shows sidebar based on navigation context
- Houses global PrimeVue components (Toast, ConfirmDialog)
- Manages profile modal visibility

---

#### **`resources/app/js/components/layout/IconRail.vue`**
64px icon rail for primary navigation.

**Purpose**: Quick access to main sections (Home, League, Drivers, Profile)

**Structure**:
```vue
<template>
  <aside class="icon-rail">
    <!-- Logo -->
    <div class="rail-logo">
      <img src="/images/logo/256.png" alt="Logo" class="logo-image" />
    </div>

    <!-- Navigation Items -->
    <nav class="rail-nav">
      <RailItem
        v-for="item in navItems"
        :key="item.id"
        :icon="item.icon"
        :active="isActive(item)"
        :tooltip="item.label"
        @click="handleClick(item)"
      />
    </nav>

    <!-- Divider -->
    <div class="rail-divider" />

    <!-- Bottom Items (Profile, Logout, Help) -->
    <nav class="rail-nav-bottom">
      <RailItem
        v-for="item in bottomItems"
        :key="item.id"
        :icon="item.icon"
        :tooltip="item.label"
        @click="handleClick(item)"
      />
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNavigationStore } from '@app/stores/navigationStore';
import { useUserStore } from '@app/stores/userStore';
import { PhHouse, PhFlagCheckered, PhUsers, PhUser, PhSignOut, PhQuestion } from '@phosphor-icons/vue';
import RailItem from './RailItem.vue';

const router = useRouter();
const route = useRoute();
const navigationStore = useNavigationStore();
const userStore = useUserStore();

interface NavItem {
  id: string;
  label: string;
  icon: Component;
  route?: string;
  action?: () => void;
}

const navItems = computed<NavItem[]>(() => [
  { id: 'home', label: 'Home', icon: PhHouse, route: '/' },
  { id: 'league', label: 'Leagues', icon: PhFlagCheckered, route: '/' }, // Shows all competitions
  { id: 'drivers', label: 'Drivers', icon: PhUsers, route: '/drivers' }, // All drivers in league
]);

const bottomItems = computed<NavItem[]>(() => [
  {
    id: 'profile',
    label: 'Profile',
    icon: PhUser,
    action: () => navigationStore.setProfileModal(true)
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: PhSignOut,
    action: () => userStore.logout()
  },
  {
    id: 'help',
    label: 'Help',
    icon: PhQuestion,
    action: () => window.open('/help', '_blank')
  },
]);

function isActive(item: NavItem): boolean {
  if (!item.route) return false;
  return route.path === item.route || route.path.startsWith(item.route);
}

function handleClick(item: NavItem): void {
  if (item.action) {
    item.action();
  } else if (item.route) {
    router.push(item.route);
  }
}
</script>

<style scoped>
.icon-rail {
  width: 64px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 8px;
}

.rail-logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--cyan), var(--green));
  border-radius: var(--p-content-border-radius, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.rail-divider {
  width: 24px;
  height: 1px;
  background: var(--border);
  margin: 8px 0;
}

.rail-nav-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
}
</style>
```

**Key Features**:
- Active state indicator (left cyan border)
- Phosphor icon system
- Tooltip on hover (using PrimeVue Tooltip directive)
- Action vs. route handling
- Auto-scroll to bottom items

---

#### **`resources/app/js/components/layout/RailItem.vue`**
Individual rail navigation item (reusable).

**Structure**:
```vue
<template>
  <button
    v-tooltip.right="tooltip"
    class="rail-item"
    :class="{ active }"
    @click="$emit('click')"
  >
    <component :is="icon" :size="20" weight="regular" />
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  icon: Component;
  active?: boolean;
  tooltip?: string;
}

withDefaults(defineProps<Props>(), {
  active: false,
  tooltip: ''
});

defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.rail-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: var(--p-content-border-radius, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.rail-item:hover {
  color: var(--text-secondary);
  background: var(--bg-elevated);
}

.rail-item.active {
  color: var(--cyan);
  background: var(--cyan-dim);
}

.rail-item.active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--cyan);
  border-radius: 0 2px 2px 0;
}
</style>
```

**Key Features**:
- Hover states
- Active indicator (left border)
- Tooltip via PrimeVue directive
- Accessibility (button element, keyboard navigation)

---

#### **`resources/app/js/components/layout/Sidebar.vue`**
240px sidebar navigation panel (contextual, competition-specific).

**Purpose**: Shows detailed navigation when user is in a competition/season context

**Structure**:
```vue
<template>
  <aside class="sidebar" v-if="showSidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="sidebar-title">//{{ competitionName }}</div>
      <div class="sidebar-subtitle">{{ seasonName }}</div>
    </div>

    <!-- Navigation Sections -->
    <div class="sidebar-content">
      <div class="sidebar-section">
        <div class="sidebar-label">Navigation</div>
        <nav class="sidebar-nav">
          <SidebarLink
            v-for="link in navigationLinks"
            :key="link.id"
            :to="link.to"
            :icon="link.icon"
            :label="link.label"
            :tag="link.tag"
          />
        </nav>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationStore } from '@app/stores/navigationStore';
import { PhCalendar, PhTrophy, PhUsers, PhCar, PhUsersThree, PhGear } from '@phosphor-icons/vue';
import SidebarLink from './SidebarLink.vue';

const route = useRoute();
const navigationStore = useNavigationStore();

const showSidebar = computed(() => navigationStore.showSidebar);
const competitionName = computed(() => navigationStore.currentCompetition?.name || 'COMPETITION');
const seasonName = computed(() => navigationStore.currentSeason?.name || 'Season');

const navigationLinks = computed(() => {
  if (!navigationStore.currentCompetition || !navigationStore.currentSeason) {
    return [];
  }

  const { leagueId, competitionId, seasonId } = navigationStore;
  const basePath = `/leagues/${leagueId}/competitions/${competitionId}/seasons/${seasonId}`;

  return [
    {
      id: 'rounds',
      to: basePath,
      icon: PhCalendar,
      label: 'Rounds',
      tag: navigationStore.currentSeason?.rounds_count
    },
    {
      id: 'standings',
      to: `${basePath}/standings`,
      icon: PhTrophy,
      label: 'Standings'
    },
    {
      id: 'drivers',
      to: `${basePath}/drivers`,
      icon: PhUsers,
      label: 'Drivers',
      tag: navigationStore.currentSeason?.drivers_count
    },
    {
      id: 'divisions-teams',
      to: `${basePath}/divisions-teams`,
      icon: PhUsersThree,
      label: 'Divisions & Teams'
    },
    {
      id: 'settings',
      to: `${basePath}/settings`,
      icon: PhGear,
      label: 'Settings'
    },
  ];
});
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 4px;
}

.sidebar-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.sidebar-content {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 20px;
  margin-bottom: 8px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}
</style>
```

**Key Features**:
- Conditional rendering based on competition context
- Dynamic header with competition/season name
- Tag badges for counts (rounds, drivers)
- Scrollable content area

---

#### **`resources/app/js/components/layout/SidebarLink.vue`**
Individual sidebar navigation link (reusable).

**Structure**:
```vue
<template>
  <router-link
    :to="to"
    class="sidebar-link"
    :class="{ active: isActive }"
  >
    <component :is="icon" :size="16" weight="regular" />
    <span>{{ label }}</span>
    <span v-if="tag" class="tag" :class="tagVariant">{{ tag }}</span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Component } from 'vue';

interface Props {
  to: string;
  icon: Component;
  label: string;
  tag?: string | number;
  tagVariant?: 'default' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  tag: undefined,
  tagVariant: 'default'
});

const route = useRoute();
const isActive = computed(() => route.path === props.to);
</script>

<style scoped>
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.sidebar-link:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.sidebar-link.active {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.tag {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 6px;
  background: var(--cyan-dim);
  color: var(--cyan);
  border-radius: 3px;
}

.tag.warning {
  background: var(--orange-dim);
  color: var(--orange);
}
</style>
```

**Key Features**:
- Router link integration
- Active state detection
- Tag badges (count or warning)
- Icon + label layout

---

### 1.2 Composables

#### **`resources/app/js/composables/useNavigation.ts`**
Reusable composable for navigation state management.

**Purpose**: Provides navigation context detection logic

```typescript
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationStore } from '@app/stores/navigationStore';

export function useNavigation() {
  const route = useRoute();
  const navigationStore = useNavigationStore();

  // Detect if we're in a competition/season context
  const isInCompetitionContext = computed(() => {
    return !!(route.params.competitionId && route.params.seasonId);
  });

  // Extract IDs from route
  const leagueId = computed(() => {
    const id = route.params.leagueId;
    return id ? parseInt(Array.isArray(id) ? id[0] : id, 10) : null;
  });

  const competitionId = computed(() => {
    const id = route.params.competitionId;
    return id ? parseInt(Array.isArray(id) ? id[0] : id, 10) : null;
  });

  const seasonId = computed(() => {
    const id = route.params.seasonId;
    return id ? parseInt(Array.isArray(id) ? id[0] : id, 10) : null;
  });

  // Watch route changes and update navigation store
  watch(
    [isInCompetitionContext, leagueId, competitionId, seasonId],
    ([inContext, league, competition, season]) => {
      if (inContext && league && competition && season) {
        navigationStore.setCompetitionContext(league, competition, season);
      } else {
        navigationStore.clearCompetitionContext();
      }
    },
    { immediate: true }
  );

  return {
    isInCompetitionContext,
    leagueId,
    competitionId,
    seasonId,
  };
}
```

**Key Features**:
- Route parameter extraction
- Context detection
- Automatic store updates
- Type-safe ID parsing

---

## 2. CSS/Styling Strategy

### 2.1 Design Tokens (Already in `app.css`)

The design system colors are already defined in `resources/app/css/app.css` under the `:root` CSS variables. **No changes needed** - we'll use existing variables:

**Background Colors**:
- `--bg-dark: #0d1117` ✓
- `--bg-panel: #161b22` ✓
- `--bg-card: #1c2128` ✓
- `--bg-elevated: #21262d` ✓
- `--bg-highlight: #272d36` ✓

**Text Colors**:
- `--text-primary: #e6edf3` ✓
- `--text-secondary: #8b949e` ✓
- `--text-muted: #6e7681` ✓

**Semantic Colors**:
- `--cyan: #58a6ff` ✓
- `--green: #7ee787` ✓
- `--orange: #f0883e` ✓

**Grid Pattern**:
- `--grid-color: rgba(88, 166, 255, 0.06)` ✓

### 2.2 New CSS Additions

Add to `resources/app/css/app.css`:

```css
/* ============================================
   Layout Variables - Navigation System
   ============================================ */
:root {
  --rail-width: 64px;
  --sidebar-width: 240px;
  --radius: 6px;
}

/* ============================================
   Layout Utilities - Three-Column Navigation
   ============================================ */
@layer utilities {
  .layout-rail {
    width: var(--rail-width);
  }

  .layout-sidebar {
    width: var(--sidebar-width);
  }

  .layout-main {
    flex: 1;
    min-width: 0; /* Prevent flex item overflow */
  }
}
```

### 2.3 Tailwind CSS Integration

Use existing Tailwind utilities where possible:
- Flexbox: `flex`, `flex-col`, `items-center`, `justify-between`
- Spacing: `gap-2`, `p-4`, `px-6`, `py-3`
- Colors: Use CSS variables with Tailwind (`bg-[var(--bg-panel)]`)
- Typography: Use existing font utilities or custom classes

**Hybrid Approach**: Component-scoped styles for navigation-specific patterns, Tailwind for standard spacing/layout.

---

## 3. Router Integration

### 3.1 Route Structure Modifications

**Current Routes**:
```typescript
{
  path: '/',
  name: 'home',
  component: () => import('@app/views/LeagueList.vue'),
},
{
  path: '/leagues/:id',
  name: 'league-detail',
  component: () => import('@app/views/LeagueDetail.vue'),
},
{
  path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
  name: 'season-detail',
  component: () => import('@app/views/SeasonDetail.vue'),
}
```

**New Routes** (add these):

```typescript
{
  path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
  name: 'season-detail',
  component: () => import('@app/views/SeasonDetail.vue'),
  meta: { title: 'Season Details', requiresCompetitionContext: true },
  redirect: { name: 'season-rounds' },
  children: [
    {
      path: '',
      name: 'season-rounds',
      component: () => import('@app/views/season/RoundsView.vue'),
      meta: { title: 'Rounds' },
    },
    {
      path: 'standings',
      name: 'season-standings',
      component: () => import('@app/views/season/StandingsView.vue'),
      meta: { title: 'Standings' },
    },
    {
      path: 'drivers',
      name: 'season-drivers',
      component: () => import('@app/views/season/DriversView.vue'),
      meta: { title: 'Drivers' },
    },
    {
      path: 'divisions-teams',
      name: 'season-divisions-teams',
      component: () => import('@app/views/season/DivisionsTeamsView.vue'),
      meta: { title: 'Divisions & Teams' },
    },
    {
      path: 'settings',
      name: 'season-settings',
      component: () => import('@app/views/season/SettingsView.vue'),
      meta: { title: 'Settings' },
    },
  ],
}
```

### 3.2 Navigation Guards

Update `resources/app/js/router/index.ts` to handle sidebar visibility:

```typescript
// Add meta field type
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresCompetitionContext?: boolean;
  }
}

// Add after existing beforeEach guard
router.afterEach((to) => {
  const navigationStore = useNavigationStore();

  // Show sidebar if route requires competition context
  if (to.meta.requiresCompetitionContext) {
    navigationStore.setShowSidebar(true);
  } else {
    navigationStore.setShowSidebar(false);
  }
});
```

### 3.3 Dynamic Sidebar Logic

**Sidebar shows when**:
- Route has `competitionId` and `seasonId` params
- Route meta has `requiresCompetitionContext: true`

**Sidebar hides when**:
- On home route (`/`)
- On league detail route (not in season context)
- No competition/season params

---

## 4. State Management

### 4.1 New Pinia Store: `navigationStore.ts`

Create `resources/app/js/stores/navigationStore.ts`:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Competition } from '@app/types/competition';
import type { Season } from '@app/types/season';

export const useNavigationStore = defineStore('navigation', () => {
  // State
  const showSidebar = ref(false);
  const showProfileModal = ref(false);
  const activeRailItem = ref<string>('home');

  // Competition context
  const leagueId = ref<number | null>(null);
  const competitionId = ref<number | null>(null);
  const seasonId = ref<number | null>(null);
  const currentCompetition = ref<Competition | null>(null);
  const currentSeason = ref<Season | null>(null);

  // Getters
  const isInCompetitionContext = computed(() => {
    return !!(competitionId.value && seasonId.value);
  });

  // Actions
  function setShowSidebar(value: boolean): void {
    showSidebar.value = value;
  }

  function setProfileModal(value: boolean): void {
    showProfileModal.value = value;
  }

  function setActiveRailItem(item: string): void {
    activeRailItem.value = item;
  }

  function setCompetitionContext(
    league: number,
    competition: number,
    season: number
  ): void {
    leagueId.value = league;
    competitionId.value = competition;
    seasonId.value = season;
    showSidebar.value = true;
  }

  function clearCompetitionContext(): void {
    leagueId.value = null;
    competitionId.value = null;
    seasonId.value = null;
    currentCompetition.value = null;
    currentSeason.value = null;
    showSidebar.value = false;
  }

  function setCompetitionData(competition: Competition, season: Season): void {
    currentCompetition.value = competition;
    currentSeason.value = season;
  }

  return {
    // State
    showSidebar,
    showProfileModal,
    activeRailItem,
    leagueId,
    competitionId,
    seasonId,
    currentCompetition,
    currentSeason,

    // Getters
    isInCompetitionContext,

    // Actions
    setShowSidebar,
    setProfileModal,
    setActiveRailItem,
    setCompetitionContext,
    clearCompetitionContext,
    setCompetitionData,
  };
});
```

**Key Features**:
- Sidebar visibility state
- Active rail item tracking
- Competition context (IDs + data)
- Profile modal state
- Context detection

### 4.2 Integration with Existing Stores

Modify `SeasonDetail.vue` to populate navigation store:

```typescript
// In loadSeason() success callback
import { useNavigationStore } from '@app/stores/navigationStore';

const navigationStore = useNavigationStore();

// After successfully loading season
if (season.value) {
  navigationStore.setCompetitionData(
    season.value.competition,
    season.value
  );
}
```

---

## 5. Migration Strategy

### 5.1 Backward Compatibility

**Phase 1: Additive Changes** (No Breaking Changes)
1. Create new layout components alongside existing Header.vue
2. Add navigationStore without removing existing code
3. Test new layout in isolation

**Phase 2: Feature Flag** (Optional)
1. Add environment variable `VITE_NEW_NAVIGATION=true`
2. Conditionally render AppLayout vs. old layout
3. Allow rollback if issues arise

**Phase 3: Migration**
1. Replace `App.vue` to use `AppLayout.vue`
2. Remove old `Header.vue` (keep for reference during testing)
3. Update all views to work with new layout

**Phase 4: Cleanup**
1. Remove feature flag
2. Delete old Header.vue
3. Remove unused styles

### 5.2 Testing Checklist

**Component Tests** (Vitest):
- [ ] IconRail renders correctly
- [ ] RailItem active states work
- [ ] Sidebar shows/hides based on context
- [ ] SidebarLink navigation works
- [ ] NavigationStore state updates

**Integration Tests**:
- [ ] Navigate from home to league detail → sidebar hidden
- [ ] Navigate from league to season → sidebar shown
- [ ] Sidebar shows correct competition/season name
- [ ] Rail active states match current route
- [ ] Profile modal opens from rail
- [ ] Logout works from rail

**Visual Regression Tests** (Manual):
- [ ] Layout matches design reference
- [ ] Active states match design
- [ ] Hover states work
- [ ] Responsive behavior (if applicable)
- [ ] Dark theme consistency

---

## 6. File Structure

### 6.1 Files to Create

```
resources/app/js/
├── components/
│   └── layout/
│       ├── AppLayout.vue            [NEW] Main three-column layout
│       ├── IconRail.vue             [NEW] 64px icon rail
│       ├── RailItem.vue             [NEW] Rail navigation item
│       ├── Sidebar.vue              [NEW] 240px sidebar panel
│       └── SidebarLink.vue          [NEW] Sidebar navigation link
├── composables/
│   └── useNavigation.ts             [NEW] Navigation context composable
├── stores/
│   └── navigationStore.ts           [NEW] Navigation state management
├── views/
│   └── season/                      [NEW DIRECTORY]
│       ├── RoundsView.vue           [NEW] Extracted from SeasonDetail.vue
│       ├── StandingsView.vue        [NEW] Extracted from SeasonDetail.vue
│       ├── DriversView.vue          [NEW] Extracted from SeasonDetail.vue
│       ├── DivisionsTeamsView.vue   [NEW] Extracted from SeasonDetail.vue
│       └── SettingsView.vue         [NEW] Extracted from SeasonDetail.vue
└── types/
    └── navigation.ts                [NEW] Navigation-specific types
```

### 6.2 Files to Modify

```
resources/app/js/
├── components/
│   └── App.vue                      [MODIFY] Replace with AppLayout
├── router/
│   └── index.ts                     [MODIFY] Add nested routes + meta fields
├── views/
│   └── SeasonDetail.vue             [MODIFY] Extract tabs into separate views
└── css/
    └── app.css                      [MODIFY] Add layout variables
```

### 6.3 Files to Remove (After Migration)

```
resources/app/js/
└── components/
    └── layout/
        └── Header.vue               [REMOVE] Replaced by AppLayout + IconRail
```

---

## 7. Implementation Order

### Step 1: Foundation (No UI Changes)
**Duration**: 1-2 hours

1. **Create navigationStore.ts**
   - Define state structure
   - Add actions for context management
   - Write unit tests

2. **Create useNavigation.ts composable**
   - Implement route parameter detection
   - Add store integration
   - Test context detection logic

3. **Update router meta fields**
   - Add `requiresCompetitionContext` to relevant routes
   - Update TypeScript declarations

**Checkpoint**: Run tests, ensure no regressions

---

### Step 2: Layout Components (Isolated)
**Duration**: 3-4 hours

4. **Create RailItem.vue**
   - Implement basic component
   - Add styles
   - Write component tests

5. **Create IconRail.vue**
   - Add navigation items
   - Integrate with navigationStore
   - Test active states and click handlers

6. **Create SidebarLink.vue**
   - Implement router-link integration
   - Add tag badge support
   - Write component tests

7. **Create Sidebar.vue**
   - Add header with competition/season name
   - Implement navigation sections
   - Test conditional rendering

8. **Create AppLayout.vue**
   - Assemble three-column layout
   - Integrate IconRail and Sidebar
   - Add Toast/ConfirmDialog

**Checkpoint**: Storybook/isolated testing of components

---

### Step 3: Router Integration
**Duration**: 2-3 hours

9. **Add nested routes for season views**
   - Create route structure with children
   - Add redirects and meta fields

10. **Extract SeasonDetail.vue tabs into separate views**
    - Create `RoundsView.vue`
    - Create `StandingsView.vue`
    - Create `DriversView.vue`
    - Create `DivisionsTeamsView.vue`
    - Create `SettingsView.vue`

11. **Update SeasonDetail.vue**
    - Remove tab logic
    - Use `<router-view>` for nested routes
    - Populate navigationStore with competition/season data

**Checkpoint**: Test navigation between season views

---

### Step 4: Integration & Migration
**Duration**: 2-3 hours

12. **Update App.vue**
    - Replace current structure with AppLayout
    - Move Toast/ConfirmDialog to AppLayout
    - Remove old Header import

13. **Add router afterEach guard**
    - Implement sidebar visibility logic
    - Test on all routes

14. **Update CSS**
    - Add layout variables to app.css
    - Test responsive behavior

**Checkpoint**: Full integration testing

---

### Step 5: Testing & Refinement
**Duration**: 2-4 hours

15. **Write component tests**
    - IconRail navigation tests
    - Sidebar context tests
    - NavigationStore tests

16. **Manual testing**
    - Test all navigation paths
    - Verify active states
    - Check profile modal
    - Test logout flow

17. **Visual QA**
    - Compare with design reference
    - Check hover/active states
    - Verify spacing and colors

18. **Performance testing**
    - Check for layout shifts
    - Verify smooth transitions
    - Test with slow network

**Checkpoint**: All tests passing, visual QA approved

---

### Step 6: Cleanup
**Duration**: 1 hour

19. **Remove old Header.vue**
20. **Update documentation**
21. **Remove feature flags (if used)**
22. **Final commit and PR**

---

## 8. TypeScript Types

Create `resources/app/js/types/navigation.ts`:

```typescript
import type { Component } from 'vue';

export interface NavItem {
  id: string;
  label: string;
  icon: Component;
  route?: string;
  action?: () => void;
  tooltip?: string;
}

export interface SidebarNavItem {
  id: string;
  to: string;
  icon: Component;
  label: string;
  tag?: string | number;
  tagVariant?: 'default' | 'warning';
}

export interface NavigationContext {
  leagueId: number | null;
  competitionId: number | null;
  seasonId: number | null;
}

export interface CompetitionContext extends NavigationContext {
  competitionName: string;
  seasonName: string;
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests (Vitest)

**navigationStore.test.ts**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNavigationStore } from '../navigationStore';

describe('NavigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with correct defaults', () => {
    const store = useNavigationStore();
    expect(store.showSidebar).toBe(false);
    expect(store.isInCompetitionContext).toBe(false);
  });

  it('sets competition context correctly', () => {
    const store = useNavigationStore();
    store.setCompetitionContext(1, 2, 3);
    expect(store.leagueId).toBe(1);
    expect(store.competitionId).toBe(2);
    expect(store.seasonId).toBe(3);
    expect(store.showSidebar).toBe(true);
    expect(store.isInCompetitionContext).toBe(true);
  });

  it('clears competition context', () => {
    const store = useNavigationStore();
    store.setCompetitionContext(1, 2, 3);
    store.clearCompetitionContext();
    expect(store.leagueId).toBe(null);
    expect(store.showSidebar).toBe(false);
  });
});
```

**IconRail.test.ts**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import IconRail from '../IconRail.vue';

describe('IconRail', () => {
  it('renders navigation items', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    });

    const wrapper = mount(IconRail, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('.icon-rail').exists()).toBe(true);
    expect(wrapper.findAll('.rail-item').length).toBeGreaterThan(0);
  });

  it('shows active state for current route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      ],
    });

    await router.push('/');

    const wrapper = mount(IconRail, {
      global: {
        plugins: [router],
      },
    });

    // Verify active class is applied
    expect(wrapper.find('.rail-item.active').exists()).toBe(true);
  });
});
```

### 9.2 Integration Tests

Test complete navigation flows:
- Home → League → Season (sidebar appears)
- Season → Home (sidebar disappears)
- Rail item clicks navigate correctly
- Sidebar links navigate correctly
- Profile modal opens/closes

---

## 10. Edge Cases & Considerations

### 10.1 Responsive Design

**Current Plan**: Desktop-first (64px rail + 240px sidebar)

**Future Considerations**:
- Mobile: Collapse rail to hamburger menu
- Tablet: Keep rail, make sidebar collapsible
- Add `useBreakpoint` composable for responsive logic

### 10.2 Accessibility

**Requirements**:
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] ARIA labels for icon-only buttons
- [ ] Screen reader announcements for route changes
- [ ] Focus management (trap focus in modal)
- [ ] High contrast mode support

**Implementation**:
```vue
<!-- RailItem.vue -->
<button
  v-tooltip.right="tooltip"
  class="rail-item"
  :aria-label="tooltip"
  :aria-current="active ? 'page' : undefined"
>
```

### 10.3 Performance

**Optimizations**:
- Lazy load sidebar only when needed
- Use `v-show` instead of `v-if` for sidebar (avoid re-renders)
- Memoize navigation items with `computed`
- Use `shallowRef` for icon components

### 10.4 Error Handling

**Scenarios**:
- Competition/season data fails to load
- Invalid route parameters
- Store initialization fails

**Handling**:
- Show fallback UI in sidebar ("Competition Unavailable")
- Gracefully hide sidebar if context is missing
- Log errors to console for debugging

---

## 11. Success Criteria

### Definition of Done

- [ ] All new components created and tested
- [ ] NavigationStore implemented and tested
- [ ] Router updated with nested routes
- [ ] App.vue migrated to use AppLayout
- [ ] Old Header.vue removed
- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Visual QA matches design reference
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance metrics acceptable (<100ms layout shift)
- [ ] Documentation updated
- [ ] PR approved and merged

---

## 12. Rollback Plan

If critical issues arise:

1. **Revert App.vue** to use old Header.vue
2. **Disable navigationStore** initialization
3. **Remove nested routes** (keep flat structure)
4. **Redeploy** previous version
5. **Investigate** issues in staging environment
6. **Fix** and re-test before re-attempting migration

**Rollback Trigger**:
- Navigation completely broken
- Sidebar causes infinite loops
- Performance degradation >500ms
- Critical accessibility issues

---

## 13. Post-Migration Enhancements

**Phase 2 Features** (Future):
- Search bar in sidebar
- Recent competitions/seasons
- Keyboard shortcuts (Cmd+K for search)
- Sidebar collapse/expand animation
- Dark mode toggle in rail
- User preferences (sidebar width, collapsed state)
- Mobile responsive navigation

---

## Appendix: Code Snippets

### Example: Extracting Rounds Tab from SeasonDetail.vue

**Before** (SeasonDetail.vue):
```vue
<TabPanel value="rounds">
  <RoundsPanel :season-id="seasonId" />
</TabPanel>
```

**After** (RoundsView.vue):
```vue
<template>
  <div class="rounds-view">
    <RoundsPanel :season-id="seasonId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import RoundsPanel from '@app/components/round/RoundsPanel.vue';

const route = useRoute();
const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
</script>
```

**SeasonDetail.vue** (simplified):
```vue
<template>
  <div class="season-detail">
    <Breadcrumbs :items="breadcrumbItems" />
    <CompetitionHeader />

    <!-- Nested router view replaces tabs -->
    <router-view />
  </div>
</template>
```

---

## Summary

This plan provides a complete, step-by-step implementation strategy for migrating from the current header-based navigation to the Technical Blueprint three-column layout. The approach is:

1. **Non-breaking**: Build new components alongside existing code
2. **Testable**: Each component is independently tested
3. **Incremental**: Can be rolled out in phases
4. **Reversible**: Clear rollback plan if issues arise
5. **Future-proof**: Designed for extensibility (mobile, search, etc.)

**Estimated Total Time**: 12-18 hours of development + testing

**Key Risks**:
- Route refactoring may break existing deep links
- Sidebar context detection may have edge cases
- Performance impact of additional components

**Mitigation**:
- Comprehensive testing at each step
- Feature flag for gradual rollout
- Performance monitoring during migration
