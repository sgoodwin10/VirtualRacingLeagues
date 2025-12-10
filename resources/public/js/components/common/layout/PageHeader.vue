<template>
  <section
    class="relative pt-[calc(var(--header-height)+4rem)] pb-16 border-b theme-border"
    :style="backgroundStyles"
  >
    <!-- Background Image Overlay (if provided) -->
    <div
      v-if="backgroundImage"
      class="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-secondary)]/80 to-[var(--bg-secondary)]"
    ></div>

    <!-- Content Container -->
    <div class="container-racing relative z-10">
      <div class="flex justify-between items-start gap-8 flex-wrap">
        <!-- Left: Logo + Info Section -->
        <div
          class="flex items-start gap-6 flex-1 min-w-0"
          :class="{ 'flex-col md:flex-row': logoUrl }"
        >
          <!-- Logo (if provided) -->
          <div v-if="logoUrl" class="flex-shrink-0">
            <img
              :src="logoUrl"
              :alt="`${title} logo`"
              class="w-20 h-20 md:w-[100px] md:h-[100px] object-contain rounded-md bg-[var(--bg-primary)] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            />
          </div>

          <!-- Info Section -->
          <div class="max-w-[600px] flex-1 min-w-0" :class="{ 'pt-1': logoUrl && !isMobile }">
            <!-- Label -->
            <span
              v-if="label"
              class="font-display text-[0.625rem] uppercase tracking-[0.3em] theme-accent-gold block mb-2"
            >
              {{ label }}
            </span>

            <!-- Title -->
            <h1
              class="text-[clamp(2rem,5vw,3rem)] mb-2 font-display uppercase leading-tight theme-text-primary"
            >
              {{ title }}
            </h1>

            <!-- Description -->
            <p v-if="description" class="text-base theme-text-muted leading-relaxed">
              {{ description }}
            </p>
          </div>
        </div>

        <!-- Right: Social Links Slot -->
        <slot name="social-links"></slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBreakpoints } from '@vueuse/core';

interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  backgroundImage?: string;
  logoUrl?: string;
}

const props = withDefaults(defineProps<PageHeaderProps>(), {
  label: undefined,
  description: undefined,
  backgroundImage: undefined,
  logoUrl: undefined,
});

const breakpoints = useBreakpoints({
  tablet: 768,
});

const isMobile = breakpoints.smaller('tablet');

const backgroundStyles = computed(() => {
  if (!props.backgroundImage) {
    return {
      backgroundColor: 'var(--bg-secondary)',
    };
  }

  try {
    // Parse URL to validate its format
    const url = new URL(props.backgroundImage, window.location.origin);

    // Only allow http: and https: protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      console.warn('Unsafe URL protocol blocked:', url.protocol);
      return {
        backgroundColor: 'var(--bg-secondary)',
      };
    }

    // The URL constructor validates the URL structure and protocol
    // We use the validated URL directly - it's safe because:
    // 1. Protocol is restricted to http/https
    // 2. URL constructor parses and validates the format
    // 3. Modern browsers handle special characters in CSS url() correctly
    const sanitizedUrl = url.href;

    return {
      backgroundImage: `url("${sanitizedUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  } catch {
    console.warn('Invalid background image URL:', props.backgroundImage);
    return {
      backgroundColor: 'var(--bg-secondary)',
    };
  }
});
</script>
