<script setup lang="ts">
/**
 * PropTable - Component props documentation table for demo sections
 *
 * @component
 * @example
 * ```vue
 * <PropTable :props="buttonProps" />
 * ```
 */
import { computed } from 'vue';

export interface PropDefinition {
  /** Prop name */
  name: string;
  /** TypeScript type */
  type: string;
  /** Default value */
  default?: string;
  /** Prop description */
  description: string;
  /** Is prop required */
  required?: boolean;
}

interface Props {
  /**
   * Array of prop definitions to display
   */
  props: PropDefinition[];
}

const props = defineProps<Props>();

// Sort props: required first, then alphabetically
const sortedProps = computed(() => {
  return [...props.props].sort((a, b) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return a.name.localeCompare(b.name);
  });
});
</script>

<template>
  <div class="prop-table-container theme-bg-tertiary rounded overflow-hidden">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="prop-table w-full">
        <thead>
          <tr class="theme-bg-secondary border-b theme-border">
            <th class="prop-table-header">Prop</th>
            <th class="prop-table-header">Type</th>
            <th class="prop-table-header">Default</th>
            <th class="prop-table-header">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="prop in sortedProps"
            :key="prop.name"
            class="border-b border-racing-track/20 hover:bg-racing-track/5 transition-colors"
          >
            <!-- Prop Name -->
            <td class="prop-table-cell">
              <code class="prop-name">{{ prop.name }}</code>
              <span
                v-if="prop.required"
                class="ml-1.5 text-racing-danger text-[10px]"
                title="Required"
                >*</span
              >
            </td>

            <!-- Type -->
            <td class="prop-table-cell">
              <code class="prop-type">{{ prop.type }}</code>
            </td>

            <!-- Default Value -->
            <td class="prop-table-cell">
              <code v-if="prop.default" class="prop-default">{{ prop.default }}</code>
              <span v-else class="theme-text-dim text-xs">-</span>
            </td>

            <!-- Description -->
            <td class="prop-table-cell">
              <p class="prop-description">{{ prop.description }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Legend -->
    <div
      class="prop-table-footer px-4 py-2 text-[10px] theme-text-muted border-t theme-border-subtle flex items-center gap-4"
    >
      <span class="flex items-center gap-1">
        <span class="text-racing-danger">*</span>
        <span>Required</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.prop-table-header {
  padding: 0.75rem 1rem;
  text-align: left;
  font-family: var(--font-display);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.prop-table-cell {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.prop-name {
  font-family: var(--font-data);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-racing-gold);
}

.prop-type {
  font-family: var(--font-data);
  font-size: 0.75rem;
  background: rgba(45, 45, 45, 0.2);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--text-secondary);
}

.prop-default {
  font-family: var(--font-data);
  font-size: 0.75rem;
  color: var(--color-racing-info);
  background: rgba(59, 130, 246, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.prop-description {
  font-size: 0.75rem;
  line-height: 1.625;
  color: var(--text-secondary);
}
</style>
