# VersionIndicator Component Specification

> **Priority**: 2 (Specialized)
> **Location**: `resources/app/js/components/common/indicators/VersionIndicator.vue`

## Overview

A badge for displaying version numbers, typically in headers, footers, or about sections.

## Design Reference

From `badges.html`:
```css
.version-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 6px 12px;
  background: var(--green-dim);
  color: var(--green);
  border-radius: var(--radius);
}
```

## Props Interface

```typescript
interface VersionIndicatorProps {
  /**
   * Version string (e.g., 'v1.0.0', '2.3.1')
   * @default ''
   */
  version: string;

  /**
   * Color variant
   * @default 'success'
   */
  variant?: 'success' | 'info' | 'warning' | 'neutral';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md';

  /**
   * Automatically prepend 'v' if missing
   * @default true
   */
  autoPrefix?: boolean;
}
```

## Size Specifications

| Size | Font Size | Padding |
|------|-----------|---------|
| `sm` | 10px | 4px 8px |
| `md` | 11px | 6px 12px |

## Color Mapping

| Variant | Background | Text Color | Use Case |
|---------|------------|------------|----------|
| `success` | `var(--green-dim)` | `var(--green)` | Stable release |
| `info` | `var(--cyan-dim)` | `var(--cyan)` | Latest version |
| `warning` | `var(--orange-dim)` | `var(--orange)` | Beta/RC |
| `neutral` | `var(--bg-elevated)` | `var(--text-secondary)` | Legacy |

## Implementation Template

```vue
<template>
  <span
    :class="[
      'version-indicator',
      `version-indicator--${variant}`,
      `version-indicator--${size}`
    ]"
  >
    {{ displayVersion }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  version: string;
  variant?: 'success' | 'info' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  autoPrefix?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'success',
  size: 'md',
  autoPrefix: true,
});

const displayVersion = computed(() => {
  if (!props.version) return '';
  if (props.autoPrefix && !props.version.startsWith('v')) {
    return `v${props.version}`;
  }
  return props.version;
});
</script>

<style scoped>
.version-indicator {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
}

/* Sizes */
.version-indicator--sm {
  padding: 4px 8px;
  font-size: 10px;
}

.version-indicator--md {
  padding: 6px 12px;
  font-size: 11px;
}

/* Variants */
.version-indicator--success {
  background: var(--green-dim);
  color: var(--green);
}

.version-indicator--info {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.version-indicator--warning {
  background: var(--orange-dim);
  color: var(--orange);
}

.version-indicator--neutral {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}
</style>
```

## Usage Examples

```vue
<!-- Basic usage -->
<VersionIndicator version="1.0.0" />
<VersionIndicator version="v2.3.1" />

<!-- Variants -->
<VersionIndicator version="1.0.0" variant="success" />  <!-- Stable -->
<VersionIndicator version="2.0.0" variant="info" />     <!-- Latest -->
<VersionIndicator version="3.0.0-beta" variant="warning" />  <!-- Beta -->
<VersionIndicator version="0.9.0" variant="neutral" />  <!-- Legacy -->

<!-- Sizes -->
<VersionIndicator version="1.0.0" size="sm" />
<VersionIndicator version="1.0.0" size="md" />

<!-- Without auto prefix -->
<VersionIndicator version="2024.1" :auto-prefix="false" />

<!-- In header -->
<header class="app-header">
  <h1>My App</h1>
  <VersionIndicator version="1.0.0" size="sm" />
</header>

<!-- In footer -->
<footer>
  <span>Powered by VRL</span>
  <VersionIndicator version="2.1.0" variant="neutral" />
</footer>
```

## Integration Patterns

### App Header

```vue
<template>
  <header class="header">
    <div class="header__logo">
      <img src="/logo.svg" alt="Logo" />
      <span class="header__title">Virtual Racing Leagues</span>
    </div>
    <div class="header__version">
      <VersionIndicator :version="appVersion" size="sm" />
    </div>
  </header>
</template>

<script setup lang="ts">
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
</script>
```

### About Dialog

```vue
<Dialog header="About">
  <div class="about-content">
    <img src="/logo.svg" alt="VRL Logo" class="about-logo" />
    <h2>Virtual Racing Leagues</h2>
    <VersionIndicator :version="appVersion" />
    <p>Manage your sim racing leagues with ease.</p>
  </div>
</Dialog>
```

### Package/Dependency Display

```vue
<div class="dependency-list">
  <div class="dependency" v-for="dep in dependencies" :key="dep.name">
    <span>{{ dep.name }}</span>
    <VersionIndicator
      :version="dep.version"
      :variant="getVariant(dep)"
      size="sm"
    />
  </div>
</div>
```

## Test Cases

```typescript
describe('VersionIndicator', () => {
  it('renders version string', () => {
    const wrapper = mount(VersionIndicator, { props: { version: '1.0.0' } });
    expect(wrapper.text()).toBe('v1.0.0');
  });

  it('does not double prefix v', () => {
    const wrapper = mount(VersionIndicator, { props: { version: 'v1.0.0' } });
    expect(wrapper.text()).toBe('v1.0.0');
  });

  it('respects autoPrefix=false', () => {
    const wrapper = mount(VersionIndicator, {
      props: { version: '2024.1', autoPrefix: false }
    });
    expect(wrapper.text()).toBe('2024.1');
  });

  it('renders all variants', () => {
    const variants = ['success', 'info', 'warning', 'neutral'];
    variants.forEach(variant => {
      const wrapper = mount(VersionIndicator, {
        props: { version: '1.0.0', variant }
      });
      expect(wrapper.classes()).toContain(`version-indicator--${variant}`);
    });
  });

  it('renders both sizes', () => {
    ['sm', 'md'].forEach(size => {
      const wrapper = mount(VersionIndicator, {
        props: { version: '1.0.0', size }
      });
      expect(wrapper.classes()).toContain(`version-indicator--${size}`);
    });
  });

  it('handles empty version', () => {
    const wrapper = mount(VersionIndicator, { props: { version: '' } });
    expect(wrapper.text()).toBe('');
  });
});
```

## Accessibility

- Monospace font makes version numbers clearly readable
- Color is supplemented by the version text
- Consider adding `aria-label` for context: "Application version 1.0.0"
