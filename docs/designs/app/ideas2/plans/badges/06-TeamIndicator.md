# TeamIndicator Component Specification

> **Priority**: 2 (Specialized)
> **Location**: `resources/app/js/components/common/indicators/TeamIndicator.vue`

## Overview

Displays team name with a color dot indicator for quick visual identification. Can optionally show a team logo instead of the color dot.

## Design Reference

From `badges.html`:
```css
.team-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--bg-elevated);
  border-radius: 3px;
  font-size: 12px;
}

.team-badge .color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
```

## Props Interface

```typescript
interface TeamIndicatorProps {
  /**
   * Team name
   * @default ''
   */
  name?: string;

  /**
   * Team color (hex code)
   * @default '#58a6ff'
   */
  color?: string;

  /**
   * Team logo URL (if provided, replaces color dot)
   */
  logo?: string;

  /**
   * Whether to show the team name
   * @default true
   */
  showName?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Truncate long names
   * @default true
   */
  truncate?: boolean;

  /**
   * Max width for truncation (CSS value)
   * @default '120px'
   */
  maxWidth?: string;
}
```

## Size Specifications

| Size | Dot Size | Logo Size | Font Size | Padding |
|------|----------|-----------|-----------|---------|
| `sm` | 6px | 12px | 11px | 2px 6px |
| `md` | 8px | 16px | 12px | 4px 8px |
| `lg` | 10px | 20px | 13px | 6px 10px |

## Implementation Template

```vue
<template>
  <span
    :class="[
      'team-indicator',
      `team-indicator--${size}`,
      { 'team-indicator--dot-only': !showName }
    ]"
    :title="name"
  >
    <img
      v-if="logo"
      :src="logo"
      :alt="name"
      class="team-indicator__logo"
      @error="handleLogoError"
    />
    <span
      v-else
      class="team-indicator__dot"
      :style="{ backgroundColor: color }"
    />
    <span
      v-if="showName"
      class="team-indicator__name"
      :class="{ 'team-indicator__name--truncate': truncate }"
      :style="truncate ? { maxWidth } : undefined"
    >
      {{ name }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  name?: string;
  color?: string;
  logo?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  truncate?: boolean;
  maxWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  color: '#58a6ff',
  showName: true,
  size: 'md',
  truncate: true,
  maxWidth: '120px',
});

const logoFailed = ref(false);

function handleLogoError() {
  logoFailed.value = true;
}
</script>

<style scoped>
.team-indicator {
  display: inline-flex;
  align-items: center;
  background: var(--bg-elevated);
  border-radius: 3px;
  font-family: var(--font-sans);
}

/* Sizes */
.team-indicator--sm {
  gap: 4px;
  padding: 2px 6px;
  font-size: 11px;
}

.team-indicator--sm .team-indicator__dot {
  width: 6px;
  height: 6px;
}

.team-indicator--sm .team-indicator__logo {
  width: 12px;
  height: 12px;
}

.team-indicator--md {
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
}

.team-indicator--md .team-indicator__dot {
  width: 8px;
  height: 8px;
}

.team-indicator--md .team-indicator__logo {
  width: 16px;
  height: 16px;
}

.team-indicator--lg {
  gap: 8px;
  padding: 6px 10px;
  font-size: 13px;
}

.team-indicator--lg .team-indicator__dot {
  width: 10px;
  height: 10px;
}

.team-indicator--lg .team-indicator__logo {
  width: 20px;
  height: 20px;
}

/* Dot only mode */
.team-indicator--dot-only {
  padding: 4px;
}

/* Elements */
.team-indicator__dot {
  border-radius: 50%;
  flex-shrink: 0;
}

.team-indicator__logo {
  border-radius: 2px;
  flex-shrink: 0;
  object-fit: contain;
}

.team-indicator__name {
  color: var(--text-primary);
}

.team-indicator__name--truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
```

## Usage Examples

```vue
<!-- Basic usage -->
<TeamIndicator name="Red Bull Racing" color="#3671c6" />
<TeamIndicator name="McLaren" color="#ff8000" />
<TeamIndicator name="Ferrari" color="#e8002d" />
<TeamIndicator name="Mercedes" color="#27f4d2" />

<!-- With logo -->
<TeamIndicator
  name="Red Bull Racing"
  color="#3671c6"
  logo="/teams/redbull.svg"
/>

<!-- Color dot only -->
<TeamIndicator color="#ff8000" :show-name="false" />

<!-- Different sizes -->
<TeamIndicator name="McLaren" color="#ff8000" size="sm" />
<TeamIndicator name="McLaren" color="#ff8000" size="md" />
<TeamIndicator name="McLaren" color="#ff8000" size="lg" />

<!-- No truncation -->
<TeamIndicator
  name="Visa Cash App RB F1 Team"
  color="#6692ff"
  :truncate="false"
/>

<!-- Custom max width -->
<TeamIndicator
  name="Aston Martin Aramco Cognizant F1 Team"
  color="#229971"
  max-width="200px"
/>
```

## Migration Guide

### From TeamCell

**Before:**
```vue
<!-- TeamCell.vue internal implementation -->
<span class="team-cell">
  <span class="team-color" :style="{ backgroundColor: team.color }"></span>
  <span class="team-name">{{ team.name }}</span>
</span>
```

**After:**
```vue
<TeamIndicator
  :name="team.name"
  :color="team.color"
  :logo="team.logo"
/>
```

### In DataTable

**Before:**
```vue
<Column header="Team">
  <template #body="{ data }">
    <TeamCell :team="data.team" />
  </template>
</Column>
```

**After:**
```vue
<Column header="Team">
  <template #body="{ data }">
    <TeamIndicator
      :name="data.team.name"
      :color="data.team.color"
      :logo="data.team.logo"
      size="sm"
    />
  </template>
</Column>
```

## Test Cases

```typescript
describe('TeamIndicator', () => {
  it('renders team name', () => {
    const wrapper = mount(TeamIndicator, {
      props: { name: 'Red Bull Racing', color: '#3671c6' }
    });
    expect(wrapper.text()).toBe('Red Bull Racing');
  });

  it('renders color dot with correct color', () => {
    const wrapper = mount(TeamIndicator, {
      props: { name: 'Ferrari', color: '#e8002d' }
    });
    const dot = wrapper.find('.team-indicator__dot');
    expect(dot.attributes('style')).toContain('background-color: rgb(232, 0, 45)');
  });

  it('renders logo when provided', () => {
    const wrapper = mount(TeamIndicator, {
      props: {
        name: 'McLaren',
        color: '#ff8000',
        logo: '/teams/mclaren.svg'
      }
    });
    expect(wrapper.find('.team-indicator__logo').exists()).toBe(true);
    expect(wrapper.find('.team-indicator__dot').exists()).toBe(false);
  });

  it('hides name when showName is false', () => {
    const wrapper = mount(TeamIndicator, {
      props: { name: 'Test', color: '#000', showName: false }
    });
    expect(wrapper.find('.team-indicator__name').exists()).toBe(false);
    expect(wrapper.classes()).toContain('team-indicator--dot-only');
  });

  it('renders all sizes', () => {
    ['sm', 'md', 'lg'].forEach(size => {
      const wrapper = mount(TeamIndicator, {
        props: { name: 'Test', color: '#000', size }
      });
      expect(wrapper.classes()).toContain(`team-indicator--${size}`);
    });
  });

  it('truncates long names by default', () => {
    const wrapper = mount(TeamIndicator, {
      props: {
        name: 'Very Long Team Name That Should Be Truncated',
        color: '#000'
      }
    });
    expect(wrapper.find('.team-indicator__name--truncate').exists()).toBe(true);
  });

  it('applies title attribute with full name', () => {
    const wrapper = mount(TeamIndicator, {
      props: { name: 'Test Team', color: '#000' }
    });
    expect(wrapper.attributes('title')).toBe('Test Team');
  });
});
```

## Accessibility

- Full team name in `title` attribute for truncated names
- Logo has `alt` attribute with team name
- Color dot is supplemented by team name text
- Fallback to color dot if logo fails to load
