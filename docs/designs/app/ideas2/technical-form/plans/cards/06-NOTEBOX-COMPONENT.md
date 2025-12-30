# NoteBox Component - Implementation Specification

## Component: `NoteBox.vue`

The NoteBox component displays documentation and usage notes with a left border accent. It's designed for technical notes, code documentation, and usage guidelines.

## Component API

### Props

```typescript
interface NoteBoxProps {
  title: string;              // Note box title (e.g., "USAGE GUIDELINES", "IMPORTANT")
  class?: string;             // Additional CSS classes
}
```

### Slots

```typescript
{
  title?: () => VNode[];      // Custom title content
  default?: () => VNode[];    // Note content (supports HTML, code, etc.)
}
```

### Events

None (note boxes are display-only)

## HTML Structure from Design

```html
<div class="note-box">
  <div class="note-title">USAGE GUIDELINES</div>
  <p class="note-text">
    Use <code>.card</code> for general content containers.
    Use <code>.metric-card</code> for KPI displays with the colored top accent.
    Use <code>.info-box</code> for static informational notes.
    Use <code>.alert</code> for dismissible notifications and system messages.
  </p>
</div>
```

## CSS Classes from Design

```css
.note-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--cyan);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 16px 20px;
  margin-top: 24px;
}

.note-box .note-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--cyan);
  margin-bottom: 8px;
}

.note-box .note-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.note-box .note-text code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--text-primary);
}
```

## Tailwind Implementation

Most styles use Tailwind except the left border (scoped CSS):

```typescript
// Container
<div class="
  note-box                      // Custom class for left border
  bg-card                       // background: var(--bg-card)
  border                        // border: 1px solid
  border-[var(--border)]        // border-color: var(--border)
  rounded-r-[var(--radius)]     // border-radius: 0 var(--radius) var(--radius) 0
  px-5 py-4                     // padding: 16px 20px
  mt-6                          // margin-top: 24px
">

// Title
<div class="
  font-mono                     // font-family: var(--font-mono)
  text-[11px]                   // font-size: 11px
  font-semibold                 // font-weight: 600
  tracking-wide                 // letter-spacing: 0.5px
  text-[var(--cyan)]            // color: var(--cyan)
  mb-2                          // margin-bottom: 8px
">

// Text content
<p class="
  text-md                       // font-size: 13px
  text-[var(--text-secondary)]  // color: var(--text-secondary)
  leading-relaxed               // line-height: 1.6
">

// Inline code
<code class="
  font-mono                     // font-family: var(--font-mono)
  text-sm                       // font-size: 12px
  bg-elevated                   // background: var(--bg-elevated)
  px-1.5 py-0.5                 // padding: 2px 6px
  rounded-sm                    // border-radius: 3px
  text-[var(--text-primary)]    // color: var(--text-primary)
">
```

## Implementation

### File: `NoteBox.vue`

```vue
<script setup lang="ts">
import type { NoteBoxProps } from './types';

const props = defineProps<NoteBoxProps>();
</script>

<template>
  <div
    :class="[
      'note-box',
      'bg-card border border-[var(--border)] rounded-r-[var(--radius)] px-5 py-4 mt-6',
      props.class,
    ]"
    role="note"
    :aria-label="title"
  >
    <!-- Title -->
    <slot name="title">
      <div class="font-mono text-[11px] font-semibold tracking-wide text-[var(--cyan)] mb-2">
        {{ title }}
      </div>
    </slot>

    <!-- Content -->
    <div class="note-content text-md text-[var(--text-secondary)] leading-relaxed">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Left border accent (always cyan for note boxes) */
.note-box {
  border-left: 3px solid var(--cyan);
}

/* Inline code styling within note content */
.note-content :deep(code) {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--text-primary);
}

/* Preserve formatting for pre/code blocks */
.note-content :deep(pre) {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-elevated);
  padding: 12px;
  border-radius: var(--radius);
  overflow-x: auto;
  margin: 8px 0;
}

.note-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

/* List styling within note content */
.note-content :deep(ul),
.note-content :deep(ol) {
  margin-left: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.note-content :deep(ul) {
  list-style-type: disc;
}

.note-content :deep(ol) {
  list-style-type: decimal;
}

.note-content :deep(li) {
  margin-bottom: 0.25rem;
}

/* Paragraph spacing */
.note-content :deep(p + p) {
  margin-top: 0.5rem;
}

/* Strong/bold text */
.note-content :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}
</style>
```

## Usage Examples

### Basic Note Box

```vue
<NoteBox title="USAGE GUIDELINES">
  <p>
    Use <code>.card</code> for general content containers.
    Use <code>.metric-card</code> for KPI displays with the colored top accent.
  </p>
</NoteBox>
```

### Note Box with Multiple Paragraphs

```vue
<NoteBox title="IMPORTANT">
  <p>
    This component requires <code>TypeScript</code> and <code>Vue 3</code>.
  </p>
  <p>
    Make sure to import all dependencies before using this component.
  </p>
</NoteBox>
```

### Note Box with List

```vue
<NoteBox title="REQUIREMENTS">
  <p>Before implementing this feature, ensure:</p>
  <ul>
    <li>All tests are passing</li>
    <li>Code follows <code>PSR-12</code> standards</li>
    <li>Documentation is up to date</li>
  </ul>
</NoteBox>
```

### Note Box with Code Block

```vue
<NoteBox title="EXAMPLE">
  <p>To use this component in your Vue file:</p>
  <pre><code>import { Card } from '@app/components/common/cards';

&lt;Card title="My Card"&gt;
  &lt;p&gt;Card content&lt;/p&gt;
&lt;/Card&gt;</code></pre>
</NoteBox>
```

### Note Box with Custom Title

```vue
<NoteBox title="Default Title">
  <template #title>
    <div class="flex items-center gap-2">
      <PhLightbulb :size="14" class="text-cyan" />
      <span class="font-mono text-[11px] font-semibold tracking-wide text-[var(--cyan)]">
        PRO TIP
      </span>
    </div>
  </template>

  <p>Use keyboard shortcuts to speed up your workflow!</p>
</NoteBox>
```

### Note Box with Mixed Content

```vue
<NoteBox title="ADVANCED USAGE">
  <p>
    The <code>Card</code> component supports several advanced features:
  </p>

  <ul>
    <li>Custom header content via <code>#header</code> slot</li>
    <li>Action buttons via <code>#actions</code> slot</li>
    <li>No-padding body with <code>CardBody</code> component</li>
  </ul>

  <p>
    <strong>Note:</strong> Always test your implementation before deploying.
  </p>
</NoteBox>
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

- Use `role="note"` for note content
- Include descriptive `aria-label` from title
- Inline code is presentational (no special ARIA needed)

### Screen Reader Support

- Title is announced first
- Content is read in natural order
- Code snippets are read as text
- Lists are announced properly

### Keyboard Navigation

- Note boxes are not interactive
- Any links within content are keyboard accessible
- Tab order flows naturally through content

### Color Contrast

- All text meets WCAG AA requirements
- Code snippets have sufficient contrast
- Left border is supplemental (not sole indicator)

## Testing Specification

### File: `__tests__/NoteBox.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NoteBox from '@app/components/common/cards/NoteBox.vue';

describe('NoteBox', () => {
  it('renders with required props', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'USAGE GUIDELINES',
      },
      slots: {
        default: '<p>Test content</p>',
      },
    });
    expect(wrapper.text()).toContain('USAGE GUIDELINES');
    expect(wrapper.text()).toContain('Test content');
  });

  it('renders title correctly', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'TEST TITLE',
      },
    });
    expect(wrapper.text()).toContain('TEST TITLE');
  });

  it('renders default slot content', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<p class="test-content">Custom content</p>',
      },
    });
    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Custom content');
  });

  it('renders title slot content', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Default',
      },
      slots: {
        title: '<span class="custom-title">Custom Title</span>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default');
  });

  it('applies custom classes', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    expect(wrapper.attributes('role')).toBe('note');
  });

  it('has aria-label from title', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'USAGE GUIDELINES',
      },
    });
    expect(wrapper.attributes('aria-label')).toBe('USAGE GUIDELINES');
  });

  it('renders HTML content in slot', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<p>Text with <code>code</code> and <strong>bold</strong>.</p>',
      },
    });
    expect(wrapper.find('code').exists()).toBe(true);
    expect(wrapper.find('strong').exists()).toBe(true);
  });

  it('renders lists in content', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<ul><li>Item 1</li><li>Item 2</li></ul>',
      },
    });
    expect(wrapper.find('ul').exists()).toBe(true);
    expect(wrapper.findAll('li').length).toBe(2);
  });

  it('renders pre/code blocks', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<pre><code>const x = 10;</code></pre>',
      },
    });
    expect(wrapper.find('pre').exists()).toBe(true);
    expect(wrapper.find('code').exists()).toBe(true);
  });

  it('has correct layout classes', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    const noteBox = wrapper.find('.note-box');
    expect(noteBox.classes()).toContain('bg-card');
    expect(noteBox.classes()).toContain('border');
    expect(noteBox.classes()).toContain('px-5');
    expect(noteBox.classes()).toContain('py-4');
  });

  it('has correct title typography', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    const title = wrapper.find('.font-mono');
    expect(title.exists()).toBe(true);
    expect(title.classes()).toContain('font-semibold');
    expect(title.classes()).toContain('tracking-wide');
  });

  it('styles inline code elements', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
      slots: {
        default: '<p>Use <code>inline code</code> here.</p>',
      },
    });
    expect(wrapper.find('code').exists()).toBe(true);
  });

  it('applies cyan accent color to title', () => {
    const wrapper = mount(NoteBox, {
      props: {
        title: 'Test',
      },
    });
    const title = wrapper.find('.font-mono');
    expect(title.classes()).toContain('text-[var(--cyan)]');
  });
});
```

## Performance Considerations

1. **No Complex Logic**: Simple prop rendering
2. **Deep Selectors**: Used for styling slotted content (minimal performance impact)
3. **Static Content**: No reactive computations
4. **Minimal Scoped CSS**: Only for left border and content styling

## Design Rationale

### Why Always Use Cyan?

Unlike InfoBox which has multiple variants, NoteBox always uses cyan to maintain consistency for technical documentation. This creates a clear visual distinction:
- **NoteBox**: Technical notes, documentation, usage guidelines (always cyan)
- **InfoBox**: User-facing messages, status updates (multiple variants)

### Why :deep() for Code Styling?

The `code` elements are in the default slot (user-provided content). We use `:deep()` to style these elements while maintaining component encapsulation.

### Why Include List and Pre Styling?

Technical notes often include:
- Lists of requirements or features
- Code examples in `<pre>` blocks
- Inline code with `<code>` tags

Providing default styling for these elements ensures consistent formatting without requiring users to add classes.

### Why role="note"?

The `note` ARIA role indicates that content is parenthetic or ancillary to the main content. This is semantically correct for documentation boxes that provide additional context or guidelines.

## Usage Guidelines

### When to Use NoteBox

**Use NoteBox for:**
- Technical documentation within the UI
- Usage guidelines and instructions
- Code examples and snippets
- Developer notes and tips
- API documentation

**Example scenarios:**
```vue
<!-- Feature documentation -->
<NoteBox title="FEATURE OVERVIEW">
  <p>This feature allows users to <code>batch import</code> driver data.</p>
</NoteBox>

<!-- API usage -->
<NoteBox title="API ENDPOINT">
  <p>POST <code>/api/drivers/import</code></p>
  <pre><code>{
  "file": "drivers.csv",
  "season_id": 123
}</code></pre>
</NoteBox>

<!-- Requirements -->
<NoteBox title="REQUIREMENTS">
  <ul>
    <li>CSV file must have headers</li>
    <li>Maximum file size: 5MB</li>
    <li>Supported formats: CSV, TSV</li>
  </ul>
</NoteBox>
```

### When NOT to Use NoteBox

**Don't use NoteBox for:**
- User-facing informational messages (use InfoBox)
- Temporary notifications (use Alert)
- Success/error messages (use Alert)
- Status updates (use InfoBox)

## Content Styling Reference

The NoteBox component provides automatic styling for common HTML elements:

### Inline Code
```vue
<NoteBox title="EXAMPLE">
  <p>Use <code>inline code</code> for technical terms.</p>
</NoteBox>
```

### Code Blocks
```vue
<NoteBox title="EXAMPLE">
  <pre><code>const example = 'formatted code block';</code></pre>
</NoteBox>
```

### Lists
```vue
<NoteBox title="EXAMPLE">
  <ul>
    <li>Unordered list item</li>
  </ul>
  <ol>
    <li>Ordered list item</li>
  </ol>
</NoteBox>
```

### Emphasis
```vue
<NoteBox title="EXAMPLE">
  <p>Use <strong>strong</strong> for emphasis.</p>
</NoteBox>
```

All these elements will be styled consistently with the Technical Blueprint design system.
