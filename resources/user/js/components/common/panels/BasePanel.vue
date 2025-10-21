<template>
  <Panel
    :collapsed="localCollapsed"
    :toggleable="toggleable"
    :header="header"
    :unstyled="unstyled"
    :pt="pt"
    :pt-options="ptOptions"
    :class="panelClass"
    @toggle="handleToggle"
  >
    <!-- Header slot with collapsed state -->
    <template v-if="$slots.header" #header>
      <slot name="header" :collapsed="localCollapsed" />
    </template>

    <!-- Icons slot -->
    <template v-if="$slots.icons" #icons>
      <slot name="icons" />
    </template>

    <!-- Default content slot with custom wrapper -->
    <div v-if="$slots.default" :class="contentClass">
      <slot />
    </div>

    <!-- Footer slot with custom wrapper -->
    <template v-if="$slots.footer" #footer>
      <div :class="footerClass">
        <slot name="footer" />
      </div>
    </template>
  </Panel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Panel from 'primevue/panel';

/**
 * BasePanel Component
 *
 * A wrapper around PrimeVue's Panel component that provides consistent styling
 * and functionality for the user dashboard. Supports collapsible panels with
 * customizable headers, content, and footers.
 *
 * @example
 * ```vue
 * <BasePanel
 *   v-model:collapsed="isCollapsed"
 *   header="Panel Title"
 *   toggleable
 *   content-class="p-4"
 * >
 *   Panel content goes here
 * </BasePanel>
 * ```
 */

/**
 * Component props interface
 */
interface Props {
  /** Whether the panel is collapsed */
  collapsed?: boolean;
  /** Whether the panel can be toggled */
  toggleable?: boolean;
  /** Panel header text */
  header?: string;
  /** Custom CSS class for the header */
  headerClass?: string;
  /** Props to pass to the toggle button */
  toggleButtonProps?: object;
  /** Custom CSS class for the content wrapper */
  contentClass?: string;
  /** Custom CSS class for the footer wrapper */
  footerClass?: string;
  /** Custom CSS class for the panel root element */
  class?: string;
  /** Whether to use unstyled mode (no default PrimeVue styles) */
  unstyled?: boolean;
  /** PrimeVue pass-through API object */
  pt?: object;
  /** PrimeVue pass-through options */
  ptOptions?: object;
}

/**
 * Component emits interface
 */
interface Emits {
  /** Emitted when the panel is toggled */
  (event: 'toggle', value: { originalEvent: Event; value: boolean }): void;
  /** Emitted for v-model:collapsed support */
  (event: 'update:collapsed', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  toggleable: false,
  header: undefined,
  headerClass: undefined,
  toggleButtonProps: undefined,
  contentClass: undefined,
  footerClass: undefined,
  class: undefined,
  unstyled: false,
  pt: undefined,
  ptOptions: undefined,
});

const emit = defineEmits<Emits>();

/**
 * Local collapsed state for v-model support
 */
const localCollapsed = ref(props.collapsed);

/**
 * Watch for external changes to collapsed prop
 */
watch(
  () => props.collapsed,
  (newValue) => {
    localCollapsed.value = newValue;
  },
);

/**
 * Computed class for the panel root element
 * Merges custom class prop with any default classes
 */
const panelClass = computed(() => {
  const classes: string[] = [];

  if (props.class) {
    classes.push(props.class);
  }

  if (props.headerClass) {
    // Note: PrimeVue Panel doesn't directly support headerClass prop
    // This would need to be applied via pt (pass-through) API
    // We keep it here for future enhancement or documentation
  }

  return classes.join(' ');
});

/**
 * Handle toggle event from PrimeVue Panel
 * Emits both 'toggle' and 'update:collapsed' events for flexibility
 *
 * @param event - The toggle event from PrimeVue Panel
 */
const handleToggle = (event: { originalEvent: Event; value: boolean }) => {
  localCollapsed.value = event.value;
  emit('toggle', event);
  emit('update:collapsed', event.value);
};
</script>

<style scoped>
/* No custom styles needed - relying on PrimeVue's default Panel styles and Tailwind utilities */
</style>
