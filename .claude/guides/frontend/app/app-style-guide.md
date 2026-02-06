# App Dashboard Styling Guide

The user dashboard (`resources/app/`) uses a **Technical Blueprint** design system - a dark, grid-patterned interface with monospace typography and cyan accents.

## Color Palette

### Backgrounds
| Variable | Hex | Usage |
|----------|-----|-------|
| `--bg-dark` | `#0d1117` | Page background |
| `--bg-panel` | `#161b22` | Sidebars, headers |
| `--bg-card` | `#1c2128` | Cards, panels |
| `--bg-elevated` | `#21262d` | Hover states, elevated surfaces |
| `--bg-highlight` | `#272d36` | Active states |

### Text
| Variable | Hex | Usage |
|----------|-----|-------|
| `--text-primary` | `#e6edf3` | Headings, primary content |
| `--text-secondary` | `#8b949e` | Body text, labels |
| `--text-muted` | `#6e7681` | Placeholder, disabled |

### Semantic Colors
| Variable | Hex | Usage |
|----------|-----|-------|
| `--cyan` | `#58a6ff` | Primary/info |
| `--green` | `#7ee787` | Success |
| `--orange` | `#f0883e` | Warning |
| `--red` | `#f85149` | Error/danger |
| `--purple` | `#bc8cff` | Special |
| `--yellow` | `#d29922` | Highlight/gold |

Each semantic color has a `*-dim` variant (15% opacity) for backgrounds: `--cyan-dim`, `--red-dim`, etc.

## Typography

### Font Families
```css
--font-mono: 'PT IBM Mono', 'SF Mono', Monaco, monospace;  /* Headers, labels, data */
--font-sans: 'Inter', -apple-system, sans-serif;           /* Body text */
--font-display: 'Orbitron', sans-serif;                    /* Special headings */
```

### Typography Utilities
```html
<h1 class="text-page-title">Page Title</h1>        <!-- 32px mono -->
<h2 class="text-section-header">Section</h2>      <!-- 24px mono -->
<h3 class="text-card-title">Card Title</h3>       <!-- 14px mono -->
<span class="text-section-label">LABEL</span>     <!-- 11px mono uppercase cyan -->
<p class="text-body">Body text</p>                <!-- 14px sans -->
<span class="text-metric-large">42</span>         <!-- 28px mono bold -->
```

## Spacing

Use Tailwind's spacing scale. Common patterns:
- Card padding: `p-4` (16px)
- Section gaps: `gap-4` or `gap-6`
- Form field margin: `mb-4` or `.form-group` class

## Components

### Buttons
Use the `<Button>` component from `@app/components/common/buttons`:

```vue
<Button variant="primary" label="Save" />
<Button variant="secondary" :icon="PhPlus" label="Add" />
<Button variant="danger" label="Delete" />
<Button variant="ghost" :icon="PhX" />
```

Variants: `primary`, `secondary`, `ghost`, `outline`, `danger`, `success`, `warning`
Sizes: `sm`, `default`, `lg`, `xl`

### Forms
Use form CSS classes from `forms.css`:

```html
<div class="form-group">
  <label class="form-label">Field Name</label>
  <input class="form-input" />
  <span class="form-error">Error message</span>
</div>

<div class="form-row">  <!-- 2-column grid -->
  <div class="form-group">...</div>
  <div class="form-group">...</div>
</div>
```

Layout classes: `.form-row` (2-col), `.form-row-3` (3-col), `.form-row-4` (4-col)

### Status Indicators
```html
<span class="status-badge active">Active</span>
<span class="status-badge pending">Pending</span>
<span class="status-badge error">Error</span>
```

### Tables
PrimeVue DataTable with custom styling applied globally:
- Headers: 10px uppercase mono, muted color
- Cells: 14px, proper padding
- Podium classes: `.podium-1`, `.podium-2`, `.podium-3` for ranking rows

## Layout Variables
```css
--rail-width: 64px;
--navigation-sidebar-width: 240px;
--radius: 6px;
```

## PrimeVue Integration

Global styles override PrimeVue defaults in `app.css`. Key customizations:
- Dark theme surface colors mapped to blueprint palette
- Cyan as primary color
- Monospace fonts for buttons, tabs, dialogs
- Custom drawer/dialog styling with dark masks

### Common PrimeVue Imports
```ts
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import Toast from 'primevue/toast';
```

## File Organization

```
resources/app/
├── css/
│   ├── app.css              # Main styles, theme variables, PrimeVue overrides
│   └── components/
│       ├── buttons.css      # Button variants
│       ├── forms.css        # Form styles
│       └── accordion.css    # Accordion styles
└── js/
    ├── components/
    │   └── common/          # Reusable components (buttons, forms, cards, etc.)
    ├── composables/         # Vue composables (useToastError, useCrudStore, etc.)
    ├── services/            # API services
    ├── stores/              # Pinia stores
    ├── types/               # TypeScript interfaces
    └── views/               # Page components
```

## Best Practices

1. **Use CSS variables** - Never hardcode colors; use `var(--cyan)` etc.
2. **Prefer utility classes** - Use Tailwind for layout, custom classes for complex patterns
3. **Wrap PrimeVue components** - Create app-specific wrappers (see `Button.vue`)
4. **Use composables** - Extract reusable logic (`useToastError`, `useCrudStore`)
5. **Import via aliases** - Use `@app/` not relative paths
