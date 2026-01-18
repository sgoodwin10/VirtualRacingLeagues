<script setup lang="ts">
/**
 * SpeedLines Component
 *
 * Animated horizontal speed lines that traverse the screen.
 * Creates a dynamic racing effect in the background.
 */
</script>

<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
    <div
      v-for="i in 5"
      :key="i"
      :class="[
        'absolute h-0.5 opacity-30',
        'bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent',
        'speed-line',
      ]"
      :style="{
        top: `${i * 20 - 10}%`,
        width: `${150 + i * 50}px`,
        animationDelay: `${(i - 1) * 0.5}s`,
      }"
    />
  </div>
</template>

<style scoped>
.speed-line {
  animation: speedLine 3s linear infinite;
}

@keyframes speedLine {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  10% {
    opacity: 0.4;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translateX(100vw);
    opacity: 0;
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .speed-line {
    animation: none;
    opacity: 0;
  }
}
</style>
