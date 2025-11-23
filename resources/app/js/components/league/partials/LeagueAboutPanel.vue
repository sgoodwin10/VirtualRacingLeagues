<script setup lang="ts">
import BasePanel from '@app/components/common/panels/BasePanel.vue';

interface Props {
  leagueName: string;
  description: string | null;
}

defineProps<Props>();
</script>

<template>
  <BasePanel>
    <template #header>
      <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
        <span class="font-medium text-surface-700">About {{ leagueName }}</span>
      </div>
    </template>
    <div v-if="description" class="prose max-w-none p-4">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="text-gray-700 leading-relaxed" v-html="description"></div>
    </div>
    <div v-else class="text-gray-500 italic pt-4">No description provided</div>
  </BasePanel>
</template>
