# Card Components - TypeScript Types & Interfaces

## File: `types.ts`

This file contains all TypeScript types and interfaces used by the card components.

```typescript
// resources/app/js/components/common/cards/types.ts

import type { Component } from 'vue';

/**
 * Semantic variant types for cards and alerts
 * Maps to design system colors
 */
export type CardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Metric card variant types
 * Each variant has a corresponding accent color
 */
export type MetricVariant = 'default' | 'green' | 'orange' | 'purple' | 'red';

/**
 * Info box variant types
 * Used for informational messages with left border accent
 */
export type InfoBoxVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * Alert variant types
 * Used for notification banners
 */
export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

/**
 * Change direction for metric cards
 * Indicates positive or negative change
 */
export type ChangeDirection = 'positive' | 'negative' | 'neutral';

/**
 * Props for the Card component
 */
export interface CardProps {
  /**
   * Card title displayed in the header
   * If not provided, header slot should be used
   */
  title?: string;

  /**
   * Whether to show the card header
   * @default true if title is provided
   */
  showHeader?: boolean;

  /**
   * Additional CSS classes for the card container
   */
  class?: string;
}

/**
 * Props for the CardHeader component
 */
export interface CardHeaderProps {
  /**
   * Header title text
   */
  title?: string;

  /**
   * Additional CSS classes for the header
   */
  class?: string;
}

/**
 * Props for the CardBody component
 */
export interface CardBodyProps {
  /**
   * Remove default padding from the card body
   * Useful for tables or custom layouts
   * @default false
   */
  noPadding?: boolean;

  /**
   * Additional CSS classes for the body
   */
  class?: string;
}

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps {
  /**
   * Metric label (e.g., "Drivers", "Teams", "Points")
   */
  label: string;

  /**
   * Metric value (e.g., "20", "5,420", "14/22")
   */
  value: string | number;

  /**
   * Optional change indicator text (e.g., "+2 active", "63.6% complete")
   */
  change?: string;

  /**
   * Change direction affects the icon and color
   * @default 'neutral'
   */
  changeDirection?: ChangeDirection;

  /**
   * Icon component to display (Phosphor Icons)
   */
  icon?: Component;

  /**
   * Visual variant of the metric card
   * Affects the top accent bar color
   * @default 'default'
   */
  variant?: MetricVariant;

  /**
   * Additional CSS classes for the card
   */
  class?: string;
}

/**
 * Props for the InfoBox component
 */
export interface InfoBoxProps {
  /**
   * Info box title (e.g., "INFORMATION", "SUCCESS")
   */
  title: string;

  /**
   * Info box message/text content
   */
  message?: string;

  /**
   * Visual variant of the info box
   * Affects the left border accent color
   * @default 'info'
   */
  variant?: InfoBoxVariant;

  /**
   * Additional CSS classes for the info box
   */
  class?: string;
}

/**
 * Props for the Alert component
 */
export interface AlertProps {
  /**
   * Alert title
   */
  title: string;

  /**
   * Alert message/description
   */
  message: string;

  /**
   * Visual variant of the alert
   * Affects background color, border, and icon
   * @default 'info'
   */
  variant?: AlertVariant;

  /**
   * Custom icon component (Phosphor Icons)
   * If not provided, default icon for variant will be used
   */
  icon?: Component;

  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Additional CSS classes for the alert
   */
  class?: string;
}

/**
 * Emits for the Alert component
 */
export interface AlertEmits {
  /**
   * Emitted when the alert is dismissed
   */
  (e: 'dismiss'): void;
}

/**
 * Props for the NoteBox component
 */
export interface NoteBoxProps {
  /**
   * Note box title (e.g., "USAGE GUIDELINES", "IMPORTANT")
   */
  title: string;

  /**
   * Additional CSS classes for the note box
   */
  class?: string;
}

/**
 * Variant to CSS variable mapping
 */
export interface VariantColorMap {
  default: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

/**
 * Metric variant to CSS variable mapping
 */
export interface MetricVariantColorMap {
  default: string;
  green: string;
  orange: string;
  purple: string;
  red: string;
}
```

## Type Usage Examples

### Card Component

```typescript
// Basic card with title
<Card title="Card Title">
  <p>Card content goes here</p>
</Card>

// Card with header slot
<Card>
  <template #header>
    <CardHeader title="Custom Header">
      <template #actions>
        <Button label="Add" />
      </template>
    </CardHeader>
  </template>
  <template #body>
    <CardBody>
      <p>Card content</p>
    </CardBody>
  </template>
</Card>
```

### MetricCard Component

```typescript
// Metric card with all props
<MetricCard
  label="Drivers"
  :value="20"
  change="+2 active"
  change-direction="positive"
  :icon="PhUser"
  variant="default"
/>

// Simple metric card
<MetricCard
  label="Teams"
  :value="10"
  variant="green"
/>
```

### InfoBox Component

```typescript
// Info box with default variant
<InfoBox
  title="INFORMATION"
  message="This is an informational note."
  variant="info"
/>

// Info box with slot content
<InfoBox title="WARNING" variant="warning">
  <p>Custom HTML content with <code>code</code> elements.</p>
</InfoBox>
```

### Alert Component

```typescript
// Success alert
<Alert
  title="Success"
  message="Your changes have been saved successfully."
  variant="success"
/>

// Dismissible alert
<Alert
  title="Warning"
  message="This action requires confirmation."
  variant="warning"
  dismissible
  @dismiss="handleDismiss"
/>
```

### NoteBox Component

```typescript
// Note box with slot content
<NoteBox title="USAGE GUIDELINES">
  <p>
    Use <code>.card</code> for general content containers.
    Use <code>.metric-card</code> for KPI displays.
  </p>
</NoteBox>
```

## Type Guards

```typescript
/**
 * Type guard to check if variant is valid
 */
export function isValidCardVariant(variant: string): variant is CardVariant {
  return ['default', 'success', 'warning', 'danger', 'info'].includes(variant);
}

/**
 * Type guard to check if metric variant is valid
 */
export function isValidMetricVariant(variant: string): variant is MetricVariant {
  return ['default', 'green', 'orange', 'purple', 'red'].includes(variant);
}

/**
 * Type guard to check if alert variant is valid
 */
export function isValidAlertVariant(variant: string): variant is AlertVariant {
  return ['success', 'warning', 'error', 'info'].includes(variant);
}
```

## CSS Variable Mappings

```typescript
/**
 * Maps variant to CSS color variables
 */
export const VARIANT_COLOR_MAP: Record<CardVariant, string> = {
  default: 'var(--cyan)',
  success: 'var(--green)',
  warning: 'var(--orange)',
  danger: 'var(--red)',
  info: 'var(--cyan)',
};

/**
 * Maps variant to CSS dim color variables
 */
export const VARIANT_DIM_COLOR_MAP: Record<CardVariant, string> = {
  default: 'var(--cyan-dim)',
  success: 'var(--green-dim)',
  warning: 'var(--orange-dim)',
  danger: 'var(--red-dim)',
  info: 'var(--cyan-dim)',
};

/**
 * Maps metric variant to CSS color variables
 */
export const METRIC_VARIANT_COLOR_MAP: Record<MetricVariant, string> = {
  default: 'var(--cyan)',
  green: 'var(--green)',
  orange: 'var(--orange)',
  purple: 'var(--purple)',
  red: 'var(--red)',
};

/**
 * Maps metric variant to CSS dim color variables
 */
export const METRIC_VARIANT_DIM_COLOR_MAP: Record<MetricVariant, string> = {
  default: 'var(--cyan-dim)',
  green: 'var(--green-dim)',
  orange: 'var(--orange-dim)',
  purple: 'var(--purple-dim)',
  red: 'var(--red-dim)',
};
```

## Composable Helpers

```typescript
/**
 * Composable for getting variant classes
 */
export function useVariantClasses(variant: Ref<CardVariant>) {
  return computed(() => ({
    borderColor: VARIANT_COLOR_MAP[variant.value],
    backgroundColor: VARIANT_DIM_COLOR_MAP[variant.value],
    textColor: VARIANT_COLOR_MAP[variant.value],
  }));
}

/**
 * Composable for getting metric variant classes
 */
export function useMetricVariantClasses(variant: Ref<MetricVariant>) {
  return computed(() => ({
    accentColor: METRIC_VARIANT_COLOR_MAP[variant.value],
    iconBackground: METRIC_VARIANT_DIM_COLOR_MAP[variant.value],
    iconColor: METRIC_VARIANT_COLOR_MAP[variant.value],
  }));
}
```

## Notes

1. All types are exported for use in other parts of the application
2. Props use optional properties with sensible defaults
3. Type guards ensure runtime type safety
4. CSS variable mappings centralize color management
5. Composable helpers reduce code duplication
6. All types include JSDoc comments for IDE autocomplete
