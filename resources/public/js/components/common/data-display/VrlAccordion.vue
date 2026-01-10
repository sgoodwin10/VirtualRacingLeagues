<script setup lang="ts">
/**
 * VrlAccordion - Collapsible accordion component for displaying grouped content
 *
 * @component
 * @example
 * ```vue
 * <VrlAccordion v-model="openItems" :items="accordionItems" :multiple="true">
 *   <template #item-0>Content for first item</template>
 *   <template #item-1>Content for second item</template>
 * </VrlAccordion>
 * ```
 */
import { ref, watch } from 'vue';
import { PhCaretDown } from '@phosphor-icons/vue';

export interface AccordionItem {
  /**
   * Unique identifier for the item
   */
  id: string | number;

  /**
   * Title/header text for the accordion item
   */
  title: string;

  /**
   * Optional subtitle or secondary text
   */
  subtitle?: string;

  /**
   * Optional badge text to display in header
   */
  badge?: string;

  /**
   * Badge variant (status styling)
   */
  badgeVariant?: 'active' | 'completed' | 'upcoming' | 'default';

  /**
   * Optional meta text to display next to badge (e.g., date)
   */
  meta?: string;

  /**
   * Whether this item is disabled
   */
  disabled?: boolean;

  /**
   * Custom icon component (from Phosphor Icons)
   */
  icon?: unknown;
}

interface Props {
  /**
   * Array of accordion items
   */
  items: AccordionItem[];

  /**
   * Currently open item indices (v-model)
   */
  modelValue?: number[];

  /**
   * Allow multiple items to be open simultaneously
   * @default false
   */
  multiple?: boolean;

  /**
   * Additional CSS classes
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  multiple: false,
  class: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
  'item-toggle': [index: number, isOpen: boolean, item: AccordionItem];
}>();

// Local state for open items
const openItems = ref<number[]>([...props.modelValue]);

// Template refs for accordion header buttons
// eslint-disable-next-line no-undef -- HTMLButtonElement is a TypeScript DOM type
const headerRefs = ref<HTMLButtonElement[]>([]);

// Sync with v-model
watch(
  () => props.modelValue,
  (newValue) => {
    openItems.value = [...newValue];
  },
);

// Check if an item is open
const isOpen = (index: number): boolean => {
  return openItems.value.includes(index);
};

// Toggle an item open/closed
const toggleItem = (index: number) => {
  const item = props.items[index];
  if (!item || item.disabled) return;

  const currentlyOpen = isOpen(index);

  if (props.multiple) {
    // Multiple mode: add/remove from array
    if (currentlyOpen) {
      openItems.value = openItems.value.filter((i) => i !== index);
    } else {
      openItems.value = [...openItems.value, index];
    }
  } else {
    // Single mode: only one item open at a time
    if (currentlyOpen) {
      openItems.value = [];
    } else {
      openItems.value = [index];
    }
  }

  emit('update:modelValue', openItems.value);
  emit('item-toggle', index, !currentlyOpen, item);
};

// Keyboard navigation

const handleKeydown = (event: KeyboardEvent, index: number) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      toggleItem(index);
      break;
    case 'ArrowDown':
      event.preventDefault();
      focusNextItem(index);
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusPreviousItem(index);
      break;
    case 'Home':
      event.preventDefault();
      focusFirstItem();
      break;
    case 'End':
      event.preventDefault();
      focusLastItem();
      break;
  }
};

const focusItem = (index: number) => {
  headerRefs.value[index]?.focus();
};

const focusNextItem = (currentIndex: number) => {
  let nextIndex = currentIndex + 1;
  while (nextIndex < props.items.length && props.items[nextIndex]?.disabled) {
    nextIndex++;
  }
  if (nextIndex < props.items.length) {
    focusItem(nextIndex);
  }
};

const focusPreviousItem = (currentIndex: number) => {
  let prevIndex = currentIndex - 1;
  while (prevIndex >= 0 && props.items[prevIndex]?.disabled) {
    prevIndex--;
  }
  if (prevIndex >= 0) {
    focusItem(prevIndex);
  }
};

const focusFirstItem = () => {
  let firstIndex = 0;
  while (firstIndex < props.items.length && props.items[firstIndex]?.disabled) {
    firstIndex++;
  }
  if (firstIndex < props.items.length) {
    focusItem(firstIndex);
  }
};

const focusLastItem = () => {
  let lastIndex = props.items.length - 1;
  while (lastIndex >= 0 && props.items[lastIndex]?.disabled) {
    lastIndex--;
  }
  if (lastIndex >= 0) {
    focusItem(lastIndex);
  }
};

// Badge styling based on variant
const badgeClasses = (variant?: 'active' | 'completed' | 'upcoming' | 'default'): string => {
  const baseClasses = 'font-display text-[10px] uppercase tracking-wider px-2 py-1 rounded';

  const variantStyles = {
    active: 'bg-racing-success/10 text-racing-success',
    completed: 'bg-racing-success/10 text-racing-success',
    upcoming: 'bg-racing-warning/10 text-racing-warning',
    default: 'bg-racing-tarmac text-racing-barrier',
  };

  return `${baseClasses} ${variantStyles[variant || 'default']}`;
};
</script>

<template>
  <div :class="['accordion-racing', props.class]" role="region">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      :class="[
        'accordion-item',
        {
          'is-open': isOpen(index),
          'is-disabled': item.disabled,
        },
      ]"
    >
      <!-- Accordion Header -->
      <button
        :id="`accordion-header-${index}`"
        :ref="(el) => (headerRefs[index] = el as HTMLButtonElement)"
        type="button"
        :aria-expanded="isOpen(index)"
        :aria-controls="`accordion-panel-${index}`"
        :aria-disabled="item.disabled"
        :disabled="item.disabled"
        :class="['accordion-header', { 'is-open': isOpen(index) }]"
        @click="toggleItem(index)"
        @keydown="handleKeydown($event, index)"
      >
        <!-- Icon (if provided) -->
        <div v-if="item.icon" class="accordion-icon">
          <component :is="item.icon" :size="20" weight="duotone" />
        </div>

        <!-- Content -->
        <div class="accordion-header-content">
          <h3 class="accordion-title">{{ item.title }}</h3>
          <p v-if="item.subtitle" class="accordion-subtitle">{{ item.subtitle }}</p>
        </div>

        <!-- Badge and Meta -->
        <div v-if="item.badge || item.meta" class="accordion-meta-group">
          <span v-if="item.badge" :class="badgeClasses(item.badgeVariant)">
            {{ item.badge }}
          </span>
          <span v-if="item.meta" class="accordion-meta">{{ item.meta }}</span>
        </div>

        <!-- Expand/Collapse Icon -->
        <PhCaretDown
          :size="20"
          weight="bold"
          :class="['accordion-chevron', { 'is-rotated': isOpen(index) }]"
        />
      </button>

      <!-- Accordion Panel -->
      <div
        :id="`accordion-panel-${index}`"
        role="region"
        :aria-labelledby="`accordion-header-${index}`"
        :aria-hidden="!isOpen(index)"
        :class="['accordion-panel', { 'is-open': isOpen(index) }]"
      >
        <div class="accordion-panel-content">
          <slot :name="`item-${index}`" :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Accordion Container */
.accordion-racing {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Accordion Item */
.accordion-item {
  background: var(--bg-secondary, var(--color-racing-asphalt));
  border: 1px solid var(--border-primary, var(--color-racing-tarmac));
  border-radius: 4px;
  transition: all var(--duration-normal, 300ms) var(--ease-racing, ease);
  overflow: hidden;
}

.accordion-item:hover:not(.is-disabled) {
  border-color: var(--card-hover-border, var(--color-racing-gold-muted));
}

.accordion-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Accordion Header */
.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) ease;
}

.accordion-header.is-open {
  border-bottom-color: var(--border-primary, var(--color-racing-tarmac));
}

.accordion-header:hover:not(:disabled) {
  background: var(--bg-hover, rgba(212, 168, 83, 0.05));
}

.accordion-header:focus-visible {
  outline: 2px solid var(--color-racing-gold);
  outline-offset: -2px;
}

.accordion-header:disabled {
  cursor: not-allowed;
}

/* Icon */
.accordion-icon {
  flex-shrink: 0;
  color: var(--color-racing-gold);
}

/* Header Content */
.accordion-header-content {
  flex: 1;
  min-width: 0;
}

.accordion-title {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-racing-pit-white));
  margin: 0;
}

.accordion-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted, var(--color-racing-barrier));
  margin: var(--space-xs) 0 0;
}

/* Meta Group (badge + date) */
.accordion-meta-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.accordion-meta {
  font-size: 0.75rem;
  color: var(--text-muted, var(--color-racing-barrier));
  white-space: nowrap;
}

/* Chevron */
.accordion-chevron {
  flex-shrink: 0;
  color: var(--color-racing-gold);
  transition: transform var(--duration-normal, 300ms) var(--ease-racing, ease);
}

.accordion-chevron.is-rotated {
  transform: rotate(180deg);
}

/* Accordion Panel */
.accordion-panel {
  overflow: hidden;
  max-height: 0;
  transition: max-height var(--duration-normal, 300ms) var(--ease-racing, ease);
}

.accordion-panel.is-open {
  max-height: 5000px; /* Large enough for most content */
}

.accordion-panel-content {
  padding: 0 var(--space-lg) var(--space-lg);
  border-top: 1px solid var(--border-primary, var(--color-racing-tarmac));
}

/* Responsive */
@media (max-width: 768px) {
  .accordion-header {
    padding: var(--space-md);
    flex-wrap: wrap;
  }

  .accordion-panel-content {
    padding: 0 var(--space-md) var(--space-md);
  }

  .accordion-title {
    font-size: 0.875rem;
  }

  .accordion-subtitle {
    font-size: 0.6875rem;
  }

  .accordion-meta-group {
    order: 4;
    width: 100%;
    margin-top: var(--space-xs);
    justify-content: flex-start;
  }

  .accordion-meta {
    font-size: 0.6875rem;
  }
}
</style>
