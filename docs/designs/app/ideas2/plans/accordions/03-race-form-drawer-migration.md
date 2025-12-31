# RaceFormDrawer.vue Accordion Migration Plan

## Current State Analysis

**File:** `resources/app/js/components/round/modals/RaceFormDrawer.vue`

### Current Implementation

The RaceFormDrawer uses **4 separate Accordion instances** for form organization:

1. **Qualifying Configuration** (lines 66-156)
   - Shown only when `isQualifying` is true
   - Contains qualifying format, length, tire, pole bonus settings

2. **Race Details** (lines 159-316)
   - Shown only for races (not qualifiers)
   - Contains starting grid, race length, penalties & rules

3. **Points** (lines 319-549)
   - Shown only for races (not qualifiers)
   - Contains race points toggle, points grid, bonuses, DNF points

4. **Notes** (lines 552-579)
   - Shown only for races (not qualifiers)
   - Contains race notes textarea

### Current Styling
- All accordions use `:value="['0']"` (default expanded)
- All use `:multiple="true"` (unnecessary with single panel)
- Only Qualifying Configuration has PT styling
- Headers are plain text labels

---

## Target State

Transform to Technical Blueprint design with:
- Form-specific accordion variant (lighter interaction)
- Icon-based headers for visual recognition
- Consistent dark theme styling
- Collapsible form sections with smooth animations

---

## Migration Steps

### Step 1: Update Imports

**Current:**
```typescript
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
```

**Target:**
```typescript
import {
  TechnicalAccordion,
  TechnicalAccordionPanel,
  TechnicalAccordionHeader,
  TechnicalAccordionContent,
  AccordionIcon,
} from '@app/components/common/accordions';
import {
  PhGear,
  PhFlagCheckered,
  PhTrophy,
  PhNote,
} from '@phosphor-icons/vue';
```

### Step 2: Transform Qualifying Configuration Accordion

**Current (lines 66-73):**
```vue
<Accordion v-if="isQualifying" :value="['0']" :multiple="true">
  <AccordionPanel value="0">
    <AccordionHeader>Qualifying Configuration</AccordionHeader>
    <AccordionContent
      :pt="{
        root: { class: 'bg-inherit' },
        content: { class: 'p-4 bg-inherit border border-slate-200 rounded-b bg-surface-50' },
      }"
    >
```

**Target:**
```vue
<TechnicalAccordion v-if="isQualifying" :model-value="['qualifying']" :multiple="true" gap="md">
  <TechnicalAccordionPanel value="qualifying">
    <TechnicalAccordionHeader
      title="Qualifying Configuration"
      subtitle="Set up qualifying session parameters"
      :icon="PhGear"
      icon-variant="purple"
    />
    <TechnicalAccordionContent elevated padding="md">
```

### Step 3: Transform Race Details Accordion

**Current (lines 159-163):**
```vue
<Accordion v-if="!isQualifying" :value="['0']" :multiple="true">
  <AccordionPanel value="0">
    <AccordionHeader>Race Details</AccordionHeader>
    <AccordionContent>
```

**Target:**
```vue
<TechnicalAccordion v-if="!isQualifying" :model-value="['details']" :multiple="true" gap="md">
  <TechnicalAccordionPanel value="details">
    <TechnicalAccordionHeader
      title="Race Details"
      subtitle="Configure grid, length, and race rules"
      :icon="PhFlagCheckered"
      icon-variant="cyan"
    />
    <TechnicalAccordionContent padding="md">
```

### Step 4: Transform Points Accordion

**Current (lines 319-323):**
```vue
<Accordion v-if="!isQualifying" :value="['0']" :multiple="true">
  <AccordionPanel value="0">
    <AccordionHeader>Points</AccordionHeader>
    <AccordionContent>
```

**Target:**
```vue
<TechnicalAccordion v-if="!isQualifying" :model-value="['points']" :multiple="true" gap="md">
  <TechnicalAccordionPanel value="points">
    <TechnicalAccordionHeader
      title="Points Configuration"
      subtitle="Define race points, bonuses, and penalties"
      :icon="PhTrophy"
      icon-variant="green"
    />
    <TechnicalAccordionContent padding="md">
```

### Step 5: Transform Notes Accordion

**Current (lines 552-556):**
```vue
<Accordion v-if="!isQualifying" :value="['0']" :multiple="true">
  <AccordionPanel value="0">
    <AccordionHeader>Notes</AccordionHeader>
    <AccordionContent>
```

**Target:**
```vue
<TechnicalAccordion v-if="!isQualifying" :model-value="['notes']" :multiple="true" gap="md">
  <TechnicalAccordionPanel value="notes">
    <TechnicalAccordionHeader
      title="Race Notes"
      subtitle="Add optional notes and comments"
      :icon="PhNote"
      icon-variant="orange"
    />
    <TechnicalAccordionContent padding="md">
```

---

## Alternative: Single Accordion with Multiple Panels

Consider consolidating into a single Accordion for better UX:

```vue
<TechnicalAccordion
  v-if="!isQualifying"
  v-model="activeFormSections"
  :multiple="true"
  gap="md"
>
  <!-- Race Details Panel -->
  <TechnicalAccordionPanel value="details">
    <TechnicalAccordionHeader
      title="Race Details"
      subtitle="Configure grid, length, and race rules"
      :icon="PhFlagCheckered"
      icon-variant="cyan"
    />
    <TechnicalAccordionContent padding="md">
      <!-- Race details form fields -->
    </TechnicalAccordionContent>
  </TechnicalAccordionPanel>

  <!-- Points Panel -->
  <TechnicalAccordionPanel value="points">
    <TechnicalAccordionHeader
      title="Points Configuration"
      subtitle="Define race points, bonuses, and penalties"
      :icon="PhTrophy"
      icon-variant="green"
    />
    <TechnicalAccordionContent padding="md">
      <!-- Points form fields -->
    </TechnicalAccordionContent>
  </TechnicalAccordionPanel>

  <!-- Notes Panel -->
  <TechnicalAccordionPanel value="notes">
    <TechnicalAccordionHeader
      title="Race Notes"
      subtitle="Add optional notes and comments"
      :icon="PhNote"
      icon-variant="orange"
    />
    <TechnicalAccordionContent padding="md">
      <!-- Notes form fields -->
    </TechnicalAccordionContent>
  </TechnicalAccordionPanel>
</TechnicalAccordion>
```

**Benefits:**
- Single state variable (`activeFormSections`)
- Consistent visual grouping
- Better keyboard navigation
- Reduced DOM complexity

---

## Form Content Styling Updates

### Input Fields

Update form field styling for dark theme:

```vue
<!-- Before -->
<InputText
  v-model="form.qualifying_tire"
  class="w-full"
/>

<!-- After -->
<InputText
  v-model="form.qualifying_tire"
  class="w-full bg-elevated border-default text-primary"
/>
```

### Labels

```vue
<!-- Before -->
<FormLabel label="Qualifying Format" />

<!-- After (if FormLabel doesn't support dark theme) -->
<FormLabel label="Qualifying Format" class="text-secondary font-mono" />
```

### Grid Layouts

```vue
<!-- Update grid styling -->
<div class="grid grid-cols-2 gap-4">
  <!-- Form fields -->
</div>
```

---

## CSS Updates

Add form-specific accordion styles:

```css
/* Form accordion variant */
.accordion-form .accordion-item {
  background: var(--accordion-bg-elevated);
}

.accordion-form .accordion-header {
  padding: 12px 16px;
}

.accordion-form .accordion-title {
  font-size: 12px;
}

.accordion-form .accordion-content {
  padding: 16px;
}

/* Form field overrides for dark theme */
.accordion-form :deep(.p-inputtext),
.accordion-form :deep(.p-dropdown),
.accordion-form :deep(.p-inputnumber-input) {
  background: var(--accordion-bg-highlight);
  border-color: var(--accordion-border);
  color: var(--accordion-text-primary);
}

.accordion-form :deep(.p-inputtext:focus),
.accordion-form :deep(.p-dropdown:focus) {
  border-color: var(--accordion-border-active);
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
}
```

---

## State Management Update

**Add reactive state for form sections:**

```typescript
// Add to script setup
const activeFormSections = ref<string[]>(['details', 'points', 'notes']);

// For qualifying mode
const activeQualifyingSection = ref<string[]>(['qualifying']);
```

---

## Test Updates

**File:** `resources/app/js/components/round/modals/__tests__/RaceFormDrawer.test.ts`

Key test updates:
1. Update component imports
2. Update selectors for new component structure
3. Test accordion expand/collapse behavior
4. Verify form field accessibility within accordions

```typescript
describe('RaceFormDrawer', () => {
  it('renders qualifying accordion when isQualifying is true', async () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        isQualifying: true,
        // ... other props
      },
    });

    expect(wrapper.find('[data-testid="qualifying-accordion"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="race-details-accordion"]').exists()).toBe(false);
  });

  it('renders race accordions when isQualifying is false', async () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        isQualifying: false,
        // ... other props
      },
    });

    expect(wrapper.find('[data-testid="qualifying-accordion"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="race-details-accordion"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="points-accordion"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="notes-accordion"]').exists()).toBe(true);
  });

  it('expands all sections by default', async () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        isQualifying: false,
      },
    });

    const panels = wrapper.findAllComponents(TechnicalAccordionPanel);
    panels.forEach(panel => {
      expect(panel.classes()).toContain('active');
    });
  });
});
```

---

## Migration Checklist

- [ ] Update imports
- [ ] Transform Qualifying Configuration accordion
- [ ] Transform Race Details accordion
- [ ] Transform Points accordion
- [ ] Transform Notes accordion
- [ ] Consider consolidating into single accordion
- [ ] Update form field styling for dark theme
- [ ] Add form section state management
- [ ] Update tests
- [ ] Visual review
- [ ] Form validation testing

---

## Risk Mitigation

1. **Form Validation**: Ensure all validations still trigger correctly within new accordion structure
2. **Focus Management**: Tab order should work through accordion content
3. **Conditional Rendering**: Test isQualifying toggle thoroughly
4. **Points Grid**: Complex nested content - test thoroughly

---

## Estimated Effort

- Accordion transformation: 2 hours
- Form field styling: 1 hour
- Consolidation (optional): 1 hour
- Testing: 1 hour
- **Total: 4-5 hours**
