<script setup lang="ts">
import { computed } from 'vue';
import { PhFileText, PhChartBar, PhNote } from '@phosphor-icons/vue';

export type SectionId = 'basic' | 'points' | 'notes';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: typeof PhFileText;
  required: boolean;
}

interface Props {
  activeSection: SectionId;
  isQualifying: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'change-section': [sectionId: SectionId];
}>();

const sections = computed<SectionConfig[]>(() => [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: PhFileText,
    required: false,
  },
  {
    id: 'points',
    label: 'Points System',
    icon: PhChartBar,
    required: false,
  },
  {
    id: 'notes',
    label: 'Race Notes',
    icon: PhNote,
    required: false,
  },
]);

function handleSectionClick(sectionId: SectionId): void {
  emit('change-section', sectionId);
}
</script>

<template>
  <aside class="flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)]">
    <nav class="flex-1 p-4">
      <div class="text-sidebar-label mb-3">Sections</div>

      <ul class="space-y-1">
        <li v-for="section in sections" :key="section.id">
          <button
            type="button"
            :class="{
              'bg-[var(--cyan-dim)] text-[var(--cyan)] border-[var(--cyan)]':
                activeSection === section.id,
              'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border-transparent':
                activeSection !== section.id,
            }"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all border"
            @click="handleSectionClick(section.id)"
          >
            <component :is="section.icon" :size="16" weight="duotone" />
            <span class="flex-1 text-left font-medium">{{ section.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>
