<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';

const headingLevels = [1, 2, 3, 4, 5, 6] as const;
</script>

<template>
  <section id="typography" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Typography</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        VrlHeading component provides consistent heading styles with multiple variants and sizes.
      </p>
    </div>

    <!-- VrlHeading Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlHeading</VrlHeading>
      <p class="theme-text-muted mb-6">
        Responsive heading component with semantic HTML and racing-inspired typography.
      </p>

      <!-- Variants -->
      <div class="space-y-8">
        <div>
          <VrlHeading
            :level="4"
            as="div"
            class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
          >
            Variants
          </VrlHeading>
          <div class="space-y-6 theme-bg-tertiary p-6 rounded-sm">
            <div>
              <VrlHeading :level="1" variant="hero">Hero Variant</VrlHeading>
              <p class="text-xs font-data theme-text-dim mt-2">
                variant="hero" - Large hero section headings
              </p>
            </div>
            <div>
              <VrlHeading :level="2" variant="section">Section Variant</VrlHeading>
              <p class="text-xs font-data theme-text-dim mt-2">
                variant="section" - Section headers
              </p>
            </div>
            <div>
              <VrlHeading :level="3" variant="card">Card Variant</VrlHeading>
              <p class="text-xs font-data theme-text-dim mt-2">
                variant="card" - Card titles and smaller headings
              </p>
            </div>
          </div>
        </div>

        <!-- Semantic Levels -->
        <div>
          <VrlHeading
            :level="4"
            as="div"
            class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
          >
            Semantic Levels (Default Variant)
          </VrlHeading>
          <div class="space-y-4 theme-bg-tertiary p-6 rounded-sm">
            <div v-for="level in headingLevels" :key="level">
              <VrlHeading :level="level"> Heading Level {{ level }} </VrlHeading>
              <p class="text-xs font-data theme-text-dim mt-1">:level="{{ level }}"</p>
            </div>
          </div>
        </div>

        <!-- Custom Element -->
        <div>
          <VrlHeading
            :level="4"
            as="div"
            class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
          >
            Custom Element with "as" Prop
          </VrlHeading>
          <div class="theme-bg-tertiary p-6 rounded-sm space-y-3">
            <VrlHeading :level="2" as="div" variant="section"> Rendered as &lt;div&gt; </VrlHeading>
            <p class="text-xs font-data theme-text-dim">
              :level="2" as="div" - Semantic h2 styling on a div element
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
