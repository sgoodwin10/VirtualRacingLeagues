<script setup lang="ts">
interface Props {
  text?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: undefined,
  class: '',
});
</script>

<template>
  <small v-if="props.text" :class="['form-help', props.class]">
    {{ props.text }}
  </small>
</template>

<style scoped>
.form-help {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}
</style>
