<script setup lang="ts">
import { computed } from 'vue';
import DOMPurify from 'dompurify';
import BasePanel from '@app/components/common/panels/BasePanel.vue';

interface Props {
  leagueName: string;
  description: string | null;
}

const props = defineProps<Props>();

// Sanitize description to prevent XSS attacks
const sanitizedDescription = computed(() => {
  if (!props.description) return null;
  return DOMPurify.sanitize(props.description, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
});
</script>

<template>
  <BasePanel>
    <template #header>
      <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
        <span class="font-medium text-surface-700">About {{ leagueName }}</span>
      </div>
    </template>
    <div v-if="sanitizedDescription" class="prose max-w-none p-4">
      <!-- Safe to use v-html here because content is sanitized with DOMPurify -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="text-gray-700 leading-relaxed" v-html="sanitizedDescription"></div>
    </div>
    <div v-else class="text-gray-500 italic pt-4">No description provided</div>
  </BasePanel>
</template>
