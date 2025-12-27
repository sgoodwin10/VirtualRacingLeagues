# Typography Implementation Plan - Technical Blueprint Design System

**Status**: Ready for Implementation
**Target Application**: User Dashboard (`resources/app`)
**Design Reference**: `/var/www/docs/designs/app/ideas2/technical-form/typography.html`

---

## Executive Summary

This plan replaces the current typography system (Noto Sans + missing Zalando Sans) with the Technical Blueprint dual-font system using **IBM Plex Mono** (technical elements) and **Inter** (body text).

### Key Changes
- Replace Google Fonts import: Noto Sans → IBM Plex Mono + Inter
- Add CSS font-family variables: `--font-mono` and `--font-sans`
- Update Tailwind v4 `@theme` directive with new font families
- Create typography utility classes for all text styles
- Update body element to use new font stack
- Ensure PrimeVue components inherit correct fonts

---

## Current State Analysis

### Files to Modify
1. **`/var/www/resources/views/app.blade.php`** (lines 8-9)
   - Current: Has preconnect links but no font link
   - Issue: No actual Google Fonts stylesheet loaded

2. **`/var/www/resources/app/css/app.css`**
   - Line 2: Has `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans...')`
   - Lines 308-315: Body references 'Zalando Sans' (not imported)
   - Already has Tailwind v4 `@theme` directive (lines 7-147)
   - Already has Technical Blueprint color palette

### Current Font Issues
- Noto Sans imported but not used consistently
- Zalando Sans referenced but never imported
- No monospace font for technical elements
- Font system doesn't match Technical Blueprint design

---

## Target Typography System

### Font Stack

| Font | Purpose | Weights | CSS Variable |
|------|---------|---------|--------------|
| **IBM Plex Mono** | Headers, Labels, Data Display, Navigation | 400, 500, 600, 700 | `--font-mono` |
| **Inter** | Body Text, Descriptions | 400, 500, 600, 700 | `--font-sans` |

### Typography Scale

| Element | Font | Size | Weight | Letter Spacing | Transform | Color | Line Height |
|---------|------|------|--------|----------------|-----------|-------|-------------|
| **Page Title** | IBM Plex Mono | 32px | 600 | - | - | `--text-primary` | - |
| **Section Header** | IBM Plex Mono | 24px | 600 | - | - | `--text-primary` | - |
| **Card Title** | IBM Plex Mono | 14px | 600 | - | - | `--text-primary` | - |
| **Card Title Small** | IBM Plex Mono | 12px | 600 | 0.5px | - | `--text-primary` | - |
| **Section Label** | IBM Plex Mono | 11px | 600 | 1px | uppercase | `--cyan` | - |
| **Sidebar Label** | IBM Plex Mono | 10px | 600 | 1.5px | uppercase | `--text-muted` | - |
| **Form Label** | IBM Plex Mono | 11px | 500 | 0.5px | - | `--text-secondary` | - |
| **Body** | Inter | 14px | 400 | - | - | `--text-secondary` | 1.6 |
| **Body Small** | Inter | 13px | 400 | - | - | `--text-secondary` | 1.5 |
| **Metric Large** | IBM Plex Mono | 28px | 600 | - | - | `--text-primary` | - |
| **Table Data** | IBM Plex Mono | 14px | 600 | - | - | `--text-primary` | - |
| **Inline Code** | IBM Plex Mono | 11px | 400 | - | - | `--text-secondary` | - |

---

## Implementation Steps

### Step 1: Update Google Fonts Link in Blade Template

**File**: `/var/www/resources/views/app.blade.php`

**Action**: Replace the preconnect links with actual font link

**Current (lines 8-9)**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**Replace with**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Why**: Adds the actual font stylesheet while keeping performance-optimizing preconnect links.

---

### Step 2: Update CSS Imports and Add Font Variables

**File**: `/var/www/resources/app/css/app.css`

#### 2.1: Remove Old Font Import

**Current (line 1-2)**:
```css
/* Google Fonts - Zalando Sans */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');
```

**Replace with**:
```css
/* Technical Blueprint Typography - IBM Plex Mono + Inter */
/* Fonts loaded via resources/views/app.blade.php for optimal performance */
```

**Why**: Remove unused Noto Sans import and inaccurate comment. Fonts are now loaded via `<link>` in blade template for better caching.

#### 2.2: Add Font Family Variables to `@theme`

**Location**: Inside the `@theme` directive (after line 16, before the color variables)

**Add**:
```css
  /* Font Family - Technical Blueprint */
  --font-mono: 'IBM Plex Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  /* Font family utilities for Tailwind v4 */
  --font-family-mono: var(--font-mono);
  --font-family-sans: var(--font-sans);
```

**Why**:
- Creates CSS variables for font families accessible throughout the app
- Provides fallback fonts for each category (system fonts)
- Tailwind v4 `@theme` directive generates utility classes from these variables
- Generates `font-mono` and `font-sans` Tailwind utilities automatically

#### 2.3: Add Font Family Variables to `:root`

**Location**: Inside `:root` selector (around line 150-210, after existing variables)

**Add**:
```css
  /* Typography - Font Families */
  --font-mono: 'IBM Plex Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Why**: Duplicate definition in `:root` for direct `var()` usage in custom CSS (matches existing pattern for colors).

---

### Step 3: Update Body Element Font

**File**: `/var/www/resources/app/css/app.css`

**Current (lines 307-316)**:
```css
body {
  font-family:
    'Zalando Sans',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: var(--font-size-base);
  margin: 0;
  padding: 0;
  overflow-x: hidden;
```

**Replace with**:
```css
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  margin: 0;
  padding: 0;
  overflow-x: hidden;
```

**Why**:
- Use Inter (via `--font-sans`) as default body font
- Cleaner syntax using CSS variable
- Matches Technical Blueprint design

---

### Step 4: Add Typography Utility Classes

**File**: `/var/www/resources/app/css/app.css`

**Location**: Inside the `@layer utilities` block (after line 414, before closing brace on line 415)

**Add**:
```css
  /* ============================================
     Typography Utilities - Technical Blueprint
     ============================================ */

  /* Page Title - 32px/600/IBM Plex Mono */
  .text-page-title {
    font-family: var(--font-mono);
    font-size: 2rem; /* 32px */
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Section Header - 24px/600/IBM Plex Mono */
  .text-section-header {
    font-family: var(--font-mono);
    font-size: 1.5rem; /* 24px */
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Card Title - 14px/600/IBM Plex Mono */
  .text-card-title {
    font-family: var(--font-mono);
    font-size: 0.875rem; /* 14px */
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Card Title Small - 12px/600/0.5px tracking/IBM Plex Mono */
  .text-card-title-small {
    font-family: var(--font-mono);
    font-size: 0.75rem; /* 12px */
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--text-primary);
  }

  /* Section Label - 11px/600/1px tracking/uppercase/cyan */
  .text-section-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem; /* 11px */
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--cyan);
  }

  /* Sidebar Label - 10px/600/1.5px tracking/uppercase/muted */
  .text-sidebar-label {
    font-family: var(--font-mono);
    font-size: 0.625rem; /* 10px */
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  /* Form Label - 11px/500/0.5px tracking */
  .text-form-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem; /* 11px */
    font-weight: 500;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
  }

  /* Body - 14px/400/Inter/1.6 line-height */
  .text-body {
    font-family: var(--font-sans);
    font-size: 0.875rem; /* 14px */
    font-weight: 400;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* Body Small - 13px/400/Inter/1.5 line-height */
  .text-body-small {
    font-family: var(--font-sans);
    font-size: 0.8125rem; /* 13px */
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  /* Metric Large - 28px/600/IBM Plex Mono */
  .text-metric-large {
    font-family: var(--font-mono);
    font-size: 1.75rem; /* 28px */
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Table Data - 14px/600/IBM Plex Mono */
  .text-table-data {
    font-family: var(--font-mono);
    font-size: 0.875rem; /* 14px */
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Inline Code - 11px/400/IBM Plex Mono */
  .text-inline-code {
    font-family: var(--font-mono);
    font-size: 0.6875rem; /* 11px */
    font-weight: 400;
    padding: 2px 6px;
    background: var(--bg-elevated);
    border-radius: 3px;
    color: var(--text-secondary);
  }
```

**Why**:
- Provides reusable, semantic utility classes for each text style
- Ensures consistent typography across the application
- Easier to use than composing multiple Tailwind utilities
- Self-documenting class names (`.text-card-title` vs `.font-mono text-sm font-semibold`)
- Matches Technical Blueprint design specifications exactly

---

### Step 5: Override Heading Element Defaults

**File**: `/var/www/resources/app/css/app.css`

**Current (lines 336-344)**:
```css
/* Ensure headings maintain proper color */
h1,
h2,
h3,
h4,
h5,
h6 {
  color: var(--text-primary);
}
```

**Replace with**:
```css
/* Heading Elements - Technical Blueprint Typography */
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-mono);
  color: var(--text-primary);
}

/* Default heading sizes (can be overridden with utility classes) */
h1 { font-size: 2rem; font-weight: 600; }      /* 32px - Page Title */
h2 { font-size: 1.5rem; font-weight: 600; }    /* 24px - Section Header */
h3 { font-size: 0.875rem; font-weight: 600; }  /* 14px - Card Title */
h4 { font-size: 0.75rem; font-weight: 600; }   /* 12px - Card Title Small */
h5 { font-size: 0.6875rem; font-weight: 600; } /* 11px */
h6 { font-size: 0.6875rem; font-weight: 600; } /* 11px */
```

**Why**:
- All headings use IBM Plex Mono by default (Technical Blueprint standard)
- Provides sensible defaults that match the typography scale
- Can still be overridden with utility classes when needed
- Ensures consistency even when utility classes aren't used

---

### Step 6: Add PrimeVue Component Font Overrides (Optional)

**File**: `/var/www/resources/app/css/app.css`

**Location**: After PrimeVue component customizations (after line 613)

**Add** (if needed after testing):
```css
/* ============================================
   PrimeVue Typography Overrides
   ============================================ */

/* PrimeVue Button - Use monospace font */
.p-button {
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* PrimeVue Menu Items - Use monospace font */
.p-menu-item-label,
.p-menubar-item-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
}

/* PrimeVue DataTable Headers - Use monospace font */
.p-datatable-thead > tr > th {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* PrimeVue DataTable Body - Use monospace font for data */
.p-datatable-tbody > tr > td {
  font-family: var(--font-mono);
  font-size: 0.875rem; /* 14px */
  font-weight: 600;
}

/* PrimeVue Dialog Title - Use monospace font */
.p-dialog-title {
  font-family: var(--font-mono);
  font-size: 0.875rem; /* 14px */
  font-weight: 600;
}

/* PrimeVue Tabs - Use monospace font */
.p-tab {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* PrimeVue Form Labels - Keep body font */
.p-label,
.p-float-label label {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  letter-spacing: 0.5px;
}
```

**Why**:
- Ensures PrimeVue components use the correct fonts from Technical Blueprint
- Technical elements (buttons, menus, tables, tabs) use IBM Plex Mono
- Form content can use Inter (via utility classes if needed)
- **NOTE**: Add these selectively based on actual PrimeVue components used in your app

---

## Usage Guidelines

### When to Use IBM Plex Mono (`--font-mono`)
- Page titles and section headers
- Navigation labels and menu items
- Card titles and headings
- Form labels and field labels
- Data display (metrics, tables, statistics)
- Technical content (code snippets, IDs, timestamps)
- Buttons and interactive elements
- Badges and tags
- Use the `//PREFIX` pattern for section titles (e.g., `//COMPETITIONS`, `//SEASON_OVERVIEW`)

### When to Use Inter (`--font-sans`)
- Body text and descriptions
- Paragraph content
- Help text and tooltips
- Long-form content
- User-generated content

### Using Typography Utilities

**With Tailwind Utilities** (recommended):
```vue
<h1 class="text-page-title">
  //COMPETITIONS
</h1>

<p class="text-body">
  This is a description using Inter for optimal readability.
</p>

<span class="text-metric-large">5,420</span>
```

**With Direct Classes** (for specific cases):
```vue
<div class="text-section-label">SEASON 2024</div>
<div class="text-card-title">Race Results</div>
<code class="text-inline-code">validate:results --round=15</code>
```

**With Tailwind Composition** (when customization needed):
```vue
<!-- Override color while keeping other properties -->
<div class="text-card-title text-cyan-500">
  Custom Color Card Title
</div>

<!-- Combine with spacing and layout utilities -->
<h2 class="text-section-header mb-4 pb-3 border-b border-border">
  //SECTION_HEADER
</h2>
```

---

## Testing & Verification

### Step 1: Visual Verification

After implementation, verify typography on:

1. **Existing Views**
   - `/` - Dashboard home
   - `/profile` - User profile
   - Any other existing views

2. **Check Elements**
   - All headings (h1-h6) use IBM Plex Mono
   - Body text uses Inter
   - Navigation labels are monospace
   - Tables/data displays are monospace
   - Forms have correct label fonts

### Step 2: Browser DevTools Check

Open browser DevTools and verify:

```javascript
// Check computed font-family for key elements
getComputedStyle(document.body).fontFamily
// Should be: "Inter", -apple-system, BlinkMacSystemFont, ...

getComputedStyle(document.querySelector('h1')).fontFamily
// Should be: "IBM Plex Mono", "SF Mono", Monaco, ...

getComputedStyle(document.querySelector('.text-card-title')).fontFamily
// Should be: "IBM Plex Mono", "SF Mono", Monaco, ...
```

### Step 3: Font Loading Verification

1. Open Network tab in DevTools
2. Filter by "Font"
3. Verify both fonts load:
   - `IBMPlexMono-Regular.woff2` (and other weights)
   - `Inter-Regular.woff2` (and other weights)

### Step 4: Accessibility Check

- Verify minimum contrast ratios (WCAG AA)
  - `--text-primary` on `--bg-dark`: Should pass
  - `--text-secondary` on `--bg-card`: Should pass
- Check text is readable at all defined sizes
- Ensure letter-spacing doesn't harm readability

### Step 5: Responsive Testing

Test on different viewports:
- Desktop (1920px, 1440px, 1024px)
- Tablet (768px)
- Mobile (375px)

Ensure typography scales appropriately and remains readable.

---

## Rollback Plan

If issues arise, rollback by reversing changes:

### 1. Revert Blade Template
```html
<!-- Back to preconnect links only -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### 2. Revert CSS Import
```css
/* Google Fonts - Zalando Sans */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');
```

### 3. Revert Body Font
```css
body {
  font-family:
    'Zalando Sans',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  /* ... */
}
```

### 4. Remove Added Utilities
Remove the typography utility classes block from `@layer utilities`.

---

## Implementation Checklist

- [ ] **Step 1**: Update Google Fonts link in `app.blade.php`
- [ ] **Step 2.1**: Remove old font import from `app.css`
- [ ] **Step 2.2**: Add font family variables to `@theme`
- [ ] **Step 2.3**: Add font family variables to `:root`
- [ ] **Step 3**: Update body element font-family
- [ ] **Step 4**: Add typography utility classes
- [ ] **Step 5**: Update heading element defaults
- [ ] **Step 6**: Add PrimeVue overrides (if needed)
- [ ] **Test**: Visual verification on all views
- [ ] **Test**: Browser DevTools font-family check
- [ ] **Test**: Network tab font loading verification
- [ ] **Test**: Accessibility contrast check
- [ ] **Test**: Responsive viewport testing
- [ ] **Test**: PrimeVue component rendering
- [ ] **Run**: `npm run type-check` (ensure no TypeScript errors)
- [ ] **Run**: `npm run lint:app` (ensure no linting errors)
- [ ] **Run**: `npm run format:app` (format code)
- [ ] **Build**: `npm run build` (verify production build works)
- [ ] **Document**: Update any component documentation

---

## Future Enhancements

### Phase 2 Considerations

1. **Variable Font Support**
   - Consider using Inter Variable for smaller file size
   - Reduce weight-specific font file requests

2. **Font Display Strategy**
   - Test `font-display: swap` vs `optional` for performance
   - Consider FOUT (Flash of Unstyled Text) vs FOIT (Flash of Invisible Text)

3. **Component Library**
   - Create Vue typography components (`<PageTitle>`, `<SectionHeader>`, etc.)
   - Enforce typography standards at component level

4. **Design Tokens**
   - Extract typography values to design tokens JSON
   - Use token transformer for cross-platform consistency

5. **Dark/Light Theme Support**
   - Adjust font weights for different theme backgrounds
   - IBM Plex Mono may need weight adjustments on light backgrounds

---

## References

- **Design System**: `/var/www/docs/designs/app/ideas2/technical-form/typography.html`
- **Google Fonts**: https://fonts.google.com/specimen/IBM+Plex+Mono
- **Google Fonts**: https://fonts.google.com/specimen/Inter
- **Tailwind CSS v4 Docs**: https://tailwindcss.com/docs/theme
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

## Notes

- This plan assumes Tailwind CSS v4 with `@theme` directive (already present in current `app.css`)
- Color palette is already implemented (Technical Blueprint colors)
- Font sizes are already defined as CSS variables (lines 8-16 in current `app.css`)
- Implementation should be done in a feature branch and tested thoroughly before merging
- Consider performance impact: IBM Plex Mono + Inter adds ~60-80KB (gzipped) of font files
- The `//PREFIX` pattern is a design choice for section titles - ensure content team is aware

---

**Plan Created**: 2025-12-27
**Plan Version**: 1.0
**Target Implementation**: After color system implementation
