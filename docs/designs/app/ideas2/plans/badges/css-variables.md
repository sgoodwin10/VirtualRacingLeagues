# CSS Variables Setup Guide

> **Priority**: Critical (Must be completed before component implementation)
> **Location**: `resources/app/css/variables.css` or similar

---

## Overview

All badge/indicator components depend on a shared set of CSS variables for colors, typography, and spacing. This document outlines the required variables and where to define them.

---

## Required CSS Variables

### Complete Variable Set

```css
:root {
  /* =============================================
   * COLORS - Semantic Palette
   * ============================================= */

  /* Primary accent - Info, links, highlights */
  --cyan: #58a6ff;
  --cyan-dim: rgba(88, 166, 255, 0.15);

  /* Success - Active, online, completed */
  --green: #7ee787;
  --green-dim: rgba(126, 231, 135, 0.15);

  /* Warning - Pending, caution */
  --orange: #f0883e;
  --orange-dim: rgba(240, 136, 62, 0.15);

  /* Danger - Error, failed, critical */
  --red: #f85149;
  --red-dim: rgba(248, 81, 73, 0.15);

  /* Special - Highlights, categories */
  --purple: #bc8cff;
  --purple-dim: rgba(188, 140, 255, 0.15);

  /* Metallic - Positions/Rankings */
  --yellow: #d29922;        /* Gold - 1st place */
  --silver: #c0c0c0;        /* Silver - 2nd place */
  --bronze: #cd7f32;        /* Bronze - 3rd place */

  /* =============================================
   * BACKGROUNDS
   * ============================================= */

  --bg-dark: #0d1117;       /* Base background */
  --bg-panel: #161b22;      /* Panel background */
  --bg-card: #1c2128;       /* Card background */
  --bg-elevated: #21262d;   /* Elevated surfaces, badges */
  --bg-highlight: #272d36;  /* Hover states */

  /* =============================================
   * TEXT
   * ============================================= */

  --text-primary: #e6edf3;    /* Primary text */
  --text-secondary: #8b949e;  /* Secondary text */
  --text-muted: #6e7681;      /* Muted/disabled text */

  /* =============================================
   * BORDERS
   * ============================================= */

  --border: #30363d;          /* Default border color */
  --border-light: #3d444d;    /* Light border */
  --border-focus: #58a6ff;    /* Focus state border */

  /* =============================================
   * TYPOGRAPHY
   * ============================================= */

  /* Font families */
  --font-mono: 'IBM Plex Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* =============================================
   * SPACING & SIZING
   * ============================================= */

  --radius-sm: 3px;     /* Tags, small elements */
  --radius-md: 4px;     /* Badges, buttons */
  --radius-lg: 6px;     /* Cards, panels */
  --radius-xl: 8px;     /* Large cards */
  --radius-full: 9999px; /* Pills, circles */

  /* =============================================
   * EFFECTS
   * ============================================= */

  /* Glow effects for active states */
  --glow-green: 0 0 8px rgba(126, 231, 135, 0.5);
  --glow-cyan: 0 0 8px rgba(88, 166, 255, 0.5);
  --glow-orange: 0 0 8px rgba(240, 136, 62, 0.5);
  --glow-red: 0 0 8px rgba(248, 81, 73, 0.5);

  /* =============================================
   * Z-INDEX SCALE
   * ============================================= */

  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

---

## File Location Options

### Option 1: Dedicated Variables File (Recommended)

Create `resources/app/css/variables.css`:

```css
/* resources/app/css/variables.css */
:root {
  /* All variables here */
}
```

Import in main CSS:
```css
/* resources/app/css/app.css */
@import './variables.css';
/* ... rest of styles */
```

### Option 2: In Main App CSS

Add to existing `resources/app/css/app.css`:

```css
/* resources/app/css/app.css */
:root {
  /* Variables at the top */
}

/* Rest of styles below */
```

### Option 3: Tailwind Plugin

If using Tailwind CSS extensively, extend the config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'theme-cyan': 'var(--cyan)',
        'theme-green': 'var(--green)',
        'theme-orange': 'var(--orange)',
        'theme-red': 'var(--red)',
        'theme-purple': 'var(--purple)',
        // etc.
      },
      fontFamily: {
        mono: 'var(--font-mono)',
        sans: 'var(--font-sans)',
      },
    },
  },
};
```

---

## Usage in Components

### In Scoped Styles

```vue
<style scoped>
.my-badge {
  background: var(--cyan-dim);
  color: var(--cyan);
  font-family: var(--font-mono);
  border-radius: var(--radius-md);
}
</style>
```

### In Computed Styles

```vue
<script setup lang="ts">
import { computed } from 'vue';

const badgeStyle = computed(() => ({
  backgroundColor: 'var(--cyan-dim)',
  color: 'var(--cyan)',
}));
</script>
```

### With CSS-in-JS (if applicable)

```typescript
const styles = {
  badge: {
    background: 'var(--cyan-dim)',
    color: 'var(--cyan)',
  },
};
```

---

## Browser Support

CSS custom properties are supported in all modern browsers:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

For IE11 support (if required), use a PostCSS plugin like `postcss-custom-properties`.

---

## Testing Variables

Create a test component to verify variables are working:

```vue
<!-- ColorPaletteTest.vue -->
<template>
  <div class="color-test">
    <div class="swatch cyan">Cyan</div>
    <div class="swatch green">Green</div>
    <div class="swatch orange">Orange</div>
    <div class="swatch red">Red</div>
    <div class="swatch purple">Purple</div>
  </div>
</template>

<style scoped>
.color-test {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: var(--bg-dark);
}

.swatch {
  padding: 16px 24px;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}

.swatch.cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.swatch.green {
  background: var(--green-dim);
  color: var(--green);
}

.swatch.orange {
  background: var(--orange-dim);
  color: var(--orange);
}

.swatch.red {
  background: var(--red-dim);
  color: var(--red);
}

.swatch.purple {
  background: var(--purple-dim);
  color: var(--purple);
}
</style>
```

---

## Migration Checklist

- [ ] Create/update CSS variables file
- [ ] Import variables file in main CSS
- [ ] Add IBM Plex Mono font to the project
- [ ] Test variables are accessible in components
- [ ] Verify colors render correctly
- [ ] Check font-family fallbacks work

---

## Font Setup

### IBM Plex Mono Installation

**Option 1: Google Fonts (CDN)**

Add to `resources/views/app.blade.php`:

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Option 2: Self-hosted**

1. Download from Google Fonts
2. Add to `resources/app/fonts/`
3. Create font-face declarations:

```css
@font-face {
  font-family: 'IBM Plex Mono';
  src: url('../fonts/IBMPlexMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IBM Plex Mono';
  src: url('../fonts/IBMPlexMono-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IBM Plex Mono';
  src: url('../fonts/IBMPlexMono-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IBM Plex Mono';
  src: url('../fonts/IBMPlexMono-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**Option 3: npm package**

```bash
npm install @ibm/plex
```

Import in CSS:
```css
@import '@ibm/plex/css/ibm-plex-mono.css';
```
