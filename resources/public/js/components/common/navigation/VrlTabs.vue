<script setup lang="ts">
import { ref, computed, watch } from 'vue';

export interface TabItem {
  label: string;
  count?: number;
  disabled?: boolean;
}

interface Props {
  modelValue?: number;
  tabs: TabItem[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  class: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'tab-change': [index: number, tab: TabItem];
}>();

const activeTab = ref(props.modelValue);
// eslint-disable-next-line no-undef
const tabRefs = ref<(HTMLElement | null)[]>([]);

// Sync with v-model
watch(
  () => props.modelValue,
  (newValue) => {
    activeTab.value = newValue;
  },
);

// Select a tab
const selectTab = (index: number) => {
  const tab = props.tabs[index];
  if (!tab || tab.disabled) return;

  activeTab.value = index;
  emit('update:modelValue', index);
  emit('tab-change', index, tab);
};

// Keyboard navigation

const handleKeydown = (event: KeyboardEvent, currentIndex: number) => {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : props.tabs.length - 1;
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      newIndex = currentIndex < props.tabs.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = props.tabs.length - 1;
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      selectTab(currentIndex);
      return;
    default:
      return;
  }

  // Skip disabled tabs with infinite loop protection
  let attempts = 0;
  while (
    props.tabs[newIndex]?.disabled &&
    newIndex !== currentIndex &&
    attempts < props.tabs.length
  ) {
    attempts++;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'Home') {
      newIndex = newIndex > 0 ? newIndex - 1 : props.tabs.length - 1;
    } else {
      newIndex = newIndex < props.tabs.length - 1 ? newIndex + 1 : 0;
    }
  }

  // Focus the new tab button using template refs
  tabRefs.value[newIndex]?.focus();
};

const tabButtonClasses = computed(() => (index: number) => {
  const isActive = activeTab.value === index;
  const tab = props.tabs[index];

  const baseClasses =
    'relative px-4 sm:px-6 py-3 sm:py-4 font-display text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-racing-gold focus-visible:ring-inset';

  const activeClasses = isActive
    ? 'text-racing-gold bg-racing-gold/10'
    : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]';

  const disabledClasses = tab?.disabled ? 'opacity-50 cursor-not-allowed' : '';

  const borderClasses = index > 0 ? 'border-l border-[var(--border-primary)]' : '';

  return [baseClasses, activeClasses, disabledClasses, borderClasses].filter(Boolean).join(' ');
});

const tabId = (index: number) => `tab-${index}`;
const panelId = (index: number) => `panel-${index}`;
</script>

<template>
  <div :class="['card-racing', 'rounded', 'overflow-hidden', props.class]">
    <!-- Tab buttons -->
    <div
      role="tablist"
      class="flex overflow-x-auto"
      style="border-bottom: 1px solid var(--border-primary)"
      :aria-label="'Tab navigation'"
    >
      <button
        v-for="(tab, index) in tabs"
        :id="tabId(index)"
        :key="index"
        :ref="
          (el) => {
            tabRefs[index] = el as HTMLElement | null;
          }
        "
        role="tab"
        :aria-selected="activeTab === index"
        :aria-controls="panelId(index)"
        :aria-disabled="tab.disabled"
        :tabindex="activeTab === index ? 0 : -1"
        :class="tabButtonClasses(index)"
        :disabled="tab.disabled"
        @click="selectTab(index)"
        @keydown="handleKeydown($event, index)"
      >
        <!-- Icon slot -->
        <span class="mr-1 sm:mr-2 inline-block align-middle">
          <slot :name="`icon-${index}`" :active="activeTab === index" />
        </span>

        <!-- Label -->
        <span class="align-middle">{{ tab.label }}</span>

        <!-- Count badge -->
        <span
          v-if="tab.count !== undefined"
          class="ml-1 sm:ml-2 px-1.5 py-0.5 text-[10px] rounded"
          style="background: var(--bg-tertiary); color: var(--text-dim)"
        >
          {{ tab.count }}
        </span>

        <!-- Active indicator -->
        <span
          v-if="activeTab === index"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-racing-gold"
        />
      </button>
    </div>

    <!-- Tab panels -->
    <div class="p-4 sm:p-6">
      <div
        v-for="(_tab, index) in tabs"
        :id="panelId(index)"
        :key="index"
        role="tabpanel"
        :aria-labelledby="tabId(index)"
        :hidden="activeTab !== index"
      >
        <slot v-if="activeTab === index" :name="`tab-${index}`">
          <slot />
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-racing {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

.text-racing-gold {
  color: var(--racing-gold, #d4a853);
}

.bg-racing-gold\/10 {
  background-color: rgba(212, 168, 83, 0.1);
}

.focus-visible\:ring-racing-gold:focus-visible {
  --tw-ring-color: var(--racing-gold, #d4a853);
}
</style>
