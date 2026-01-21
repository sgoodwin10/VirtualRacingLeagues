<script setup lang="ts">
interface VrlAccordionContentProps {
  /** Whether content is visible */
  show: boolean;

  /** Custom CSS class */
  class?: string;
}

const props = defineProps<VrlAccordionContentProps>();
</script>

<template>
  <Transition name="accordion-collapse">
    <div
      v-show="show"
      :class="['pb-5 text-[var(--text-secondary)] text-[0.9rem] leading-relaxed', props.class]"
      data-test="vrl-accordion-content"
    >
      <slot />
    </div>
  </Transition>
</template>

<style scoped>
.accordion-collapse-enter-active,
.accordion-collapse-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease,
    padding 0.3s ease;
  overflow: hidden;
}

.accordion-collapse-enter-from,
.accordion-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.accordion-collapse-enter-to,
.accordion-collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
