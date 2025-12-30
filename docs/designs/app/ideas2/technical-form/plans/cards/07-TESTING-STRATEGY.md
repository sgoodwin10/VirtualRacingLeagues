# Card Components - Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for all card components. Each component must achieve 100% test coverage with a focus on behavior over implementation.

## Testing Tools

- **Vitest**: Unit testing framework
- **@vue/test-utils**: Vue component testing utilities
- **@phosphor-icons/vue**: Icon components for testing

## Test Structure

All test files follow this structure:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ComponentName from '@app/components/common/cards/ComponentName.vue';

describe('ComponentName', () => {
  // Helper function for mounting with common config
  const mountComponent = (props = {}, slots = {}) => {
    return mount(ComponentName, {
      props,
      slots,
    });
  };

  // Test cases organized by functionality
  describe('Rendering', () => { ... });
  describe('Props', () => { ... });
  describe('Slots', () => { ... });
  describe('Events', () => { ... });
  describe('Accessibility', () => { ... });
  describe('Variants', () => { ... });
});
```

## Testing Checklist

### For Every Component

- [ ] Renders with required props
- [ ] Renders without optional props
- [ ] Applies custom classes
- [ ] Has correct layout classes
- [ ] Has correct typography classes
- [ ] Has accessible ARIA attributes
- [ ] Has semantic HTML roles

### For Components with Variants

- [ ] Applies default variant correctly
- [ ] Tests all variant classes
- [ ] Tests variant-specific styling
- [ ] Tests variant-specific behavior

### For Components with Slots

- [ ] Renders each slot content
- [ ] Slot content overrides props
- [ ] Multiple slots work together
- [ ] Empty slots don't break rendering

### For Components with Events

- [ ] Events are emitted correctly
- [ ] Events include correct payload
- [ ] Events respect disabled state
- [ ] Event handlers are called once

### For Components with Icons

- [ ] Default icons render correctly
- [ ] Custom icons override defaults
- [ ] Icons have correct size
- [ ] Icons are hidden from screen readers

## Component-Specific Test Plans

### Card Component

**Critical paths:**
1. Basic rendering (title + content)
2. Header visibility logic
3. Slot composition (header + body + actions)
4. No-header variant

**Test cases:**
```typescript
- renders without props
- renders title when provided
- shows header when title is provided
- hides header when showHeader is false
- renders header slot content
- renders actions slot content
- renders default slot content
- renders body slot content
- applies custom classes
- has accessible role and aria-label
```

**Edge cases:**
- Header shown with actions but no title
- Both title prop and header slot provided (slot wins)
- Both default and body slots provided (body wins)

### MetricCard Component

**Critical paths:**
1. Basic metric display (label + value)
2. Icon rendering (default + custom)
3. Change indicator with direction
4. Variant styling

**Test cases:**
```typescript
- renders with required props (label, value)
- renders icon when provided
- renders change indicator when provided
- shows positive change icon
- shows negative change icon
- applies all variant classes correctly
- formats numeric values with locale
- displays string values as-is
- applies custom classes
- has accessible role and label
- hides icons from screen readers
- renders all slots correctly
```

**Edge cases:**
- Large numbers (1,000,000+)
- String values with special characters (14/22, ±2)
- Change without direction (neutral)
- Value = 0

### InfoBox Component

**Critical paths:**
1. Basic rendering (title + message)
2. Variant styling (border + title color)
3. Custom content in slot

**Test cases:**
```typescript
- renders with required props
- renders without message prop
- applies info variant by default
- applies all variant classes correctly
- renders title slot content
- renders default slot content
- applies custom classes
- has accessible role and aria-label
- has correct typography classes
- has correct layout classes
```

**Edge cases:**
- Very long title
- Very long message
- HTML content in slot (lists, code, etc.)

### Alert Component

**Critical paths:**
1. Basic rendering (title + message)
2. Default icon per variant
3. Dismissible functionality
4. ARIA live regions

**Test cases:**
```typescript
- renders with required props
- applies info variant by default
- applies all variant classes correctly
- shows correct default icon for each variant
- renders custom icon when provided
- shows dismiss button when dismissible
- hides dismiss button when not dismissible
- emits dismiss event when dismiss button clicked
- renders all slots correctly
- applies custom classes
- has accessible role
- has aria-live="polite" for non-error variants
- has aria-live="assertive" for error variant
- dismiss button has accessible label
- icons are hidden from screen readers
```

**Edge cases:**
- Multiple alerts stacked
- Alert dismissed while animating
- Custom icon with dismissible
- Very long title or message

### NoteBox Component

**Critical paths:**
1. Basic rendering (title + content)
2. HTML content styling (code, lists, etc.)
3. Custom title slot

**Test cases:**
```typescript
- renders with required props
- renders title correctly
- renders default slot content
- renders title slot content
- applies custom classes
- has accessible role and aria-label
- renders HTML content (code, strong, etc.)
- renders lists in content
- renders pre/code blocks
- has correct layout classes
- has correct title typography
- styles inline code elements
- applies cyan accent color to title
```

**Edge cases:**
- Deeply nested HTML
- Mixed content (text + code + lists)
- Empty content
- Very long code blocks

## Accessibility Testing

### ARIA Attributes

Each component must test:

```typescript
it('has accessible role', () => {
  const wrapper = mount(Component, { props: { ...requiredProps } });
  expect(wrapper.attributes('role')).toBe('expectedRole');
});

it('has aria-label', () => {
  const wrapper = mount(Component, { props: { ...requiredProps } });
  expect(wrapper.attributes('aria-label')).toBeTruthy();
});
```

### Icon Accessibility

Icons must be hidden from screen readers:

```typescript
it('hides decorative icons from screen readers', () => {
  const wrapper = mount(Component, {
    props: { icon: PhIcon }
  });
  const icon = wrapper.findComponent(PhIcon);
  expect(icon.attributes('aria-hidden')).toBe('true');
});
```

### Live Regions (Alerts)

```typescript
it('has appropriate aria-live value', () => {
  const wrapper = mount(Alert, {
    props: { title: 'Test', message: 'Test', variant: 'error' }
  });
  expect(wrapper.attributes('aria-live')).toBe('assertive');
});
```

## Snapshot Testing

**NOT RECOMMENDED** for these components because:
- Layout changes frequently during development
- Snapshots are brittle and hard to maintain
- Behavior testing is more valuable
- CSS classes may change with Tailwind updates

Instead, focus on **behavioral assertions**:
```typescript
// Good
expect(wrapper.find('.card-title').exists()).toBe(true);
expect(wrapper.text()).toContain('Expected Text');

// Avoid
expect(wrapper.html()).toMatchSnapshot();
```

## Coverage Goals

### Statement Coverage: 100%

Every line of code must be executed during tests.

### Branch Coverage: 100%

Every conditional branch must be tested:

```typescript
// Component code
const shouldShow = computed(() => {
  if (props.showHeader !== undefined) {
    return props.showHeader;
  }
  return !!props.title;
});

// Tests must cover:
it('shows header when showHeader is true', () => { ... });
it('hides header when showHeader is false', () => { ... });
it('shows header when title provided and showHeader undefined', () => { ... });
it('hides header when no title and showHeader undefined', () => { ... });
```

### Function Coverage: 100%

Every function must be called:

```typescript
// Component code
function handleDismiss(): void {
  emit('dismiss');
}

// Test must call function
it('emits dismiss event when button clicked', async () => {
  await wrapper.find('button').trigger('click');
  expect(wrapper.emitted('dismiss')).toBeTruthy();
});
```

## Running Tests

```bash
# Run all card component tests
npm test -- cards

# Run specific component test
npm test -- Card.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm test -- --watch

# Run in UI mode
npm run test:ui
```

## Test Organization

```
resources/app/js/components/common/cards/
├── __tests__/
│   ├── Card.test.ts
│   ├── CardHeader.test.ts        # If CardHeader is separate
│   ├── CardBody.test.ts          # If CardBody is separate
│   ├── MetricCard.test.ts
│   ├── InfoBox.test.ts
│   ├── Alert.test.ts
│   └── NoteBox.test.ts
├── Card.vue
├── MetricCard.vue
├── InfoBox.vue
├── Alert.vue
├── NoteBox.vue
├── types.ts
└── index.ts
```

## Mocking Guidelines

### When to Mock

1. **External dependencies**: API calls, router, etc. (NOT applicable to these components)
2. **Heavy computations**: (NOT applicable - these are simple display components)
3. **Third-party libraries**: (NOT applicable - we use Vue and Phosphor Icons directly)

### When NOT to Mock

1. **Vue components**: Test real component behavior
2. **Props/slots**: Use actual values
3. **Icons**: Use real Phosphor icon components
4. **CSS classes**: Test actual classes applied

## Example: Complete Test File

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from '@app/components/common/cards/Card.vue';

describe('Card', () => {
  describe('Rendering', () => {
    it('renders with default slot', () => {
      const wrapper = mount(Card, {
        slots: { default: '<p>Test content</p>' },
      });
      expect(wrapper.text()).toContain('Test content');
    });

    it('renders with title prop', () => {
      const wrapper = mount(Card, {
        props: { title: 'Test Title' },
      });
      expect(wrapper.text()).toContain('Test Title');
    });
  });

  describe('Props', () => {
    it('shows header when title is provided', () => {
      const wrapper = mount(Card, {
        props: { title: 'Test' },
      });
      expect(wrapper.find('.bg-elevated').exists()).toBe(true);
    });

    it('hides header when showHeader is false', () => {
      const wrapper = mount(Card, {
        props: { title: 'Test', showHeader: false },
      });
      expect(wrapper.find('.bg-elevated').exists()).toBe(false);
    });

    it('applies custom classes', () => {
      const wrapper = mount(Card, {
        props: { class: 'custom-class' },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });
  });

  describe('Slots', () => {
    it('renders header slot', () => {
      const wrapper = mount(Card, {
        slots: { header: '<span class="custom">Custom</span>' },
      });
      expect(wrapper.find('.custom').exists()).toBe(true);
    });

    it('renders actions slot', () => {
      const wrapper = mount(Card, {
        props: { title: 'Test' },
        slots: { actions: '<button>Action</button>' },
      });
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('renders body slot', () => {
      const wrapper = mount(Card, {
        slots: { body: '<div class="body">Body</div>' },
      });
      expect(wrapper.find('.body').exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has accessible role', () => {
      const wrapper = mount(Card, {
        props: { title: 'Test' },
      });
      expect(wrapper.attributes('role')).toBe('region');
    });

    it('has aria-label from title', () => {
      const wrapper = mount(Card, {
        props: { title: 'Test Card' },
      });
      expect(wrapper.attributes('aria-label')).toBe('Test Card');
    });

    it('has default aria-label when no title', () => {
      const wrapper = mount(Card);
      expect(wrapper.attributes('aria-label')).toBe('Card');
    });
  });

  describe('Styling', () => {
    it('has correct container classes', () => {
      const wrapper = mount(Card);
      expect(wrapper.find('.bg-card').exists()).toBe(true);
      expect(wrapper.find('.border').exists()).toBe(true);
    });

    it('header has correct layout classes', () => {
      const wrapper = mount(Card, {
        props: { title: 'Test' },
      });
      const header = wrapper.find('.bg-elevated');
      expect(header.classes()).toContain('flex');
      expect(header.classes()).toContain('items-center');
    });
  });
});
```

## Continuous Integration

Tests must pass in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Frontend Tests
  run: npm test

- name: Check Coverage
  run: npm run test:coverage
  env:
    COVERAGE_THRESHOLD: 100
```

## Test Maintenance

1. **Update tests when components change**: Keep tests in sync with implementation
2. **Refactor tests with components**: Don't let tests become brittle
3. **Review test failures**: Understand why tests fail before fixing them
4. **Add tests for bugs**: Every bug fix should include a regression test

## Common Pitfalls

### 1. Testing Implementation Details

```typescript
// Bad: Testing internal computed property
expect(wrapper.vm.shouldShowHeader).toBe(true);

// Good: Testing visible behavior
expect(wrapper.find('.card-header').exists()).toBe(true);
```

### 2. Not Testing All Variants

```typescript
// Bad: Only testing one variant
it('applies success variant', () => { ... });

// Good: Testing all variants
it('applies all variant classes correctly', () => {
  const variants = ['success', 'warning', 'error', 'info'];
  variants.forEach(variant => { ... });
});
```

### 3. Incomplete Accessibility Tests

```typescript
// Bad: Only testing role
expect(wrapper.attributes('role')).toBe('alert');

// Good: Testing role, aria-live, and aria-label
expect(wrapper.attributes('role')).toBe('alert');
expect(wrapper.attributes('aria-live')).toBe('polite');
expect(wrapper.attributes('aria-label')).toBeTruthy();
```

## Summary

- **100% coverage required** for all components
- **Focus on behavior**, not implementation
- **Test accessibility** thoroughly
- **Test all variants and edge cases**
- **Keep tests maintainable** and readable
- **Run tests before committing**
