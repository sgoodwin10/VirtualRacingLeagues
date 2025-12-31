# Card Components - Implementation Guide

## Implementation Order

Follow this order to ensure dependencies are met and to build from simple to complex:

### Phase 1: Foundation (30 minutes)

1. **Create types.ts** ✓
   - Define all TypeScript interfaces
   - Export type guards and helpers
   - Add JSDoc comments

2. **Create directory structure**
   ```bash
   mkdir -p resources/app/js/components/common/cards/__tests__
   ```

### Phase 2: Base Components (2 hours)

3. **CardBody.vue** (simplest component)
   - Basic container with optional no-padding variant
   - Write tests
   - Verify 100% coverage

4. **CardHeader.vue** (simple header component)
   - Title and actions slots
   - Write tests
   - Verify 100% coverage

5. **Card.vue** (composes Header + Body)
   - Header visibility logic
   - Slot composition
   - Write tests
   - Verify 100% coverage

### Phase 3: Specialized Components (3 hours)

6. **MetricCard.vue**
   - Top accent bar styling
   - Icon integration
   - Change direction logic
   - Number formatting
   - Write tests
   - Verify 100% coverage

7. **InfoBox.vue**
   - Left border accent
   - Variant styling
   - Write tests
   - Verify 100% coverage

8. **Alert.vue**
   - Default icons per variant
   - Dismissible functionality
   - ARIA live regions
   - Write tests
   - Verify 100% coverage

9. **NoteBox.vue**
   - Deep selector styling for content
   - Code/list formatting
   - Write tests
   - Verify 100% coverage

### Phase 4: Integration (2 hours)

10. **Create index.ts**
    - Export all components
    - Export types
    - Add JSDoc comments

11. **Integration testing**
    - Test component composition
    - Test in real application views
    - Verify no console errors

### Phase 5: Documentation & Quality (30 minutes)

12. **Final quality checks**
    - Run `npm run type-check`
    - Run `npm run lint:fix`
    - Run `npm run test:coverage`
    - Run `npm run format`

13. **Update documentation**
    - Add usage examples
    - Update component library docs

## Step-by-Step: Creating Card.vue

This example shows the complete process for one component.

### Step 1: Create the Component File

```bash
touch resources/app/js/components/common/cards/Card.vue
```

### Step 2: Add Script Setup

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { CardProps } from './types';

const props = withDefaults(defineProps<CardProps>(), {
  showHeader: undefined,
});

const shouldShowHeader = computed(() => {
  if (props.showHeader !== undefined) {
    return props.showHeader;
  }
  return !!props.title;
});
</script>
```

### Step 3: Add Template

```vue
<template>
  <div
    :class="[
      'bg-card border border-[var(--border)] rounded-[var(--radius)] overflow-hidden',
      props.class,
    ]"
    role="region"
    :aria-label="title || 'Card'"
  >
    <div
      v-if="shouldShowHeader || $slots.header || $slots.actions"
      class="flex items-center justify-between px-[18px] py-[14px] border-b border-[var(--border)] bg-elevated"
    >
      <div>
        <slot name="header">
          <span
            v-if="title"
            class="font-mono text-sm font-semibold tracking-wide text-[var(--text-primary)]"
          >
            {{ title }}
          </span>
        </slot>
      </div>

      <div v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>

    <div class="p-[18px]">
      <slot name="body">
        <slot />
      </slot>
    </div>
  </div>
</template>
```

### Step 4: Add Scoped Styles (if needed)

```vue
<style scoped>
/* Card.vue uses only Tailwind utilities - no scoped CSS needed */
</style>
```

### Step 5: Create Test File

```bash
touch resources/app/js/components/common/cards/__tests__/Card.test.ts
```

### Step 6: Write Tests

See `07-TESTING-STRATEGY.md` for complete test examples.

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from '@app/components/common/cards/Card.vue';

describe('Card', () => {
  it('renders with default slot', () => {
    const wrapper = mount(Card, {
      slots: { default: '<p>Test</p>' },
    });
    expect(wrapper.text()).toContain('Test');
  });

  // ... more tests
});
```

### Step 7: Run Tests

```bash
npm test -- Card.test.ts
```

### Step 8: Check Coverage

```bash
npm run test:coverage -- Card.test.ts
```

Ensure 100% coverage before proceeding.

### Step 9: Type Check

```bash
npm run type-check
```

Fix any TypeScript errors.

### Step 10: Lint and Format

```bash
npm run lint:fix
npm run format
```

## Common Development Tasks

### Adding a New Prop

1. **Update types.ts**
   ```typescript
   export interface CardProps {
     // ... existing props
     newProp?: string;  // Add new prop with JSDoc
   }
   ```

2. **Update component**
   ```vue
   <script setup lang="ts">
   const props = withDefaults(defineProps<CardProps>(), {
     // ... existing defaults
     newProp: 'default value',
   });
   </script>
   ```

3. **Add tests**
   ```typescript
   it('applies new prop correctly', () => {
     const wrapper = mount(Card, {
       props: { newProp: 'test value' },
     });
     // Assert expected behavior
   });
   ```

### Adding a New Slot

1. **Update component template**
   ```vue
   <slot name="newSlot">
     <!-- Default content -->
   </slot>
   ```

2. **Update types.ts** (for documentation)
   ```typescript
   /**
    * Slots for Card component
    */
   interface CardSlots {
     newSlot?: () => VNode[];
   }
   ```

3. **Add tests**
   ```typescript
   it('renders newSlot content', () => {
     const wrapper = mount(Card, {
       slots: { newSlot: '<div class="test">Content</div>' },
     });
     expect(wrapper.find('.test').exists()).toBe(true);
   });
   ```

### Adding a New Variant

1. **Update types.ts**
   ```typescript
   export type CardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'newVariant';
   ```

2. **Add variant styles**
   ```vue
   <style scoped>
   .card--newVariant {
     /* Variant-specific styles */
   }
   </style>
   ```

3. **Add tests**
   ```typescript
   it('applies newVariant class', () => {
     const wrapper = mount(Card, {
       props: { variant: 'newVariant' },
     });
     expect(wrapper.find('.card--newVariant').exists()).toBe(true);
   });
   ```

## Debugging Tips

### Component Not Rendering

1. **Check imports**
   ```typescript
   // Correct
   import Card from '@app/components/common/cards/Card.vue';

   // Incorrect
   import Card from './Card.vue';  // Use path alias
   ```

2. **Check props**
   ```vue
   <!-- Ensure required props are provided -->
   <Card title="Required Title">
   ```

3. **Check console for errors**
   ```bash
   npm run dev
   # Open browser console
   ```

### Tests Failing

1. **Check test isolation**
   ```typescript
   // Each test should be independent
   it('test 1', () => {
     const wrapper = mount(Card, { ... });
     // Don't reuse wrapper in other tests
   });
   ```

2. **Check async operations**
   ```typescript
   // Use await for async operations
   await wrapper.find('button').trigger('click');
   expect(wrapper.emitted('event')).toBeTruthy();
   ```

3. **Check slot syntax**
   ```typescript
   // Correct
   slots: { default: '<p>Test</p>' }

   // Incorrect
   slots: { default: 'Test' }  // Must be HTML string
   ```

### TypeScript Errors

1. **Check type imports**
   ```typescript
   // Import types with 'type' keyword
   import type { CardProps } from './types';
   ```

2. **Check prop types**
   ```typescript
   // Use withDefaults for optional props
   const props = withDefaults(defineProps<CardProps>(), {
     variant: 'default',
   });
   ```

3. **Run type check**
   ```bash
   npm run type-check
   ```

## Integration Examples

### Using Cards in a View

```vue
<script setup lang="ts">
import { Card, MetricCard, InfoBox, Alert } from '@app/components/common/cards';
import { PhUser, PhUsers, PhClock } from '@phosphor-icons/vue';
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Metrics Row -->
    <div class="grid grid-cols-3 gap-5">
      <MetricCard
        label="Drivers"
        :value="20"
        change="+2 active"
        change-direction="positive"
        :icon="PhUser"
        variant="default"
      />

      <MetricCard
        label="Teams"
        :value="10"
        change="Full grid"
        :icon="PhUsers"
        variant="green"
      />

      <MetricCard
        label="Races"
        value="14/22"
        change="63.6% complete"
        :icon="PhClock"
        variant="orange"
      />
    </div>

    <!-- Content Card -->
    <Card title="Season Overview">
      <template #actions>
        <Button label="Edit" icon="PhPencil" variant="ghost" size="sm" />
      </template>

      <p class="text-body-small">
        Season 2024 is currently active with 20 drivers across 10 teams.
      </p>
    </Card>

    <!-- Info Box -->
    <InfoBox
      title="INFORMATION"
      message="Standings are calculated automatically after each race."
      variant="info"
    />

    <!-- Alert -->
    <Alert
      title="Success"
      message="Season settings have been updated."
      variant="success"
      dismissible
      @dismiss="handleDismiss"
    />
  </div>
</template>
```

### Using Cards in Tests

```typescript
import { mount } from '@vue/test-utils';
import SeasonView from '@app/views/SeasonView.vue';
import { Card, MetricCard } from '@app/components/common/cards';

describe('SeasonView', () => {
  it('displays season metrics', () => {
    const wrapper = mount(SeasonView, {
      props: { seasonId: 1 },
    });

    const metricCards = wrapper.findAllComponents(MetricCard);
    expect(metricCards.length).toBe(3);
  });

  it('displays season info card', () => {
    const wrapper = mount(SeasonView, {
      props: { seasonId: 1 },
    });

    const card = wrapper.findComponent(Card);
    expect(card.props('title')).toBe('Season Overview');
  });
});
```

## Quality Assurance Checklist

Before marking a component as complete:

- [ ] Component renders correctly
- [ ] All props work as expected
- [ ] All slots work as expected
- [ ] All events work as expected
- [ ] All variants tested
- [ ] 100% test coverage
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Code formatted with Prettier
- [ ] Accessible (ARIA, keyboard, screen reader)
- [ ] No console errors in browser
- [ ] Documented in index.ts
- [ ] Usage examples added

## Getting Help

If you encounter issues:

1. **Check this documentation** first
2. **Review component specifications** in individual component docs
3. **Check existing components** for reference patterns
4. **Run diagnostics**:
   ```bash
   npm run type-check
   npm run lint
   npm test -- --coverage
   ```

## Next Steps After Implementation

1. **Update component library documentation**
2. **Add Storybook stories** (if using Storybook)
3. **Migrate existing code** to use new components
4. **Create usage examples** in the UI
5. **Gather feedback** from team

## Maintenance

### Regular Maintenance Tasks

1. **Update dependencies**
   ```bash
   npm update
   ```

2. **Run full test suite**
   ```bash
   npm test
   ```

3. **Check for deprecations**
   ```bash
   npm run lint
   ```

4. **Review accessibility**
   - Test with screen reader
   - Test keyboard navigation
   - Check color contrast

### When to Refactor

Consider refactoring when:
- Adding the same feature to multiple components
- Tests become difficult to maintain
- Component complexity exceeds 300 lines
- Performance issues arise
- Accessibility issues are identified

## Success Criteria

Implementation is complete when:

✅ All 5 components implemented
✅ All components have 100% test coverage
✅ All components pass TypeScript checks
✅ All components pass linting
✅ All components are accessible
✅ index.ts exports all components
✅ Documentation is complete
✅ No console errors or warnings
✅ Team has reviewed and approved

## Timeline

- **Phase 1** (Types): 30 minutes
- **Phase 2** (Base Components): 2 hours
- **Phase 3** (Specialized Components): 3 hours
- **Phase 4** (Integration): 2 hours
- **Phase 5** (Documentation): 30 minutes

**Total**: ~8 hours

Good luck! 🚀
