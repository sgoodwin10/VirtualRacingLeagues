import type { Ref } from 'vue';

/**
 * Context provided by VrlAccordion to child VrlAccordionItem components
 */
export interface AccordionContext {
  /** Currently active item value(s) */
  activeValue: Ref<string | string[] | undefined>;
  /** Whether multiple items can be open simultaneously */
  multiple: boolean;
  /** Function to toggle an accordion item */
  toggleItem: (value: string) => void;
}

/**
 * Gap size mapping for accordion spacing
 */
export const GAP_MAP = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
} as const;

/**
 * Gap size type for accordion
 */
export type AccordionGap = keyof typeof GAP_MAP;
