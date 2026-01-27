<script setup lang="ts">
import { computed } from 'vue';
import Breadcrumbs, { type BreadcrumbItem } from '@app/components/common/Breadcrumbs.vue';

/**
 * Props for the HeaderBar component
 */
interface Props {
  /**
   * Array of breadcrumb items to display in the header
   * Optional - if not provided, no breadcrumbs will be shown
   */
  breadcrumbs?: BreadcrumbItem[];
}

const props = withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [],
});

/**
 * Whether to show breadcrumbs section
 */
const showBreadcrumbs = computed(() => props.breadcrumbs && props.breadcrumbs.length > 0);
</script>

<template>
  <header class="header-bar">
    <!-- Left side - Breadcrumbs -->
    <div v-if="showBreadcrumbs" class="header-left">
      <Breadcrumbs :items="breadcrumbs" />
    </div>
    <div v-else class="header-left" />

    <!-- Right side - Action buttons slot -->
    <div class="header-right">
      <slot name="actions" />

      <div class="font-logo text-xl flex items-center">
        <img src="/images/logo/64.png" alt="SimGrid Logo" class="w-6 h-6 mr-1" />
        <span class="text-cyan">SimGrid</span>
        <span class="text-gray-400">Manager</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  min-height: 60px;
}

.header-left {
  flex: 1;
  min-width: 0; /* Allow truncation if needed */
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
