# Alert Component - Implementation Specification

## Component: `Alert.vue`

The Alert component displays notification banners with an icon, title, and message. It can be dismissible and supports multiple visual variants for different message types.

## Component API

### Props

```typescript
interface AlertProps {
  title: string;                    // Alert title
  message: string;                  // Alert message/description
  variant?: AlertVariant;           // Visual variant: 'success' | 'warning' | 'error' | 'info'
  icon?: Component;                 // Custom icon component (Phosphor Icons)
  dismissible?: boolean;            // Whether the alert can be dismissed
  class?: string;                   // Additional CSS classes
}
```

### Slots

```typescript
{
  icon?: () => VNode[];       // Custom icon content
  title?: () => VNode[];      // Custom title content
  message?: () => VNode[];    // Custom message content
  default?: () => VNode[];    // Alias for message slot
}
```

### Events

```typescript
interface AlertEmits {
  (e: 'dismiss'): void;       // Emitted when the alert is dismissed
}
```

## HTML Structure from Design

```html
<!-- Success Alert -->
<div class="alert alert-success">
  <svg class="alert-icon"><!-- checkmark icon --></svg>
  <div class="alert-content">
    <div class="alert-title">Success</div>
    <div class="alert-message">Your changes have been saved successfully.</div>
  </div>
</div>

<!-- Warning Alert -->
<div class="alert alert-warning">
  <svg class="alert-icon"><!-- warning icon --></svg>
  <div class="alert-content">
    <div class="alert-title">Pending Results</div>
    <div class="alert-message">Round 15 data requires validation.</div>
  </div>
</div>

<!-- Error Alert -->
<div class="alert alert-error">
  <svg class="alert-icon"><!-- error icon --></svg>
  <div class="alert-content">
    <div class="alert-title">Error</div>
    <div class="alert-message">Failed to load data. Please try again.</div>
  </div>
</div>

<!-- Info Alert -->
<div class="alert alert-info">
  <svg class="alert-icon"><!-- info icon --></svg>
  <div class="alert-content">
    <div class="alert-title">Information</div>
    <div class="alert-message">New entry will be added to current season roster.</div>
  </div>
</div>
```

## CSS Classes from Design

```css
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius);
  margin-bottom: 12px;
  font-size: 13px;
}

.alert-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.alert-message {
  opacity: 0.9;
}

.alert-success {
  background: var(--green-dim);
  border: 1px solid rgba(126, 231, 135, 0.3);
  color: var(--green);
}

.alert-warning {
  background: var(--orange-dim);
  border: 1px solid rgba(240, 136, 62, 0.3);
  color: var(--orange);
}

.alert-error {
  background: var(--red-dim);
  border: 1px solid rgba(248, 81, 73, 0.3);
  color: var(--red);
}

.alert-info {
  background: var(--cyan-dim);
  border: 1px solid rgba(88, 166, 255, 0.3);
  color: var(--cyan);
}
```

## Tailwind Implementation

Most styles use Tailwind except variant-specific colors (scoped CSS):

```typescript
// Container
<div class="
  alert                         // Custom class for variant styles
  alert--{variant}              // Variant class
  flex                          // display: flex
  items-start                   // align-items: flex-start
  gap-3                         // gap: 12px
  px-3.5 py-3                   // padding: 12px 14px
  rounded-[var(--radius)]       // border-radius: var(--radius)
  mb-3                          // margin-bottom: 12px
  text-md                       // font-size: 13px
">

// Icon (18px)
<svg class="
  flex-shrink-0                 // flex-shrink: 0
  w-[18px] h-[18px]             // width: 18px, height: 18px
">

// Content
<div class="
  flex-1                        // flex: 1
">

// Title
<div class="
  font-semibold                 // font-weight: 600
  mb-0.5                        // margin-bottom: 2px
">

// Message
<div class="
  opacity-90                    // opacity: 0.9
">
```

## Implementation

### File: `Alert.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import {
  PhCheckCircle,
  PhWarning,
  PhXCircle,
  PhInfo,
  PhX,
} from '@phosphor-icons/vue';
import type { AlertProps, AlertEmits } from './types';

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'info',
  dismissible: false,
});

const emit = defineEmits<AlertEmits>();

/**
 * Default icons for each variant
 */
const defaultIcon = computed(() => {
  const iconMap = {
    success: PhCheckCircle,
    warning: PhWarning,
    error: PhXCircle,
    info: PhInfo,
  };
  return iconMap[props.variant];
});

/**
 * Icon to display (custom or default)
 */
const displayIcon = computed(() => {
  return props.icon || defaultIcon.value;
});

/**
 * Handle dismiss action
 */
function handleDismiss(): void {
  emit('dismiss');
}
</script>

<template>
  <div
    :class="[
      'alert',
      `alert--${variant}`,
      'flex items-start gap-3 px-3.5 py-3 rounded-[var(--radius)] mb-3 text-md',
      props.class,
    ]"
    role="alert"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
  >
    <!-- Icon -->
    <slot name="icon">
      <component
        :is="displayIcon"
        :size="18"
        weight="regular"
        class="flex-shrink-0"
        aria-hidden="true"
      />
    </slot>

    <!-- Content -->
    <div class="flex-1">
      <!-- Title -->
      <slot name="title">
        <div class="font-semibold mb-0.5">
          {{ title }}
        </div>
      </slot>

      <!-- Message -->
      <slot name="message">
        <slot>
          <div class="opacity-90">
            {{ message }}
          </div>
        </slot>
      </slot>
    </div>

    <!-- Dismiss Button -->
    <button
      v-if="dismissible"
      type="button"
      class="flex-shrink-0 p-0.5 hover:opacity-70 transition-opacity"
      :aria-label="`Dismiss ${variant} alert`"
      @click="handleDismiss"
    >
      <PhX :size="16" weight="bold" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
/* Success variant */
.alert--success {
  background: var(--green-dim);
  border: 1px solid rgba(126, 231, 135, 0.3);
  color: var(--green);
}

/* Warning variant */
.alert--warning {
  background: var(--orange-dim);
  border: 1px solid rgba(240, 136, 62, 0.3);
  color: var(--orange);
}

/* Error variant */
.alert--error {
  background: var(--red-dim);
  border: 1px solid rgba(248, 81, 73, 0.3);
  color: var(--red);
}

/* Info variant */
.alert--info {
  background: var(--cyan-dim);
  border: 1px solid rgba(88, 166, 255, 0.3);
  color: var(--cyan);
}
</style>
```

## Usage Examples

### Basic Success Alert

```vue
<Alert
  title="Success"
  message="Your changes have been saved successfully."
  variant="success"
/>
```

### Warning Alert

```vue
<Alert
  title="Pending Results"
  message="Round 15 data requires validation."
  variant="warning"
/>
```

### Error Alert

```vue
<Alert
  title="Error"
  message="Failed to load data. Please try again."
  variant="error"
/>
```

### Info Alert

```vue
<Alert
  title="Information"
  message="New entry will be added to current season roster."
  variant="info"
/>
```

### Dismissible Alert

```vue
<script setup lang="ts">
import { ref } from 'vue';

const showAlert = ref(true);

function handleDismiss() {
  showAlert.value = false;
}
</script>

<template>
  <Alert
    v-if="showAlert"
    title="Success"
    message="Your changes have been saved."
    variant="success"
    dismissible
    @dismiss="handleDismiss"
  />
</template>
```

### Alert with Custom Icon

```vue
<Alert
  title="Custom Alert"
  message="This alert uses a custom icon."
  variant="info"
  :icon="PhRocket"
/>
```

### Alert with Custom Content

```vue
<Alert title="Complex Alert" variant="warning">
  <template #message>
    <p class="mb-2">This alert contains custom content:</p>
    <ul class="ml-4 list-disc opacity-90">
      <li>First important item</li>
      <li>Second important item</li>
      <li>Third important item</li>
    </ul>
  </template>
</Alert>
```

### All Variants

```vue
<div class="max-w-2xl space-y-0">
  <Alert
    title="Success"
    message="Your changes have been saved successfully."
    variant="success"
  />

  <Alert
    title="Pending Results"
    message="Round 15 data requires validation."
    variant="warning"
  />

  <Alert
    title="Error"
    message="Failed to load data. Please try again."
    variant="error"
  />

  <Alert
    title="Information"
    message="New entry will be added to current season roster."
    variant="info"
  />
</div>
```

## Accessibility

### ARIA Attributes

```vue
<div
  role="alert"
  :aria-live="variant === 'error' ? 'assertive' : 'polite'"
>
```

### Semantic HTML

- Use `role="alert"` for alert container
- `aria-live="assertive"` for errors (immediate announcement)
- `aria-live="polite"` for other variants (wait for pause)
- Dismiss button has descriptive `aria-label`
- Icons are decorative with `aria-hidden="true"`

### Keyboard Navigation

- Dismiss button is keyboard accessible (Tab)
- Enter/Space to dismiss
- Focus visible on dismiss button

### Screen Reader Support

- Alert title announced first
- Message content follows
- Dismiss button announces action
- Icons hidden from screen readers

### Color Contrast

- All text meets WCAG AA requirements
- Icons supplement text (not sole indicator)
- Background colors provide sufficient contrast

## Testing Specification

### File: `__tests__/Alert.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Alert from '@app/components/common/cards/Alert.vue';
import {
  PhCheckCircle,
  PhWarning,
  PhXCircle,
  PhInfo,
  PhRocket,
} from '@phosphor-icons/vue';

describe('Alert', () => {
  it('renders with required props', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test Alert',
        message: 'Test message',
      },
    });
    expect(wrapper.text()).toContain('Test Alert');
    expect(wrapper.text()).toContain('Test message');
  });

  it('applies info variant by default', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    expect(wrapper.find('.alert--info').exists()).toBe(true);
    expect(wrapper.findComponent(PhInfo).exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['success', 'warning', 'error', 'info'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(Alert, {
        props: {
          title: 'Test',
          message: 'Test',
          variant,
        },
      });
      expect(wrapper.find(`.alert--${variant}`).exists()).toBe(true);
    });
  });

  it('shows correct default icon for each variant', () => {
    const variantIconMap = {
      success: PhCheckCircle,
      warning: PhWarning,
      error: PhXCircle,
      info: PhInfo,
    } as const;

    Object.entries(variantIconMap).forEach(([variant, IconComponent]) => {
      const wrapper = mount(Alert, {
        props: {
          title: 'Test',
          message: 'Test',
          variant: variant as any,
        },
      });
      expect(wrapper.findComponent(IconComponent).exists()).toBe(true);
    });
  });

  it('renders custom icon when provided', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        icon: PhRocket,
      },
    });
    expect(wrapper.findComponent(PhRocket).exists()).toBe(true);
    expect(wrapper.findComponent(PhInfo).exists()).toBe(false);
  });

  it('shows dismiss button when dismissible', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        dismissible: true,
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('hides dismiss button when not dismissible', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        dismissible: false,
      },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits dismiss event when dismiss button clicked', async () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        dismissible: true,
      },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('dismiss')).toBeTruthy();
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('does not show dismiss button by default', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders title slot content', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Default',
        message: 'Test',
      },
      slots: {
        title: '<span class="custom-title">Custom Title</span>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default');
  });

  it('renders message slot content', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Default',
      },
      slots: {
        message: '<p class="custom-message">Custom message</p>',
      },
    });
    expect(wrapper.find('.custom-message').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default');
  });

  it('renders default slot as message', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Default',
      },
      slots: {
        default: '<p class="custom-content">Custom content</p>',
      },
    });
    expect(wrapper.find('.custom-content').exists()).toBe(true);
  });

  it('renders icon slot content', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
      slots: {
        icon: '<svg class="custom-icon"></svg>',
      },
    });
    expect(wrapper.find('.custom-icon').exists()).toBe(true);
  });

  it('applies custom classes', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    expect(wrapper.attributes('role')).toBe('alert');
  });

  it('has aria-live="polite" for non-error variants', () => {
    const variants = ['success', 'warning', 'info'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(Alert, {
        props: {
          title: 'Test',
          message: 'Test',
          variant,
        },
      });
      expect(wrapper.attributes('aria-live')).toBe('polite');
    });
  });

  it('has aria-live="assertive" for error variant', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        variant: 'error',
      },
    });
    expect(wrapper.attributes('aria-live')).toBe('assertive');
  });

  it('dismiss button has accessible label', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        variant: 'warning',
        dismissible: true,
      },
    });
    const button = wrapper.find('button');
    expect(button.attributes('aria-label')).toBe('Dismiss warning alert');
  });

  it('icons are hidden from screen readers', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    const icons = wrapper.findAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('has correct layout classes', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    const alert = wrapper.find('.alert');
    expect(alert.classes()).toContain('flex');
    expect(alert.classes()).toContain('items-start');
    expect(alert.classes()).toContain('gap-3');
  });
});
```

## Performance Considerations

1. **Icon Components**: Lazy loaded with tree-shaking
2. **Computed Properties**: Simple icon selection logic
3. **Event Handling**: Single dismiss handler
4. **Scoped CSS**: Minimal - only for variant colors

## Design Rationale

### Why Scoped CSS for Variant Colors?

Each variant requires unique background, border, and text colors. Scoped CSS provides:
- Cleaner template
- Better performance (no inline styles)
- Centralized color management
- Easier maintenance

### Why Default Icons?

Each alert variant has a conventional icon (checkmark for success, warning triangle for warnings, etc.). Providing defaults reduces boilerplate while still allowing customization.

### Why Dismissible is Opt-in?

Most alerts are informational and should remain visible. Making `dismissible` opt-in prevents accidental dismissal of important messages.

### Why aria-live="assertive" for Errors?

Errors require immediate user attention. Using `aria-live="assertive"` ensures screen readers announce errors immediately, interrupting other content.

## Variant Usage Guidelines

### Success
Use for successful operations, confirmations, and positive outcomes.

### Warning
Use for cautions, actions requiring review, and potential issues.

### Error
Use for failures, validation errors, and critical problems.

### Info
Use for general information, tips, and neutral notifications.
