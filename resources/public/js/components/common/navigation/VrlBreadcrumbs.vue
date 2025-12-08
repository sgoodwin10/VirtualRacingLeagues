<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import { PhCaretRight, PhHouse } from '@phosphor-icons/vue';

export interface BreadcrumbItem {
  label: string;
  to?: string | RouteLocationRaw;
}

interface Props {
  items: BreadcrumbItem[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

// Check if item is the last (current page)
const isLast = (index: number): boolean => {
  return index === props.items.length - 1;
};
</script>

<template>
  <nav :class="['flex', 'items-center', 'gap-2', 'flex-wrap', props.class]" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="index">
      <!-- Breadcrumb item -->
      <component
        :is="!isLast(index) && item.to ? RouterLink : 'span'"
        :to="item.to"
        :class="[
          'flex',
          'items-center',
          'gap-1.5',
          'font-data',
          'text-[11px]',
          !isLast(index) && item.to
            ? 'hover:text-racing-gold transition-colors cursor-pointer'
            : '',
          isLast(index) ? 'font-medium' : '',
        ]"
        :style="isLast(index) ? 'color: var(--text-primary)' : 'color: var(--text-dim)'"
        :aria-current="isLast(index) ? 'page' : undefined"
      >
        <!-- Home icon for first item -->
        <PhHouse v-if="index === 0" :size="14" class="text-sm" />

        <!-- Label -->
        {{ item.label }}
      </component>

      <!-- Separator (not after last item) -->
      <PhCaretRight
        v-if="!isLast(index)"
        :size="12"
        class="text-xs"
        style="color: var(--text-dim)"
      />
    </template>
  </nav>
</template>

<style scoped>
.hover\:text-racing-gold:hover {
  color: var(--racing-gold);
}
</style>
