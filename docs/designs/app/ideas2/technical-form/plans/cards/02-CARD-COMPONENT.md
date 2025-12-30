# Card Component - Implementation Specification

## Component: `Card.vue`

The Card component is a flexible container component that can display content with an optional header and body. It serves as the foundation for organizing related information.

## Component API

### Props

```typescript
interface CardProps {
  title?: string;           // Card title displayed in the header
  showHeader?: boolean;     // Whether to show the card header (default: true if title provided)
  class?: string;           // Additional CSS classes
}
```

### Slots

```typescript
{
  header?: () => VNode[];   // Custom header content (overrides title prop)
  default?: () => VNode[];  // Card body content
  body?: () => VNode[];     // Alias for default slot
  actions?: () => VNode[];  // Action buttons in header (right side)
}
```

### Events

None

## HTML Structure from Design

```html
<!-- Basic Card -->
<div class="card">
  <div class="card-header">
    <span class="card-title">//CARD_TITLE</span>
  </div>
  <div class="card-body">
    <p>Card body content goes here.</p>
  </div>
</div>

<!-- Card with Actions -->
<div class="card">
  <div class="card-header">
    <span class="card-title">//WITH_ACTIONS</span>
    <button>Add</button>
  </div>
  <div class="card-body">
    <p>Card content</p>
  </div>
</div>
```

## CSS Classes from Design

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elevated);
}

.card-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.card-body {
  padding: 18px;
}

.card-body.no-padding {
  padding: 0;
}
```

## Tailwind Implementation

Convert CSS classes to Tailwind utilities:

```typescript
// Card container
<div class="
  bg-card                    // background: var(--bg-card)
  border                     // border: 1px solid
  border-[var(--border)]     // border-color: var(--border)
  rounded-[var(--radius)]    // border-radius: var(--radius)
  overflow-hidden            // overflow: hidden
">

// Card header
<div class="
  flex                       // display: flex
  items-center               // align-items: center
  justify-between            // justify-content: space-between
  px-[18px] py-[14px]       // padding: 14px 18px
  border-b                   // border-bottom: 1px solid
  border-[var(--border)]     // border-bottom-color: var(--border)
  bg-elevated                // background: var(--bg-elevated)
">

// Card title
<span class="
  font-mono                  // font-family: var(--font-mono)
  text-sm                    // font-size: 12px
  font-semibold              // font-weight: 600
  tracking-wide              // letter-spacing: 0.5px
  text-[var(--text-primary)] // color: var(--text-primary)
">

// Card body
<div class="
  p-[18px]                   // padding: 18px
">

// Card body (no padding)
<div class="
  p-0                        // padding: 0
">
```

## Implementation

### File: `Card.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { CardProps } from './types';

const props = withDefaults(defineProps<CardProps>(), {
  showHeader: undefined,
});

/**
 * Determine if header should be shown
 * Show if title is provided OR showHeader is explicitly true
 */
const shouldShowHeader = computed(() => {
  if (props.showHeader !== undefined) {
    return props.showHeader;
  }
  return !!props.title;
});
</script>

<template>
  <div
    :class="[
      'bg-card border border-[var(--border)] rounded-[var(--radius)] overflow-hidden',
      props.class,
    ]"
  >
    <!-- Header Slot -->
    <div
      v-if="shouldShowHeader || $slots.header || $slots.actions"
      class="flex items-center justify-between px-[18px] py-[14px] border-b border-[var(--border)] bg-elevated"
    >
      <!-- Header Content -->
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

      <!-- Header Actions -->
      <div v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Body Slot -->
    <div class="p-[18px]">
      <slot name="body">
        <slot />
      </slot>
    </div>
  </div>
</template>
```

## Usage Examples

### Basic Card with Title

```vue
<Card title="//CARD_TITLE">
  <p class="text-body-small">
    Card body content goes here. Use for grouping related information.
  </p>
</Card>
```

### Card with Actions

```vue
<Card title="//WITH_ACTIONS">
  <template #actions>
    <Button label="Add" icon="PhPlus" size="sm" />
  </template>

  <p class="text-body-small">
    Cards can include header actions for quick access to common operations.
  </p>
</Card>
```

### Card with Custom Header

```vue
<Card>
  <template #header>
    <div class="flex items-center gap-3">
      <PhUser :size="16" class="text-cyan" />
      <span class="font-mono text-sm font-semibold">Custom Header</span>
    </div>
  </template>

  <p class="text-body-small">Custom header content</p>
</Card>
```

### Card without Header

```vue
<Card :show-header="false">
  <p class="text-body-small">
    This card has no header section.
  </p>
</Card>
```

### Card with Body Slot

```vue
<Card title="Data Table">
  <template #body>
    <CardBody no-padding>
      <DataTable :value="items" />
    </CardBody>
  </template>
</Card>
```

## Accessibility

### ARIA Attributes

```vue
<div
  role="region"
  :aria-label="title || 'Card'"
  class="..."
>
```

### Semantic HTML

- Use `<div>` with `role="region"` for card container
- Use `<span>` for title text
- Ensure proper heading hierarchy if title is important

### Keyboard Navigation

- Cards themselves are not interactive
- Ensure any buttons or links in actions slot are keyboard accessible
- Tab order flows naturally through header actions to body content

### Screen Reader Support

- Card title is announced when focused
- Content is readable in linear order
- Action buttons have proper labels

## Testing Specification

### File: `__tests__/Card.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from '@app/components/common/cards/Card.vue';
import Button from '@app/components/common/buttons/Button.vue';

describe('Card', () => {
  it('renders without props', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p>Test content</p>',
      },
    });
    expect(wrapper.html()).toContain('Test content');
  });

  it('renders title when provided', () => {
    const wrapper = mount(Card, {
      props: { title: '//CARD_TITLE' },
    });
    expect(wrapper.text()).toContain('//CARD_TITLE');
  });

  it('shows header when title is provided', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test Title' },
    });
    expect(wrapper.find('.bg-elevated').exists()).toBe(true);
  });

  it('hides header when showHeader is false', () => {
    const wrapper = mount(Card, {
      props: {
        title: 'Test Title',
        showHeader: false,
      },
    });
    expect(wrapper.find('.bg-elevated').exists()).toBe(false);
  });

  it('renders header slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<span class="custom-header">Custom</span>',
      },
    });
    expect(wrapper.find('.custom-header').exists()).toBe(true);
    expect(wrapper.text()).toContain('Custom');
  });

  it('renders actions slot content', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test' },
      slots: {
        actions: '<button>Action</button>',
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Action');
  });

  it('renders default slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p class="test-content">Body content</p>',
      },
    });
    expect(wrapper.find('.test-content').exists()).toBe(true);
  });

  it('renders body slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        body: '<div class="body-content">Custom body</div>',
      },
    });
    expect(wrapper.find('.body-content').exists()).toBe(true);
  });

  it('applies custom classes', () => {
    const wrapper = mount(Card, {
      props: { class: 'custom-class' },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('applies correct background and border styles', () => {
    const wrapper = mount(Card);
    const card = wrapper.find('[class*="bg-card"]');
    expect(card.exists()).toBe(true);
    expect(card.classes()).toContain('border');
  });

  it('header has correct layout classes', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test' },
    });
    const header = wrapper.find('.bg-elevated');
    expect(header.classes()).toContain('flex');
    expect(header.classes()).toContain('items-center');
    expect(header.classes()).toContain('justify-between');
  });

  it('title has correct typography classes', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test Title' },
    });
    const title = wrapper.find('.font-mono');
    expect(title.exists()).toBe(true);
    expect(title.classes()).toContain('font-semibold');
    expect(title.classes()).toContain('tracking-wide');
  });

  it('has accessible role', () => {
    const wrapper = mount(Card, {
      props: { title: 'Test Card' },
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
```

## Component Variants

### Standard Card

```vue
<Card title="Standard Card">
  <p>Standard card content</p>
</Card>
```

### Header-Only Card

```vue
<Card title="Header Only" />
```

### Body-Only Card

```vue
<Card :show-header="false">
  <p>No header, just body content</p>
</Card>
```

### Complex Card with Actions

```vue
<Card title="Complex Card">
  <template #actions>
    <ButtonGroup>
      <Button icon="PhPencil" variant="ghost" size="sm" />
      <Button icon="PhTrash" variant="ghost" size="sm" />
    </ButtonGroup>
  </template>

  <div class="space-y-4">
    <p>Complex card content with multiple sections</p>
    <div class="flex gap-2">
      <Button label="Save" variant="primary" />
      <Button label="Cancel" variant="ghost" />
    </div>
  </div>
</Card>
```

## Performance Considerations

1. **Slot Content**: Use v-if sparingly inside slots
2. **Computed Properties**: Minimal computations for header visibility
3. **CSS**: Use Tailwind utilities to avoid scoped CSS overhead
4. **Bundle Size**: No external dependencies beyond Vue core

## Migration Notes

If migrating from existing card implementations:

1. Replace custom card markup with `<Card>` component
2. Move title to `title` prop
3. Move actions to `#actions` slot
4. Body content goes in default slot
5. Test header visibility logic
6. Update tests to use new component API
