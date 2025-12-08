<template>
  <section
    class="relative pt-[calc(var(--header-height)+4rem)] pb-16 border-b border-[var(--color-tarmac)]"
    :style="backgroundStyles"
  >
    <!-- Background Image Overlay (if provided) -->
    <div
      v-if="backgroundImage"
      class="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-asphalt)]/80 to-[var(--color-asphalt)]"
    ></div>

    <!-- Content Container -->
    <div class="container-racing relative z-10">
      <div class="max-w-[600px]">
        <!-- Label -->
        <span
          v-if="label"
          class="font-display text-[0.625rem] uppercase tracking-[0.3em] text-[var(--color-gold)] block mb-2"
        >
          {{ label }}
        </span>

        <!-- Title -->
        <h1 class="text-[clamp(2rem,5vw,3rem)] mb-4 font-display uppercase leading-tight">
          {{ title }}
        </h1>

        <!-- Description -->
        <p v-if="description" class="text-base text-[var(--color-barrier)] leading-relaxed">
          {{ description }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  backgroundImage?: string;
}

const props = withDefaults(defineProps<PageHeaderProps>(), {
  label: undefined,
  description: undefined,
  backgroundImage: undefined,
});

const backgroundStyles = computed(() => {
  if (!props.backgroundImage) {
    return {
      backgroundColor: 'var(--color-asphalt)',
    };
  }

  return {
    backgroundImage: `url(${props.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
});
</script>
