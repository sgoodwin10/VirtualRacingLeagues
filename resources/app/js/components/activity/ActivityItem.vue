<script setup lang="ts">
import { ref } from 'vue';
import type { FormattedActivity } from '@app/types/activityLog';

interface Props {
  activity: FormattedActivity;
  showDetails?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  compact: false,
});

const expanded = ref(false);

function toggleExpanded() {
  if (props.activity.changes) {
    expanded.value = !expanded.value;
  }
}

function hasChanges(): boolean {
  return !!props.activity.changes && (!!props.activity.changes.old || !!props.activity.changes.new);
}
</script>

<template>
  <div
    class="border-b border-[var(--border)] first:pt-0 last:border-b-0 hover:bg-[var(--bg-hover)] px-4 -mx-4 transition-colors"
    :class="{
      'py-2': compact,
      'py-4': !compact,
    }"
  >
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div
        class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        :class="{
          'bg-green-100': activity.iconColor === 'text-green-500',
          'bg-blue-100': activity.iconColor === 'text-blue-500',
          'bg-red-100': activity.iconColor === 'text-red-500',
          'bg-purple-100': activity.iconColor === 'text-purple-500',
          'bg-gray-100': activity.iconColor === 'text-gray-500',
          'bg-cyan-100': activity.iconColor === 'text-cyan-500',
          'bg-yellow-100': activity.iconColor === 'text-yellow-500',
        }"
      >
        <i :class="['pi', activity.icon, activity.iconColor]" class="text-lg"></i>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Description -->
        <p class="text-[var(--text-primary)] font-medium">
          {{ activity.description }}
        </p>

        <!-- Context breadcrumb -->
        <p v-if="activity.context" class="text-sm text-[var(--text-muted)] mt-1">
          {{ activity.context }}
        </p>

        <!-- Meta info -->
        <div class="flex items-center gap-2 mt-2 text-sm text-[var(--text-secondary)]">
          <span>by {{ activity.causer }}</span>
          <span class="text-[var(--text-muted)]">•</span>
          <span :title="activity.timestamp">{{ activity.relativeTime }}</span>
        </div>

        <!-- Changes toggle -->
        <button
          v-if="hasChanges() && !compact"
          class="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          @click="toggleExpanded"
        >
          <i :class="['pi', expanded ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
          {{ expanded ? 'Hide' : 'Show' }} Changes
        </button>

        <!-- Changes section (expanded) -->
        <div v-if="expanded && hasChanges() && !compact" class="mt-3 space-y-2">
          <div v-if="activity.changes?.old" class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-sm font-mono font-semibold text-red-800 mb-1">Old Values</p>
            <pre class="text-xs text-red-700 overflow-x-auto">{{
              JSON.stringify(activity.changes.old, null, 2)
            }}</pre>
          </div>

          <div
            v-if="activity.changes?.new"
            class="bg-green-50 border border-green-200 rounded-md p-3"
          >
            <p class="text-sm font-mono font-semibold text-green-800 mb-1">New Values</p>
            <pre class="text-xs text-green-700 overflow-x-auto">{{
              JSON.stringify(activity.changes.new, null, 2)
            }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
