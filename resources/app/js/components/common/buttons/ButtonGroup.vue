<script setup lang="ts">
interface Props {
  orientation?: 'horizontal' | 'vertical';
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
});
</script>

<template>
  <div class="app-button-group" :class="`app-button-group--${orientation}`">
    <slot />
  </div>
</template>

<style scoped>
/* Button group styles in buttons.css */
</style>
