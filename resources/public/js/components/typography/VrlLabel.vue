<script setup lang="ts">
interface Props {
  for?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  for: undefined,
  required: false,
});
</script>

<template>
  <label
    :for="props.for"
    class="block mb-2 font-display text-[10px] uppercase tracking-wider theme-text-dim"
  >
    <slot />
    <span v-if="props.required" class="text-racing-safety">*</span>
  </label>
</template>
