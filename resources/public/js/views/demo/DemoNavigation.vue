<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';

interface Section {
  id: string;
  label: string;
}

const emit = defineEmits<{
  scrollTo: [id: string];
}>();

const sections: Section[] = [
  { id: 'theme', label: 'Theme System' },
  { id: 'typography', label: 'Typography' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'badges', label: 'Badges' },
  { id: 'forms', label: 'Forms' },
  { id: 'cards', label: 'Cards' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'data', label: 'Data Display' },
  { id: 'overlays', label: 'Overlays' },
];

const handleSectionClick = (id: string) => {
  emit('scrollTo', id);
};
</script>

<template>
  <section class="py-12 theme-bg-secondary border-y theme-border">
    <div class="container-racing">
      <VrlHeading :level="3" variant="card" class="mb-6 text-center">Quick Navigation</VrlHeading>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          v-for="section in sections"
          :key="section.id"
          class="px-4 py-2 text-xs font-display uppercase tracking-wider theme-bg-tertiary theme-text-muted hover:theme-accent-gold transition-all rounded-sm"
          @click="handleSectionClick(section.id)"
        >
          {{ section.label }}
        </button>
      </div>
    </div>
  </section>
</template>
