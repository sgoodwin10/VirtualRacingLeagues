<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

interface Props {
  visibility: 'public' | 'private' | 'unlisted';
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'pi pi-eye',
});

const severity = computed((): 'success' | 'warning' | 'info' => {
  switch (props.visibility) {
    case 'public':
      return 'success';
    case 'private':
      return 'warning';
    case 'unlisted':
      return 'info';
    default:
      return 'info';
  }
});

const displayValue = computed(() => props.visibility.toUpperCase());
</script>

<template>
  <Tag :icon="icon" :value="displayValue" :severity="severity" class="text-xs uppercase border" />
</template>
