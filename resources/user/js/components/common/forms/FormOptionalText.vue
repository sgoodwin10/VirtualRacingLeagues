<script setup lang="ts">
interface Props {
  text: string;
  showOptional?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showOptional: true,
  class: 'text-xs text-gray-500',
});
</script>

<template>
  <p :class="props.class">
    <span v-if="showOptional" class="font-medium">Optional:</span>
    {{ ' ' }}{{ text }}
  </p>
</template>
