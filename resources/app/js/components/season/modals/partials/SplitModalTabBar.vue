<script setup lang="ts">
import { PhFile, PhUser, PhUsers, PhImage } from '@phosphor-icons/vue';
import SplitModalNavItem from './SplitModalNavItem.vue';

type SectionType = 'basic' | 'driver' | 'team' | 'branding';

interface Props {
  activeSection: SectionType;
}

defineProps<Props>();

interface Emits {
  (e: 'section-change', section: SectionType): void;
}

const emit = defineEmits<Emits>();

function handleSectionChange(section: SectionType): void {
  emit('section-change', section);
}
</script>

<template>
  <nav class="tab-bar">
    <SplitModalNavItem
      label="Basic"
      :icon="PhFile"
      :active="activeSection === 'basic'"
      :compact="true"
      @click="handleSectionChange('basic')"
    />
    <SplitModalNavItem
      label="Driver"
      :icon="PhUser"
      :active="activeSection === 'driver'"
      :compact="true"
      @click="handleSectionChange('driver')"
    />
    <SplitModalNavItem
      label="Team"
      :icon="PhUsers"
      :active="activeSection === 'team'"
      :compact="true"
      @click="handleSectionChange('team')"
    />
    <SplitModalNavItem
      label="Brand"
      :icon="PhImage"
      :active="activeSection === 'branding'"
      :compact="true"
      @click="handleSectionChange('branding')"
    />
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  gap: 4px;
  padding: 8px 12px;
}

/* Custom scrollbar styling */
.tab-bar::-webkit-scrollbar {
  height: 2px;
}

.tab-bar::-webkit-scrollbar-track {
  background: transparent;
}

.tab-bar::-webkit-scrollbar-thumb {
  background: var(--bg-highlight);
  border-radius: 2px;
}

.tab-bar::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
