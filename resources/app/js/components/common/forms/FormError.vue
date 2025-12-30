<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  error?: string | string[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: undefined,
  class: '',
});

const errorMessage = computed(() => {
  if (!props.error) return null;
  return Array.isArray(props.error) ? props.error[0] : props.error;
});
</script>

<template>
  <small v-if="errorMessage" :class="['form-error', props.class]">
    {{ errorMessage }}
  </small>
</template>

<style scoped>
.form-error {
  font-size: 12px;
  color: var(--red);
  margin-top: 6px;
  display: block;
}
</style>
