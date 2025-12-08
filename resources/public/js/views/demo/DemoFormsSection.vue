<script setup lang="ts">
import { ref } from 'vue';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import VrlSearchBar from '@public/components/common/forms/VrlSearchBar.vue';
import VrlFilterChips from '@public/components/common/forms/VrlFilterChips.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlTextarea from '@public/components/common/forms/VrlTextarea.vue';
import VrlSelect from '@public/components/common/forms/VrlSelect.vue';
import VrlCheckbox from '@public/components/common/forms/VrlCheckbox.vue';
import VrlRadio from '@public/components/common/forms/VrlRadio.vue';
import VrlToggle from '@public/components/common/forms/VrlToggle.vue';

// Form demo states - separate refs for each distinct input
// Search demo
const searchQuery = ref('');
const searchLoading = ref(false);

// Filter chips demo
const selectedFilter = ref('all');
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'GT7', value: 'gt7' },
  { label: 'ACC', value: 'acc' },
  { label: 'iRacing', value: 'iracing' },
];

// Input size demos
const inputValueSm = ref('');
const inputValueMd = ref('');
const inputValueLg = ref('');

// Input state demos
const leagueName = ref('');
const inputErrorValue = ref('Invalid input');
const disabledInput = ref('');
const readonlyInput = ref('');

// Input type demos
const emailValue = ref('');
const passwordValue = ref('');
const lapCount = ref('');

// Other form components
const textareaValue = ref('');
const selectValue = ref('');
const checkboxValue = ref(true);
const checkboxValue2 = ref(false);
const checkboxDisabled = ref(false);
const radioValue = ref('public');
const toggleValue = ref(true);
const toggleValue2 = ref(false);
const toggleDisabled = ref(false);

// Select options
const platformOptions = [
  { label: 'Gran Turismo 7', value: 'gt7' },
  { label: 'Assetto Corsa Competizione', value: 'acc' },
  { label: 'iRacing', value: 'iracing' },
  { label: 'F1 24', value: 'f1' },
];

// Search demo handler
const handleSearch = () => {
  searchLoading.value = true;
  setTimeout(() => {
    searchLoading.value = false;
  }, 1500);
};
</script>

<template>
  <section id="forms" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Forms</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Form inputs, selects, checkboxes, toggles, and validation components.
      </p>
    </div>

    <!-- VrlSearchBar Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlSearchBar</VrlHeading>
      <p class="theme-text-muted mb-6">
        Search input with magnifying glass icon, loading state, and Enter key support.
      </p>

      <div class="max-w-2xl space-y-6">
        <!-- Basic Search -->
        <div>
          <VrlHeading
            :level="4"
            as="div"
            class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
          >
            Basic Search
          </VrlHeading>
          <VrlSearchBar
            v-model="searchQuery"
            placeholder="Search leagues, drivers, or competitions..."
            :loading="searchLoading"
            @search="handleSearch"
          />
          <p class="mt-3 text-sm theme-text-muted">
            Current value:
            <span class="font-data theme-accent-gold">{{ searchQuery || '(empty)' }}</span>
          </p>
          <p class="mt-2 text-xs theme-text-dim">
            Press Enter to trigger search event (simulates loading for 1.5s)
          </p>
        </div>
      </div>
    </div>

    <!-- VrlFilterChips Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlFilterChips</VrlHeading>
      <p class="theme-text-muted mb-6">
        Filter chips with gold active state, keyboard navigation, and full accessibility support.
      </p>

      <div class="space-y-6">
        <!-- Filter Chips -->
        <div>
          <VrlHeading
            :level="4"
            as="div"
            class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
          >
            Platform Filter
          </VrlHeading>
          <VrlFilterChips v-model="selectedFilter" :options="filterOptions" />
          <p class="mt-4 text-sm theme-text-muted">
            Selected: <span class="font-data theme-accent-gold">{{ selectedFilter }}</span>
          </p>
          <p class="mt-2 text-xs theme-text-dim">
            Use arrow keys to navigate, Enter/Space to select
          </p>
        </div>
      </div>
    </div>

    <!-- VrlInput Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlInput</VrlHeading>
      <p class="theme-text-muted mb-6">
        Text input fields with sizes, labels, validation states, and error messages.
      </p>

      <!-- Input Sizes -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Sizes
        </VrlHeading>
        <div class="max-w-md space-y-4">
          <VrlInput
            v-model="inputValueSm"
            size="sm"
            label="Small Input"
            placeholder="Small input (32px)"
          />
          <VrlInput
            v-model="inputValueMd"
            size="md"
            label="Medium Input (Default)"
            placeholder="Medium input (40px)"
          />
          <VrlInput
            v-model="inputValueLg"
            size="lg"
            label="Large Input"
            placeholder="Large input (48px)"
          />
        </div>
      </div>

      <!-- Input States -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          States
        </VrlHeading>
        <div class="max-w-md space-y-4">
          <VrlInput
            v-model="leagueName"
            label="League Name"
            placeholder="Enter league name"
            :required="true"
          />
          <VrlInput
            v-model="inputErrorValue"
            label="Error State"
            :invalid="true"
            error-message="Please enter a valid league name"
          />
          <VrlInput
            v-model="disabledInput"
            label="Disabled Input"
            placeholder="Cannot edit"
            :disabled="true"
          />
          <VrlInput
            v-model="readonlyInput"
            label="Readonly Input"
            placeholder="Read only value"
            :readonly="true"
          />
        </div>
      </div>

      <!-- Input Types -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Input Types
        </VrlHeading>
        <div class="max-w-md space-y-4">
          <VrlInput v-model="emailValue" type="email" label="Email" placeholder="driver@vrl.com" />
          <VrlInput
            v-model="passwordValue"
            type="password"
            label="Password"
            placeholder="Enter password"
          />
          <VrlInput
            v-model="lapCount"
            type="number"
            label="Lap Count"
            placeholder="Enter number of laps"
          />
        </div>
      </div>
    </div>

    <!-- VrlTextarea Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlTextarea</VrlHeading>
      <p class="theme-text-muted mb-6">
        Multi-line text input with configurable rows and validation.
      </p>

      <div class="max-w-lg space-y-4">
        <VrlTextarea
          v-model="textareaValue"
          label="Description"
          placeholder="Enter a description for your league..."
          :rows="4"
        />
        <VrlTextarea
          v-model="textareaValue"
          label="With Error"
          placeholder="Enter description..."
          :invalid="true"
          error-message="Description is required"
          :rows="3"
        />
      </div>
    </div>

    <!-- VrlSelect Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlSelect</VrlHeading>
      <p class="theme-text-muted mb-6">Dropdown select with custom styling and size variants.</p>

      <div class="grid md:grid-cols-3 gap-4 max-w-2xl">
        <VrlSelect
          v-model="selectValue"
          :options="platformOptions"
          size="sm"
          label="Small"
          placeholder="Select..."
        />
        <VrlSelect
          v-model="selectValue"
          :options="platformOptions"
          size="md"
          label="Medium (Default)"
          placeholder="Select platform..."
        />
        <VrlSelect
          v-model="selectValue"
          :options="platformOptions"
          size="lg"
          label="Large"
          placeholder="Select platform..."
        />
      </div>

      <div class="mt-4 max-w-md">
        <VrlSelect
          v-model="selectValue"
          :options="platformOptions"
          label="With Error"
          :invalid="true"
          error-message="Please select a platform"
          placeholder="Select..."
        />
      </div>
    </div>

    <!-- VrlCheckbox Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlCheckbox</VrlHeading>
      <p class="theme-text-muted mb-6">Custom checkbox with racing-inspired gold accent.</p>

      <div class="space-y-3">
        <VrlCheckbox v-model="checkboxValue" label="Enable notifications" />
        <VrlCheckbox v-model="checkboxValue2" label="Public league" />
        <VrlCheckbox v-model="checkboxDisabled" label="Disabled option" :disabled="true" />
      </div>
    </div>

    <!-- VrlRadio Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlRadio</VrlHeading>
      <p class="theme-text-muted mb-6">Radio button group with gold inner circle when selected.</p>

      <div class="space-y-3">
        <VrlRadio v-model="radioValue" value="public" name="visibility" label="Public" />
        <VrlRadio v-model="radioValue" value="private" name="visibility" label="Private" />
        <VrlRadio v-model="radioValue" value="invite" name="visibility" label="Invite Only" />
      </div>

      <p class="mt-4 text-sm theme-text-muted">
        Selected: <span class="font-data theme-accent-gold">{{ radioValue }}</span>
      </p>
    </div>

    <!-- VrlToggle Component -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlToggle</VrlHeading>
      <p class="theme-text-muted mb-6">
        Toggle switch with three sizes and optional description layout.
      </p>

      <!-- Toggle Sizes -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Sizes
        </VrlHeading>
        <div class="flex flex-wrap items-end gap-6">
          <VrlToggle v-model="toggleValue" size="sm" label="Small" />
          <VrlToggle v-model="toggleValue" size="md" label="Medium" />
          <VrlToggle v-model="toggleValue" size="lg" label="Large" />
        </div>
      </div>

      <!-- Toggle States -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          States
        </VrlHeading>
        <div class="flex flex-wrap gap-6">
          <VrlToggle v-model="toggleValue" label="Active" />
          <VrlToggle v-model="toggleValue2" label="Inactive" />
          <VrlToggle v-model="toggleDisabled" label="Disabled" :disabled="true" />
        </div>
      </div>

      <!-- Toggle with Description -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          With Description
        </VrlHeading>
        <div class="max-w-md space-y-4">
          <VrlToggle
            v-model="toggleValue"
            label="Email Notifications"
            description="Receive email updates about race results and standings"
          />
          <VrlToggle
            v-model="toggleValue2"
            label="Public Profile"
            description="Allow other drivers to view your statistics"
          />
        </div>
      </div>
    </div>
  </section>
</template>
