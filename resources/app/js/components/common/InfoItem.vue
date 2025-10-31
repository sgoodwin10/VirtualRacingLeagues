<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  icon: Component;
  title?: string;
  text: string;
  centered?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="['flex gap-2 bg-slate-50 py-3 px-3 group', { 'justify-center': props.centered }]">
    <component
      :is="icon"
      :size="28"
      class="shrink-0 text-slate-400 group-hover:text-primary-500 transition-colors"
    />
    <div v-if="title" class="flex flex-col space-y-0.5 pl-1 group">
      <span class="text-xs uppercase text-primary-300 group-hover:text-primary-500">{{
        title
      }}</span>
      <span class="text-slate-600 group-hover:text-slate-800">{{ text }}</span>
    </div>
    <div
      v-else
      class="flex items-center text-slate-600 group-hover:text-slate-800 transition-colors"
    >
      {{ text }}
    </div>
  </div>
</template>
