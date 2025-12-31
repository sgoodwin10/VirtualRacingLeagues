# Badge System Migration - Index

> **Technical Blueprint Design System**
> **Target Folder**: `resources/app`

---

## Quick Links

### Main Documentation
- [**README.md**](./README.md) - Complete migration plan overview

### CSS Setup
- [**css-variables.md**](./css-variables.md) - Required CSS variables and setup

### Component Specifications
| # | Component | Location | Priority |
|---|-----------|----------|----------|
| 1 | [BaseBadge](./01-BaseBadge.md) | `components/common/indicators/BaseBadge.vue` | Foundation |
| 2 | [StatusIndicator](./02-StatusIndicator.md) | `components/common/indicators/StatusIndicator.vue` | Foundation |
| 3 | [CountIndicator](./03-CountIndicator.md) | `components/common/indicators/CountIndicator.vue` | Foundation |
| 4 | [TagIndicator](./04-TagIndicator.md) | `components/common/indicators/TagIndicator.vue` | Foundation |
| 5 | [PositionIndicator](./05-PositionIndicator.md) | `components/common/indicators/PositionIndicator.vue` | Specialized |
| 6 | [TeamIndicator](./06-TeamIndicator.md) | `components/common/indicators/TeamIndicator.vue` | Specialized |
| 7 | [VersionIndicator](./07-VersionIndicator.md) | `components/common/indicators/VersionIndicator.vue` | Specialized |

### Migration Guides
| # | Components | Priority |
|---|------------|----------|
| 1 | [Driver Components](./migrations/01-driver-components.md) | High |
| 2 | [Season & Competition](./migrations/02-season-competition-components.md) | Medium |
| 3 | [League Components](./migrations/03-league-components.md) | Medium |
| 4 | [Result Components](./migrations/04-result-components.md) | Medium |
| 5 | [Table Cell Components](./migrations/05-table-components.md) | High |
| 6 | [Accordion Components](./migrations/06-accordion-components.md) | Low |

---

## Implementation Order

### Phase 0: Prerequisites
```
1. [ ] Set up CSS variables (css-variables.md)
2. [ ] Add IBM Plex Mono font
3. [ ] Create indicators folder structure
```

### Phase 1: Core Components (Foundation)
```
1. [ ] BaseBadge.vue
2. [ ] StatusIndicator.vue
3. [ ] CountIndicator.vue
4. [ ] TagIndicator.vue
5. [ ] index.ts (barrel export)
```

### Phase 2: Specialized Components
```
6. [ ] PositionIndicator.vue
7. [ ] TeamIndicator.vue
8. [ ] VersionIndicator.vue
```

### Phase 3: Migration - High Priority
```
8. [ ] Update StatusCell.vue
9. [ ] Update TeamCell.vue
10. [ ] Update DriverStatusBadge.vue
```

### Phase 4: Migration - Medium Priority
```
11. [ ] Update LeagueVisibilityTag.vue
12. [ ] Update SeasonCard.vue
13. [ ] Update CompetitionCard.vue
14. [ ] Update CompetitionHeader.vue
15. [ ] Update ViewDriverModal.vue
```

### Phase 5: Migration - Lower Priority
```
16. [ ] Update RaceEventResultsSection.vue
17. [ ] Update ResultEntryTable.vue
18. [ ] Update CrossDivisionResultsSection.vue
```

### Phase 6: Alignment
```
19. [ ] Align AccordionBadge.vue
20. [ ] Align AccordionStatusIndicator.vue
```

### Phase 7: Cleanup
```
21. [ ] Add deprecation warnings to old components
22. [ ] Update all imports
23. [ ] Run tests
24. [ ] Visual regression testing
```

---

## Folder Structure After Migration

```
resources/app/js/components/common/indicators/
├── BaseBadge.vue
├── StatusIndicator.vue
├── CountIndicator.vue
├── TagIndicator.vue
├── PositionIndicator.vue
├── TeamIndicator.vue
├── VersionIndicator.vue
├── index.ts
└── __tests__/
    ├── BaseBadge.test.ts
    ├── StatusIndicator.test.ts
    ├── CountIndicator.test.ts
    ├── TagIndicator.test.ts
    ├── PositionIndicator.test.ts
    ├── TeamIndicator.test.ts
    └── VersionIndicator.test.ts
```

---

## Component Mapping Reference

| Use Case | Component | Variant/Status |
|----------|-----------|----------------|
| Driver status (active/inactive/banned) | `StatusIndicator` | active/inactive/error |
| Season status (active/completed/archived/setup) | `StatusIndicator` | active/success/inactive/pending |
| League visibility (public/private/unlisted) | `StatusIndicator` | active/warning/inactive |
| Competition archived | `StatusIndicator` | inactive |
| Platform name | `BaseBadge` | cyan |
| Car class | `BaseBadge` | purple |
| Division name | `BaseBadge` | varies |
| Pole position (P) | `TagIndicator` | purple |
| Fastest lap (FL) | `TagIndicator` | purple |
| DNF status | `StatusIndicator` | error |
| Racing position (1st, 2nd, 3rd) | `PositionIndicator` | - |
| Team name with color | `TeamIndicator` | - |
| Navigation count | `CountIndicator` | cyan |
| Alert count | `CountIndicator` | orange/red |
| Version number | `VersionIndicator` | success |

---

## Testing Commands

```bash
# Run all indicator tests
npm run test:app -- --testPathPattern="indicators"

# Run specific component test
npm run test:app -- BaseBadge.test.ts

# Run with coverage
npm run test:app -- --coverage --testPathPattern="indicators"

# Watch mode during development
npm run test:app -- --watch --testPathPattern="indicators"
```

---

## Estimated Effort

| Phase | Components/Files | Estimated Time |
|-------|-----------------|----------------|
| Phase 0 | CSS setup | 1-2 hours |
| Phase 1 | 4 core components | 4-6 hours |
| Phase 2 | 3 specialized components | 3-4 hours |
| Phase 3 | 3 high-priority migrations | 2-3 hours |
| Phase 4 | 5 medium-priority migrations | 3-4 hours |
| Phase 5 | 3 lower-priority migrations | 2-3 hours |
| Phase 6 | 2 alignments | 1-2 hours |
| Phase 7 | Cleanup & testing | 2-4 hours |
| **Total** | ~20 components/files | **18-28 hours** |

---

## Success Criteria

- [ ] All 7 indicator components created and tested
- [ ] All existing badge/tag usages migrated
- [ ] No PrimeVue Tag/Chip for badge purposes
- [ ] CSS variables in place and working
- [ ] Visual consistency across all indicators
- [ ] All tests passing with 80%+ coverage
- [ ] No visual regressions
- [ ] Documentation complete
