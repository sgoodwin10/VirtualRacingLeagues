<script setup lang="ts">
import { PhUser, PhEnvelope } from '@phosphor-icons/vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';

interface Props {
  organizerName: string | null;
  contactEmail: string | null;
}

defineProps<Props>();
</script>

<template>
  <BasePanel>
    <template #header>
      <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
        <span class="font-medium text-surface-700">Contact Information</span>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
      <!-- Organizer Name -->
      <div
        class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors"
        >
          <PhUser :size="20" class="text-blue-600" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Manager</div>
          <div class="font-semibold text-gray-900 truncate mt-0.5">
            {{ organizerName ?? 'Not provided' }}
          </div>
        </div>
      </div>

      <!-- Contact Email -->
      <a
        v-if="contactEmail"
        :href="`mailto:${contactEmail}`"
        class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
      >
        <div
          class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors"
        >
          <PhEnvelope :size="20" class="text-green-600" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Email</div>
          <div class="font-semibold text-blue-600 group-hover:text-blue-700 truncate mt-0.5">
            {{ contactEmail }}
          </div>
        </div>
      </a>

      <!-- Placeholder if no email -->
      <div v-else class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 opacity-50">
        <div
          class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100"
        >
          <PhEnvelope :size="20" class="text-gray-400" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Email</div>
          <div class="text-sm text-gray-400 italic mt-0.5">Not provided</div>
        </div>
      </div>
    </div>
  </BasePanel>
</template>
