<script setup lang="ts">
import { computed } from 'vue';
import {
  PhFileText,
  PhUser,
  PhUsers,
  PhImage,
  PhCheckCircle,
  PhWarning,
} from '@phosphor-icons/vue';
import SeasonEditProgress from './SeasonEditProgress.vue';

export type SectionId = 'basic' | 'driver' | 'team' | 'branding';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: typeof PhFileText;
  required: boolean;
  complete: boolean;
}

interface Props {
  activeSection: SectionId;
  seasonName: string;
  isNameValid: boolean;
  driverSettingsCount: number;
  teamSettingsEnabled: boolean;
  mediaCount: number;
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
    complete: props.isNameValid,
  },
  {
    id: 'driver',
    label: 'Driver Settings',
    icon: PhUser,
    required: false,
    complete: false,
  },
  {
    id: 'team',
    label: 'Team Settings',
    icon: PhUsers,
    required: false,
    complete: false,
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: PhImage,
    required: false,
    complete: false,
  },
]);

const progressPercentage = computed(() => {
  let progress = 10; // Base progress

  // Name contributes 50%
  if (props.isNameValid) {
    progress += 50;
  }

  // Driver settings contribute 20%
  if (props.driverSettingsCount > 0) {
    progress += Math.min(props.driverSettingsCount * 7, 20);
  }

  // Team settings contribute 10%
  if (props.teamSettingsEnabled) {
    progress += 10;
  }

  // Media contributes remaining 10%
  progress += Math.min(props.mediaCount * 5, 10);

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
    <SeasonEditProgress
      :season-name="seasonName"
      :driver-settings-count="driverSettingsCount"
      :team-settings-enabled="teamSettingsEnabled"
      :media-count="mediaCount"
      :progress-percentage="progressPercentage"
    />
  </aside>
</template>
