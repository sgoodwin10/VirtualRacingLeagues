// resources/app/js/components/common/cards/index.ts

/**
 * Card Components
 *
 * A collection of reusable card components following the Technical Blueprint design system.
 * These components provide consistent styling and behavior for displaying content,
 * metrics, notifications, and informational messages.
 */

export { default as Card } from './Card.vue';
export { default as CardHeader } from './CardHeader.vue';
export { default as CardBody } from './CardBody.vue';
export { default as MetricCard } from './MetricCard.vue';
export { default as InfoBox } from './InfoBox.vue';
export { default as Alert } from './Alert.vue';
export { default as NoteBox } from './NoteBox.vue';

// Export types
export type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  MetricCardProps,
  InfoBoxProps,
  AlertProps,
  AlertEmits,
  NoteBoxProps,
  CardVariant,
  MetricVariant,
  InfoBoxVariant,
  AlertVariant,
  ChangeDirection,
} from './types';
