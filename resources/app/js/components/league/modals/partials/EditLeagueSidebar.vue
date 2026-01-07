<script setup lang="ts">
import { computed } from 'vue';
import { PhFileText, PhUser, PhImage, PhLink, PhCheckCircle, PhWarning } from '@phosphor-icons/vue';
import EditLeagueProgress from './EditLeagueProgress.vue';

export type SectionId = 'basic' | 'contact' | 'media' | 'social';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: typeof PhFileText;
  required: boolean;
  complete: boolean;
}

interface Props {
  activeSection: SectionId;
  leagueName: string;
  platformCount: number;
  visibility: string;
  mediaCount: number;
  isNameValid: boolean;
  isPlatformsValid: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'change-section': [sectionId: SectionId];
}>();

const sections = computed<SectionConfig[]>(() => [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: PhFileText,
    required: true,
    complete: props.isNameValid && props.isPlatformsValid,
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: PhUser,
    required: false,
    complete: false,
  },
  {
    id: 'media',
    label: 'Media',
    icon: PhImage,
    required: false,
    complete: false,
  },
  {
    id: 'social',
    label: 'Social Links',
    icon: PhLink,
    required: false,
    complete: false,
  },
]);

const progressPercentage = computed(() => {
  let progress = 10; // Base progress

  // Name contributes 40%
  if (props.isNameValid) {
    progress += 40;
  }

  // Platforms contribute 40%
  if (props.isPlatformsValid) {
    progress += 40;
  }

  // Additional media contributes remaining 10%
  progress += Math.min(props.mediaCount * 3, 10);

  return Math.min(progress, 100);
});

function handleSectionClick(sectionId: SectionId): void {
  emit('change-section', sectionId);
}
</script>

<template>
  <aside class="flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)]">
    <!-- Navigation Section -->
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
            :aria-current="activeSection === section.id ? 'step' : undefined"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all border"
            @click="handleSectionClick(section.id)"
          >
            <component :is="section.icon" :size="16" weight="duotone" />
            <span class="flex-1 text-left font-medium">{{ section.label }}</span>

            <!-- Badge: Required or Complete -->
            <span
              v-if="section.required && !section.complete"
              class="px-2 py-0.5 bg-[var(--orange-dim)] text-[var(--orange)] rounded font-mono uppercase"
            >
              <PhWarning :size="12" weight="bold" />
            </span>
            <span v-else-if="section.complete" class="text-[var(--green)]">
              <PhCheckCircle :size="16" weight="fill" />
            </span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Progress Summary -->
    <EditLeagueProgress
      :league-name="leagueName"
      :platform-count="platformCount"
      :visibility="visibility"
      :media-count="mediaCount"
      :progress-percentage="progressPercentage"
    />
  </aside>
</template>
