<script setup lang="ts">
interface VrlPanelContentProps {
  /** Whether content is visible */
  show: boolean;

  /** Custom CSS class */
  class?: string;
}

const props = defineProps<VrlPanelContentProps>();
</script>

<template>
  <Transition name="panel-collapse">
    <div
      v-show="show"
      :class="['p-5 bg-[var(--bg-card)]', props.class]"
      data-test="vrl-panel-content"
    >
      <slot />
    </div>
  </Transition>
</template>

<style scoped>
.panel-collapse-enter-active,
.panel-collapse-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}

.panel-collapse-enter-from,
.panel-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.panel-collapse-enter-to,
.panel-collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
