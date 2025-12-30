# Card Components - Implementation Plan

This directory contains the complete implementation plan for converting the Technical Blueprint HTML card components into Vue 3 components.

## 📁 Documentation Structure

### [00-OVERVIEW.md](./00-OVERVIEW.md)
**Start here!** Provides project summary, component list, directory structure, design decisions, and success criteria.

**Key sections:**
- Components to implement
- Directory structure
- CSS approach (Tailwind + minimal scoped CSS)
- Accessibility requirements
- Implementation timeline (~8 hours)

### [01-TYPES.md](./01-TYPES.md)
Complete TypeScript type definitions for all components.

**Includes:**
- All TypeScript interfaces
- Type guards
- CSS variable mappings
- Composable helpers
- Usage examples for each type

### Component Specifications

#### [02-CARD-COMPONENT.md](./02-CARD-COMPONENT.md)
Basic card container with optional header and body.

**Features:**
- Flexible header/body slots
- Action buttons in header
- Conditional header visibility
- TypeScript props and slots

#### [03-METRIC-CARD-COMPONENT.md](./03-METRIC-CARD-COMPONENT.md)
KPI display card with colored top accent bar.

**Features:**
- Top accent bar (5 color variants)
- Icon integration
- Metric value formatting
- Change indicator with direction (positive/negative/neutral)

#### [04-INFOBOX-COMPONENT.md](./04-INFOBOX-COMPONENT.md)
Informational note with left border accent.

**Features:**
- Left border accent (4 color variants)
- Static informational content
- HTML content support
- Semantic variant names

#### [05-ALERT-COMPONENT.md](./05-ALERT-COMPONENT.md)
Notification banner with icon.

**Features:**
- Default icons per variant
- Dismissible functionality
- ARIA live regions
- 4 semantic variants (success, warning, error, info)

#### [06-NOTEBOX-COMPONENT.md](./06-NOTEBOX-COMPONENT.md)
Documentation/usage notes box.

**Features:**
- Always cyan accent (technical documentation)
- Automatic code/list styling
- Deep selector content formatting
- Supports HTML, code blocks, lists

### Quality Assurance

#### [07-TESTING-STRATEGY.md](./07-TESTING-STRATEGY.md)
Comprehensive testing approach for all components.

**Covers:**
- Test structure and organization
- Component-specific test plans
- Accessibility testing
- Coverage goals (100%)
- Common pitfalls

#### [08-IMPLEMENTATION-GUIDE.md](./08-IMPLEMENTATION-GUIDE.md)
Step-by-step implementation instructions.

**Includes:**
- Implementation order (Phase 1-5)
- Step-by-step component creation
- Common development tasks
- Debugging tips
- Integration examples
- Quality assurance checklist

## 🚀 Quick Start

1. **Read [00-OVERVIEW.md](./00-OVERVIEW.md)** - Understand the project scope
2. **Review [01-TYPES.md](./01-TYPES.md)** - Understand the type system
3. **Follow [08-IMPLEMENTATION-GUIDE.md](./08-IMPLEMENTATION-GUIDE.md)** - Build the components
4. **Reference component specs** (02-06) - Detailed specifications for each component
5. **Test using [07-TESTING-STRATEGY.md](./07-TESTING-STRATEGY.md)** - Ensure quality

## 📦 Components to Build

| Component | Description | Priority |
|-----------|-------------|----------|
| **Card** | Basic content container | High |
| **MetricCard** | KPI display with accent bar | High |
| **InfoBox** | Informational notes | Medium |
| **Alert** | Dismissible notifications | High |
| **NoteBox** | Technical documentation | Low |

## 🎯 Implementation Order

```
Phase 1: Types (30 min)
└── Create types.ts

Phase 2: Base Components (2 hours)
├── CardBody.vue (optional separate component)
├── CardHeader.vue (optional separate component)
└── Card.vue

Phase 3: Specialized Components (3 hours)
├── MetricCard.vue
├── InfoBox.vue
├── Alert.vue
└── NoteBox.vue

Phase 4: Integration (2 hours)
├── Create index.ts
└── Integration testing

Phase 5: Quality (30 min)
├── Type checking
├── Linting
├── Test coverage
└── Documentation
```

## ✅ Success Criteria

- [ ] All 5 components implemented
- [ ] 100% test coverage for all components
- [ ] All TypeScript checks pass
- [ ] All linting checks pass
- [ ] All components accessible (WCAG 2.1 AA)
- [ ] No console errors or warnings
- [ ] index.ts exports all components
- [ ] Documentation complete

## 🛠️ Technology Stack

- **Vue 3** - Composition API with `<script setup lang="ts">`
- **TypeScript** - Strict mode enabled
- **Tailwind CSS v4** - Utility-first CSS
- **Phosphor Icons** - Icon library
- **Vitest** - Unit testing
- **@vue/test-utils** - Component testing

## 📐 Design System Integration

All components integrate with the Technical Blueprint design system:

### Colors
- `--cyan`, `--green`, `--orange`, `--red`, `--purple` - Semantic colors
- `--cyan-dim`, `--green-dim`, etc. - Dim variants (15% opacity)
- `--bg-card`, `--bg-elevated`, `--bg-panel` - Background colors
- `--text-primary`, `--text-secondary`, `--text-muted` - Text colors
- `--border`, `--border-muted` - Border colors

### Typography
- `--font-mono` - IBM Plex Mono (headings, labels, data)
- `--font-sans` - Inter (body text)
- Custom typography utilities (`.text-card-title`, etc.)

### Spacing & Layout
- `--radius` - 6px border radius
- Consistent padding/margin using Tailwind scale

## 📝 File Locations

```
resources/app/js/components/common/cards/
├── Card.vue
├── MetricCard.vue
├── InfoBox.vue
├── Alert.vue
├── NoteBox.vue
├── types.ts
├── index.ts
└── __tests__/
    ├── Card.test.ts
    ├── MetricCard.test.ts
    ├── InfoBox.test.ts
    ├── Alert.test.ts
    └── NoteBox.test.ts
```

## 🧪 Testing

```bash
# Run all card component tests
npm test -- cards

# Run specific component test
npm test -- Card.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

## 🔍 Quality Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint:fix

# Formatting
npm run format

# All quality checks
npm run type-check && npm run lint && npm run test:coverage
```

## 📚 Additional Resources

- [Technical Blueprint HTML](../../../cards.html) - Original design reference
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Phosphor Icons](https://phosphoricons.com/)
- [Vitest Documentation](https://vitest.dev/)

## 🤝 Contributing

When implementing these components:

1. Follow the implementation order in Phase 1-5
2. Maintain 100% test coverage
3. Follow TypeScript strict mode
4. Use Tailwind utilities (minimize scoped CSS)
5. Ensure accessibility (WCAG 2.1 AA)
6. Add JSDoc comments for props and methods
7. Format code with Prettier before committing

## ⚠️ Important Notes

- **DO NOT** skip testing - 100% coverage is required
- **DO NOT** use relative imports - use `@app/` path alias
- **DO NOT** add dependencies without approval
- **DO** follow existing component patterns
- **DO** test accessibility thoroughly
- **DO** run quality checks before committing

## 📞 Questions?

If you have questions during implementation:

1. Review the relevant specification document (02-06)
2. Check the implementation guide (08)
3. Look at existing components for patterns
4. Run diagnostic commands (type-check, lint, test)

## 🎉 Getting Started

Ready to begin? Start with:

```bash
# 1. Create types file
touch resources/app/js/components/common/cards/types.ts

# 2. Follow Phase 1 in 08-IMPLEMENTATION-GUIDE.md
# 3. Build components in order
# 4. Test thoroughly
# 5. Integrate and deploy
```

---

**Total Estimated Time**: ~8 hours
**Difficulty**: Medium
**Priority**: High

Good luck! 🚀
