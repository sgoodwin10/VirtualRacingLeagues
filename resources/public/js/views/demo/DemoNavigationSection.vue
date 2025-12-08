<script setup lang="ts">
import { ref } from 'vue';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import VrlBreadcrumbs, {
  type BreadcrumbItem,
} from '@public/components/common/navigation/VrlBreadcrumbs.vue';
import VrlTabs, { type TabItem } from '@public/components/common/navigation/VrlTabs.vue';
import VrlCard from '@public/components/common/cards/VrlCard.vue';
import {
  PhFlagCheckered,
  PhUsers,
  PhChartLine,
  PhCheckCircle,
  PhXCircle,
  PhStar,
} from '@phosphor-icons/vue';

// Breadcrumb examples
const simpleBreadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Leagues', to: '/leagues' },
  { label: 'GT Masters Cup' },
];

const longBreadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Leagues', to: '/leagues' },
  { label: 'GT Masters Cup', to: '/leagues/gt-masters' },
  { label: 'Season 2024', to: '/leagues/gt-masters/2024' },
  { label: 'Round 5' },
];

// Tabs example
const activeTab = ref(0);
const demoTabs: TabItem[] = [
  { label: 'Competitions' },
  { label: 'Drivers', count: 78 },
  { label: 'Statistics' },
];

const tabsWithDisabled: TabItem[] = [
  { label: 'Active' },
  { label: 'Disabled', disabled: true },
  { label: 'Another' },
];
const disabledTabIndex = ref(0);
</script>

<template>
  <section id="navigation" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Navigation</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Navigation components for breadcrumbs, tabs, and menus.
      </p>
    </div>

    <!-- VrlBreadcrumbs -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-muted"
        >VrlBreadcrumbs - Breadcrumb Navigation</VrlHeading
      >

      <div class="space-y-4">
        <!-- Simple breadcrumbs -->
        <VrlCard :hoverable="false" class="p-4 sm:p-6">
          <p class="font-data text-xs theme-text-dim uppercase tracking-wider mb-3">
            Simple (3 items)
          </p>
          <VrlBreadcrumbs :items="simpleBreadcrumbs" />
        </VrlCard>

        <!-- Long breadcrumbs -->
        <VrlCard :hoverable="false" class="p-4 sm:p-6">
          <p class="font-data text-xs theme-text-dim uppercase tracking-wider mb-3">
            Deep navigation (5 items)
          </p>
          <VrlBreadcrumbs :items="longBreadcrumbs" />
        </VrlCard>
      </div>
    </div>

    <!-- VrlTabs -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-muted"
        >VrlTabs - Tab Navigation</VrlHeading
      >

      <div class="space-y-6">
        <!-- Standard tabs with content -->
        <div>
          <p class="font-data text-xs theme-text-dim uppercase tracking-wider mb-3">
            With icons and counts
          </p>
          <VrlTabs v-model="activeTab" :tabs="demoTabs">
            <template #icon-0="{ active }">
              <PhFlagCheckered :size="14" :weight="active ? 'fill' : 'regular'" />
            </template>
            <template #icon-1="{ active }">
              <PhUsers :size="14" :weight="active ? 'fill' : 'regular'" />
            </template>
            <template #icon-2="{ active }">
              <PhChartLine :size="14" :weight="active ? 'fill' : 'regular'" />
            </template>
            <template #tab-0>
              <div class="space-y-2">
                <p class="theme-text-secondary">
                  <strong>Competitions Panel</strong>
                </p>
                <p class="text-sm theme-text-muted">
                  View all active and upcoming competitions in the league.
                </p>
              </div>
            </template>
            <template #tab-1>
              <div class="space-y-2">
                <p class="theme-text-secondary">
                  <strong>Drivers Panel</strong>
                </p>
                <p class="text-sm theme-text-muted">
                  Browse the 78 registered drivers and their statistics.
                </p>
              </div>
            </template>
            <template #tab-2>
              <div class="space-y-2">
                <p class="theme-text-secondary">
                  <strong>Statistics Panel</strong>
                </p>
                <p class="text-sm theme-text-muted">Detailed analytics and performance metrics.</p>
              </div>
            </template>
          </VrlTabs>
        </div>

        <!-- Tabs with disabled state -->
        <div>
          <p class="font-data text-xs theme-text-dim uppercase tracking-wider mb-3">
            With disabled tab
          </p>
          <VrlTabs v-model="disabledTabIndex" :tabs="tabsWithDisabled">
            <template #icon-0="{ active }">
              <PhCheckCircle :size="14" :weight="active ? 'fill' : 'regular'" />
            </template>
            <template #icon-1="{ active }">
              <PhXCircle :size="14" :weight="active ? 'fill' : 'regular'" />
            </template>
            <template #icon-2="{ active }">
              <PhStar :size="14" :weight="active ? 'fill' : 'regular'" />
            </template>
            <template #tab-0>
              <p class="text-sm theme-text-muted">This is the active tab content.</p>
            </template>
            <template #tab-1>
              <p class="text-sm theme-text-muted">This won't show - tab is disabled.</p>
            </template>
            <template #tab-2>
              <p class="text-sm theme-text-muted">Another enabled tab content.</p>
            </template>
          </VrlTabs>
        </div>
      </div>
    </div>
  </section>
</template>
