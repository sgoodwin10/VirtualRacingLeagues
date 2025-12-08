<script setup lang="ts">
/* global HTMLElement */
import { computed, ref, watch } from 'vue';
import {
  PhCaretLeft,
  PhCaretRight,
  PhCaretDoubleLeft,
  PhCaretDoubleRight,
} from '@phosphor-icons/vue';

type Variant = 'standard' | 'compact' | 'racing';

interface Props {
  modelValue: number; // Current page (1-indexed)
  totalPages: number;
  variant?: Variant;
  showInfo?: boolean; // "Showing X-Y of Z"
  showPerPage?: boolean;
  perPageOptions?: number[];
  perPage?: number;
  totalRecords?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'standard',
  showInfo: false,
  showPerPage: false,
  perPageOptions: () => [10, 25, 50, 100],
  perPage: 10,
  totalRecords: undefined,
  class: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'update:perPage': [value: number];
}>();

// Local per-page state
const localPerPage = ref(props.perPage);

// Watch for external perPage changes
watch(
  () => props.perPage,
  (newValue) => {
    localPerPage.value = newValue;
  },
);

// Watch for local perPage changes and emit update
watch(localPerPage, (newValue) => {
  if (newValue !== props.perPage) {
    emit('update:perPage', newValue);
    // Reset to page 1 when changing per-page
    emit('update:modelValue', 1);
  }
});

// Generate page numbers for standard variant
const pageNumbers = computed(() => {
  const pages: Array<number | 'ellipsis'> = [];
  const total = props.totalPages;
  const current = props.modelValue;

  if (total <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (total > 1) {
      pages.push(total);
    }
  }

  return pages;
});

// Calculate info text
const infoText = computed(() => {
  if (!props.totalRecords) return '';

  const start = (props.modelValue - 1) * localPerPage.value + 1;
  const end = Math.min(props.modelValue * localPerPage.value, props.totalRecords);

  return `Showing ${start}-${end} of ${props.totalRecords} results`;
});

// Navigation functions
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.modelValue) {
    emit('update:modelValue', page);
  }
};

const previousPage = () => {
  goToPage(props.modelValue - 1);
};

const nextPage = () => {
  goToPage(props.modelValue + 1);
};

const firstPage = () => {
  goToPage(1);
};

const lastPage = () => {
  goToPage(props.totalPages);
};

// Keyboard navigation
// eslint-disable-next-line no-undef
const handleKeydown = (event: KeyboardEvent, page?: number) => {
  // Only handle keyboard events when focus is on a pagination button
  const target = event.target as HTMLElement;
  if (!target.matches('button')) {
    return;
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      previousPage();
      break;
    case 'ArrowRight':
      event.preventDefault();
      nextPage();
      break;
    case 'Home':
      event.preventDefault();
      firstPage();
      break;
    case 'End':
      event.preventDefault();
      lastPage();
      break;
    case 'Enter':
    case ' ':
      if (page !== undefined) {
        event.preventDefault();
        goToPage(page);
      }
      break;
  }
};

// Computed classes for variants
const buttonBaseClasses =
  'min-w-[36px] h-9 inline-flex items-center justify-center font-data text-[13px] transition-all cursor-pointer border-0';
const buttonInactiveClasses = 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]';
const buttonActiveClasses = 'bg-[var(--accent-gold)] text-[#0a0a0a]';
const buttonDisabledClasses = 'opacity-40 cursor-not-allowed';

const getButtonClasses = (isActive = false, isDisabled = false) => {
  const classes = [buttonBaseClasses];

  if (isDisabled) {
    classes.push(buttonDisabledClasses);
  } else if (isActive) {
    classes.push(buttonActiveClasses);
  } else {
    classes.push(buttonInactiveClasses, 'hover:text-[var(--accent-gold)]');
  }

  // Add shape based on variant
  if (props.variant === 'racing') {
    classes.push('[clip-path:polygon(5%_0%,100%_0%,95%_100%,0%_100%)]');
  } else {
    classes.push('rounded');
  }

  return classes.join(' ');
};

const getArrowButtonClasses = (isDisabled = false) => {
  const classes = [buttonBaseClasses];

  if (isDisabled) {
    classes.push(buttonDisabledClasses);
  } else {
    classes.push(buttonInactiveClasses, 'hover:text-[var(--accent-gold)]');
  }

  // Racing variant has different arrow clip-path
  if (props.variant === 'racing') {
    classes.push('[clip-path:polygon(15%_0%,100%_0%,85%_100%,0%_100%)]');
  } else {
    classes.push('rounded');
  }

  return classes.join(' ');
};
</script>

<template>
  <nav
    role="navigation"
    aria-label="Pagination"
    :class="['vrl-pagination', props.class]"
    @keydown="handleKeydown"
  >
    <!-- Standard Pagination -->
    <div
      v-if="variant === 'standard'"
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <!-- Info text (if showInfo) -->
      <span v-if="showInfo && totalRecords" class="font-data text-sm text-[var(--text-muted)]">
        <span class="text-[var(--text-primary)]">{{ infoText }}</span>
      </span>

      <!-- Per-page selector (if showPerPage) -->
      <div v-if="showPerPage" class="flex items-center gap-2">
        <span class="font-data text-sm text-[var(--text-muted)]">Show</span>
        <select
          v-model.number="localPerPage"
          class="px-3 py-1.5 text-sm font-data h-9 appearance-none cursor-pointer rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] min-w-[70px]"
          style="
            background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22%239ca3af%22 d=%22M7 10l5 5 5-5z%22/%3E%3C/svg%3E');
            background-repeat: no-repeat;
            background-position: right 8px center;
          "
        >
          <option v-for="option in perPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <span class="font-data text-sm text-[var(--text-muted)]">per page</span>
      </div>

      <!-- Page buttons -->
      <div class="flex flex-wrap items-center gap-1">
        <!-- First page (if showInfo) -->
        <button
          v-if="showInfo"
          type="button"
          :class="getArrowButtonClasses(modelValue === 1)"
          :disabled="modelValue === 1"
          :aria-disabled="modelValue === 1"
          aria-label="First page"
          @click="firstPage"
        >
          <PhCaretDoubleLeft :size="14" />
        </button>

        <!-- Previous page -->
        <button
          type="button"
          :class="getArrowButtonClasses(modelValue === 1)"
          :disabled="modelValue === 1"
          :aria-disabled="modelValue === 1"
          aria-label="Previous page"
          @click="previousPage"
        >
          <PhCaretLeft :size="14" />
        </button>

        <!-- Page numbers -->
        <template v-for="(page, index) in pageNumbers" :key="index">
          <span
            v-if="page === 'ellipsis'"
            :class="getButtonClasses(false, false)"
            class="cursor-default"
            aria-hidden="true"
          >
            ...
          </span>
          <button
            v-else
            type="button"
            :class="getButtonClasses(page === modelValue)"
            :aria-current="page === modelValue ? 'page' : undefined"
            :aria-label="`Page ${page}`"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </template>

        <!-- Next page -->
        <button
          type="button"
          :class="getArrowButtonClasses(modelValue === totalPages)"
          :disabled="modelValue === totalPages"
          :aria-disabled="modelValue === totalPages"
          aria-label="Next page"
          @click="nextPage"
        >
          <PhCaretRight :size="14" />
        </button>

        <!-- Last page (if showInfo) -->
        <button
          v-if="showInfo"
          type="button"
          :class="getArrowButtonClasses(modelValue === totalPages)"
          :disabled="modelValue === totalPages"
          :aria-disabled="modelValue === totalPages"
          aria-label="Last page"
          @click="lastPage"
        >
          <PhCaretDoubleRight :size="14" />
        </button>
      </div>
    </div>

    <!-- Compact Pagination -->
    <div v-else-if="variant === 'compact'" class="flex items-center gap-3">
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center transition-all rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
        :class="{ 'opacity-40 cursor-not-allowed': modelValue === 1 }"
        :disabled="modelValue === 1"
        :aria-disabled="modelValue === 1"
        aria-label="Previous page"
        @click="previousPage"
      >
        <PhCaretLeft :size="14" />
      </button>

      <span class="font-data text-sm text-[var(--text-primary)]">
        Page <span class="text-[var(--accent-gold)]">{{ modelValue }}</span> of
        <span>{{ totalPages }}</span>
      </span>

      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center transition-all rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
        :class="{
          'opacity-40 cursor-not-allowed': modelValue === totalPages,
          'hover:text-[var(--accent-gold)]': modelValue !== totalPages,
        }"
        :disabled="modelValue === totalPages"
        :aria-disabled="modelValue === totalPages"
        aria-label="Next page"
        @click="nextPage"
      >
        <PhCaretRight :size="14" />
      </button>
    </div>

    <!-- Racing Pagination (angled buttons) -->
    <div v-else-if="variant === 'racing'" class="flex flex-wrap items-center gap-1">
      <!-- Previous page -->
      <button
        type="button"
        :class="getArrowButtonClasses(modelValue === 1)"
        :disabled="modelValue === 1"
        :aria-disabled="modelValue === 1"
        aria-label="Previous page"
        @click="previousPage"
      >
        <PhCaretLeft :size="14" />
      </button>

      <!-- Page numbers -->
      <template v-for="(page, index) in pageNumbers" :key="index">
        <span
          v-if="page === 'ellipsis'"
          :class="getButtonClasses(false, false)"
          class="cursor-default"
          aria-hidden="true"
        >
          ...
        </span>
        <button
          v-else
          type="button"
          :class="getButtonClasses(page === modelValue)"
          :aria-current="page === modelValue ? 'page' : undefined"
          :aria-label="`Page ${page}`"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>

      <!-- Next page -->
      <button
        type="button"
        :class="getArrowButtonClasses(modelValue === totalPages)"
        :disabled="modelValue === totalPages"
        :aria-disabled="modelValue === totalPages"
        aria-label="Next page"
        @click="nextPage"
      >
        <PhCaretRight :size="14" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* Remove focus outline, we handle it with classes */
.vrl-pagination button:focus {
  outline: none;
}

/* Focus visible styling */
.vrl-pagination button:focus-visible {
  box-shadow:
    0 0 0 3px rgba(212, 168, 83, 0.12),
    0 0 0 1px var(--accent-gold);
}

/* Select focus styling */
.vrl-pagination select:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(212, 168, 83, 0.12),
    0 0 0 1px var(--accent-gold);
}
</style>
