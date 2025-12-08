<script setup lang="ts">
import { ref } from 'vue';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlIconButton from '@public/components/common/buttons/VrlIconButton.vue';
import PropTable, { type PropDefinition } from '@public/components/common/demo/PropTable.vue';
import CodeExample from '@public/components/common/demo/CodeExample.vue';

const loadingDemo = ref(false);
const disabledDemo = ref(false);

const handleLoadingToggle = () => {
  loadingDemo.value = true;
  setTimeout(() => {
    loadingDemo.value = false;
  }, 2000);
};

// VrlButton prop definitions
const buttonProps: PropDefinition[] = [
  {
    name: 'variant',
    type: "'primary' | 'secondary' | 'ghost' | 'text' | 'danger' | 'danger-outline' | 'social'",
    default: "'primary'",
    description:
      'Button visual style. Primary has safety orange color with angled clip-path, secondary has gold outline.',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description: 'Button size: xs (28px), sm (34px), md (40px), lg (48px), xl (56px).',
  },
  {
    name: 'icon',
    type: 'string',
    description:
      "Phosphor icon name to display. Available: 'plus', 'eye', 'trash', 'dots-three', 'pencil-simple', 'gear', 'share-network', 'x', 'star', 'discord-logo', 'twitter-logo', 'youtube-logo'.",
  },
  {
    name: 'iconPos',
    type: "'left' | 'right'",
    default: "'left'",
    description: 'Icon position relative to button text.',
  },
  {
    name: 'loading',
    type: 'boolean',
    default: 'false',
    description: 'Show loading state and disable interaction.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Disable button interaction.',
  },
  {
    name: 'type',
    type: "'button' | 'submit' | 'reset'",
    default: "'button'",
    description: 'HTML button type attribute.',
  },
];

// VrlIconButton prop definitions
const iconButtonProps: PropDefinition[] = [
  {
    name: 'icon',
    type: 'string',
    required: true,
    description: 'Phosphor icon name to display (required).',
  },
  {
    name: 'aria-label',
    type: 'string',
    required: true,
    description: 'ARIA label for accessibility (required).',
  },
  {
    name: 'variant',
    type: "'angled' | 'rounded' | 'circular' | 'gold-outline' | 'ghost' | 'danger'",
    default: "'angled'",
    description:
      'Button visual style. Angled has clip-path polygon, circular is rounded-full, gold-outline has gold border.',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg'",
    default: "'md'",
    description: 'Button size: xs (28px), sm (36px), md (40px), lg (48px).',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Disable button interaction.',
  },
];
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
      <div class="mb-8">
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

      <!-- Code Examples -->
      <div class="mb-8 space-y-4">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Code Examples
        </VrlHeading>
        <CodeExample
          title="Basic Button"
          :code="`<VrlButton variant=&quot;primary&quot;>Click Me</VrlButton>`"
        />
        <CodeExample
          title="Button with Icon"
          :code="`<VrlButton icon=&quot;plus&quot; icon-pos=&quot;left&quot; variant=&quot;secondary&quot;>\n  Add Item\n</VrlButton>`"
        />
        <CodeExample
          title="Loading State"
          :code="`<VrlButton :loading=&quot;isLoading&quot; @click=&quot;handleSubmit&quot;>\n  {{ isLoading ? 'Saving...' : 'Save Changes' }}\n</VrlButton>`"
        />
      </div>

      <!-- Props Table -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Props
        </VrlHeading>
        <PropTable :props="buttonProps" />
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
      <div class="mb-8">
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

      <!-- Code Examples -->
      <div class="mb-8 space-y-4">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Code Examples
        </VrlHeading>
        <CodeExample
          title="Icon Button"
          :code="`<VrlIconButton icon=&quot;plus&quot; variant=&quot;angled&quot; aria-label=&quot;Add&quot; />`"
        />
        <CodeExample
          title="Multiple Variants"
          :code="`<VrlIconButton icon=&quot;star&quot; variant=&quot;circular&quot; aria-label=&quot;Favorite&quot; />\n<VrlIconButton icon=&quot;pencil-simple&quot; variant=&quot;gold-outline&quot; aria-label=&quot;Edit&quot; />\n<VrlIconButton icon=&quot;trash&quot; variant=&quot;danger&quot; aria-label=&quot;Delete&quot; />`"
        />
      </div>

      <!-- Props Table -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Props
        </VrlHeading>
        <PropTable :props="iconButtonProps" />
      </div>
    </div>
  </section>
</template>
