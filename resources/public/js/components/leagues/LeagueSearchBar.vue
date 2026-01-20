<template>
  <div
    class="search-bar flex flex-col sm:flex-row gap-4 mb-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] p-4"
  >
    <!-- Search Input -->
    <div class="search-input-wrapper flex-1 relative">
      <span
        class="search-icon absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
      >
        🔍
      </span>
      <input
        type="text"
        :value="modelValue"
        placeholder="Search leagues by name..."
        class="w-full pl-11 pr-4 py-3 bg-[var(--bg-dark)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-primary)] text-[0.9rem] font-[var(--font-body)] transition-all focus:outline-none focus:border-[var(--cyan)] focus:ring-2 focus:ring-[var(--cyan-dim)] placeholder:text-[var(--text-muted)]"
        @input="handleSearchInput"
      />
    </div>

    <!-- Platform Filter -->
    <select
      :value="platform"
      class="px-4 py-3 bg-[var(--bg-dark)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-primary)] text-[0.9rem] font-[var(--font-body)] cursor-pointer min-w-[150px] focus:outline-none focus:border-[var(--cyan)] focus:ring-2 focus:ring-[var(--cyan-dim)]"
      @change="handlePlatformChange"
    >
      <option :value="null">All Platforms</option>
      <option v-for="p in platforms" :key="p.id" :value="p.id">
        {{ p.name }}
      </option>
    </select>

    <!-- Sort By -->
    <select
      :value="sortBy"
      class="px-4 py-3 bg-[var(--bg-dark)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-primary)] text-[0.9rem] font-[var(--font-body)] cursor-pointer min-w-[150px] focus:outline-none focus:border-[var(--cyan)] focus:ring-2 focus:ring-[var(--cyan-dim)]"
      @change="handleSortChange"
    >
      <option value="popular">Most Popular</option>
      <option value="recent">Recently Active</option>
      <option value="name">Name A-Z</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { Platform } from '@public/types/public';

interface Props {
  modelValue: string;
  platform: string | number | null;
  sortBy: 'popular' | 'recent' | 'name';
  platforms: Platform[];
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'update:platform', value: string | number | null): void;
  (e: 'update:sortBy', value: 'popular' | 'recent' | 'name'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Handle search input changes
 */
const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

/**
 * Handle platform filter changes
 */
const handlePlatformChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value === 'null' || target.value === '' ? null : Number(target.value);
  emit('update:platform', value);
};

/**
 * Handle sort option changes
 */
const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:sortBy', target.value as 'popular' | 'recent' | 'name');
};
</script>
