<script setup lang="ts">
import { ref } from 'vue';
import VrlHeading from '@public/components/typography/VrlHeading.vue';
import VrlButton from '@public/components/buttons/VrlButton.vue';
import VrlIconButton from '@public/components/buttons/VrlIconButton.vue';

const loadingDemo = ref(false);
const disabledDemo = ref(false);

const handleLoadingToggle = () => {
  loadingDemo.value = true;
  setTimeout(() => {
    loadingDemo.value = false;
  }, 2000);
};
</script>

<template>
  <section id="buttons" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Buttons</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Racing-inspired button components with angled edges, multiple variants, and interactive
        states.
      </p>
    </div>

    <!-- VrlButton Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlButton</VrlHeading>
      <p class="theme-text-muted mb-6">
        Primary button component with variants, sizes, icons, and loading states.
      </p>

      <!-- Variants -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Variants
        </VrlHeading>
        <div class="flex flex-wrap gap-4">
          <VrlButton variant="primary">Primary</VrlButton>
          <VrlButton variant="secondary">Secondary</VrlButton>
          <VrlButton variant="ghost">Ghost</VrlButton>
          <VrlButton variant="text">Text</VrlButton>
          <VrlButton variant="danger">Danger</VrlButton>
          <VrlButton variant="danger-outline">Danger Outline</VrlButton>
          <VrlButton variant="social">Social</VrlButton>
        </div>
      </div>

      <!-- Sizes -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Sizes
        </VrlHeading>
        <div class="flex flex-wrap items-center gap-4">
          <VrlButton size="xs">Extra Small</VrlButton>
          <VrlButton size="sm">Small</VrlButton>
          <VrlButton size="md">Medium</VrlButton>
          <VrlButton size="lg">Large</VrlButton>
          <VrlButton size="xl">Extra Large</VrlButton>
        </div>
      </div>

      <!-- With Icons -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          With Icons
        </VrlHeading>
        <div class="flex flex-wrap gap-4">
          <VrlButton icon="plus" icon-pos="left">Add Item</VrlButton>
          <VrlButton icon="eye" variant="secondary">View Details</VrlButton>
          <VrlButton icon="trash" variant="danger">Delete</VrlButton>
          <VrlButton icon="share-network" icon-pos="right" variant="ghost">Share</VrlButton>
        </div>
      </div>

      <!-- States -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          States
        </VrlHeading>
        <div class="flex flex-wrap gap-4">
          <VrlButton :disabled="disabledDemo">Disabled</VrlButton>
          <VrlButton :loading="loadingDemo" @click="handleLoadingToggle">
            {{ loadingDemo ? 'Loading...' : 'Trigger Loading' }}
          </VrlButton>
        </div>
        <div class="mt-4 p-4 theme-bg-tertiary rounded-sm">
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="disabledDemo" type="checkbox" class="w-4 h-4 theme-accent-gold" />
            <span class="text-sm theme-text-secondary">Toggle disabled state</span>
          </label>
        </div>
      </div>

      <!-- Social Buttons -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Social Links
        </VrlHeading>
        <div class="flex flex-wrap gap-3">
          <VrlButton variant="social" icon="discord-logo" size="sm">Discord</VrlButton>
          <VrlButton variant="social" icon="twitter-logo" size="sm">Twitter</VrlButton>
          <VrlButton variant="social" icon="youtube-logo" size="sm">YouTube</VrlButton>
        </div>
      </div>
    </div>

    <!-- VrlIconButton Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlIconButton</VrlHeading>
      <p class="theme-text-muted mb-6">Icon-only button component with multiple shape variants.</p>

      <!-- Variants -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Variants
        </VrlHeading>
        <!-- eslint-disable vue/attribute-hyphenation -->
        <div class="flex flex-wrap gap-4">
          <VrlIconButton icon="plus" variant="angled" ariaLabel="Add" />
          <VrlIconButton icon="eye" variant="rounded" ariaLabel="View" />
          <VrlIconButton icon="star" variant="circular" ariaLabel="Favorite" />
          <VrlIconButton icon="pencil-simple" variant="gold-outline" ariaLabel="Edit" />
          <VrlIconButton icon="gear" variant="ghost" ariaLabel="Settings" />
          <VrlIconButton icon="trash" variant="danger" ariaLabel="Delete" />
        </div>
        <!-- eslint-enable vue/attribute-hyphenation -->
      </div>

      <!-- Sizes -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Sizes
        </VrlHeading>
        <!-- eslint-disable vue/attribute-hyphenation -->
        <div class="flex flex-wrap items-center gap-4">
          <VrlIconButton icon="plus" size="xs" ariaLabel="Add" />
          <VrlIconButton icon="plus" size="sm" ariaLabel="Add" />
          <VrlIconButton icon="plus" size="md" ariaLabel="Add" />
          <VrlIconButton icon="plus" size="lg" ariaLabel="Add" />
        </div>
        <!-- eslint-enable vue/attribute-hyphenation -->
      </div>

      <!-- Common Use Cases -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Common Use Cases
        </VrlHeading>
        <!-- eslint-disable vue/attribute-hyphenation -->
        <div class="flex flex-wrap gap-4">
          <VrlIconButton icon="x" variant="ghost" ariaLabel="Close" />
          <VrlIconButton icon="share-network" variant="gold-outline" ariaLabel="Share" />
          <VrlIconButton icon="pencil-simple" variant="angled" ariaLabel="Edit" />
          <VrlIconButton icon="trash" variant="danger" ariaLabel="Delete" />
          <VrlIconButton icon="dots-three" variant="ghost" ariaLabel="More options" />
        </div>
        <!-- eslint-enable vue/attribute-hyphenation -->
      </div>
    </div>
  </section>
</template>
