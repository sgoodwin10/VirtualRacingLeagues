# VRL Velocity Public Dashboard - Style Guide

Quick reference for the VRL Velocity design system used in the public dashboard.

---

## Color Palette

### Background Colors (Progressive Depth)
```css
--bg-dark: #0d1117        /* Base/body background */
--bg-panel: #161b22       /* Panel/container background */
--bg-card: #1c2128        /* Card background */
--bg-elevated: #21262d    /* Elevated elements (hover, dropdowns) */
--bg-highlight: #272d36   /* Highlighted/active states */
```

**Utility Classes**: `.bg-dark`, `.bg-panel`, `.bg-card`, `.bg-elevated`, `.bg-highlight`

### Text Colors
```css
--text-primary: #e6edf3   /* Primary text, headings */
--text-secondary: #8b949e /* Secondary text, labels */
--text-muted: #6e7681     /* Tertiary text, placeholders */
```

**Utility Classes**: `.text-primary`, `.text-secondary`, `.text-muted`

### Accent Colors
```css
--cyan: #58a6ff       /* Primary accent, links, info */
--green: #7ee787      /* Success states */
--orange: #f0883e     /* Warning states */
--red: #f85149        /* Error/danger states */
--purple: #bc8cff     /* Special highlights */
--yellow: #d29922     /* Podium highlights */
```

**Utility Classes**: `.text-cyan`, `.text-green`, `.text-orange`, `.text-red`, `.text-purple`, `.text-yellow`

### Dim Backgrounds (15% opacity)
For badges, tags, and subtle highlights:
```css
--cyan-dim: rgba(88, 166, 255, 0.15)
--green-dim: rgba(126, 231, 135, 0.15)
--orange-dim: rgba(240, 136, 62, 0.15)
--red-dim: rgba(248, 81, 73, 0.15)
--purple-dim: rgba(188, 140, 255, 0.15)
--yellow-dim: rgba(210, 153, 34, 0.15)
```

**Utility Classes**: `.bg-cyan-dim`, `.bg-green-dim`, `.bg-orange-dim`, `.bg-red-dim`, `.bg-purple-dim`, `.bg-yellow-dim`

### Borders
```css
--border: #30363d         /* Default borders */
--border-muted: #21262d   /* Subtle borders */
```

**Utility Classes**: `.border-default`, `.border-muted`

---

## Typography

### Font Families
- **Display** (Orbitron): Headings, labels, buttons, display text
- **Body** (Inter): Body text, paragraphs

```css
--font-display: 'Orbitron', sans-serif
--font-body: 'Inter', sans-serif
```

**Utility Classes**: `.font-display`, `.font-body`

### Heading Scale
```css
h1: 3rem (48px)  - font-weight: 800, letter-spacing: 2px
h2: 2rem (32px)  - font-weight: 700, letter-spacing: 1px
h3: 1.5rem (24px) - font-weight: 600, letter-spacing: 1px
h4: 1.25rem (20px) - font-weight: 600, letter-spacing: 0.5px
h5: 1rem (16px)   - font-weight: 600
h6: 0.875rem (14px) - font-weight: 600
```

### Utility Typography Classes
```css
.text-display-h1    /* 3rem, 800 weight, 2px spacing */
.text-display-h2    /* 2rem, 700 weight, 1px spacing */
.text-display-h3    /* 1.5rem, 600 weight, 1px spacing */
.text-section-title /* 1.25rem, 600 weight, 0.5px spacing */
.text-card-title    /* 1rem, 600 weight, 0.5px spacing */
.text-body          /* 1rem, 400 weight, line-height: 1.6 */
.text-body-secondary /* 0.9rem, secondary color */
.text-small         /* 0.85rem, muted color */
.text-label         /* 0.75rem, uppercase, 2px spacing, cyan */
.text-gradient      /* Cyan-purple gradient text */
```

---

## Spacing System

### Standard Spacing (Tailwind)
Use Tailwind's spacing scale: `4px = 1`, `8px = 2`, `12px = 3`, `16px = 4`, etc.

### Common Patterns
- **Card padding**: `p-6` (24px)
- **Card header**: `px-6 py-5`
- **Card footer**: `px-6 py-4`
- **Section padding**: `px-8 py-12` or `px-8 pt-32 pb-16` (hero)
- **Container max-width**: `max-w-[1400px]` (landing), `max-w-7xl` (header)
- **Gap between elements**: `gap-4` (16px), `gap-8` (32px), `gap-12` (48px)

---

## Border Radius

```css
--radius-sm: 4px
--radius: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-pill: 100px   /* Fully rounded */
```

**Usage**: `rounded-[var(--radius-lg)]`, `rounded-[var(--radius-pill)]`

---

## Components

### Buttons (`VrlButton`)

**Variants**: `primary`, `secondary`, `ghost`, `outline`, `success`, `warning`, `danger`

**Sizes**: `sm`, `default`, `lg`, `xl`

**Example**:
```vue
<VrlButton variant="primary" size="lg">
  Start Racing Free
</VrlButton>
```

**Visual Specs**:
- Font: Orbitron, 600 weight, 1px letter-spacing
- Transition: `all 0.3s ease`
- Primary: Cyan background, lifts on hover (-2px translateY)
- Secondary: Transparent, border, elevated background on hover

### Cards (`VrlCard`)

**Props**: `title`, `hoverable`, `bodyPadding`, `showHeader`

**Example**:
```vue
<VrlCard title="Card Title" :hoverable="true">
  <template #body>Card content</template>
  <template #footer>Card footer</template>
</VrlCard>
```

**Visual Specs**:
- Background: `var(--bg-card)`
- Border: `var(--border)`, cyan on hover if `hoverable`
- Border radius: `var(--radius-lg)` (12px)
- Padding: 24px default

### Badges (`VrlBadge`)

**Variants**: `default`, `cyan`, `green`, `orange`, `red`, `purple`

**Props**: `variant`, `dot`, `pulse`

**Example**:
```vue
<VrlBadge variant="green" dot pulse>100% Free</VrlBadge>
```

**Visual Specs**:
- Font: Orbitron, 0.7rem, 600 weight, uppercase
- Padding: `px-3 py-1.5`
- Border radius: `var(--radius-pill)`
- Dim backgrounds for colored variants

### Forms (`VrlInput`)

**Example**:
```vue
<VrlInput
  v-model="email"
  type="email"
  placeholder="Enter email"
  :error="errors.email"
/>
```

**Visual Specs**:
- Background: `var(--bg-dark)`
- Border: `var(--border)`, cyan on focus
- Border radius: `var(--radius)` (6px)
- Padding: `px-4 py-3`
- Focus shadow: `0 0 0 3px var(--cyan-dim)`
- Error state: red border and shadow

---

## Layout Patterns

### Landing Page Structure
```vue
<div class="bg-[var(--bg-dark)] text-[var(--text-primary)]">
  <BackgroundGrid />
  <SpeedLines />
  <LandingNav />
  <main>
    <!-- Sections here -->
  </main>
</div>
```

### Hero Section
- Full viewport: `min-h-screen`
- Padding: `px-8 pt-32 pb-16`
- Grid: `lg:grid-cols-2` (two-column on desktop)
- Max width: `max-w-[1400px] mx-auto`

### Content Sections
- Padding: `px-8 py-16` or `py-24`
- Max width: `max-w-[1400px] mx-auto`
- Responsive grid: `grid md:grid-cols-2 lg:grid-cols-3 gap-8`

### Header
- Fixed height: `h-16`
- Background: `bg-[var(--bg-panel)]`
- Border: `border-b border-[var(--border)]`
- Flexbox: `flex justify-between items-center`

### Footer
- Background: `bg-[var(--bg-panel)]`
- Border: `border-t border-[var(--border)]`
- Padding: `px-8 py-12`
- Desktop: `grid-cols-3` (copyright, social, links)
- Mobile: Stacked flex column

---

## Animations

### Transitions
```css
--transition: all 0.3s ease
```

### Common Animations
- **Hover lift**: `translateY(-2px)` with shadow
- **Pulse**: Badge dots (2s ease-in-out infinite)
- **Slide in**: Hero content (1s ease-out)

### Accessibility
Always include motion preference support:
```css
@media (prefers-reduced-motion: reduce) {
  /* Remove animations */
}
```

---

## Accessibility

### Focus States
- Outline: `2px solid var(--cyan)`
- Outline offset: `2px`
- Applied to: `:focus-visible`

### ARIA
- Use `aria-label` for icon buttons
- Use `aria-invalid` for form errors
- Use `aria-describedby` for error messages
- Use `role="region"` for cards

---

## Special Effects

### Background Grid
```css
.bg-grid {
  background-image:
    linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### Gradient Text
```css
.text-gradient {
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Best Practices

1. **Use CSS variables** for colors, not hardcoded hex values
2. **Use utility classes** from `app.css` before writing custom CSS
3. **Always include hover states** for interactive elements
4. **Use Orbitron** for headings/labels, **Inter** for body text
5. **Follow the progressive depth system** for backgrounds (dark → panel → card → elevated → highlight)
6. **Use dim backgrounds** for badges and highlights
7. **Apply consistent spacing**: 4, 8, 12, 16, 24, 32, 48 (px)
8. **Test accessibility**: keyboard navigation, screen readers, motion preferences
