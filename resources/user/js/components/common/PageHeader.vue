<script setup lang="ts">
import HTag from '@user/components/common/HTag.vue';

/**
 * Props for the PageHeader component
 */
interface Props {
  /**
   * The main heading text to display
   */
  title: string;

  /**
   * Optional descriptive text to display below the heading
   */
  description?: string;
}

defineProps<Props>();
</script>

<template>
  <div>
    <HTag additional-classes="mb-2">{{ title }}</HTag>
    <p v-if="description" class="text-gray-600">{{ description }}</p>
  </div>
</template>
