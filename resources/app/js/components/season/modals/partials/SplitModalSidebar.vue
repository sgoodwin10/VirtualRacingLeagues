<script setup lang="ts">
import { computed } from 'vue';
import { PhFile, PhUser, PhUsers, PhImage } from '@phosphor-icons/vue';
import SplitModalNavItem from './SplitModalNavItem.vue';
import SplitModalStatusSummary from './SplitModalStatusSummary.vue';

type SectionType = 'basic' | 'driver' | 'team' | 'branding';

interface FormState {
  race_divisions_enabled: boolean;
  team_championship_enabled: boolean;
  drop_round: boolean;
  round_totals_tiebreaker_rules_enabled: boolean;
}

interface Props {
  activeSection: SectionType;
  form: FormState;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'section-change', section: SectionType): void;
}

const emit = defineEmits<Emits>();

// Calculate badge count for driver settings
const driverBadgeCount = computed(() => {
  let count = 0;
  if (props.form.race_divisions_enabled) count++;
  if (props.form.drop_round) count++;
  if (props.form.round_totals_tiebreaker_rules_enabled) count++;
  return count > 0 ? count : undefined;
});

function handleSectionChange(section: SectionType): void {
  emit('section-change', section);
}
</script>

<template>
  <aside class="flex flex-col bg-panel border-r border-[--border]">
    <nav class="p-4 flex-1 overflow-y-auto">
      <div class="text-sidebar-label mb-3">//Sections</div>
      <ul class="list-none flex flex-col gap-1">
        <li class="w-full">
          <SplitModalNavItem
            label="Basic Info"
            :icon="PhFile"
            :active="activeSection === 'basic'"
            @click="handleSectionChange('basic')"
          />
        </li>
        <li class="w-full">
          <SplitModalNavItem
            label="Driver Settings"
            :icon="PhUser"
            :active="activeSection === 'driver'"
            :badge="driverBadgeCount"
            :badge-active="!!driverBadgeCount"
            @click="handleSectionChange('driver')"
          />
        </li>
        <li class="w-full">
          <SplitModalNavItem
            label="Team Settings"
            :icon="PhUsers"
            :active="activeSection === 'team'"
            @click="handleSectionChange('team')"
          />
        </li>
        <li class="w-full">
          <SplitModalNavItem
            label="Branding"
            :icon="PhImage"
            :active="activeSection === 'branding'"
            @click="handleSectionChange('branding')"
          />
        </li>
      </ul>
    </nav>

    <!-- Status Summary -->
    <SplitModalStatusSummary
      :divisions-enabled="form.race_divisions_enabled"
      :teams-enabled="form.team_championship_enabled"
      :drop-rounds-enabled="form.drop_round"
      :tiebreakers-enabled="form.round_totals_tiebreaker_rules_enabled"
      :collapsible="false"
    />
  </aside>
</template>
