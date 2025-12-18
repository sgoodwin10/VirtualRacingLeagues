# Media Management Frontend Implementation Plan

> **Document Version:** 1.0
> **Created:** December 2024
> **Status:** Implementation Plan
> **Agents:** `dev-fe-app`, `dev-fe-admin`, `dev-fe-public`
> **Parent Document:** [01-media-management-architecture-plan.md](./01-media-management-architecture-plan.md)

## Table of Contents

1. [Overview](#1-overview)
2. [API Response Types](#2-api-response-types)
3. [Shared Components](#3-shared-components)
4. [App Dashboard Implementation](#4-app-dashboard-implementation)
5. [Admin Dashboard Implementation](#5-admin-dashboard-implementation)
6. [Public Dashboard Implementation](#6-public-dashboard-implementation)
7. [Testing Requirements](#7-testing-requirements)
8. [File Reference](#8-file-reference)

---

## 1. Overview

This document provides the frontend implementation plan for the Media Management feature across all three Vue.js applications (App, Admin, Public).

### Current State Analysis

Based on codebase research:

| Dashboard | Current Image Components | Current Patterns |
|-----------|--------------------------|------------------|
| App | `ImageUpload.vue` | Uses PrimeVue FileUpload, client-side validation, object URL preview |
| Admin | `ImageUpload.vue`, `FilePreview.vue` | Similar to App, handles SiteConfigFile objects |
| Public | Direct `<img>` tags | Uses `logo_url` from API |

**Current Frontend Files:**
- `resources/app/js/components/common/forms/ImageUpload.vue`
- `resources/admin/js/components/SiteConfig/FileUpload/ImageUpload.vue`
- `resources/admin/js/components/SiteConfig/FileUpload/FilePreview.vue`
- Various components using `logo_url`, `header_image_url`, etc.

### Key Changes Required

1. **New TypeScript types** for media response structure
2. **New shared component** `ResponsiveImage.vue` for displaying images with srcset
3. **Update ImageUpload components** to work with new API response
4. **Update all image displays** to use srcset and lazy loading
5. **Add WebP fallback** using `<picture>` element for older browsers

---

## 2. API Response Types

### 2.1 Shared Media Types

Each dashboard needs these TypeScript type definitions:

**File:** `resources/{app,admin,public}/js/types/media.ts`

```typescript
/**
 * Represents a single media item from the API.
 * Returned by endpoints that include image data.
 */
export interface MediaItem {
  /** Unique identifier for the media item */
  id: number;

  /** URL to the original uploaded image */
  original: string;

  /** Object mapping conversion names to their URLs */
  conversions: MediaConversions;

  /** Pre-built srcset string for responsive images */
  srcset: string;
}

/**
 * Available image conversions with their URLs.
 * All conversions are in WebP format for optimal performance.
 */
export interface MediaConversions {
  /** 150x150 thumbnail, cropped */
  thumb: string;

  /** 320px width for mobile */
  small: string;

  /** 640px width for tablet */
  medium: string;

  /** 1280px width for desktop */
  large: string;

  /** 1200x630 for social sharing (OG images only) */
  og?: string;
}

/**
 * Default sizes attribute for responsive images.
 * Can be overridden per-component based on layout.
 */
export const DEFAULT_SIZES = '(max-width: 320px) 320px, (max-width: 640px) 640px, 1280px';

/**
 * Helper type for entities that have media fields.
 * Used for type-safe access to media properties.
 */
export interface WithMedia {
  logo?: MediaItem | null;
  headerImage?: MediaItem | null;
  banner?: MediaItem | null;

  // Legacy fields for backward compatibility during transition
  logoUrl?: string | null;
  headerImageUrl?: string | null;
  bannerUrl?: string | null;
}

/**
 * Props for the ResponsiveImage component.
 */
export interface ResponsiveImageProps {
  /** The media item to display */
  media: MediaItem | null | undefined;

  /** Alt text for accessibility */
  alt: string;

  /** Fallback URL if media is null (e.g., legacy logoUrl) */
  fallbackSrc?: string;

  /** Which conversion to use as the default src */
  defaultConversion?: keyof MediaConversions;

  /** Custom sizes attribute */
  sizes?: string;

  /** Enable lazy loading (default: true) */
  lazy?: boolean;

  /** CSS class for the image */
  class?: string;

  /** Placeholder to show while loading */
  placeholder?: 'blur' | 'skeleton' | 'none';
}
```

### 2.2 Update Entity Types

Update existing entity types to include new media structure:

**Example - League Type Update:**

```typescript
// resources/app/js/types/league.ts

import type { MediaItem } from './media';

export interface League {
  id: number;
  name: string;
  slug: string;
  description?: string;
  // ... other fields

  // New media fields
  logo: MediaItem | null;
  headerImage: MediaItem | null;
  banner: MediaItem | null;

  // Legacy fields (deprecated, will be removed after migration)
  /** @deprecated Use logo.original instead */
  logoUrl?: string;
  /** @deprecated Use headerImage.original instead */
  headerImageUrl?: string;
  /** @deprecated Use banner.original instead */
  bannerUrl?: string;
}
```

---

## 3. Shared Components

### 3.1 ResponsiveImage Component

Create a reusable responsive image component for each dashboard.

**File:** `resources/{app,admin,public}/js/components/common/ResponsiveImage.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MediaItem, MediaConversions, ResponsiveImageProps } from '@{app,admin,public}/types/media';
import { DEFAULT_SIZES } from '@{app,admin,public}/types/media';

const props = withDefaults(defineProps<ResponsiveImageProps>(), {
  defaultConversion: 'medium',
  sizes: DEFAULT_SIZES,
  lazy: true,
  placeholder: 'skeleton',
});

const isLoaded = ref(false);
const hasError = ref(false);

/**
 * Get the src URL - either from media conversions or fallback.
 */
const src = computed(() => {
  if (props.media?.conversions?.[props.defaultConversion]) {
    return props.media.conversions[props.defaultConversion];
  }
  if (props.media?.original) {
    return props.media.original;
  }
  return props.fallbackSrc ?? '';
});

/**
 * Get the srcset from media item.
 */
const srcset = computed(() => {
  return props.media?.srcset ?? '';
});

/**
 * Determine if we have a valid image to display.
 */
const hasImage = computed(() => {
  return Boolean(src.value);
});

/**
 * Handle image load event.
 */
const onLoad = () => {
  isLoaded.value = true;
};

/**
 * Handle image error event.
 */
const onError = () => {
  hasError.value = true;
};

/**
 * Show skeleton placeholder while loading.
 */
const showSkeleton = computed(() => {
  return props.placeholder === 'skeleton' && !isLoaded.value && !hasError.value && hasImage.value;
});
</script>

<template>
  <div class="responsive-image-container" :class="{ 'is-loading': showSkeleton }">
    <!-- Skeleton placeholder -->
    <div v-if="showSkeleton" class="skeleton-placeholder" aria-hidden="true" />

    <!-- Picture element for WebP with fallback -->
    <picture v-if="hasImage && !hasError">
      <!-- WebP source (from conversions/srcset) -->
      <source
        v-if="srcset"
        :srcset="srcset"
        :sizes="sizes"
        type="image/webp"
      />
      <!-- Fallback img -->
      <img
        :src="src"
        :alt="alt"
        :loading="lazy ? 'lazy' : 'eager'"
        :class="[props.class, { 'is-loaded': isLoaded }]"
        @load="onLoad"
        @error="onError"
      />
    </picture>

    <!-- Fallback for no image -->
    <div v-else-if="!hasImage || hasError" class="no-image-placeholder">
      <slot name="placeholder">
        <span class="no-image-icon">
          <i class="pi pi-image" />
        </span>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.responsive-image-container {
  position: relative;
  overflow: hidden;
}

.skeleton-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

img.is-loaded {
  opacity: 1;
}

.no-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--surface-100);
  color: var(--text-color-secondary);
}

.no-image-icon {
  font-size: 2rem;
}
</style>
```

### 3.2 Updated ImageUpload Component

Update the existing `ImageUpload.vue` to work with the new media response format.

**Key Changes:**
1. Accept `MediaItem` for existing images (not just URL string)
2. Emit both `File` (for upload) and removal events
3. Display responsive preview using new conversions

**File:** `resources/app/js/components/common/forms/ImageUpload.vue` (update)

```vue
<script setup lang="ts">
import { computed, ref, onUnmounted, watch } from 'vue';
import FileUpload from 'primevue/fileupload';
import type { MediaItem } from '@app/types/media';

interface Props {
  /** Currently selected file for upload */
  modelValue: File | null;

  /** Existing media item from API */
  existingMedia?: MediaItem | null;

  /** Legacy: Existing image URL (deprecated, use existingMedia) */
  existingImageUrl?: string;

  /** Field label */
  label: string;

  /** Accepted MIME types */
  accept?: string;

  /** Max file size in bytes */
  maxFileSize?: number;

  /** Minimum dimensions required */
  minDimensions?: { width: number; height: number };

  /** Recommended dimensions (info only) */
  recommendedDimensions?: { width: number; height: number };

  /** Preview size */
  previewSize?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  maxFileSize: 2 * 1024 * 1024, // 2MB
  previewSize: 'medium',
});

const emit = defineEmits<{
  'update:modelValue': [file: File | null];
  'remove-existing': [];
}>();

// Local state
const previewUrl = ref<string | null>(null);
const validationError = ref<string | null>(null);

/**
 * Compute the preview URL to display.
 * Priority: new file preview > existing media > legacy URL
 */
const displayUrl = computed(() => {
  if (previewUrl.value) {
    return previewUrl.value;
  }
  if (props.existingMedia?.conversions?.medium) {
    return props.existingMedia.conversions.medium;
  }
  if (props.existingMedia?.original) {
    return props.existingMedia.original;
  }
  return props.existingImageUrl ?? null;
});

/**
 * Check if we have something to display.
 */
const hasImage = computed(() => {
  return Boolean(displayUrl.value);
});

/**
 * Handle file selection from FileUpload component.
 */
const onSelect = async (event: { files: File[] }) => {
  const file = event.files[0];

  if (!file) {
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    validationError.value = 'Please select an image file';
    return;
  }

  // Validate file size
  if (file.size > props.maxFileSize) {
    const maxSizeMB = (props.maxFileSize / 1024 / 1024).toFixed(1);
    validationError.value = `File size must be less than ${maxSizeMB}MB`;
    return;
  }

  // Validate dimensions if required
  if (props.minDimensions) {
    const isValid = await validateDimensions(file);
    if (!isValid) {
      return;
    }
  }

  // Clear any previous errors
  validationError.value = null;

  // Create preview URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = URL.createObjectURL(file);

  // Emit the file
  emit('update:modelValue', file);
};

/**
 * Validate image dimensions.
 */
const validateDimensions = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = props.minDimensions!;
      if (img.width < width || img.height < height) {
        validationError.value = `Image must be at least ${width}x${height} pixels`;
        resolve(false);
      } else {
        resolve(true);
      }
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      validationError.value = 'Failed to load image for validation';
      resolve(false);
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Handle remove button click.
 */
const onRemove = () => {
  // Clear local preview
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }

  // Clear the file
  emit('update:modelValue', null);

  // If there was existing media, emit remove event
  if (props.existingMedia || props.existingImageUrl) {
    emit('remove-existing');
  }
};

/**
 * Format file size for display.
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Cleanup on unmount
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newFile) => {
    if (!newFile && previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }
  }
);
</script>

<template>
  <div class="image-upload">
    <label v-if="label" class="image-upload__label">
      {{ label }}
      <span v-if="recommendedDimensions" class="image-upload__hint">
        (Recommended: {{ recommendedDimensions.width }}x{{ recommendedDimensions.height }})
      </span>
    </label>

    <!-- Preview with remove button -->
    <div v-if="hasImage" class="image-upload__preview" :class="`image-upload__preview--${previewSize}`">
      <img :src="displayUrl!" alt="Preview" class="image-upload__image" />
      <button
        type="button"
        class="image-upload__remove"
        aria-label="Remove image"
        @click="onRemove"
      >
        <i class="pi pi-times" />
      </button>
    </div>

    <!-- File upload area -->
    <FileUpload
      v-else
      mode="basic"
      :accept="accept"
      :max-file-size="maxFileSize"
      :auto="false"
      choose-label="Choose Image"
      class="image-upload__input"
      @select="onSelect"
    />

    <!-- Validation error -->
    <small v-if="validationError" class="image-upload__error">
      {{ validationError }}
    </small>

    <!-- Size info -->
    <small v-if="!validationError" class="image-upload__info">
      Max size: {{ formatFileSize(maxFileSize) }}
    </small>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-upload__label {
  font-weight: 500;
  color: var(--text-color);
}

.image-upload__hint {
  font-weight: 400;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.image-upload__preview {
  position: relative;
  border-radius: var(--border-radius);
  overflow: hidden;
  background-color: var(--surface-100);
}

.image-upload__preview--small {
  width: 100px;
  height: 100px;
}

.image-upload__preview--medium {
  width: 200px;
  height: 150px;
}

.image-upload__preview--large {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16 / 9;
}

.image-upload__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-upload__remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.image-upload__remove:hover {
  background-color: var(--red-500);
}

.image-upload__error {
  color: var(--red-500);
}

.image-upload__info {
  color: var(--text-color-secondary);
}
</style>
```

---

## 4. App Dashboard Implementation

**Agent:** `dev-fe-app`

### 4.1 Files to Create

| File | Purpose |
|------|---------|
| `types/media.ts` | Media type definitions |
| `components/common/ResponsiveImage.vue` | Responsive image component |

### 4.2 Files to Modify

| File | Changes |
|------|---------|
| `types/league.ts` | Add MediaItem fields |
| `types/season.ts` | Add MediaItem fields |
| `types/competition.ts` | Add MediaItem fields |
| `types/team.ts` | Add MediaItem fields |
| `components/common/forms/ImageUpload.vue` | Support MediaItem |
| `components/league/LeagueCard.vue` | Use ResponsiveImage |
| `components/league/partials/LeagueHeader.vue` | Use ResponsiveImage |
| `components/league/modals/LeagueWizardDrawer.vue` | Update for new API |
| `components/competition/CompetitionCard.vue` | Use ResponsiveImage |
| `components/competition/CompetitionHeader.vue` | Use ResponsiveImage |
| `components/season/SeasonCard.vue` | Use ResponsiveImage |
| `components/season/modals/SeasonFormDrawer.vue` | Update for new API |
| `services/leagueService.ts` | Handle new response format |

### 4.3 Example Component Updates

**LeagueCard.vue - Before:**
```vue
<img :src="league.logoUrl" :alt="league.name" />
```

**LeagueCard.vue - After:**
```vue
<ResponsiveImage
  :media="league.logo"
  :fallback-src="league.logoUrl"
  :alt="league.name"
  default-conversion="medium"
  class="league-card__logo"
/>
```

**LeagueHeader.vue - Before:**
```vue
<div
  class="league-header"
  :style="{ backgroundImage: `url(${league.bannerUrl})` }"
>
```

**LeagueHeader.vue - After:**
```vue
<div class="league-header">
  <picture v-if="league.banner">
    <source :srcset="league.banner.srcset" type="image/webp" />
    <img
      :src="league.banner.original"
      :alt="`${league.name} banner`"
      loading="lazy"
      class="league-header__background"
    />
  </picture>
  <img
    v-else-if="league.bannerUrl"
    :src="league.bannerUrl"
    :alt="`${league.name} banner`"
    class="league-header__background"
  />
</div>
```

---

## 5. Admin Dashboard Implementation

**Agent:** `dev-fe-admin`

### 5.1 Files to Create

| File | Purpose |
|------|---------|
| `types/media.ts` | Media type definitions |
| `components/common/ResponsiveImage.vue` | Responsive image component |

### 5.2 Files to Modify

| File | Changes |
|------|---------|
| `types/league.ts` | Add MediaItem fields |
| `components/SiteConfig/FileUpload/ImageUpload.vue` | Support MediaItem |
| `components/SiteConfig/FileUpload/FilePreview.vue` | Support MediaItem |
| `components/League/LeaguesTable.vue` | Use ResponsiveImage for thumbnails |

### 5.3 SiteConfig Special Handling

SiteConfig currently uses a separate `SiteConfigFile` model. Update to support both:

```typescript
// types/siteConfig.ts

import type { MediaItem } from './media';

export interface SiteConfig {
  // ... other fields

  // New media fields
  logo: MediaItem | null;
  favicon: MediaItem | null;
  ogImage: MediaItem | null;

  // Legacy (deprecated)
  logoFile?: SiteConfigFile;
  faviconFile?: SiteConfigFile;
  ogImageFile?: SiteConfigFile;
}
```

---

## 6. Public Dashboard Implementation

**Agent:** `dev-fe-public`

### 6.1 Files to Create

| File | Purpose |
|------|---------|
| `types/media.ts` | Media type definitions |
| `components/common/ResponsiveImage.vue` | Responsive image component |

### 6.2 Files to Modify

| File | Changes |
|------|---------|
| `types/public.ts` | Add MediaItem to public types |
| `components/common/cards/VrlLeagueCard.vue` | Use ResponsiveImage |
| `components/common/layout/PageHeader.vue` | Use ResponsiveImage for banner |
| `views/leagues/LeagueDetailView.vue` | Use ResponsiveImage |
| `views/leagues/SeasonView.vue` | Use ResponsiveImage |
| `views/leagues/PublicLeaguesView.vue` | Use ResponsiveImage |

### 6.3 Public-Specific Considerations

1. **Lazy Loading:** All images should use `loading="lazy"` by default
2. **WebP Fallback:** Always use `<picture>` for broader browser support
3. **Performance:** Use `sizes` attribute accurately based on layout
4. **Accessibility:** Always provide meaningful `alt` text

**Example - VrlLeagueCard.vue:**
```vue
<template>
  <div class="vrl-league-card">
    <ResponsiveImage
      :media="league.logo"
      :fallback-src="league.logoUrl"
      :alt="`${league.name} logo`"
      default-conversion="medium"
      sizes="(max-width: 640px) 100vw, 320px"
      :lazy="true"
      class="vrl-league-card__logo"
    />
    <!-- ... -->
  </div>
</template>
```

---

## 7. Testing Requirements

### 7.1 Unit Tests (Vitest)

**ResponsiveImage Component:**

```typescript
// resources/app/js/components/common/__tests__/ResponsiveImage.test.ts

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResponsiveImage from '../ResponsiveImage.vue';
import type { MediaItem } from '@app/types/media';

const mockMedia: MediaItem = {
  id: 1,
  original: 'https://example.com/original.png',
  conversions: {
    thumb: 'https://example.com/thumb.webp',
    small: 'https://example.com/small.webp',
    medium: 'https://example.com/medium.webp',
    large: 'https://example.com/large.webp',
  },
  srcset: 'https://example.com/thumb.webp 150w, https://example.com/small.webp 320w',
};

describe('ResponsiveImage', () => {
  it('renders image with srcset when media is provided', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMedia,
        alt: 'Test image',
      },
    });

    const source = wrapper.find('source');
    expect(source.exists()).toBe(true);
    expect(source.attributes('srcset')).toBe(mockMedia.srcset);
    expect(source.attributes('type')).toBe('image/webp');

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('alt')).toBe('Test image');
  });

  it('uses fallbackSrc when media is null', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: null,
        alt: 'Fallback image',
        fallbackSrc: 'https://example.com/fallback.png',
      },
    });

    // Should not have srcset source
    const source = wrapper.find('source');
    expect(source.attributes('srcset')).toBeFalsy();

    // Should have img with fallback
    const img = wrapper.find('img');
    expect(img.attributes('src')).toBe('https://example.com/fallback.png');
  });

  it('shows placeholder when no image', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: null,
        alt: 'No image',
      },
    });

    const placeholder = wrapper.find('.no-image-placeholder');
    expect(placeholder.exists()).toBe(true);
  });

  it('applies lazy loading by default', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMedia,
        alt: 'Lazy image',
      },
    });

    const img = wrapper.find('img');
    expect(img.attributes('loading')).toBe('lazy');
  });

  it('disables lazy loading when lazy prop is false', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMedia,
        alt: 'Eager image',
        lazy: false,
      },
    });

    const img = wrapper.find('img');
    expect(img.attributes('loading')).toBe('eager');
  });

  it('uses specified default conversion', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMedia,
        alt: 'Test image',
        defaultConversion: 'large',
      },
    });

    const img = wrapper.find('img');
    expect(img.attributes('src')).toBe(mockMedia.conversions.large);
  });
});
```

**ImageUpload Component:**

```typescript
// resources/app/js/components/common/forms/__tests__/ImageUpload.test.ts

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ImageUpload from '../ImageUpload.vue';
import type { MediaItem } from '@app/types/media';

const mockMedia: MediaItem = {
  id: 1,
  original: 'https://example.com/logo.png',
  conversions: {
    thumb: 'https://example.com/logo-thumb.webp',
    small: 'https://example.com/logo-small.webp',
    medium: 'https://example.com/logo-medium.webp',
    large: 'https://example.com/logo-large.webp',
  },
  srcset: '',
};

describe('ImageUpload', () => {
  it('displays existing media', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        existingMedia: mockMedia,
        label: 'Logo',
      },
    });

    const img = wrapper.find('.image-upload__image');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(mockMedia.conversions.medium);
  });

  it('displays legacy URL when no media', () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        existingImageUrl: 'https://example.com/old-logo.png',
        label: 'Logo',
      },
    });

    const img = wrapper.find('.image-upload__image');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/old-logo.png');
  });

  it('emits remove-existing when remove button clicked', async () => {
    const wrapper = mount(ImageUpload, {
      props: {
        modelValue: null,
        existingMedia: mockMedia,
        label: 'Logo',
      },
    });

    await wrapper.find('.image-upload__remove').trigger('click');

    expect(wrapper.emitted('remove-existing')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
  });
});
```

### 7.2 E2E Tests (Playwright)

```typescript
// e2e/media-upload.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Media Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin/user
    await page.goto('/login');
    // ... login steps
  });

  test('league logo upload generates responsive images', async ({ page }) => {
    await page.goto('/leagues/create');

    // Upload logo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('e2e/fixtures/test-logo.png');

    // Wait for preview
    await expect(page.locator('.image-upload__image')).toBeVisible();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page).toHaveURL(/\/leagues\/\d+/);

    // Verify responsive image is displayed
    const leagueLogo = page.locator('.league-header img');
    await expect(leagueLogo).toHaveAttribute('srcset', /thumb.*small.*medium/);
  });

  test('images lazy load on scroll', async ({ page }) => {
    await page.goto('/leagues');

    // Get images that are below the fold
    const images = page.locator('.league-card__logo img');

    // First image should be visible and loaded
    await expect(images.first()).toHaveAttribute('loading', 'lazy');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for images to load
    await page.waitForTimeout(500);

    // All images should now be loaded
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible();
    }
  });
});
```

---

## 8. File Reference

### 8.1 New Files to Create

**App Dashboard:**
```
resources/app/js/
├── types/
│   └── media.ts
└── components/
    └── common/
        ├── ResponsiveImage.vue
        └── __tests__/
            └── ResponsiveImage.test.ts
```

**Admin Dashboard:**
```
resources/admin/js/
├── types/
│   └── media.ts
└── components/
    └── common/
        ├── ResponsiveImage.vue
        └── __tests__/
            └── ResponsiveImage.test.ts
```

**Public Dashboard:**
```
resources/public/js/
├── types/
│   └── media.ts
└── components/
    └── common/
        ├── ResponsiveImage.vue
        └── __tests__/
            └── ResponsiveImage.test.ts
```

### 8.2 Files to Modify

**App Dashboard:**
```
resources/app/js/
├── types/
│   ├── league.ts
│   ├── season.ts
│   ├── competition.ts
│   └── team.ts
├── components/
│   ├── common/forms/ImageUpload.vue
│   ├── league/
│   │   ├── LeagueCard.vue
│   │   ├── modals/LeagueWizardDrawer.vue
│   │   └── partials/LeagueHeader.vue
│   ├── competition/
│   │   ├── CompetitionCard.vue
│   │   ├── CompetitionHeader.vue
│   │   └── CompetitionFormDrawer.vue
│   ├── season/
│   │   ├── SeasonCard.vue
│   │   └── modals/SeasonFormDrawer.vue
│   └── team/
│       └── TeamFormModal.vue
└── services/
    ├── leagueService.ts
    ├── competitionService.ts
    └── seasonService.ts
```

**Admin Dashboard:**
```
resources/admin/js/
├── types/
│   └── league.ts
├── components/
│   ├── SiteConfig/FileUpload/
│   │   ├── ImageUpload.vue
│   │   └── FilePreview.vue
│   └── League/
│       └── LeaguesTable.vue
└── services/
    └── leagueService.ts
```

**Public Dashboard:**
```
resources/public/js/
├── types/
│   └── public.ts
├── components/
│   ├── common/
│   │   ├── cards/VrlLeagueCard.vue
│   │   └── layout/PageHeader.vue
│   └── leagues/
│       └── *.vue (various)
└── views/
    └── leagues/
        ├── LeagueDetailView.vue
        ├── SeasonView.vue
        └── PublicLeaguesView.vue
```

---

## Related Documents

- [01-media-management-architecture-plan.md](./01-media-management-architecture-plan.md) - Full architecture specification
- [02-media-implementation-overview.md](./02-media-implementation-overview.md) - Implementation overview
- [03-media-backend-implementation.md](./03-media-backend-implementation.md) - Backend implementation details
