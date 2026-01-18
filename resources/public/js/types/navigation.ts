import type { RouteLocationRaw } from 'vue-router';

/**
 * Breadcrumb item configuration
 */
export interface BreadcrumbItem {
  /** Display text for the breadcrumb */
  label: string;

  /** Regular link href (for external or non-router links) */
  href?: string;

  /** Vue Router route location */
  to?: RouteLocationRaw;

  /** Optional icon (Phosphor icon name) */
  icon?: string;
}

/**
 * Tab item configuration
 */
export interface TabItem {
  /** Unique identifier for the tab */
  key: string;

  /** Display text */
  label: string;

  /** Whether the tab is disabled */
  disabled?: boolean;

  /** Optional icon (Phosphor icon name) */
  icon?: string;

  /** Optional badge count */
  badge?: number | string;
}

/**
 * Tab variant types
 */
export type TabVariant = 'default' | 'minimal';

/**
 * Navigation link target types
 */
export type NavLinkTarget = '_self' | '_blank' | '_parent' | '_top';
