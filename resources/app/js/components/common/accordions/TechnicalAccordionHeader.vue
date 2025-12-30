<script setup lang="ts">
import { computed, type Component } from 'vue';
import AccordionHeader from 'primevue/accordionheader';
import AccordionStatusIndicator from './AccordionStatusIndicator.vue';
import AccordionIcon from './AccordionIcon.vue';
import AccordionBadge from './AccordionBadge.vue';
import type {
  AccordionStatus,
  AccordionIconVariant,
  AccordionBadgeSeverity,
  AccordionPadding,
} from './types';
import { PADDING_MAP } from './types';

interface Props {
  title: string;
  subtitle?: string;
  status?: AccordionStatus;
  icon?: Component;
  iconVariant?: AccordionIconVariant;
  badge?: string;
  badgeSeverity?: AccordionBadgeSeverity;
  hideChevron?: boolean;
  padding?: AccordionPadding;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  status: undefined,
  icon: undefined,
  iconVariant: 'cyan',
  badge: undefined,
  badgeSeverity: 'muted',
  hideChevron: false,
  padding: 'md',
});

const paddingValue = computed(() => PADDING_MAP[props.padding]);

const passthroughOptions = computed(() => ({
  root: {
    class: 'technical-accordion-header',
  },
}));
</script>

<template>
  <AccordionHeader :pt="passthroughOptions">
    <div class="header-content" :style="{ padding: paddingValue }">
      <div class="header-main">
        <slot name="prefix">
          <AccordionStatusIndicator v-if="status" :status="status" />
        </slot>

        <AccordionIcon v-if="icon" :icon="icon" :variant="iconVariant" />

        <div class="header-text">
          <div class="header-title-row">
            <slot name="title">
              <h3 class="header-title">{{ title }}</h3>
            </slot>

            <AccordionBadge v-if="badge" :text="badge" :severity="badgeSeverity" />
          </div>

          <slot name="subtitle">
            <p v-if="subtitle" class="header-subtitle">
              {{ subtitle }}
            </p>
          </slot>
        </div>

        <slot name="suffix" />
      </div>

      <div class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </AccordionHeader>
</template>

<style scoped>
.technical-accordion-header {
  cursor: pointer;
  user-select: none;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.header-title {
  font-family: var(--accordion-font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--accordion-text-primary);
  margin: 0;
  line-height: 1.4;
}

.header-subtitle {
  font-family: var(--accordion-font-sans);
  font-size: 12px;
  color: var(--accordion-text-muted);
  margin: 0;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding-right: 8px;
}

.header-chevron {
  color: var(--accordion-text-secondary);
  transition: all 0.2s ease;
}

.technical-accordion-header:hover .header-chevron {
  /* color: var(--accordion-accent-cyan); */
}

:deep(.p-accordionpanel-active) .header-chevron {
  transform: rotate(180deg);
  color: var(--accordion-accent-cyan);
}
</style>
