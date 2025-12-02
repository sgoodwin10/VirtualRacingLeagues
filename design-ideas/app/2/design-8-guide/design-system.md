# Virtual Racing Leagues Design System

## Overview

This design system establishes a cohesive visual language for the Virtual Racing Leagues platform. It combines **Industrial Precision** with **Swiss Clarity** - a dark, authoritative header that establishes brand identity, paired with a clean, functional content area optimized for data entry and management tasks.

### Design Philosophy

- **Contrast with Purpose**: Dark header (#0d0d0d) for brand authority, light content (#fafafa) for usability
- **Typography as Structure**: Monospace (JetBrains Mono) for UI/system elements, Serif (Fraunces) for data/headlines, Sans (DM Sans) for body text
- **Functional Beauty**: Every element serves a purpose, nothing purely decorative
- **Precision Over Decoration**: Clean edges, consistent spacing, deliberate color use

### Technology Stack

This design system is implemented using:
- **Tailwind CSS 4** - Utility-first CSS framework
- **PrimeVue 4** - Vue.js UI component library
- **Phosphor Icons** - Flexible icon family for simracing iconography
- **Vue 3 Composition API** - Modern Vue development patterns
- **TypeScript** - Type-safe component development

---

## Color System

### Primary Palette

#### Tailwind Configuration

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        vrl: {
          // Header / Brand Colors
          'header': '#0d0d0d',
          'header-secondary': '#1a1a1a',
          'accent-yellow': '#fbbf24',
          'accent-amber': '#d97706',
          'accent-orange': '#f97316',

          // Content Area Colors
          'bg-white': '#ffffff',
          'bg-off-white': '#fafafa',
          'bg-light': '#f5f5f5',

          // Text Colors
          'text-black': '#0a0a0a',
          'text-dark': '#1a1a1a',
          'text-medium': '#4a4a4a',
          'text-light': '#8a8a8a',
          'text-placeholder': '#a3a3a3',

          // Semantic Colors
          'accent-blue': '#1d3557',
          'accent-red': '#dc2626',
          'success': '#16a34a',
          'warning': '#d97706',
          'info': '#0284c7',

          // Border Colors
          'border-light': '#e5e5e5',
          'border-medium': '#d4d4d4',
          'border-dark': '#333333',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
        'serif': ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        'sans': ['DM Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    }
  }
}
```

### Color Usage Guidelines

| Element | Tailwind Class | Usage |
|---------|---------------|-------|
| Page Background | `bg-vrl-bg-off-white` | Main content area |
| Cards/Panels | `bg-vrl-bg-white` | Elevated content containers |
| Header Background | `bg-vrl-header` | Site header only |
| Primary Text | `text-vrl-text-black` | Headlines, important content |
| Body Text | `text-vrl-text-dark` | Paragraphs, descriptions |
| Labels | `text-vrl-text-light` | Form labels, metadata |
| Primary Button | `bg-vrl-text-black text-white` | Main CTAs |
| Secondary Button | `bg-vrl-accent-blue text-white` | Secondary actions |
| Warning/Upgrade | `bg-vrl-accent-amber text-white` | Upgrade prompts, warnings |

### Simracing-Specific Color Applications

| Context | Color | Tailwind Class |
|---------|-------|---------------|
| Fastest Lap | Purple (`#9333ea`) | `text-purple-600 bg-purple-50` |
| Pole Position | Yellow | `text-vrl-accent-yellow bg-amber-50` |
| Podium Positions | Gradient Gold/Silver/Bronze | Custom gradient classes |
| DNF Status | Red | `text-vrl-accent-red bg-red-50` |
| Safety Car | Yellow | `text-vrl-warning bg-yellow-50` |
| Track Limits | Orange | `text-vrl-accent-orange` |

---

## Typography

### Font Stack

```js
// In tailwind.config.js - already defined above
fontFamily: {
  'mono': ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
  'serif': ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
  'sans': ['DM Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
}
```

### Type Scale with Tailwind Classes

| Name | Tailwind Classes | Usage |
|------|-----------------|-------|
| Display XL | `font-serif text-[44px] font-bold leading-tight -tracking-wider` | Page titles |
| Display LG | `font-serif text-4xl font-bold leading-tight` | Section headers |
| Display MD | `font-serif text-[28px] font-semibold leading-snug` | Card titles |
| Heading LG | `font-serif text-xl font-semibold leading-relaxed` | Data highlights |
| Heading MD | `font-sans text-base font-semibold leading-normal` | Subheadings |
| Body LG | `font-sans text-[15px] leading-relaxed` | Body text |
| Body MD | `font-sans text-sm leading-normal` | Default text |
| Body SM | `font-sans text-[13px] leading-normal` | Secondary text |
| Label LG | `font-mono text-[13px] font-semibold leading-normal tracking-wide` | Form labels |
| Label MD | `font-mono text-xs font-medium leading-normal tracking-wide uppercase` | Buttons, tabs |
| Label SM | `font-mono text-[11px] font-semibold leading-snug tracking-wider uppercase` | Badges, meta |
| Label XS | `font-mono text-[10px] font-semibold leading-tight tracking-wide uppercase` | Table headers |

### Typography Components (Vue + Tailwind)

```vue
<script setup lang="ts">
interface TypographyProps {
  variant?: 'display-xl' | 'display-lg' | 'display-md' | 'heading-lg' | 'heading-md' | 'body-lg' | 'body-md' | 'body-sm' | 'label-lg' | 'label-md' | 'label-sm' | 'label-xs'
  as?: string
  color?: string
}

const props = withDefaults(defineProps<TypographyProps>(), {
  variant: 'body-md',
  as: 'p'
})

const classes = computed(() => {
  const variants = {
    'display-xl': 'font-serif text-[44px] font-bold leading-tight -tracking-wider text-vrl-text-black',
    'display-lg': 'font-serif text-4xl font-bold leading-tight text-vrl-text-black',
    'display-md': 'font-serif text-[28px] font-semibold leading-snug text-vrl-text-black',
    'heading-lg': 'font-serif text-xl font-semibold leading-relaxed text-vrl-text-black',
    'heading-md': 'font-sans text-base font-semibold leading-normal text-vrl-text-black',
    'body-lg': 'font-sans text-[15px] leading-relaxed text-vrl-text-dark',
    'body-md': 'font-sans text-sm leading-normal text-vrl-text-dark',
    'body-sm': 'font-sans text-[13px] leading-normal text-vrl-text-medium',
    'label-lg': 'font-mono text-[13px] font-semibold leading-normal tracking-wide text-vrl-text-light',
    'label-md': 'font-mono text-xs font-medium leading-normal tracking-wide uppercase text-vrl-text-medium',
    'label-sm': 'font-mono text-[11px] font-semibold leading-snug tracking-wider uppercase text-vrl-text-light',
    'label-xs': 'font-mono text-[10px] font-semibold leading-tight tracking-wide uppercase text-vrl-text-light',
  }

  return variants[props.variant]
})
</script>

<template>
  <component :is="as" :class="[classes, color]">
    <slot />
  </component>
</template>
```

### Accent Label (Colored)

```vue
<!-- Usage -->
<span class="font-mono text-[11px] font-semibold tracking-[3px] uppercase text-vrl-accent-amber">
  League Management
</span>
```

---

## Spacing System

### Base Unit: 4px

Tailwind's default spacing scale aligns perfectly with our 4px base unit system.

```js
// Tailwind default spacing (already available)
// No custom configuration needed
```

### Component Spacing Guidelines

| Component | Tailwind Padding | Tailwind Margin/Gap |
|-----------|-----------------|-------------------|
| Buttons | `px-5.5 py-2.75` (22px/11px) | `gap-2` or `gap-3` between |
| Form Inputs | `px-4 py-2.75` (16px/11px) | `mb-4` below |
| Cards/Panels | `p-6` (24px) | `gap-6` between |
| Table Cells | `px-3 py-4.5` (12px/18px) | - |
| Table Header | `px-3 py-3.5` (12px/14px) | - |
| Page Container | `p-12` (48px) | - |
| Alert/Notice | `px-5 py-4` (20px/16px) | `mb-8` below |

### Custom Spacing Extension

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      spacing: {
        '2.75': '11px',  // Button/input vertical padding
        '4.5': '18px',   // Table cell padding
        '5.5': '22px',   // Button horizontal padding
      }
    }
  }
}
```

---

## Components

### Buttons

#### Tailwind + PrimeVue Button Mapping

**PrimeVue Component**: `<Button>`

**Base Classes for All Buttons**:
```
inline-flex items-center gap-2 px-5.5 py-2.75 rounded-sm font-mono text-xs font-semibold tracking-wide uppercase cursor-pointer transition-all duration-200
```

#### Button Variants

##### Primary Button
```vue
<script setup lang="ts">
import Button from 'primevue/button'
</script>

<template>
  <!-- PrimeVue with Tailwind classes -->
  <Button
    label="Create League"
    class="bg-vrl-text-black text-white border-0 hover:bg-vrl-accent-amber"
  />

  <!-- Or pure Tailwind -->
  <button class="inline-flex items-center gap-2 px-5.5 py-2.75 bg-vrl-text-black text-white border-0 rounded-sm font-mono text-xs font-semibold tracking-wide uppercase cursor-pointer transition-all duration-200 hover:bg-vrl-accent-amber">
    Create League
  </button>
</template>
```

**Tailwind Classes**:
```
bg-vrl-text-black text-white border-0 hover:bg-vrl-accent-amber disabled:bg-vrl-border-medium disabled:cursor-not-allowed
```

##### Secondary Button
```vue
<Button
  label="View Details"
  class="bg-vrl-accent-blue text-white border border-vrl-accent-blue hover:bg-[#152a45] hover:border-[#152a45]"
/>
```

**Tailwind Classes**:
```
bg-vrl-accent-blue text-white border border-vrl-accent-blue hover:bg-[#152a45] hover:border-[#152a45]
```

##### Outline Button
```vue
<Button
  label="Cancel"
  outlined
  class="bg-vrl-bg-white text-vrl-text-medium border border-vrl-border-medium hover:border-vrl-text-dark hover:text-vrl-text-dark hover:bg-vrl-bg-light"
/>
```

**Tailwind Classes**:
```
bg-vrl-bg-white text-vrl-text-medium border border-vrl-border-medium hover:border-vrl-text-dark hover:text-vrl-text-dark hover:bg-vrl-bg-light
```

##### Danger Button
```vue
<Button
  label="Delete"
  severity="danger"
  class="bg-vrl-accent-red text-white border border-vrl-accent-red hover:bg-[#b91c1c] hover:border-[#b91c1c]"
/>
```

**Tailwind Classes**:
```
bg-vrl-accent-red text-white border border-vrl-accent-red hover:bg-[#b91c1c] hover:border-[#b91c1c]
```

##### Ghost Button
```vue
<Button
  label="More Options"
  text
  class="bg-transparent text-vrl-text-medium border-0 hover:text-vrl-text-black hover:bg-vrl-bg-light"
/>
```

#### Button Sizes

| Size | Tailwind Classes | Usage |
|------|-----------------|-------|
| Small | `px-3.5 py-2 text-[11px]` | Compact actions |
| Default | `px-5.5 py-2.75 text-xs` | Standard buttons |
| Large | `px-7 py-3.5 text-[13px]` | Primary CTAs |
| Extra Small | `px-2.5 py-1.25 text-[10px]` | Inline actions |

#### Button with Icons (Phosphor Icons)

```vue
<script setup lang="ts">
import Button from 'primevue/button'
</script>

<template>
  <!-- With Phosphor Icons -->
  <Button class="bg-vrl-text-black text-white hover:bg-vrl-accent-amber">
    <i class="ph ph-plus mr-2 text-sm"></i>
    Create League
  </Button>

  <!-- Icon only -->
  <Button class="bg-vrl-text-black text-white hover:bg-vrl-accent-amber p-2">
    <i class="ph ph-pencil text-base"></i>
  </Button>
</template>
```

#### Custom Button Component

```vue
<!-- VrlButton.vue -->
<script setup lang="ts">
import Button from 'primevue/button'

interface VrlButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  icon?: string
  iconPos?: 'left' | 'right'
  iconOnly?: boolean
}

const props = withDefaults(defineProps<VrlButtonProps>(), {
  variant: 'primary',
  size: 'md',
  iconPos: 'left'
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center gap-2 rounded-sm font-mono font-semibold tracking-wide uppercase cursor-pointer transition-all duration-200'

  const variants = {
    primary: 'bg-vrl-text-black text-white border-0 hover:bg-vrl-accent-amber',
    secondary: 'bg-vrl-accent-blue text-white border border-vrl-accent-blue hover:bg-[#152a45]',
    outline: 'bg-vrl-bg-white text-vrl-text-medium border border-vrl-border-medium hover:border-vrl-text-dark hover:text-vrl-text-dark hover:bg-vrl-bg-light',
    danger: 'bg-vrl-accent-red text-white border border-vrl-accent-red hover:bg-[#b91c1c]',
    ghost: 'bg-transparent text-vrl-text-medium border-0 hover:text-vrl-text-black hover:bg-vrl-bg-light'
  }

  const sizes = {
    xs: 'px-2.5 py-1.25 text-[10px] gap-1',
    sm: 'px-3.5 py-2 text-[11px]',
    md: 'px-5.5 py-2.75 text-xs',
    lg: 'px-7 py-3.5 text-[13px]'
  }

  const iconOnlySize = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  return [
    base,
    variants[props.variant],
    props.iconOnly ? iconOnlySize[props.size] : sizes[props.size]
  ]
})
</script>

<template>
  <Button :class="buttonClasses">
    <i v-if="icon && iconPos === 'left'" :class="`ph ph-${icon}`"></i>
    <slot v-if="!iconOnly" />
    <i v-if="icon && iconPos === 'right'" :class="`ph ph-${icon}`"></i>
  </Button>
</template>
```

**Usage**:
```vue
<VrlButton variant="primary" icon="plus">Create League</VrlButton>
<VrlButton variant="secondary" size="sm" icon="eye">View</VrlButton>
<VrlButton variant="outline" icon="pencil" icon-only />
<VrlButton variant="danger" icon="trash">Delete</VrlButton>
```

---

### Form Elements

#### Text Input

**PrimeVue Component**: `<InputText>`

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
      v-model="leagueName"
      placeholder="Enter league name"
      class="w-full px-4 py-2.75 bg-vrl-bg-white border border-vrl-border-medium rounded-sm font-mono text-[13px] text-vrl-text-dark placeholder:text-vrl-text-placeholder focus:outline-none focus:border-vrl-text-black transition-colors duration-200 disabled:bg-vrl-bg-light disabled:text-vrl-text-light disabled:cursor-not-allowed"
    />
    <small class="block mt-1.5 text-xs text-vrl-text-light">
      This will be visible to all participants
    </small>
  </div>
</template>
```

**Tailwind Classes for Input**:
```
w-full px-4 py-2.75 bg-vrl-bg-white border border-vrl-border-medium rounded-sm font-mono text-[13px] text-vrl-text-dark placeholder:text-vrl-text-placeholder focus:outline-none focus:border-vrl-text-black transition-colors duration-200
```

**Error State**:
```
border-vrl-accent-red
```

#### Form Label

**Tailwind Classes**:
```
block mb-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light
```

**Required Indicator**:
```vue
<label class="block mb-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light">
  Email
  <span class="text-vrl-accent-red">*</span>
</label>
```

#### Select / Dropdown

**PrimeVue Component**: `<Select>` (formerly Dropdown)

```vue
<script setup lang="ts">
import Select from 'primevue/select'

const platforms = ref([
  { name: 'iRacing', code: 'iracing' },
  { name: 'Assetto Corsa Competizione', code: 'acc' },
  { name: 'rFactor 2', code: 'rfactor2' }
])
const selectedPlatform = ref(null)
</script>

<template>
  <div class="mb-5">
    <label class="block mb-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light">
      Platform
    </label>
    <Select
      v-model="selectedPlatform"
      :options="platforms"
      optionLabel="name"
      placeholder="Select a platform"
      class="w-full [&>div]:px-4 [&>div]:py-2.75 [&>div]:border-vrl-border-medium [&>div]:rounded-sm [&>div]:font-mono [&>div]:text-[13px] [&>div]:text-vrl-text-dark"
    />
  </div>
</template>
```

#### Checkbox

**PrimeVue Component**: `<Checkbox>`

```vue
<script setup lang="ts">
import Checkbox from 'primevue/checkbox'
</script>

<template>
  <div class="flex items-center gap-2.5">
    <Checkbox
      v-model="isPublic"
      inputId="public"
      binary
      class="[&>div]:w-4.5 [&>div]:h-4.5 [&>div]:rounded-sm [&>div]:border-vrl-border-medium checked:[&>div]:bg-vrl-text-black checked:[&>div]:border-vrl-text-black"
    />
    <label for="public" class="text-sm text-vrl-text-dark cursor-pointer">
      Make league publicly visible
    </label>
  </div>
</template>
```

#### Textarea

**PrimeVue Component**: `<Textarea>`

```vue
<script setup lang="ts">
import Textarea from 'primevue/textarea'
</script>

<template>
  <div class="mb-5">
    <label class="block mb-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light">
      Description
    </label>
    <Textarea
      v-model="description"
      rows="5"
      placeholder="Enter league description"
      class="w-full px-4 py-3 bg-vrl-bg-white border border-vrl-border-medium rounded-sm font-sans text-sm text-vrl-text-dark resize-y min-h-[100px] focus:outline-none focus:border-vrl-text-black transition-colors duration-200"
    />
  </div>
</template>
```

#### Input Switch

**PrimeVue Component**: `<InputSwitch>`

```vue
<script setup lang="ts">
import InputSwitch from 'primevue/inputswitch'
</script>

<template>
  <div class="flex items-center justify-between py-3 border-b border-vrl-border-light">
    <div>
      <div class="text-sm font-semibold text-vrl-text-black">Allow Registrations</div>
      <div class="text-xs text-vrl-text-light mt-0.5">Enable drivers to register for competitions</div>
    </div>
    <InputSwitch v-model="allowRegistrations" />
  </div>
</template>
```

#### Custom Form Group Component

```vue
<!-- VrlFormGroup.vue -->
<script setup lang="ts">
interface VrlFormGroupProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  inputId?: string
}

const props = defineProps<VrlFormGroupProps>()
</script>

<template>
  <div class="mb-5">
    <label
      v-if="label"
      :for="inputId"
      class="block mb-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light"
    >
      {{ label }}
      <span v-if="required" class="text-vrl-accent-red">*</span>
    </label>

    <slot />

    <small v-if="hint && !error" class="block mt-1.5 text-xs text-vrl-text-light">
      {{ hint }}
    </small>

    <small v-if="error" class="block mt-1.5 text-xs text-vrl-accent-red">
      {{ error }}
    </small>
  </div>
</template>
```

**Usage**:
```vue
<VrlFormGroup
  label="League Name"
  :required="true"
  hint="This will be visible to all participants"
  :error="errors.name"
>
  <InputText v-model="form.name" />
</VrlFormGroup>
```

---

### Tags / Badges

**PrimeVue Component**: `<Tag>`

#### Status Badges

```vue
<script setup lang="ts">
import Tag from 'primevue/tag'
</script>

<template>
  <!-- Public Badge -->
  <Tag
    value="PUBLIC"
    class="inline-flex items-center px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-blue-50 text-blue-800"
  />

  <!-- Private Badge -->
  <Tag
    value="PRIVATE"
    class="inline-flex items-center px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-pink-50 text-pink-800"
  />

  <!-- Success Badge -->
  <Tag
    value="ACTIVE"
    severity="success"
    class="inline-flex items-center px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-green-50 text-green-800"
  />

  <!-- Warning Badge -->
  <Tag
    value="PENDING"
    severity="warn"
    class="inline-flex items-center px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-amber-50 text-amber-900"
  />

  <!-- Danger Badge -->
  <Tag
    value="DNF"
    severity="danger"
    class="inline-flex items-center px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-red-50 text-red-900"
  />
</template>
```

#### Simracing-Specific Badges

```vue
<template>
  <!-- Fastest Lap -->
  <Tag
    value="FASTEST LAP"
    class="inline-flex items-center gap-1.5 px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-purple-50 text-purple-800"
  >
    <template #icon>
      <i class="ph ph-lightning text-xs"></i>
    </template>
  </Tag>

  <!-- Pole Position -->
  <Tag
    value="POLE"
    class="inline-flex items-center gap-1.5 px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-amber-50 text-amber-900"
  >
    <template #icon>
      <i class="ph ph-trophy text-xs"></i>
    </template>
  </Tag>

  <!-- DNF -->
  <Tag
    value="DNF"
    class="inline-flex items-center gap-1.5 px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm bg-red-50 text-red-900"
  >
    <template #icon>
      <i class="ph ph-x-circle text-xs"></i>
    </template>
  </Tag>
</template>
```

#### Custom Badge Component

```vue
<!-- VrlBadge.vue -->
<script setup lang="ts">
import Tag from 'primevue/tag'

interface VrlBadgeProps {
  variant?: 'public' | 'private' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  icon?: string
}

const props = withDefaults(defineProps<VrlBadgeProps>(), {
  variant: 'neutral'
})

const badgeClasses = computed(() => {
  const variants = {
    public: 'bg-blue-50 text-blue-800',
    private: 'bg-pink-50 text-pink-800',
    success: 'bg-green-50 text-green-800',
    warning: 'bg-amber-50 text-amber-900',
    danger: 'bg-red-50 text-red-900',
    info: 'bg-sky-50 text-sky-800',
    neutral: 'bg-vrl-bg-light text-vrl-text-medium'
  }

  return variants[props.variant]
})
</script>

<template>
  <Tag :class="['inline-flex items-center px-3 py-1.25 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-sm', badgeClasses]">
    <i v-if="icon" :class="`ph ph-${icon} text-xs mr-1.5`"></i>
    <slot />
  </Tag>
</template>
```

---

### Tables

**PrimeVue Component**: `<DataTable>`

#### Basic Table Structure

```vue
<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

interface League {
  id: number
  name: string
  tagline: string
  logo: string
  visibility: 'public' | 'private'
  platforms: string
  competitions: number
  drivers: number
}

const leagues = ref<League[]>([])
</script>

<template>
  <DataTable
    :value="leagues"
    class="bg-vrl-bg-white border border-vrl-border-light shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    :pt="{
      header: { class: 'bg-vrl-bg-light border-b border-vrl-border-light' },
      headerRow: { class: 'px-6' },
      headerCell: { class: 'px-3 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-vrl-text-light' },
      bodyRow: { class: 'px-6 border-b border-vrl-border-light last:border-b-0 hover:bg-vrl-bg-off-white transition-colors' },
      bodyCell: { class: 'px-3 py-4.5 text-sm text-vrl-text-dark' }
    }"
  >
    <!-- Row Number Column -->
    <Column header="#" class="w-14">
      <template #body="{ index }">
        <span class="font-serif text-xl font-semibold text-vrl-border-medium">
          {{ String(index + 1).padStart(2, '0') }}
        </span>
      </template>
    </Column>

    <!-- League Info Column -->
    <Column header="League" class="flex-1">
      <template #body="{ data }">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-vrl-bg-light border border-vrl-border-light flex items-center justify-center font-serif text-base font-semibold text-vrl-text-dark flex-shrink-0">
            {{ data.logo }}
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-[15px] text-vrl-text-black mb-0.5">
              {{ data.name }}
            </div>
            <div class="text-[13px] text-vrl-text-light truncate">
              {{ data.tagline }}
            </div>
          </div>
        </div>
      </template>
    </Column>

    <!-- Status Column -->
    <Column header="Status" class="w-25">
      <template #body="{ data }">
        <VrlBadge :variant="data.visibility">
          {{ data.visibility }}
        </VrlBadge>
      </template>
    </Column>

    <!-- Platforms Column -->
    <Column field="platforms" header="Platforms" class="w-35" />

    <!-- Competitions Column -->
    <Column header="Comps" class="w-25">
      <template #body="{ data }">
        <span class="font-serif text-xl font-semibold text-vrl-text-black">
          {{ data.competitions }}
        </span>
      </template>
    </Column>

    <!-- Drivers Column -->
    <Column header="Drivers" class="w-25">
      <template #body="{ data }">
        <span class="font-serif text-xl font-semibold text-vrl-text-black">
          {{ data.drivers }}
        </span>
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" class="w-40">
      <template #body>
        <div class="flex gap-2">
          <VrlButton variant="outline" size="sm" icon="pencil">Edit</VrlButton>
          <VrlButton variant="secondary" size="sm" icon="eye">View</VrlButton>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
```

#### Tailwind Classes for Table Structure

**Table Container**:
```
bg-vrl-bg-white border border-vrl-border-light shadow-[0_1px_3px_rgba(0,0,0,0.04)]
```

**Table Header**:
```
bg-vrl-bg-light border-b border-vrl-border-light
```

**Table Header Cell**:
```
px-3 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-vrl-text-light
```

**Table Row**:
```
border-b border-vrl-border-light last:border-b-0 hover:bg-vrl-bg-off-white transition-colors
```

**Table Cell**:
```
px-3 py-4.5 text-sm text-vrl-text-dark
```

**Row Number Styling**:
```
font-serif text-xl font-semibold text-vrl-border-medium
```

**Data Highlight (Numbers)**:
```
font-serif text-xl font-semibold text-vrl-text-black
```

---

### Cards / Panels

**PrimeVue Component**: `<Card>`

#### Basic Card

```vue
<script setup lang="ts">
import Card from 'primevue/card'
</script>

<template>
  <Card class="bg-vrl-bg-white border border-vrl-border-light rounded-sm p-6">
    <template #header>
      <div class="pb-4 mb-4 border-b border-vrl-border-light">
        <h3 class="font-serif text-xl font-semibold text-vrl-text-black">
          League Settings
        </h3>
        <p class="text-sm text-vrl-text-medium mt-1">
          Configure your league preferences
        </p>
      </div>
    </template>

    <template #content>
      <!-- Card content -->
    </template>

    <template #footer>
      <div class="flex gap-3 justify-end pt-4 mt-4 border-t border-vrl-border-light">
        <VrlButton variant="outline">Cancel</VrlButton>
        <VrlButton variant="primary">Save Changes</VrlButton>
      </div>
    </template>
  </Card>
</template>
```

#### Stat Card

```vue
<template>
  <div class="text-center py-5 px-7 bg-vrl-bg-white border border-vrl-border-light min-w-[100px]">
    <div class="font-serif text-4xl font-bold text-vrl-text-black leading-none">
      3
    </div>
    <div class="font-mono text-[10px] tracking-wide uppercase text-vrl-text-light mt-1.5">
      Leagues
    </div>
  </div>
</template>
```

#### Custom Card Component

```vue
<!-- VrlCard.vue -->
<script setup lang="ts">
import Card from 'primevue/card'

interface VrlCardProps {
  title?: string
  subtitle?: string
  noPadding?: boolean
}

const props = defineProps<VrlCardProps>()
</script>

<template>
  <Card :class="['bg-vrl-bg-white border border-vrl-border-light rounded-sm', noPadding ? '' : 'p-6']">
    <template v-if="title" #header>
      <div class="pb-4 mb-4 border-b border-vrl-border-light">
        <h3 class="font-serif text-xl font-semibold text-vrl-text-black">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-sm text-vrl-text-medium mt-1">
          {{ subtitle }}
        </p>
      </div>
    </template>

    <template #content>
      <slot />
    </template>

    <template v-if="$slots.footer" #footer>
      <div class="flex gap-3 justify-end pt-4 mt-4 border-t border-vrl-border-light">
        <slot name="footer" />
      </div>
    </template>
  </Card>
</template>
```

---

### Alerts / Notices

**PrimeVue Component**: `<Message>`

#### Warning Alert (Tier Limit)

```vue
<script setup lang="ts">
import Message from 'primevue/message'
</script>

<template>
  <Message
    severity="warn"
    class="flex items-center gap-4 px-5 py-4 mb-8 bg-amber-50 border border-amber-200 border-l-4 border-l-vrl-accent-amber rounded-sm"
    :closable="false"
  >
    <template #icon>
      <div class="w-9 h-9 bg-vrl-accent-amber rounded-full flex items-center justify-center flex-shrink-0">
        <i class="ph ph-warning text-white text-lg"></i>
      </div>
    </template>

    <div class="flex-1">
      <div class="font-mono font-semibold text-[13px] text-vrl-accent-amber tracking-wide mb-0.5">
        FREE TIER LIMIT REACHED
      </div>
      <div class="text-sm text-amber-900">
        You've reached 3/3 leagues. Upgrade your plan to create more.
      </div>
    </div>

    <VrlButton
      variant="primary"
      size="sm"
      class="bg-vrl-accent-amber text-white hover:bg-[#b45309]"
    >
      Upgrade
    </VrlButton>
  </Message>
</template>
```

#### Alert Variants

```vue
<template>
  <!-- Success Alert -->
  <Message
    severity="success"
    class="flex items-center gap-4 px-5 py-4 bg-green-50 border border-green-200 border-l-4 border-l-vrl-success rounded-sm"
  >
    <template #icon>
      <div class="w-9 h-9 bg-vrl-success rounded-full flex items-center justify-center">
        <i class="ph ph-check-circle text-white text-lg"></i>
      </div>
    </template>
    <div class="flex-1">
      <div class="font-mono font-semibold text-[13px] text-vrl-success tracking-wide mb-0.5">
        SUCCESS
      </div>
      <div class="text-sm text-green-900">
        League created successfully
      </div>
    </div>
  </Message>

  <!-- Error Alert -->
  <Message
    severity="error"
    class="flex items-center gap-4 px-5 py-4 bg-red-50 border border-red-200 border-l-4 border-l-vrl-accent-red rounded-sm"
  >
    <template #icon>
      <div class="w-9 h-9 bg-vrl-accent-red rounded-full flex items-center justify-center">
        <i class="ph ph-x-circle text-white text-lg"></i>
      </div>
    </template>
    <div class="flex-1">
      <div class="font-mono font-semibold text-[13px] text-vrl-accent-red tracking-wide mb-0.5">
        ERROR
      </div>
      <div class="text-sm text-red-900">
        Failed to save changes
      </div>
    </div>
  </Message>

  <!-- Info Alert -->
  <Message
    severity="info"
    class="flex items-center gap-4 px-5 py-4 bg-sky-50 border border-sky-200 border-l-4 border-l-vrl-info rounded-sm"
  >
    <template #icon>
      <div class="w-9 h-9 bg-vrl-info rounded-full flex items-center justify-center">
        <i class="ph ph-info text-white text-lg"></i>
      </div>
    </template>
    <div class="flex-1">
      <div class="font-mono font-semibold text-[13px] text-vrl-info tracking-wide mb-0.5">
        INFORMATION
      </div>
      <div class="text-sm text-sky-900">
        Season starts in 7 days
      </div>
    </div>
  </Message>
</template>
```

#### Custom Alert Component

```vue
<!-- VrlAlert.vue -->
<script setup lang="ts">
import Message from 'primevue/message'

interface VrlAlertProps {
  severity?: 'success' | 'warn' | 'error' | 'info'
  title: string
  message: string
  icon?: string
  closable?: boolean
  actionLabel?: string
}

const props = withDefaults(defineProps<VrlAlertProps>(), {
  severity: 'info',
  closable: false
})

const emit = defineEmits<{
  action: []
  close: []
}>()

const severityClasses = computed(() => {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 border-l-vrl-success',
      icon: 'bg-vrl-success',
      title: 'text-vrl-success',
      text: 'text-green-900',
      defaultIcon: 'check-circle'
    },
    warn: {
      container: 'bg-amber-50 border-amber-200 border-l-vrl-accent-amber',
      icon: 'bg-vrl-accent-amber',
      title: 'text-vrl-accent-amber',
      text: 'text-amber-900',
      defaultIcon: 'warning'
    },
    error: {
      container: 'bg-red-50 border-red-200 border-l-vrl-accent-red',
      icon: 'bg-vrl-accent-red',
      title: 'text-vrl-accent-red',
      text: 'text-red-900',
      defaultIcon: 'x-circle'
    },
    info: {
      container: 'bg-sky-50 border-sky-200 border-l-vrl-info',
      icon: 'bg-vrl-info',
      title: 'text-vrl-info',
      text: 'text-sky-900',
      defaultIcon: 'info'
    }
  }

  return variants[props.severity]
})

const iconName = computed(() => props.icon || severityClasses.value.defaultIcon)
</script>

<template>
  <Message
    :severity="severity"
    :class="['flex items-center gap-4 px-5 py-4 border border-l-4 rounded-sm', severityClasses.container]"
    :closable="closable"
    @close="emit('close')"
  >
    <template #icon>
      <div :class="['w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', severityClasses.icon]">
        <i :class="`ph ph-${iconName} text-white text-lg`"></i>
      </div>
    </template>

    <div class="flex-1">
      <div :class="['font-mono font-semibold text-[13px] tracking-wide mb-0.5', severityClasses.title]">
        {{ title }}
      </div>
      <div :class="['text-sm', severityClasses.text]">
        {{ message }}
      </div>
    </div>

    <slot name="action">
      <VrlButton
        v-if="actionLabel"
        size="sm"
        :class="['text-white', severityClasses.icon]"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </VrlButton>
    </slot>
  </Message>
</template>
```

---

### Accordion

**PrimeVue Component**: `<Accordion>` and `<AccordionTab>`

```vue
<script setup lang="ts">
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
</script>

<template>
  <Accordion
    class="bg-vrl-bg-white border border-vrl-border-light"
    :pt="{
      accordiontab: {
        root: { class: 'border-b border-vrl-border-light last:border-b-0' },
        header: { class: 'w-full' },
        headerAction: { class: 'w-full flex items-center justify-between px-5 py-4 bg-transparent border-0 cursor-pointer transition-colors hover:bg-vrl-bg-off-white' },
        headerTitle: { class: 'font-sans text-[15px] font-semibold text-vrl-text-black' },
        headerIcon: { class: 'w-5 h-5 text-vrl-text-light transition-transform' },
        content: { class: 'px-5 pb-5 text-sm text-vrl-text-medium leading-relaxed' }
      }
    }"
  >
    <AccordionTab header="League Information">
      <p>
        Configure basic league information including name, description, and visibility settings.
      </p>
    </AccordionTab>

    <AccordionTab header="Competition Rules">
      <p>
        Set up scoring systems, penalty rules, and race regulations for all competitions.
      </p>
    </AccordionTab>

    <AccordionTab header="Driver Management">
      <p>
        Manage driver registrations, approve applications, and handle driver transfers.
      </p>
    </AccordionTab>
  </Accordion>
</template>
```

---

### Tabs / Filter Tabs

**PrimeVue Component**: `<TabView>` and `<TabPanel>`

```vue
<script setup lang="ts">
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
</script>

<template>
  <TabView
    class="bg-vrl-bg-white border border-vrl-border-medium"
    :pt="{
      navContainer: { class: 'flex gap-0' },
      nav: { class: 'flex' },
      inkbar: { class: 'hidden' },
      navContent: {
        class: 'px-5.5 py-2.75 font-mono text-xs font-medium tracking-wide text-vrl-text-medium bg-transparent border-0 border-r border-vrl-border-light cursor-pointer transition-all hover:bg-vrl-bg-light hover:text-vrl-text-dark'
      },
      navContentSelected: {
        class: 'bg-vrl-text-black text-vrl-bg-white'
      }
    }"
  >
    <TabPanel header="All">
      <!-- All leagues content -->
    </TabPanel>
    <TabPanel header="Public">
      <!-- Public leagues content -->
    </TabPanel>
    <TabPanel header="Private">
      <!-- Private leagues content -->
    </TabPanel>
    <TabPanel header="Archived">
      <!-- Archived leagues content -->
    </TabPanel>
  </TabView>
</template>
```

#### Custom Filter Tabs Component

```vue
<!-- VrlFilterTabs.vue -->
<script setup lang="ts">
import { ref } from 'vue'

interface Tab {
  key: string
  label: string
  count?: number
}

interface VrlFilterTabsProps {
  tabs: Tab[]
  modelValue: string
}

const props = defineProps<VrlFilterTabsProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectTab = (key: string) => {
  emit('update:modelValue', key)
}
</script>

<template>
  <div class="flex gap-0 bg-vrl-bg-white border border-vrl-border-medium">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="[
        'px-5.5 py-2.75 font-mono text-xs font-medium tracking-wide cursor-pointer transition-all border-r border-vrl-border-light last:border-r-0',
        modelValue === tab.key
          ? 'bg-vrl-text-black text-vrl-bg-white'
          : 'text-vrl-text-medium bg-transparent hover:bg-vrl-bg-light hover:text-vrl-text-dark'
      ]"
      @click="selectTab(tab.key)"
    >
      {{ tab.label }}
      <span v-if="tab.count !== undefined" class="ml-1.5 opacity-70">
        ({{ tab.count }})
      </span>
    </button>
  </div>
</template>
```

**Usage**:
```vue
<script setup>
const activeTab = ref('all')
const tabs = [
  { key: 'all', label: 'All', count: 12 },
  { key: 'public', label: 'Public', count: 8 },
  { key: 'private', label: 'Private', count: 4 },
  { key: 'archived', label: 'Archived', count: 0 }
]
</script>

<template>
  <VrlFilterTabs v-model="activeTab" :tabs="tabs" />
</template>
```

---

### Modal / Dialog

**PrimeVue Component**: `<Dialog>`

```vue
<script setup lang="ts">
import Dialog from 'primevue/dialog'

const visible = ref(false)
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :dismissable-mask="true"
    class="w-full max-w-[560px] max-h-[90vh] overflow-auto bg-vrl-bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
    :pt="{
      header: { class: 'flex items-center justify-between px-6 py-5 border-b border-vrl-border-light' },
      title: { class: 'font-serif text-[22px] font-semibold text-vrl-text-black' },
      closeButton: { class: 'w-8 h-8 flex items-center justify-center bg-transparent border-0 text-vrl-text-light cursor-pointer transition-colors hover:text-vrl-text-black' },
      content: { class: 'px-6 py-6' },
      footer: { class: 'flex gap-3 justify-end px-6 py-5 border-t border-vrl-border-light bg-vrl-bg-off-white' }
    }"
  >
    <template #header>
      <h3 class="font-serif text-[22px] font-semibold text-vrl-text-black">
        Create New League
      </h3>
    </template>

    <div class="space-y-5">
      <!-- Modal content -->
      <VrlFormGroup label="League Name" :required="true">
        <InputText v-model="leagueName" placeholder="Enter league name" />
      </VrlFormGroup>

      <VrlFormGroup label="Description">
        <Textarea v-model="description" rows="4" />
      </VrlFormGroup>
    </div>

    <template #footer>
      <VrlButton variant="outline" @click="visible = false">Cancel</VrlButton>
      <VrlButton variant="primary" @click="createLeague">Create League</VrlButton>
    </template>
  </Dialog>
</template>
```

#### Custom Dialog Component

```vue
<!-- VrlDialog.vue -->
<script setup lang="ts">
import Dialog from 'primevue/dialog'

interface VrlDialogProps {
  visible: boolean
  title: string
  width?: string
  dismissableMask?: boolean
}

const props = withDefaults(defineProps<VrlDialogProps>(), {
  width: '560px',
  dismissableMask: true
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const close = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :dismissable-mask="dismissableMask"
    :style="{ width }"
    class="max-h-[90vh] overflow-auto bg-vrl-bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
    :pt="{
      header: { class: 'flex items-center justify-between px-6 py-5 border-b border-vrl-border-light' },
      title: { class: 'font-serif text-[22px] font-semibold text-vrl-text-black' },
      closeButton: { class: 'w-8 h-8 flex items-center justify-center bg-transparent border-0 text-vrl-text-light cursor-pointer transition-colors hover:text-vrl-text-black' },
      content: { class: 'px-6 py-6' },
      footer: { class: 'flex gap-3 justify-end px-6 py-5 border-t border-vrl-border-light bg-vrl-bg-off-white' }
    }"
  >
    <template #header>
      <h3 class="font-serif text-[22px] font-semibold text-vrl-text-black">
        {{ title }}
      </h3>
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" :close="close" />
    </template>
  </Dialog>
</template>
```

---

### Header / Navigation

#### Site Header (Dark)

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const activeRoute = computed(() => router.currentRoute.value.name)

const logout = () => {
  // Logout logic
}
</script>

<template>
  <header class="bg-vrl-header border-b-[3px] border-vrl-accent-yellow sticky top-0 z-[100]">
    <div class="max-w-[1280px] mx-auto px-12 flex items-center justify-between h-16">
      <!-- Brand -->
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 bg-vrl-accent-yellow flex items-center justify-center font-mono text-sm font-bold text-vrl-header">
          VRL
        </div>
        <span class="font-mono text-base font-semibold text-neutral-200 tracking-wide">
          Virtual Racing Leagues
        </span>
      </div>

      <!-- Navigation -->
      <nav class="flex items-center gap-2">
        <router-link
          to="/leagues"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-medium tracking-wide uppercase text-decoration-none bg-transparent border border-transparent cursor-pointer transition-all',
            activeRoute === 'leagues'
              ? 'text-vrl-accent-yellow bg-vrl-header-secondary border-vrl-accent-yellow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-vrl-header-secondary hover:border-vrl-border-dark'
          ]"
        >
          <i class="ph ph-house text-base"></i>
          Leagues
        </router-link>

        <router-link
          to="/help"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-medium tracking-wide uppercase text-decoration-none bg-transparent border border-transparent cursor-pointer transition-all',
            activeRoute === 'help'
              ? 'text-vrl-accent-yellow bg-vrl-header-secondary border-vrl-accent-yellow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-vrl-header-secondary hover:border-vrl-border-dark'
          ]"
        >
          <i class="ph ph-question text-base"></i>
          Help
        </router-link>

        <div class="w-px h-6 bg-vrl-border-dark mx-2"></div>

        <button
          class="flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-medium tracking-wide uppercase bg-transparent border border-transparent text-neutral-400 cursor-pointer transition-all hover:text-neutral-200 hover:bg-vrl-header-secondary hover:border-vrl-border-dark"
        >
          <i class="ph ph-user text-base"></i>
          Profile
        </button>

        <button
          @click="logout"
          class="flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-medium tracking-wide uppercase bg-transparent border border-transparent text-neutral-400 cursor-pointer transition-all hover:text-neutral-200 hover:bg-vrl-header-secondary hover:border-vrl-border-dark"
        >
          <i class="ph ph-sign-out text-base"></i>
          Logout
        </button>
      </nav>
    </div>
  </header>
</template>
```

### Page Header

```vue
<template>
  <header class="grid grid-cols-[1fr_auto] gap-12 items-end mb-10 pb-8 border-b-2 border-vrl-text-black">
    <div>
      <div class="font-mono text-[11px] tracking-[3px] uppercase text-vrl-accent-amber mb-2 font-semibold">
        League Management
      </div>
      <h1 class="font-serif text-[44px] font-bold leading-tight -tracking-wider text-vrl-text-black">
        Your Leagues
      </h1>
      <p class="text-[15px] text-vrl-text-medium mt-2.5 max-w-[400px]">
        Configure and manage your racing leagues, competitions, and driver rosters
      </p>
    </div>

    <div class="flex gap-4">
      <div class="text-center py-5 px-7 bg-vrl-bg-white border border-vrl-border-light min-w-[100px]">
        <div class="font-serif text-4xl font-bold text-vrl-text-black leading-none">3</div>
        <div class="font-mono text-[10px] tracking-wide uppercase text-vrl-text-light mt-1.5">Leagues</div>
      </div>
      <div class="text-center py-5 px-7 bg-vrl-bg-white border border-vrl-border-light min-w-[100px]">
        <div class="font-serif text-4xl font-bold text-vrl-text-black leading-none">12</div>
        <div class="font-mono text-[10px] tracking-wide uppercase text-vrl-text-light mt-1.5">Competitions</div>
      </div>
      <div class="text-center py-5 px-7 bg-vrl-bg-white border border-vrl-border-light min-w-[100px]">
        <div class="font-serif text-4xl font-bold text-vrl-text-black leading-none">156</div>
        <div class="font-mono text-[10px] tracking-wide uppercase text-vrl-text-light mt-1.5">Drivers</div>
      </div>
    </div>
  </header>
</template>
```

---

## Layout

### Container

```vue
<template>
  <!-- Standard Container -->
  <div class="max-w-[1280px] mx-auto px-12">
    <!-- Content -->
  </div>

  <!-- Narrow Container -->
  <div class="max-w-[960px] mx-auto px-12">
    <!-- Content -->
  </div>

  <!-- Wide Container -->
  <div class="max-w-[1440px] mx-auto px-12">
    <!-- Content -->
  </div>
</template>
```

### Grid

```vue
<template>
  <!-- 2 Column Grid -->
  <div class="grid grid-cols-2 gap-6">
    <!-- Grid items -->
  </div>

  <!-- 3 Column Grid -->
  <div class="grid grid-cols-3 gap-6">
    <!-- Grid items -->
  </div>

  <!-- 4 Column Grid -->
  <div class="grid grid-cols-4 gap-6">
    <!-- Grid items -->
  </div>

  <!-- Responsive Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    <!-- Grid items -->
  </div>
</template>
```

---

## Icons with Phosphor

### Installation

```bash
npm install @phosphor-icons/web
```

### Setup in Vue

```ts
// main.ts
import '@phosphor-icons/web/regular'
import '@phosphor-icons/web/bold'
import '@phosphor-icons/web/fill'
```

### Icon Guidelines

- **Size**:
  - 16px (`text-base`) for buttons/navigation
  - 18-20px (`text-lg` / `text-xl`) for standalone icons
  - 24px (`text-2xl`) for feature icons
- **Weight**: Regular weight for most icons, Bold for emphasis
- **Style**: Outline/stroke style preferred over filled
- **Color**: Inherit from parent text color

### Common Simracing Icons

```vue
<template>
  <!-- Navigation -->
  <i class="ph ph-house"></i>                    <!-- Home/Dashboard -->
  <i class="ph ph-question"></i>                 <!-- Help -->
  <i class="ph ph-user"></i>                     <!-- Profile -->
  <i class="ph ph-sign-out"></i>                 <!-- Logout -->

  <!-- Actions -->
  <i class="ph ph-plus"></i>                     <!-- Add/Create -->
  <i class="ph ph-pencil"></i>                   <!-- Edit -->
  <i class="ph ph-eye"></i>                      <!-- View -->
  <i class="ph ph-trash"></i>                    <!-- Delete -->
  <i class="ph ph-copy"></i>                     <!-- Duplicate -->
  <i class="ph ph-download"></i>                 <!-- Export -->
  <i class="ph ph-upload"></i>                   <!-- Import -->
  <i class="ph ph-gear"></i>                     <!-- Settings -->

  <!-- Status Indicators -->
  <i class="ph ph-check-circle"></i>             <!-- Success -->
  <i class="ph ph-warning"></i>                  <!-- Warning -->
  <i class="ph ph-x-circle"></i>                 <!-- Error -->
  <i class="ph ph-info"></i>                     <!-- Information -->

  <!-- Simracing Specific -->
  <i class="ph ph-flag-checkered"></i>           <!-- Race/Finish -->
  <i class="ph ph-steering-wheel"></i>           <!-- Racing/Driving -->
  <i class="ph ph-users"></i>                    <!-- Drivers/Teams -->
  <i class="ph ph-trophy"></i>                   <!-- Championship/Win -->
  <i class="ph ph-timer"></i>                    <!-- Lap Times -->
  <i class="ph ph-lightning"></i>                <!-- Fastest Lap -->
  <i class="ph ph-chart-line"></i>               <!-- Performance/Stats -->
  <i class="ph ph-ranking"></i>                  <!-- Leaderboard -->
  <i class="ph ph-calendar"></i>                 <!-- Schedule/Events -->
  <i class="ph ph-map-pin"></i>                  <!-- Track/Circuit -->
  <i class="ph ph-gauge"></i>                    <!-- Speed/Performance -->
  <i class="ph ph-wrench"></i>                   <!-- Setup/Tuning -->
  <i class="ph ph-video-camera"></i>             <!-- Replay/Broadcast -->
  <i class="ph ph-target"></i>                   <!-- Target Lap -->

  <!-- Data & Files -->
  <i class="ph ph-file-text"></i>                <!-- Documents -->
  <i class="ph ph-table"></i>                    <!-- Data Tables -->
  <i class="ph ph-chart-bar"></i>                <!-- Statistics -->
  <i class="ph ph-funnel"></i>                   <!-- Filter -->
  <i class="ph ph-magnifying-glass"></i>         <!-- Search -->

  <!-- UI Controls -->
  <i class="ph ph-x"></i>                        <!-- Close -->
  <i class="ph ph-caret-down"></i>               <!-- Dropdown -->
  <i class="ph ph-caret-left"></i>               <!-- Previous -->
  <i class="ph ph-caret-right"></i>              <!-- Next -->
  <i class="ph ph-dots-three"></i>               <!-- More Options -->
</template>
```

### Icon Usage in Components

```vue
<template>
  <!-- Button with Icon -->
  <button class="inline-flex items-center gap-2">
    <i class="ph ph-plus text-sm"></i>
    <span>Create League</span>
  </button>

  <!-- Icon-only Button -->
  <button class="p-2">
    <i class="ph ph-pencil text-base"></i>
  </button>

  <!-- Large Feature Icon -->
  <div class="w-12 h-12 bg-vrl-accent-yellow rounded-full flex items-center justify-center">
    <i class="ph ph-trophy text-2xl text-vrl-header"></i>
  </div>

  <!-- Status Icon with Color -->
  <div class="flex items-center gap-2">
    <i class="ph ph-check-circle text-vrl-success text-lg"></i>
    <span>Race Complete</span>
  </div>
</template>
```

---

## PrimeVue Theming

### Custom PrimeVue Theme Configuration

```ts
// main.ts
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

const VrlPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#8a8a8a',
      600: '#4a4a4a',
      700: '#1a1a1a',
      800: '#0d0d0d',
      900: '#0a0a0a',
      950: '#0a0a0a'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#8a8a8a',
          600: '#4a4a4a',
          700: '#1a1a1a',
          800: '#0d0d0d',
          900: '#0a0a0a',
          950: '#0a0a0a'
        },
        primary: {
          color: '#0a0a0a',
          contrastColor: '#ffffff',
          hoverColor: '#d97706',
          activeColor: '#b45309'
        }
      }
    }
  }
})

const app = createApp(App)
app.use(PrimeVue, {
  theme: {
    preset: VrlPreset,
    options: {
      darkModeSelector: false,
      cssLayer: false
    }
  }
})
```

---

## Accessibility

### Guidelines

1. **Color Contrast**: All text meets WCAG AA standards
   - Body text: 4.5:1 minimum
   - Large text (18px+): 3:1 minimum
   - Interactive elements: 3:1 minimum

2. **Focus States**: All interactive elements have visible focus indicators
```vue
<template>
  <button class="focus:outline-none focus:ring-2 focus:ring-vrl-accent-amber focus:ring-offset-2">
    Click me
  </button>
</template>
```

3. **Touch Targets**: Minimum 44x44px for touch devices
```vue
<template>
  <!-- Ensure minimum touch target -->
  <button class="min-w-[44px] min-h-[44px]">
    <i class="ph ph-pencil"></i>
  </button>
</template>
```

4. **Semantic HTML**: Use proper heading hierarchy and landmark regions
```vue
<template>
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      <!-- Navigation items -->
    </nav>
  </header>

  <main role="main">
    <h1>Page Title</h1>
    <section aria-labelledby="section-heading">
      <h2 id="section-heading">Section Title</h2>
      <!-- Section content -->
    </section>
  </main>

  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
</template>
```

5. **ARIA Labels**: Provide labels for icon-only buttons
```vue
<template>
  <button aria-label="Edit league" class="p-2">
    <i class="ph ph-pencil"></i>
  </button>

  <button aria-label="Close dialog" @click="close">
    <i class="ph ph-x"></i>
  </button>
</template>
```

6. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
```vue
<template>
  <!-- Modal with keyboard trap -->
  <Dialog
    v-model:visible="visible"
    :trap-focus="true"
    @keydown.esc="visible = false"
  >
    <!-- Dialog content -->
  </Dialog>
</template>
```

---

## TypeScript Types

### Component Props Types

```typescript
// types/components.ts

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  icon?: string
  iconPos?: 'left' | 'right'
  iconOnly?: boolean
  disabled?: boolean
  loading?: boolean
}

export interface FormGroupProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  inputId?: string
}

export interface BadgeProps {
  variant?: 'public' | 'private' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  icon?: string
}

export interface AlertProps {
  severity?: 'success' | 'warn' | 'error' | 'info'
  title: string
  message: string
  icon?: string
  closable?: boolean
  actionLabel?: string
}

export interface DialogProps {
  visible: boolean
  title: string
  width?: string
  dismissableMask?: boolean
}

export interface CardProps {
  title?: string
  subtitle?: string
  noPadding?: boolean
}

export interface FilterTab {
  key: string
  label: string
  count?: number
}

export interface FilterTabsProps {
  tabs: FilterTab[]
  modelValue: string
}

// League domain types
export interface League {
  id: number
  name: string
  tagline: string
  logo: string
  visibility: 'public' | 'private'
  platforms: string
  competitions: number
  drivers: number
  createdAt: string
  updatedAt: string
}

export interface Competition {
  id: number
  leagueId: number
  name: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'active' | 'completed'
  rounds: number
}

export interface Driver {
  id: number
  name: string
  alias: string
  team?: string
  number?: number
  country: string
}

export interface Race {
  id: number
  competitionId: number
  round: number
  track: string
  date: string
  status: 'scheduled' | 'in-progress' | 'completed'
}
```

---

## Usage Examples

### Complete Form Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'

interface LeagueForm {
  name: string
  tagline: string
  description: string
  platform: string | null
  visibility: 'public' | 'private'
  allowRegistrations: boolean
}

const toast = useToast()

const form = ref<LeagueForm>({
  name: '',
  tagline: '',
  description: '',
  platform: null,
  visibility: 'public',
  allowRegistrations: true
})

const errors = ref({
  name: '',
  platform: ''
})

const platforms = [
  { name: 'iRacing', code: 'iracing' },
  { name: 'Assetto Corsa Competizione', code: 'acc' },
  { name: 'rFactor 2', code: 'rfactor2' },
  { name: 'F1 24', code: 'f124' }
]

const validateForm = (): boolean => {
  errors.value = { name: '', platform: '' }

  if (!form.value.name) {
    errors.value.name = 'League name is required'
    return false
  }

  if (!form.value.platform) {
    errors.value.platform = 'Platform is required'
    return false
  }

  return true
}

const submitForm = async () => {
  if (!validateForm()) return

  try {
    // Submit form
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'League created successfully',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create league',
      life: 3000
    })
  }
}
</script>

<template>
  <VrlCard title="Create New League" subtitle="Set up your racing league">
    <form @submit.prevent="submitForm" class="space-y-5">
      <!-- League Name -->
      <VrlFormGroup
        label="League Name"
        :required="true"
        hint="This will be visible to all participants"
        :error="errors.name"
        input-id="league-name"
      >
        <InputText
          id="league-name"
          v-model="form.name"
          placeholder="Enter league name"
          :class="['w-full px-4 py-2.75 bg-vrl-bg-white border rounded-sm font-mono text-[13px] text-vrl-text-dark', errors.name ? 'border-vrl-accent-red' : 'border-vrl-border-medium']"
        />
      </VrlFormGroup>

      <!-- Tagline -->
      <VrlFormGroup
        label="Tagline"
        hint="A short, catchy description"
        input-id="league-tagline"
      >
        <InputText
          id="league-tagline"
          v-model="form.tagline"
          placeholder="e.g., Where champions are made"
          class="w-full px-4 py-2.75 bg-vrl-bg-white border border-vrl-border-medium rounded-sm font-mono text-[13px] text-vrl-text-dark"
        />
      </VrlFormGroup>

      <!-- Platform -->
      <VrlFormGroup
        label="Platform"
        :required="true"
        :error="errors.platform"
        input-id="league-platform"
      >
        <Select
          id="league-platform"
          v-model="form.platform"
          :options="platforms"
          option-label="name"
          option-value="code"
          placeholder="Select a platform"
          class="w-full"
        />
      </VrlFormGroup>

      <!-- Description -->
      <VrlFormGroup
        label="Description"
        hint="Provide details about your league"
        input-id="league-description"
      >
        <Textarea
          id="league-description"
          v-model="form.description"
          rows="5"
          placeholder="Enter league description"
          class="w-full px-4 py-3 bg-vrl-bg-white border border-vrl-border-medium rounded-sm font-sans text-sm text-vrl-text-dark"
        />
      </VrlFormGroup>

      <!-- Visibility -->
      <div class="space-y-3">
        <label class="block font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light">
          Visibility
        </label>
        <div class="flex gap-4">
          <div class="flex items-center gap-2.5">
            <Checkbox
              v-model="form.visibility"
              inputId="visibility-public"
              value="public"
            />
            <label for="visibility-public" class="text-sm text-vrl-text-dark cursor-pointer">
              Public
            </label>
          </div>
          <div class="flex items-center gap-2.5">
            <Checkbox
              v-model="form.visibility"
              inputId="visibility-private"
              value="private"
            />
            <label for="visibility-private" class="text-sm text-vrl-text-dark cursor-pointer">
              Private
            </label>
          </div>
        </div>
      </div>

      <!-- Allow Registrations -->
      <div class="flex items-center justify-between py-3 border-t border-vrl-border-light">
        <div>
          <div class="text-sm font-semibold text-vrl-text-black">Allow Registrations</div>
          <div class="text-xs text-vrl-text-light mt-0.5">Enable drivers to register for competitions</div>
        </div>
        <InputSwitch v-model="form.allowRegistrations" />
      </div>
    </form>

    <template #footer>
      <VrlButton variant="outline" type="button">Cancel</VrlButton>
      <VrlButton variant="primary" type="submit" @click="submitForm">
        <i class="ph ph-plus mr-2"></i>
        Create League
      </VrlButton>
    </template>
  </VrlCard>
</template>
```

---

## File Structure Recommendation

```
resources/app/
├── css/
│   └── app.css                    # Tailwind imports + custom CSS
├── js/
│   ├── app.ts                     # Main entry point
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── VrlButton.vue
│   │   │   ├── VrlBadge.vue
│   │   │   ├── VrlCard.vue
│   │   │   ├── VrlDialog.vue
│   │   │   ├── VrlAlert.vue
│   │   │   ├── VrlFormGroup.vue
│   │   │   └── VrlFilterTabs.vue
│   │   ├── layout/                # Layout components
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppFooter.vue
│   │   │   ├── PageHeader.vue
│   │   │   └── PageContainer.vue
│   │   └── domain/                # Domain-specific components
│   │       ├── LeagueTable.vue
│   │       ├── LeagueCard.vue
│   │       ├── CompetitionList.vue
│   │       └── DriverRoster.vue
│   ├── composables/               # Composition functions
│   │   ├── useLeagues.ts
│   │   ├── useCompetitions.ts
│   │   └── useToast.ts
│   ├── types/                     # TypeScript types
│   │   ├── components.ts
│   │   ├── league.ts
│   │   ├── competition.ts
│   │   └── driver.ts
│   ├── views/                     # Page views
│   │   ├── LeaguesView.vue
│   │   ├── CompetitionsView.vue
│   │   └── DriversView.vue
│   ├── router/                    # Vue Router
│   │   └── index.ts
│   └── stores/                    # Pinia stores
│       ├── leagues.ts
│       └── auth.ts
└── tests/                         # Vitest tests
    ├── components/
    ├── composables/
    └── views/
```

---

## Quick Reference: CSS to Tailwind Mapping

| Custom CSS Class | Tailwind Equivalent |
|-----------------|-------------------|
| `.btn-primary` | `bg-vrl-text-black text-white hover:bg-vrl-accent-amber` |
| `.btn-secondary` | `bg-vrl-accent-blue text-white hover:bg-[#152a45]` |
| `.btn-outline` | `bg-white border border-vrl-border-medium text-vrl-text-medium hover:border-vrl-text-dark` |
| `.form-input` | `w-full px-4 py-2.75 border border-vrl-border-medium rounded-sm font-mono text-[13px]` |
| `.form-label` | `block mb-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase text-vrl-text-light` |
| `.badge-public` | `bg-blue-50 text-blue-800 px-3 py-1.25 font-mono text-[10px] uppercase` |
| `.card` | `bg-white border border-vrl-border-light rounded-sm p-6` |
| `.table-header` | `bg-vrl-bg-light border-b border-vrl-border-light` |
| `.page-header` | `grid grid-cols-[1fr_auto] gap-12 items-end mb-10 pb-8 border-b-2 border-vrl-text-black` |
| `.container` | `max-w-[1280px] mx-auto px-12` |

---

## Resources

### Documentation Links
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PrimeVue 4](https://primevue.org/)
- [Phosphor Icons](https://phosphoricons.com/)
- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)

### Design Inspiration
- Swiss Design Principles
- Brutalist Web Design
- Functional Minimalism
- Racing Telemetry Displays

---

This design system provides a complete foundation for building a professional, accessible, and maintainable simracing application using modern web technologies.
