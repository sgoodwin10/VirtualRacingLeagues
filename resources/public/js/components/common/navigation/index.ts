/**
 * VRL Velocity Design System - Navigation Components
 *
 * This barrel file exports all navigation components for convenient importing.
 *
 * @example
 * ```typescript
 * import { VrlBreadcrumbs, VrlTabs, VrlNavLink } from '@public/components/common/navigation';
 * ```
 */

export { default as VrlBreadcrumbs } from './VrlBreadcrumbs.vue';
export { default as VrlBreadcrumbItem } from './VrlBreadcrumbItem.vue';
export { default as VrlTabs } from './VrlTabs.vue';
export { default as VrlTab } from './VrlTab.vue';
export { default as VrlNavLink } from './VrlNavLink.vue';

// Re-export types for convenience
export type { BreadcrumbItem, TabItem, TabVariant, NavLinkTarget } from '@public/types/navigation';
