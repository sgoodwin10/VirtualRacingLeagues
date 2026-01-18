# VRL Velocity Landing Page Implementation Plan

## Overview

This plan outlines the implementation of the VRL Velocity brochure landing page (`brochure.html`) as the default landing page for the public dashboard at `resources/public`.

**Target**: Replace the current `HomeView.vue` with the full brochure design.

---

## 1. Design Analysis

### Page Sections (in order)

| # | Section | Description |
|---|---------|-------------|
| 1 | **Background Effects** | Animated grid background + speed lines |
| 2 | **Navigation** | Fixed header with logo, nav links, CTA buttons |
| 3 | **Hero** | Main hero section with badge, headline, subtitle, CTAs, stats, and live standings card |
| 4 | **Features** | 6 feature cards in a 3-column grid |
| 5 | **How It Works** | 5-step process with connected step cards |
| 6 | **Pricing** | Single free pricing card |
| 7 | **Platforms** | Supported gaming platforms (GT7, iRacing) |
| 8 | **Coming Soon** | 8 upcoming features grid |
| 9 | **CTA** | Final call-to-action section |
| 10 | **Footer** | Copyright and links |

---

## 2. Existing Components to Reuse

These components already exist in `resources/public/js/components/common/`:

| Component | Usage |
|-----------|-------|
| `VrlButton` | Primary/secondary CTA buttons |
| `VrlBadge` | Hero badge ("100% Free Forever"), Live badge |
| `VrlFeatureCard` | Feature cards (6 features) |
| `VrlCard` | Hero standings card, pricing card |
| `VrlPositionIndicator` | Position numbers (1, 2, 3, 4) in standings |

---

## 3. New Components to Create

### Layout Components

| Component | Path | Description |
|-----------|------|-------------|
| `LandingNav.vue` | `components/landing/LandingNav.vue` | Fixed navigation with logo, links, CTAs |
| `LandingFooter.vue` | `components/landing/LandingFooter.vue` | Footer with copyright and links |

### Background Components

| Component | Path | Description |
|-----------|------|-------------|
| `BackgroundGrid.vue` | `components/landing/BackgroundGrid.vue` | Fixed animated grid background |
| `SpeedLines.vue` | `components/landing/SpeedLines.vue` | Animated horizontal speed lines |

### Section Components

| Component | Path | Description |
|-----------|------|-------------|
| `HeroSection.vue` | `components/landing/sections/HeroSection.vue` | Hero with headline, CTAs, stats |
| `HeroStandingsCard.vue` | `components/landing/HeroStandingsCard.vue` | Live standings preview card |
| `StandingsRow.vue` | `components/landing/StandingsRow.vue` | Single driver row in standings |
| `FeaturesSection.vue` | `components/landing/sections/FeaturesSection.vue` | Features grid section |
| `HowItWorksSection.vue` | `components/landing/sections/HowItWorksSection.vue` | Step-by-step process |
| `StepCard.vue` | `components/landing/StepCard.vue` | Single step card with connector |
| `PricingSection.vue` | `components/landing/sections/PricingSection.vue` | Pricing card section |
| `PricingCard.vue` | `components/landing/PricingCard.vue` | Free pricing card |
| `PlatformsSection.vue` | `components/landing/sections/PlatformsSection.vue` | Supported platforms |
| `PlatformCard.vue` | `components/landing/PlatformCard.vue` | Single platform card |
| `ComingSoonSection.vue` | `components/landing/sections/ComingSoonSection.vue` | Coming soon features grid |
| `ComingSoonItem.vue` | `components/landing/ComingSoonItem.vue` | Single coming soon item |
| `CtaSection.vue` | `components/landing/sections/CtaSection.vue` | Final CTA section |
| `SectionHeader.vue` | `components/landing/SectionHeader.vue` | Reusable section header (tag, title, subtitle) |
| `StatItem.vue` | `components/landing/StatItem.vue` | Hero stat item (500+ Active Leagues) |

---

## 4. CSS Updates

### New CSS File
Create `resources/public/css/components/landing.css` for landing-specific styles:

```css
/* Speed lines animation */
/* Hero perspective card transform */
/* Step connector lines */
/* Pricing card gradient overlay */
/* Coming soon dashed border hover */
```

### Tailwind Classes to Use (prefer over custom CSS)

| Purpose | Tailwind Classes |
|---------|------------------|
| Grid background | Existing `.bg-grid-fixed` utility |
| Card hover | `hover:-translate-y-1`, `hover:border-[var(--cyan)]` |
| Gradient text | Existing `.text-gradient` utility |
| Section spacing | `py-24 px-8` |
| Container | `max-w-[1400px] mx-auto` |
| Grid layouts | `grid grid-cols-3 gap-8`, `grid-cols-4`, etc. |
| Responsive | `lg:grid-cols-3 md:grid-cols-1` |

---

## 5. File Structure

```
resources/public/js/
├── components/
│   └── landing/
│       ├── BackgroundGrid.vue
│       ├── SpeedLines.vue
│       ├── LandingNav.vue
│       ├── LandingFooter.vue
│       ├── SectionHeader.vue
│       ├── StatItem.vue
│       ├── HeroStandingsCard.vue
│       ├── StandingsRow.vue
│       ├── StepCard.vue
│       ├── PricingCard.vue
│       ├── PlatformCard.vue
│       ├── ComingSoonItem.vue
│       └── sections/
│           ├── HeroSection.vue
│           ├── FeaturesSection.vue
│           ├── HowItWorksSection.vue
│           ├── PricingSection.vue
│           ├── PlatformsSection.vue
│           ├── ComingSoonSection.vue
│           └── CtaSection.vue
└── views/
    └── HomeView.vue (updated)

resources/public/css/
└── components/
    └── landing.css (new)
```

---

## 6. Implementation Tasks

### Phase 1: Foundation (Background & Layout)

- [ ] **Task 1.1**: Create `BackgroundGrid.vue` - Fixed grid overlay
- [ ] **Task 1.2**: Create `SpeedLines.vue` - Animated speed lines with 5 lines
- [ ] **Task 1.3**: Create `LandingNav.vue` - Fixed nav with logo, links, Login/Get Started buttons
- [ ] **Task 1.4**: Create `LandingFooter.vue` - Footer with copyright and links
- [ ] **Task 1.5**: Create `SectionHeader.vue` - Reusable section header component

### Phase 2: Hero Section

- [ ] **Task 2.1**: Create `StatItem.vue` - Single stat (value + label)
- [ ] **Task 2.2**: Create `StandingsRow.vue` - Driver row with position, avatar, name, team, points
- [ ] **Task 2.3**: Create `HeroStandingsCard.vue` - Live standings card with perspective transform
- [ ] **Task 2.4**: Create `HeroSection.vue` - Full hero with badge, headline, CTAs, stats, standings card

### Phase 3: Features & How It Works

- [ ] **Task 3.1**: Create `FeaturesSection.vue` - 6 feature cards using `VrlFeatureCard`
- [ ] **Task 3.2**: Create `StepCard.vue` - Step card with number badge and connector line
- [ ] **Task 3.3**: Create `HowItWorksSection.vue` - 5-step process section

### Phase 4: Pricing & Platforms

- [ ] **Task 4.1**: Create `PricingCard.vue` - Free pricing card with features list
- [ ] **Task 4.2**: Create `PricingSection.vue` - Pricing section wrapper
- [ ] **Task 4.3**: Create `PlatformCard.vue` - Single platform card (icon + name)
- [ ] **Task 4.4**: Create `PlatformsSection.vue` - Supported platforms section

### Phase 5: Coming Soon & CTA

- [ ] **Task 5.1**: Create `ComingSoonItem.vue` - Dashed border item with hover effect
- [ ] **Task 5.2**: Create `ComingSoonSection.vue` - 8-item grid of upcoming features
- [ ] **Task 5.3**: Create `CtaSection.vue` - Final call-to-action

### Phase 6: Assembly & CSS

- [ ] **Task 6.1**: Create `landing.css` for animations (speed lines, pulse)
- [ ] **Task 6.2**: Update `HomeView.vue` to compose all sections
- [ ] **Task 6.3**: Add responsive breakpoints (1024px, 768px)

### Phase 7: Testing & Polish

- [ ] **Task 7.1**: Test responsive layouts on mobile/tablet
- [ ] **Task 7.2**: Verify animations respect `prefers-reduced-motion`
- [ ] **Task 7.3**: Ensure all router-links work correctly
- [ ] **Task 7.4**: Run linting and type checking

---

## 7. Content Data

### Features Data
```typescript
const features = [
  { icon: '🏁', title: 'Multi-Platform Support', description: 'Gran Turismo 7, iRacing, and more...' },
  { icon: '📊', title: 'Automatic Standings', description: 'Points calculated automatically...' },
  { icon: '👥', title: 'Driver Management', description: 'Track driver stats, manage teams...' },
  { icon: '📤', title: 'CSV Import/Export', description: 'Bulk import drivers and results...' },
  { icon: '🔗', title: 'Shareable Links', description: 'Generate public links...' },
  { icon: '⚡', title: 'Real-Time Updates', description: 'Instant standings updates...' },
];
```

### How It Works Steps
```typescript
const steps = [
  { number: 1, title: 'Create Your League', description: 'Sign up and create your league...' },
  { number: 2, title: 'Add Drivers', description: 'Import your driver roster via CSV...' },
  { number: 3, title: 'Setup Season', description: 'Create competitions, seasons, and rounds...' },
  { number: 4, title: 'Enter Results', description: 'Add race results and watch standings...' },
  { number: 5, title: 'Share', description: 'Share your public link...' },
];
```

### Pricing Features
```typescript
const pricingFeatures = [
  'Unlimited leagues',
  'Unlimited competitions & seasons',
  'Unlimited drivers',
  'All platform support',
  'CSV import/export',
  'Public shareable links',
  'Custom point systems',
  'Team & division management',
];
```

### Platforms
```typescript
const platforms = [
  { icon: '🎮', name: 'Gran Turismo 7' },
  { icon: '🏎️', name: 'iRacing' },
];
```

### Coming Soon Items
```typescript
const comingSoonItems = [
  { icon: '📈', text: 'GT7 Daily Race Stats' },
  { icon: '🛤️', text: 'Track Database' },
  { icon: '🚗', text: 'Car Selection' },
  { icon: '🤖', text: 'AI OCR Reader' },
  { icon: '📊', text: 'Google Sheets Import' },
  { icon: '🎯', text: 'More Platforms' },
  { icon: '📱', text: 'Mobile App' },
  { icon: '🔔', text: 'Discord Integration' },
];
```

### Hero Stats
```typescript
const stats = [
  { value: '500+', label: 'Active Leagues' },
  { value: '10K+', label: 'Drivers' },
  { value: '50K+', label: 'Races Tracked' },
];
```

### Sample Standings Data
```typescript
const standings = [
  { position: 1, initials: 'MV', name: 'Max Velocity', team: 'Red Storm Racing', points: 256 },
  { position: 2, initials: 'LH', name: 'Lewis Hamilton', team: 'Silver Arrows', points: 243 },
  { position: 3, initials: 'CL', name: 'Charles Leclerc', team: 'Prancing Horse', points: 231 },
  { position: 4, initials: 'LN', name: 'Lando Norris', team: 'Papaya Racing', points: 198 },
];
```

---

## 8. Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| **≥1024px** | Full layout: 2-col hero, 3-col features, 4-col coming soon |
| **768-1023px** | 1-col hero (hide visual), 1-col features, vertical steps |
| **<768px** | Hide nav links, stack stats, 2-col coming soon, stacked footer |

---

## 9. Accessibility Considerations

- All interactive elements have focus states
- Images/icons have appropriate alt text or aria-labels
- Animations respect `prefers-reduced-motion`
- Color contrast meets WCAG AA standards (already handled by design system)
- Navigation is keyboard-accessible

---

## 10. Dependencies

- **Existing**: VrlButton, VrlBadge, VrlFeatureCard, VrlCard, VrlPositionIndicator
- **Vue**: Vue 3 Composition API with `<script setup lang="ts">`
- **Router**: Vue Router for navigation links
- **Styles**: Tailwind CSS utilities + VRL design system CSS variables

---

## 11. Notes

1. **No new external dependencies** - Uses existing design system and Tailwind
2. **Prefer Tailwind utilities** over custom CSS where possible
3. **Component isolation** - Each section is its own component for maintainability
4. **Type safety** - All props interfaces defined with TypeScript
5. **Reusability** - `SectionHeader`, `StatItem`, etc. can be reused across pages

---

## Ready for Review

Please confirm this plan before implementation begins. Once approved, the dev-fe-public agent will implement each phase.
