# VRL Design Schema - Complete Reference

## Overview

The Virtual Racing Leagues "Refined Brutalist" design system has been completely updated to use:
- **Tailwind CSS 4** - Utility-first CSS framework
- **PrimeVue 4** - Vue.js UI component library
- **Phosphor Icons** - Flexible icon family for simracing

## File Locations

All design files are located in `/var/www/design-ideas/app/2/`:

### 1. Design System Documentation
**Location**: `/var/www/design-ideas/app/2/design-8-guide/design-system.md`
**Description**: Comprehensive design system documentation (2,305 lines)

**Contents**:
- Complete Tailwind configuration for VRL color tokens
- Typography system with font stacks and Tailwind classes
- Component patterns with Vue 3 Composition API examples
- PrimeVue component mapping and usage
- Phosphor Icons integration
- TypeScript types for all components
- Accessibility guidelines
- Complete form example with validation
- File structure recommendations

**Key Sections**:
- Color System & Tailwind Config
- Typography with Tailwind Classes
- Buttons (Primary, Secondary, Outline, Danger, Ghost)
- Form Elements (InputText, Select, Checkbox, Textarea, InputSwitch)
- Tags/Badges (Status & Simracing-specific)
- Tables with DataTable
- Cards/Panels
- Alerts/Messages
- Accordion
- Tabs/Filter Tabs
- Modal/Dialog
- Header/Navigation
- Layout (Container, Grid)
- Icons with Phosphor
- PrimeVue Theming
- Accessibility
- TypeScript Types
- Quick Reference: CSS to Tailwind Mapping

### 2. Component Library
**Location**: `/var/www/design-ideas/app/2/design-8-guide/component-library.html`
**Description**: Interactive component showcase (902 lines)

**Features**:
- Standalone HTML file (uses Tailwind CDN)
- Phosphor Icons via CDN
- All component variations with live examples
- PrimeVue component comments throughout
- Tailwind class examples for each component
- Copy-paste ready code snippets

**Sections**:
- Colors (swatches with Tailwind classes)
- Typography (all type scales with examples)
- Buttons (all variants & sizes)
- Forms (all input types)
- Badges (status & simracing-specific)
- Tables (complete table structure)
- Cards (basic & stat cards)
- Alerts (all severity levels)
- Icons (navigation, actions, simracing)

### 3. Main Design HTML
**Location**: `/var/www/design-ideas/app/2/design-8-refined-brutalist.html`
**Description**: Full page example showing complete league management interface (394 lines)

**Features**:
- Complete working example with Tailwind CDN
- Dark brutalist header with navigation
- Page header with stats
- Tier limit warning alert
- Filter tabs and search
- Data table with leagues
- All components in context
- PrimeVue component comments for Vue implementation

## Design Philosophy

### Contrast with Purpose
- **Dark header** (#0d0d0d) for brand authority
- **Light content** (#fafafa) for usability

### Typography as Structure
- **Monospace** (JetBrains Mono) for UI/system elements
- **Serif** (Fraunces) for data/headlines/numbers
- **Sans-serif** (DM Sans) for body text

### Functional Beauty
- Every element serves a purpose
- No purely decorative elements
- Precision over decoration

## Quick Start

### 1. Tailwind Configuration

Add to `/var/www/resources/app/css/app.css`:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        vrl: {
          'header': '#0d0d0d',
          'header-secondary': '#1a1a1a',
          'accent-yellow': '#fbbf24',
          'accent-amber': '#d97706',
          'accent-orange': '#f97316',
          'bg-white': '#ffffff',
          'bg-off-white': '#fafafa',
          'bg-light': '#f5f5f5',
          'text-black': '#0a0a0a',
          'text-dark': '#1a1a1a',
          'text-medium': '#4a4a4a',
          'text-light': '#8a8a8a',
          'text-placeholder': '#a3a3a3',
          'accent-blue': '#1d3557',
          'accent-red': '#dc2626',
          'success': '#16a34a',
          'warning': '#d97706',
          'info': '#0284c7',
          'border-light': '#e5e5e5',
          'border-medium': '#d4d4d4',
          'border-dark': '#333333',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
        'serif': ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        'sans': ['DM Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      spacing: {
        '2.75': '11px',
        '4.5': '18px',
        '5.5': '22px',
      }
    }
  }
}
```

### 2. Phosphor Icons Setup

```bash
npm install @phosphor-icons/web
```

```ts
// main.ts
import '@phosphor-icons/web/regular'
```

### 3. PrimeVue Theme Configuration

```ts
// main.ts
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

const VrlPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fafafa',
      500: '#8a8a8a',
      900: '#0a0a0a',
    }
  }
})

app.use(PrimeVue, {
  theme: {
    preset: VrlPreset
  }
})
```

## Component Mapping

### PrimeVue Components to Use

| Design Element | PrimeVue Component | Notes |
|---------------|-------------------|-------|
| Buttons | `Button` | Use with Tailwind classes |
| Text Input | `InputText` | Styled with Tailwind |
| Select/Dropdown | `Select` | PrimeVue v4 uses `Select` not `Dropdown` |
| Checkbox | `Checkbox` | With `binary` prop |
| Textarea | `Textarea` | Styled with Tailwind |
| Switch | `InputSwitch` | For toggle settings |
| Badges | `Tag` | Status indicators |
| Tables | `DataTable` + `Column` | Highly recommended |
| Cards | `Card` | With header/content/footer slots |
| Alerts | `Message` | With severity prop |
| Accordion | `Accordion` + `AccordionTab` | Collapsible sections |
| Tabs | `TabView` + `TabPanel` | Navigation tabs |
| Modal | `Dialog` | With v-model:visible |
| Navigation | `Menubar` | Top navigation |

## Common Patterns

### Button Example

```vue
<script setup lang="ts">
import Button from 'primevue/button'
</script>

<template>
  <Button 
    class="bg-vrl-text-black text-white hover:bg-vrl-accent-amber px-5.5 py-2.75 font-mono text-xs font-semibold tracking-wide uppercase"
  >
    <i class="ph ph-plus mr-2"></i>
    Create League
  </Button>
</template>
```

### Form Input Example

```vue
<script setup lang="ts">
import InputText from 'primevue/inputtext'
</script>

<template>
  <div class="mb-5">
    <label class="block mb-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light">
      League Name
      <span class="text-vrl-accent-red">*</span>
    </label>
    <InputText
      v-model="name"
      placeholder="Enter league name"
      class="w-full px-4 py-2.75 border border-vrl-border-medium rounded-sm font-mono text-[13px]"
    />
  </div>
</template>
```

### DataTable Example

```vue
<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const leagues = ref([...])
</script>

<template>
  <DataTable 
    :value="leagues"
    class="bg-vrl-bg-white border border-vrl-border-light"
  >
    <Column field="name" header="League" />
    <Column field="drivers" header="Drivers">
      <template #body="{ data }">
        <span class="font-serif text-xl font-semibold text-vrl-text-black">
          {{ data.drivers }}
        </span>
      </template>
    </Column>
  </DataTable>
</template>
```

## Simracing-Specific Elements

### Icons

- `ph-flag-checkered` - Race/Finish
- `ph-steering-wheel` - Racing/Driving
- `ph-trophy` - Championship/Win
- `ph-timer` - Lap Times
- `ph-lightning` - Fastest Lap
- `ph-gauge` - Speed/Performance
- `ph-users` - Drivers/Teams
- `ph-target` - Target Lap
- `ph-map-pin` - Track/Circuit

### Badges

- Fastest Lap: `bg-purple-50 text-purple-800`
- Pole Position: `bg-amber-50 text-amber-900`
- DNF: `bg-red-50 text-red-900`
- Safety Car: `bg-yellow-50 text-yellow-900`

## Resources

- **Design System**: `/var/www/design-ideas/app/2/design-8-guide/design-system.md`
- **Component Library**: `/var/www/design-ideas/app/2/design-8-guide/component-library.html`
- **Main Example**: `/var/www/design-ideas/app/2/design-8-refined-brutalist.html`
- **Tailwind CSS**: https://tailwindcss.com/docs
- **PrimeVue 4**: https://primevue.org/
- **Phosphor Icons**: https://phosphoricons.com/

## Next Steps

1. Open `component-library.html` in browser for visual reference
2. Open `design-system.md` for complete implementation guide
3. Review `design-8-refined-brutalist.html` for full page context
4. Use component examples as templates for your Vue components
5. Follow Tailwind class patterns throughout the design system

All files are production-ready and follow Vue 3 Composition API + TypeScript best practices.
