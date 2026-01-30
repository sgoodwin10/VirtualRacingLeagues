<script setup lang="ts">
import { computed } from 'vue';
import { PhUser, PhNotepad, PhWarning } from '@phosphor-icons/vue';

export type SectionId = 'basic' | 'additional';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: typeof PhUser;
  required: boolean;
}

interface Props {
  activeSection: SectionId;
  generalError?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'change-section': [sectionId: SectionId];
}>();

const sections = computed<SectionConfig[]>(() => [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: PhUser,
    required: true,
  },
  {
    id: 'additional',
    label: 'Additional',
    icon: PhNotepad,
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

    <!-- General Error Display -->
    <div v-if="generalError" class="p-4 border-t border-[var(--border)]">
      <div
        class="flex items-start gap-3 p-3 rounded-lg bg-[var(--red-dim)] border border-[var(--red)]"
      >
        <PhWarning :size="20" weight="duotone" class="text-[var(--red)] flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-[var(--red)] font-medium leading-relaxed break-words">
            {{ generalError }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
