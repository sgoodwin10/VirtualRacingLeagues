# InfoBox Component - Implementation Specification

## Component: `InfoBox.vue`

The InfoBox component displays informational messages with a left border accent. It's designed for static notes, warnings, and informational content that needs visual emphasis.

## Component API

### Props

```typescript
interface InfoBoxProps {
  title: string;                    // Info box title (e.g., "INFORMATION", "WARNING")
  message?: string;                 // Info box message/text content
  variant?: InfoBoxVariant;         // Visual variant: 'info' | 'success' | 'warning' | 'danger'
  class?: string;                   // Additional CSS classes
}
```

### Slots

```typescript
{
  title?: () => VNode[];      // Custom title content
  default?: () => VNode[];    // Custom message content (overrides message prop)
}
```

### Events

None (info boxes are display-only)

## HTML Structure from Design

```html
<!-- Info Variant -->
<div class="info-box">
  <div class="info-box-title">INFORMATION</div>
  <p class="info-box-text">This is an informational note with a cyan accent for general information.</p>
</div>

<!-- Success Variant -->
<div class="info-box success">
  <div class="info-box-title">SUCCESS</div>
  <p class="info-box-text">Operation completed successfully. All data has been saved.</p>
</div>

<!-- Warning Variant -->
<div class="info-box warning">
  <div class="info-box-title">WARNING</div>
  <p class="info-box-text">This action cannot be undone. Please review before proceeding.</p>
</div>

<!-- Danger Variant -->
<div class="info-box danger">
  <div class="info-box-title">DANGER</div>
  <p class="info-box-text">Critical error detected. Immediate attention required.</p>
</div>
```

## CSS Classes from Design

```css
.info-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--cyan);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 16px 20px;
}

.info-box.success { border-left-color: var(--green); }
.info-box.warning { border-left-color: var(--orange); }
.info-box.danger { border-left-color: var(--red); }

.info-box-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--cyan);
  margin-bottom: 8px;
}

.info-box.success .info-box-title { color: var(--green); }
.info-box.warning .info-box-title { color: var(--orange); }
.info-box.danger .info-box-title { color: var(--red); }

.info-box-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
```

## Tailwind Implementation

Most styles use Tailwind except variant-specific border and title colors (scoped CSS):

```typescript
// Container
<div class="
  info-box                      // Custom class for variant-specific styles
  info-box--{variant}           // Variant class
  bg-card                       // background: var(--bg-card)
  border                        // border: 1px solid
  border-[var(--border)]        // border-color: var(--border)
  rounded-r-[var(--radius)]     // border-radius: 0 var(--radius) var(--radius) 0
  px-5 py-4                     // padding: 16px 20px
">

// Title
<div class="
  info-box-title                // Custom class for variant-specific color
  info-box-title--{variant}     // Variant class for color
  font-mono                     // font-family: var(--font-mono)
  text-[11px]                   // font-size: 11px
  font-semibold                 // font-weight: 600
  tracking-wide                 // letter-spacing: 0.5px
  mb-2                          // margin-bottom: 8px
">

// Text
<p class="
  text-md                       // font-size: 13px
  text-[var(--text-secondary)]  // color: var(--text-secondary)
  leading-relaxed               // line-height: 1.6
">
```

## Implementation

### File: `InfoBox.vue`

```vue
<script setup lang="ts">
import type { InfoBoxProps } from './types';

const props = withDefaults(defineProps<InfoBoxProps>(), {
  variant: 'info',
});
</script>

<template>
  <div
    :class="[
      'info-box',
      `info-box--${variant}`,
      'bg-card border border-[var(--border)] rounded-r-[var(--radius)] px-5 py-4',
      props.class,
    ]"
    role="note"
    :aria-label="title"
  >
    <!-- Title -->
    <slot name="title">
      <div
        :class="[
          'info-box-title',
          `info-box-title--${variant}`,
          'font-mono text-[11px] font-semibold tracking-wide mb-2',
        ]"
      >
        {{ title }}
      </div>
    </slot>

    <!-- Message -->
    <slot>
      <p
        v-if="message"
        class="text-md text-[var(--text-secondary)] leading-relaxed"
      >
        {{ message }}
      </p>
    </slot>
  </div>
</template>

<style scoped>
/* Left border accent by variant */
.info-box--info {
  border-left: 3px solid var(--cyan);
}
.info-box--success {
  border-left: 3px solid var(--green);
}
.info-box--warning {
  border-left: 3px solid var(--orange);
}
.info-box--danger {
  border-left: 3px solid var(--red);
}

/* Title color by variant */
.info-box-title--info {
  color: var(--cyan);
}
.info-box-title--success {
  color: var(--green);
}
.info-box-title--warning {
  color: var(--orange);
}
.info-box-title--danger {
  color: var(--red);
}
</style>
```

## Usage Examples

### Basic Info Box

```vue
<InfoBox
  title="INFORMATION"
  message="This is an informational note with a cyan accent for general information."
  variant="info"
/>
```

### Success Info Box

```vue
<InfoBox
  title="SUCCESS"
  message="Operation completed successfully. All data has been saved."
  variant="success"
/>
```

### Warning Info Box

```vue
<InfoBox
  title="WARNING"
  message="This action cannot be undone. Please review before proceeding."
  variant="warning"
/>
```

### Danger Info Box

```vue
<InfoBox
  title="DANGER"
  message="Critical error detected. Immediate attention required."
  variant="danger"
/>
```

### Info Box with Custom Content

```vue
<InfoBox title="IMPORTANT" variant="warning">
  <p class="text-md text-[var(--text-secondary)] leading-relaxed">
    This info box contains <strong>custom HTML content</strong> with
    <code class="text-inline-code">inline code</code> elements.
  </p>
  <ul class="mt-2 ml-4 list-disc text-md text-[var(--text-secondary)]">
    <li>First important point</li>
    <li>Second important point</li>
  </ul>
</InfoBox>
```

### All Variants

```vue
<div class="flex flex-col gap-4 max-w-2xl">
  <InfoBox
    title="INFORMATION"
    message="This is an informational note with a cyan accent for general information."
    variant="info"
  />

  <InfoBox
    title="SUCCESS"
    message="Operation completed successfully. All data has been saved."
    variant="success"
  />

  <InfoBox
    title="WARNING"
    message="This action cannot be undone. Please review before proceeding."
    variant="warning"
  />

  <InfoBox
    title="DANGER"
    message="Critical error detected. Immediate attention required."
    variant="danger"
  />
</div>
```

## Accessibility

### ARIA Attributes

```vue
<div
  role="note"
  :aria-label="title"
>
```

### Semantic HTML

- Use `role="note"` for informational content
- Include descriptive `aria-label` from title
- Proper heading hierarchy if title is semantically a heading

### Screen Reader Support

- Title is announced first
- Message content follows naturally
- Semantic role indicates informational nature

### Color Contrast

- All text meets WCAG AA contrast requirements
- Left border is supplemental (not sole indicator of meaning)
- Title text provides semantic meaning beyond color

## Testing Specification

### File: `__tests__/InfoBox.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InfoBox from '@app/components/common/cards/InfoBox.vue';

describe('InfoBox', () => {
  it('renders with required props', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
        message: 'Test message',
      },
    });
    expect(wrapper.text()).toContain('INFORMATION');
    expect(wrapper.text()).toContain('Test message');
  });

  it('renders without message prop', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.text()).toContain('INFORMATION');
  });

  it('applies info variant by default', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.find('.info-box--info').exists()).toBe(true);
    expect(wrapper.find('.info-box-title--info').exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['info', 'success', 'warning', 'danger'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(InfoBox, {
        props: {
          title: 'Test',
          variant,
        },
      });
      expect(wrapper.find(`.info-box--${variant}`).exists()).toBe(true);
      expect(wrapper.find(`.info-box-title--${variant}`).exists()).toBe(true);
    });
  });

  it('renders title slot content', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Default Title',
      },
      slots: {
        title: '<span class="custom-title">Custom Title</span>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default Title');
  });

  it('renders default slot content', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
        message: 'Default message',
      },
      slots: {
        default: '<p class="custom-content">Custom content</p>',
      },
    });
    expect(wrapper.find('.custom-content').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default message');
  });

  it('applies custom classes', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Test',
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.attributes('role')).toBe('note');
  });

  it('has aria-label from title', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
    });
    expect(wrapper.attributes('aria-label')).toBe('INFORMATION');
  });

  it('applies correct border and title colors', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'SUCCESS',
        variant: 'success',
      },
    });

    // Check that variant classes exist (actual CSS is in scoped styles)
    expect(wrapper.find('.info-box--success').exists()).toBe(true);
    expect(wrapper.find('.info-box-title--success').exists()).toBe(true);
  });

  it('renders HTML content in default slot', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'INFORMATION',
      },
      slots: {
        default: '<strong>Bold text</strong> and <code>code</code>',
      },
    });
    expect(wrapper.find('strong').exists()).toBe(true);
    expect(wrapper.find('code').exists()).toBe(true);
  });

  it('has correct typography classes', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Test',
        message: 'Test message',
      },
    });

    const title = wrapper.find('.info-box-title');
    expect(title.classes()).toContain('font-mono');
    expect(title.classes()).toContain('font-semibold');

    const text = wrapper.find('p');
    expect(text.classes()).toContain('text-md');
    expect(text.classes()).toContain('leading-relaxed');
  });

  it('has correct layout classes', () => {
    const wrapper = mount(InfoBox, {
      props: {
        title: 'Test',
      },
    });

    const container = wrapper.find('.info-box');
    expect(container.classes()).toContain('bg-card');
    expect(container.classes()).toContain('border');
    expect(container.classes()).toContain('px-5');
    expect(container.classes()).toContain('py-4');
  });
});
```

## Performance Considerations

1. **No Complex Logic**: Simple prop rendering
2. **Minimal Scoped CSS**: Only for variant-specific borders and colors
3. **No Dependencies**: Pure Vue component
4. **Static Content**: No reactive computations

## Design Rationale

### Why Scoped CSS for Border and Title Color?

The left border color and title color need to change based on variant. While we could use inline styles with computed properties, scoped CSS provides:
- Better performance (no style recalculation)
- Cleaner template
- CSS variable support
- Easier maintenance

### Why Separate Message Prop and Default Slot?

Providing both `message` prop and default slot offers flexibility:
- Simple use case: Use `message` prop for plain text
- Complex use case: Use default slot for HTML content with formatting

### Why Use `role="note"`?

The `note` role indicates that the content is parenthetic or ancillary to the main content. This is semantically appropriate for informational boxes that provide additional context.

## Variant Usage Guidelines

### Info (Cyan)
Use for general information, tips, and neutral notices.

```vue
<InfoBox
  title="INFORMATION"
  message="Database backup scheduled for tonight at 2:00 AM."
  variant="info"
/>
```

### Success (Green)
Use for successful operations, confirmations, and positive feedback.

```vue
<InfoBox
  title="SUCCESS"
  message="Your changes have been saved successfully."
  variant="success"
/>
```

### Warning (Orange)
Use for warnings, cautions, and actions requiring attention.

```vue
<InfoBox
  title="WARNING"
  message="This operation will affect all active users."
  variant="warning"
/>
```

### Danger (Red)
Use for errors, critical issues, and destructive actions.

```vue
<InfoBox
  title="DANGER"
  message="Deleting this item cannot be undone."
  variant="danger"
/>
```

## Comparison with Alert Component

### When to use InfoBox vs Alert?

**Use InfoBox when:**
- Content is static and persistent
- No user action required
- Part of documentation or form instructions
- Left border accent is appropriate for layout

**Use Alert when:**
- Content is dynamic (can be dismissed)
- User action may be required
- Temporary notification
- Full-width banner style is needed
- Icon is important for recognition
