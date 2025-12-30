# Card Components - Implementation Plan Overview

## Project Summary

Convert the Technical Blueprint HTML card components into reusable Vue 3 components using the Composition API, TypeScript, and Tailwind CSS. These components will be used throughout the user dashboard for displaying content, metrics, notifications, and informational messages.

## Components to Implement

1. **Card** - Basic content container with optional header and body
2. **MetricCard** - KPI display card with colored top accent bar
3. **InfoBox** - Informational note with left border accent
4. **Alert** - Notification banner with icon
5. **NoteBox** - Documentation/usage notes box

## Directory Structure

```
resources/app/js/components/common/cards/
├── Card.vue                      # Basic card component
├── CardHeader.vue                # Reusable card header component
├── CardBody.vue                  # Reusable card body component
├── MetricCard.vue                # Metric/KPI display card
├── InfoBox.vue                   # Informational note box
├── Alert.vue                     # Alert notification component
├── NoteBox.vue                   # Documentation note box
├── index.ts                      # Export all card components
├── __tests__/
│   ├── Card.test.ts
│   ├── CardHeader.test.ts
│   ├── CardBody.test.ts
│   ├── MetricCard.test.ts
│   ├── InfoBox.test.ts
│   ├── Alert.test.ts
│   └── NoteBox.test.ts
└── types.ts                      # TypeScript types/interfaces
```

## TypeScript Types

All components will use TypeScript with strict type checking. Types will be defined in `types.ts` and exported for use across the application.

## CSS Approach

**Hybrid Approach:**
- **Tailwind Utilities**: For spacing, borders, colors, typography
- **Scoped CSS**: Only when absolutely necessary for complex styling that can't be achieved with Tailwind
- **CSS Variables**: Use existing Technical Blueprint CSS variables from `app.css`

## Design System Integration

All components will integrate with the existing Technical Blueprint design system:

### Color Palette
- Background: `--bg-card`, `--bg-elevated`, `--bg-panel`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`
- Borders: `--border`, `--border-muted`
- Semantic: `--cyan`, `--green`, `--orange`, `--red`, `--purple`
- Dim variants: `--cyan-dim`, `--green-dim`, `--orange-dim`, `--red-dim`, `--purple-dim`

### Typography
- Font families: `--font-mono` (IBM Plex Mono), `--font-sans` (Inter)
- Font sizes: Use Tailwind classes with custom design system values
- Component-specific: `.text-card-title`, `.text-card-title-small`, etc.

### Spacing & Radius
- Border radius: `--radius` (6px)
- Consistent spacing using Tailwind spacing scale

## Accessibility Requirements

All components must meet WCAG 2.1 AA standards:

- Semantic HTML elements
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus states
- Color contrast ratios
- Screen reader compatibility

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering
- Props validation
- Slot content
- Event emissions
- Variant styling
- Accessibility attributes

### Coverage Targets
- 100% statement coverage
- 100% branch coverage
- All props tested
- All variants tested
- All slots tested

## Implementation Order

1. **Phase 1: Type Definitions**
   - Create `types.ts` with all interfaces and types

2. **Phase 2: Base Components**
   - CardBody.vue (simplest)
   - CardHeader.vue
   - Card.vue (composes Header + Body)

3. **Phase 3: Specialized Components**
   - MetricCard.vue
   - InfoBox.vue
   - Alert.vue
   - NoteBox.vue

4. **Phase 4: Testing**
   - Write comprehensive Vitest tests for each component
   - Ensure 100% coverage

5. **Phase 5: Documentation**
   - Create index.ts with exports
   - Update component documentation

## Dependencies

### Internal
- Existing design system CSS (`resources/app/css/app.css`)
- Phosphor Icons (`@phosphor-icons/vue`)
- TypeScript path aliases (`@app/`)

### External
- Vue 3 Composition API
- Vitest + @vue/test-utils
- Tailwind CSS v4

## Design Decisions

### 1. Component Composition vs Monolithic
**Decision**: Use composition pattern with separate CardHeader and CardBody components.

**Rationale**:
- Greater flexibility for consumers
- Easier to maintain and test
- Follows Vue.js best practices
- Allows custom content in header/body

### 2. Tailwind vs Scoped CSS
**Decision**: Prefer Tailwind utilities, use scoped CSS only when necessary.

**Rationale**:
- Consistency with existing codebase
- Smaller bundle size
- Better performance
- Easier maintenance

### 3. Props vs Slots
**Decision**: Use slots for content, props for configuration.

**Rationale**:
- Maximum flexibility
- Better TypeScript support
- Clearer component API
- Easier testing

### 4. Variant Naming
**Decision**: Use semantic variant names (success, warning, danger, info) instead of color names.

**Rationale**:
- Semantic meaning is clearer
- Easier to maintain if colors change
- Consistent with PrimeVue naming
- Better accessibility

## Success Criteria

- All 5 components implemented with full TypeScript support
- 100% test coverage
- Zero accessibility violations
- All components exported from index.ts
- Consistent with existing design system
- No console errors or warnings
- Proper documentation in code

## Timeline Estimate

- Phase 1 (Types): 30 minutes
- Phase 2 (Base Components): 2 hours
- Phase 3 (Specialized Components): 3 hours
- Phase 4 (Testing): 2 hours
- Phase 5 (Documentation): 30 minutes

**Total**: ~8 hours

## Next Steps

1. Review this overview with the team
2. Proceed to component API specifications
3. Implement Phase 1 (Type Definitions)
4. Begin Phase 2 (Base Components)
