# DriverFormDialog.vue Accordion Migration Plan

## Current State Analysis

**File:** `resources/app/js/components/driver/modals/DriverFormDialog.vue`

### Current Implementation

Single-panel accordion for progressive disclosure of optional form fields:

- **Purpose**: Hide optional/secondary form fields by default
- **Header**: Plain text "Additional Information (Optional)"
- **Content**: Name fields, contact info, driver number, league notes
- **Mode**: Collapsed by default (no value prop = collapsed)

### Current Styling
- Minimal styling: `class="mt-2"` on Accordion
- Header text: `text-sm font-medium text-gray-700`
- Content: `space-y-3 pt-2`

---

## Target State

Transform to Technical Blueprint design with:
- Dark theme matching design system
- Clear visual indication of optional section
- Icon-based header
- Consistent form field styling

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
  AccordionBadge,
} from '@app/components/common/accordions';
import { PhInfo, PhUserCircle } from '@phosphor-icons/vue';
```

### Step 2: Transform Accordion Structure

**Current (lines 320-327):**
```vue
<Accordion :multiple="false" class="mt-2">
  <AccordionPanel value="0">
    <AccordionHeader>
      <span class="text-sm font-medium text-gray-700">
        Additional Information (Optional)
      </span>
    </AccordionHeader>
    <AccordionContent>
```

**Target:**
```vue
<TechnicalAccordion class="mt-4">
  <TechnicalAccordionPanel value="additional">
    <TechnicalAccordionHeader
      title="Additional Information"
      subtitle="Name, contact details, and notes"
      :icon="PhUserCircle"
      icon-variant="cyan"
      badge="OPTIONAL"
      badge-severity="muted"
    />
    <TechnicalAccordionContent padding="md">
```

### Step 3: Transform Content

**Current content sections (lines 328-406):**
1. Name fields grid (first/last name)
2. Contact grid (email, phone, driver number)
3. League notes textarea

**Target with updated styling:**

```vue
<TechnicalAccordionContent padding="md">
  <div class="space-y-4">
    <!-- Name Fields -->
    <div class="form-section">
      <h4 class="form-section-title">Personal Details</h4>
      <div class="grid grid-cols-2 gap-4">
        <FormInputGroup>
          <FormLabel label="First Name" />
          <InputText
            v-model="form.first_name"
            class="w-full form-input"
            placeholder="Enter first name"
          />
        </FormInputGroup>

        <FormInputGroup>
          <FormLabel label="Last Name" />
          <InputText
            v-model="form.last_name"
            class="w-full form-input"
            placeholder="Enter last name"
          />
        </FormInputGroup>
      </div>
    </div>

    <!-- Contact Information -->
    <div class="form-section">
      <h4 class="form-section-title">Contact Information</h4>
      <div class="grid grid-cols-2 gap-4">
        <FormInputGroup>
          <FormLabel label="Email" />
          <InputText
            v-model="form.email"
            type="email"
            class="w-full form-input"
            placeholder="driver@example.com"
            :invalid="!!errors.email"
          />
          <FormError v-if="errors.email" :message="errors.email" />
        </FormInputGroup>

        <FormInputGroup>
          <FormLabel label="Phone" />
          <InputText
            v-model="form.phone"
            class="w-full form-input"
            placeholder="+1 234 567 8900"
          />
        </FormInputGroup>
      </div>
    </div>

    <!-- Driver Number -->
    <div class="form-section">
      <h4 class="form-section-title">Racing Details</h4>
      <FormInputGroup class="max-w-xs">
        <FormLabel label="Driver Number" />
        <InputNumber
          v-model="form.driver_number"
          :min="1"
          :max="999"
          class="w-full form-input"
          placeholder="1-999"
        />
        <FormHelper text="Preferred racing number (1-999)" />
      </FormInputGroup>
    </div>

    <!-- League Notes -->
    <div class="form-section">
      <h4 class="form-section-title">Notes</h4>
      <FormInputGroup>
        <FormLabel label="League Notes" />
        <Textarea
          v-model="form.league_notes"
          :rows="3"
          :maxlength="500"
          class="w-full form-input"
          placeholder="Notes specific to this league..."
        />
        <div class="flex justify-between items-center mt-1">
          <FormHelper text="Notes specific to this league" />
          <FormCharacterCount
            :current="form.league_notes?.length || 0"
            :max="500"
          />
        </div>
      </FormInputGroup>
    </div>
  </div>
</TechnicalAccordionContent>
```

---

## CSS Updates

```css
/* Form section styling */
.form-section {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--accordion-border);
}

.form-section:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.form-section-title {
  font-family: var(--accordion-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accordion-text-muted);
  margin-bottom: 12px;
}

/* Form input dark theme overrides */
.form-input {
  background: var(--accordion-bg-highlight) !important;
  border-color: var(--accordion-border) !important;
  color: var(--accordion-text-primary) !important;
}

.form-input::placeholder {
  color: var(--accordion-text-muted) !important;
}

.form-input:focus {
  border-color: var(--accordion-border-active) !important;
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15) !important;
}

.form-input.p-invalid {
  border-color: var(--accordion-accent-red) !important;
}

/* Form label styling */
.form-label {
  font-family: var(--accordion-font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--accordion-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Form helper text */
.form-helper {
  font-size: 12px;
  color: var(--accordion-text-muted);
}

/* Form error styling */
.form-error {
  font-size: 12px;
  color: var(--accordion-accent-red);
}

/* Character counter */
.form-char-count {
  font-family: var(--accordion-font-mono);
  font-size: 11px;
  color: var(--accordion-text-muted);
}

.form-char-count.warning {
  color: var(--accordion-accent-orange);
}

.form-char-count.error {
  color: var(--accordion-accent-red);
}
```

---

## Full Component Section

```vue
<!-- Additional Information Accordion -->
<TechnicalAccordion class="mt-4">
  <TechnicalAccordionPanel value="additional">
    <TechnicalAccordionHeader
      title="Additional Information"
      subtitle="Name, contact details, and notes"
      :icon="PhUserCircle"
      icon-variant="cyan"
    >
      <template #suffix>
        <AccordionBadge text="OPTIONAL" severity="muted" />
      </template>
    </TechnicalAccordionHeader>

    <TechnicalAccordionContent padding="md">
      <div class="space-y-4">
        <!-- Personal Details Section -->
        <div class="form-section">
          <h4 class="form-section-title">Personal Details</h4>
          <div class="grid grid-cols-2 gap-4">
            <FormInputGroup>
              <FormLabel label="First Name" class="form-label" />
              <InputText
                v-model="form.first_name"
                class="w-full form-input"
                placeholder="Enter first name"
              />
            </FormInputGroup>

            <FormInputGroup>
              <FormLabel label="Last Name" class="form-label" />
              <InputText
                v-model="form.last_name"
                class="w-full form-input"
                placeholder="Enter last name"
              />
            </FormInputGroup>
          </div>
        </div>

        <!-- Contact Section -->
        <div class="form-section">
          <h4 class="form-section-title">Contact Information</h4>
          <div class="grid grid-cols-2 gap-4">
            <FormInputGroup>
              <FormLabel label="Email" class="form-label" />
              <InputText
                v-model="form.email"
                type="email"
                class="w-full form-input"
                :class="{ 'p-invalid': errors.email }"
                placeholder="driver@example.com"
              />
              <FormError v-if="errors.email" :message="errors.email" class="form-error" />
            </FormInputGroup>

            <FormInputGroup>
              <FormLabel label="Phone" class="form-label" />
              <InputText
                v-model="form.phone"
                class="w-full form-input"
                placeholder="+1 234 567 8900"
              />
            </FormInputGroup>
          </div>
        </div>

        <!-- Racing Details Section -->
        <div class="form-section">
          <h4 class="form-section-title">Racing Details</h4>
          <FormInputGroup class="max-w-[200px]">
            <FormLabel label="Driver Number" class="form-label" />
            <InputNumber
              v-model="form.driver_number"
              :min="1"
              :max="999"
              class="w-full form-input"
              placeholder="1-999"
            />
            <FormHelper text="Preferred racing number (1-999)" class="form-helper" />
          </FormInputGroup>
        </div>

        <!-- Notes Section -->
        <div class="form-section border-none">
          <h4 class="form-section-title">Notes</h4>
          <FormInputGroup>
            <FormLabel label="League Notes" class="form-label" />
            <Textarea
              v-model="form.league_notes"
              :rows="3"
              :maxlength="500"
              class="w-full form-input"
              placeholder="Notes specific to this league..."
            />
            <div class="flex justify-between items-center mt-2">
              <FormHelper text="Notes specific to this league" class="form-helper" />
              <FormCharacterCount
                :current="form.league_notes?.length || 0"
                :max="500"
                class="form-char-count"
              />
            </div>
          </FormInputGroup>
        </div>
      </div>
    </TechnicalAccordionContent>
  </TechnicalAccordionPanel>
</TechnicalAccordion>
```

---

## Design Considerations

### Collapsed by Default

The accordion should remain collapsed by default to:
1. Reduce initial cognitive load
2. Focus user on required fields first
3. Indicate optional nature of these fields

**Implementation:**
```vue
<!-- No model-value means collapsed by default -->
<TechnicalAccordion>
  <!-- ... -->
</TechnicalAccordion>
```

### "Optional" Badge

The muted "OPTIONAL" badge clearly communicates:
1. These fields are not required
2. The form can be submitted without them
3. Visual de-emphasis compared to required sections

### Section Dividers

Using `form-section` dividers within the accordion content:
1. Groups related fields logically
2. Provides visual breathing room
3. Matches Technical Blueprint aesthetic

---

## Test Updates

**File:** `resources/app/js/components/driver/__tests__/DriverFormDialog.test.ts`

```typescript
describe('DriverFormDialog Additional Information Accordion', () => {
  it('renders collapsed by default', () => {
    const wrapper = mount(DriverFormDialog, {
      props: { leagueId: 1 },
    });

    const panel = wrapper.findComponent(TechnicalAccordionPanel);
    expect(panel.classes()).not.toContain('active');
  });

  it('shows OPTIONAL badge', () => {
    const wrapper = mount(DriverFormDialog, {
      props: { leagueId: 1 },
    });

    const badge = wrapper.findComponent(AccordionBadge);
    expect(badge.props('text')).toBe('OPTIONAL');
    expect(badge.props('severity')).toBe('muted');
  });

  it('expands when header is clicked', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: { leagueId: 1 },
    });

    const header = wrapper.findComponent(TechnicalAccordionHeader);
    await header.trigger('click');

    const panel = wrapper.findComponent(TechnicalAccordionPanel);
    expect(panel.classes()).toContain('active');
  });

  it('validates email format when entered', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: { leagueId: 1 },
    });

    // Expand accordion
    await wrapper.findComponent(TechnicalAccordionHeader).trigger('click');

    // Enter invalid email
    const emailInput = wrapper.find('input[type="email"]');
    await emailInput.setValue('invalid-email');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('valid email');
  });

  it('allows form submission without optional fields', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: { leagueId: 1 },
    });

    // Fill only required fields
    await wrapper.find('[data-testid="nickname-input"]').setValue('TestDriver');
    await wrapper.find('[data-testid="status-dropdown"]').setValue('active');

    // Submit without expanding accordion
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeTruthy();
  });
});
```

---

## Migration Checklist

- [ ] Update imports
- [ ] Transform Accordion structure
- [ ] Add icon and badge to header
- [ ] Organize content into form sections
- [ ] Apply dark theme form styling
- [ ] Test collapsed default state
- [ ] Verify form validation works
- [ ] Update tests
- [ ] Visual review

---

## Estimated Effort

- Accordion transformation: 0.5 hours
- Form section styling: 1 hour
- Testing: 0.5 hours
- **Total: 2 hours**
