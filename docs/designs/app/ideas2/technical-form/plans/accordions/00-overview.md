# Accordion Migration Plan - Technical Blueprint Design System

## Overview

This document outlines the comprehensive plan to migrate all PrimeVue Accordion usages in `resources/app/` to the new Technical Blueprint design system as defined in `accordions.html`.

## Design System Reference

The Technical Blueprint design system introduces a distinctive engineering aesthetic with:

### Color Palette
| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-dark` | `#0d1117` | Page background |
| `--bg-panel` | `#161b22` | Panel backgrounds |
| `--bg-card` | `#1c2128` | Card/accordion backgrounds |
| `--bg-elevated` | `#21262d` | Elevated surfaces |
| `--bg-highlight` | `#272d36` | Hover states |
| `--text-primary` | `#e6edf3` | Primary text |
| `--text-secondary` | `#8b949e` | Secondary text |
| `--text-muted` | `#6e7681` | Muted text |
| `--cyan` | `#58a6ff` | Primary accent |
| `--green` | `#7ee787` | Success/active states |
| `--orange` | `#f0883e` | Warning/pending states |
| `--red` | `#f85149` | Error/danger states |
| `--purple` | `#bc8cff` | Premium/special states |
| `--border` | `#30363d` | Default borders |

### Typography
- **Headings/Labels**: IBM Plex Mono (monospace)
- **Body**: Inter (sans-serif)
- **Title size**: 13px, font-weight 600
- **Subtitle size**: 12px
- **Labels**: 11px, uppercase, letter-spacing 1px

### Key Visual Features
1. **Hover translation**: `translateX(4px)` on hover
2. **Active state**: Cyan border, elevated background
3. **Status indicators**: Vertical 4px bars with glow effects
4. **Chevron rotation**: 180deg on active
5. **8px gap** between accordion items

## Files Requiring Migration

| File | Type | Complexity | Priority |
|------|------|------------|----------|
| `RoundsPanel.vue` | Multi-panel with status | High | P1 |
| `RaceFormDrawer.vue` | Form sections (4 accordions) | Medium | P2 |
| `RaceEventResultsSection.vue` | Single panel with table | Low | P3 |
| `RoundStandingsSection.vue` | Single panel with table | Low | P3 |
| `DriverFormDialog.vue` | Single panel for optional fields | Low | P4 |

## Migration Strategy

### Phase 1: Component Creation
1. Create `TechnicalAccordion.vue` - base wrapper component
2. Create `TechnicalAccordionPanel.vue` - individual panel component
3. Create `TechnicalAccordionHeader.vue` - header with status/icon support
4. Create `TechnicalAccordionContent.vue` - content wrapper
5. Create supporting components:
   - `AccordionStatusIndicator.vue` - vertical status bar
   - `AccordionBadge.vue` - styled badges
   - `AccordionIcon.vue` - icon container

### Phase 2: CSS Variables & Theming
1. Add Technical Blueprint CSS variables to `resources/app/css/app.css`
2. Create accordion-specific CSS in `resources/app/css/components/accordion.css`
3. Ensure dark theme compatibility

### Phase 3: Component-by-Component Migration
1. **RoundsPanel.vue** - Most complex, sets the pattern
2. **RaceFormDrawer.vue** - Form-specific accordion pattern
3. **RaceEventResultsSection.vue** - Table content pattern
4. **RoundStandingsSection.vue** - Similar to RaceEventResultsSection
5. **DriverFormDialog.vue** - Simple form section pattern

### Phase 4: Testing & Refinement
1. Update existing tests for each component
2. Add visual regression tests
3. Verify accessibility compliance
4. Performance testing

## Component Location

All new components will be created in:
```
resources/app/js/components/common/accordions/
├── TechnicalAccordion.vue
├── TechnicalAccordionPanel.vue
├── TechnicalAccordionHeader.vue
├── TechnicalAccordionContent.vue
├── AccordionStatusIndicator.vue
├── AccordionBadge.vue
├── AccordionIcon.vue
├── index.ts
└── __tests__/
    ├── TechnicalAccordion.test.ts
    └── ...
```

## Success Criteria

1. All accordions match Technical Blueprint design specification
2. Consistent visual language across all accordion usages
3. Full TypeScript support with proper prop types
4. Accessible (WCAG 2.1 AA compliant)
5. Smooth animations (60fps)
6. All existing functionality preserved
7. All existing tests pass
8. New component tests with >80% coverage

## Related Documents

- [01-component-specification.md](./01-component-specification.md) - Detailed component API
- [02-rounds-panel-migration.md](./02-rounds-panel-migration.md) - RoundsPanel migration
- [03-race-form-drawer-migration.md](./03-race-form-drawer-migration.md) - RaceFormDrawer migration
- [04-race-event-results-migration.md](./04-race-event-results-migration.md) - RaceEventResultsSection migration
- [05-round-standings-migration.md](./05-round-standings-migration.md) - RoundStandingsSection migration
- [06-driver-form-dialog-migration.md](./06-driver-form-dialog-migration.md) - DriverFormDialog migration
