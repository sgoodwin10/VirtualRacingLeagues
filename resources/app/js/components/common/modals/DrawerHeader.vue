<script setup lang="ts">
import HTag from '@app/components/common/HTag.vue';

/**
 * Props for the DrawerHeader component
 */
interface Props {
  /**
   * Main heading text displayed in the drawer header
   */
  title: string;

  /**
   * Optional subtitle text displayed below the title
   * Provides additional context or instructions
   */
  subtitle?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="container mx-auto flex flex-col max-w-7xl px-12">
    <HTag :level="2" additional-classes="mb-1">{{ title }}</HTag>
    <p v-if="subtitle" class="text-gray-600">{{ subtitle }}</p>
  </div>
</template>
