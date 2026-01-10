<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import BaseCheckbox from '@app/components/common/inputs/BaseCheckbox.vue';
import RadioButton from 'primevue/radiobutton';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import Message from 'primevue/message';
import {
  RACE_TYPE_OPTIONS,
  QUALIFYING_FORMAT_OPTIONS,
  GRID_SOURCE_OPTIONS,
  RACE_LENGTH_TYPE_OPTIONS,
} from '@app/types/race';

interface Props {
  isQualifying: boolean;
  raceType: string;
  raceName: string;
  qualifyingFormat: string;
  qualifyingLength: number | null;
  qualifyingTire: string;
  qualifyingPole: number | null;
  qualifyingPoleTop10: boolean;
  gridSource: string;
  gridSourceRaceId: number | null;
  sourceRaceOptions: Array<{ value: number; label: string }>;
  lengthType: string;
  lengthValue: number;
  trackLimitsEnforced: boolean;
  falseStartDetection: boolean;
  mandatoryPitStop: boolean;
  errors: {
    race_type?: string;
    name?: string;
    qualifying_format?: string;
    qualifying_length?: string;
    grid_source?: string;
    grid_source_race_id?: string;
    length_type?: string;
    length_value?: string;
  };
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:raceType': [value: string];
  'update:raceName': [value: string];
  'update:qualifyingFormat': [value: string];
  'update:qualifyingLength': [value: number | null];
  'update:qualifyingTire': [value: string];
  'update:qualifyingPole': [value: number | null];
  'update:qualifyingPoleTop10': [value: boolean];
  'update:gridSource': [value: string];
  'update:gridSourceRaceId': [value: number | null];
  'update:lengthType': [value: string];
  'update:lengthValue': [value: number | null];
  'update:trackLimitsEnforced': [value: boolean];
  'update:falseStartDetection': [value: boolean];
  'update:mandatoryPitStop': [value: boolean];
  'blur-race-type': [];
  'blur-name': [];
}>();

function handleRaceNameUpdate(value: string | undefined): void {
  emit('update:raceName', value ?? '');
}

function handleQualifyingTireUpdate(value: string | undefined): void {
  emit('update:qualifyingTire', value ?? '');
}
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">
        {{ isQualifying ? 'Qualifying Information' : 'Race Information' }}
      </h3>
      <p class="text-[var(--text-secondary)] m-0">
        {{
          isQualifying
            ? 'Configure qualifying session parameters'
            : 'Configure race type, grid, and length'
        }}
      </p>
    </div>

    <!-- Race Type + Race Name -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
      <!-- Race Type (20% width) -->
      <div class="md:col-span-1">
        <FormInputGroup>
          <FormLabel for="race_type" text="Race Type" required />
          <Select
            id="race_type"
            :model-value="raceType"
            :options="RACE_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            placeholder="Select type"
            :invalid="!!errors.race_type"
            size="small"
            fluid
            :disabled="disabled"
            class="w-full"
            @update:model-value="emit('update:raceType', $event)"
            @blur="emit('blur-race-type')"
          />
          <FormError v-if="errors.race_type">
            {{ errors.race_type }}
          </FormError>
        </FormInputGroup>
      </div>

      <!-- Race Name (80% width) -->
      <div class="md:col-span-4">
        <FormInputGroup>
          <FormLabel for="name" text="Race Name" />
          <InputText
            id="name"
            :model-value="raceName"
            :invalid="!!errors.name"
            placeholder="e.g., Sprint Race, Feature Race"
            size="small"
            :disabled="disabled"
            class="w-full"
            @update:model-value="handleRaceNameUpdate"
            @blur="emit('blur-name')"
          />
          <FormOptionalText :show-optional="false" text="Custom name for this race" />
          <FormError v-if="errors.name">
            {{ errors.name }}
          </FormError>
        </FormInputGroup>
      </div>
    </div>

    <!-- Qualifying Configuration (Only for qualifying type) -->
    <template v-if="isQualifying">
      <div class="space-y-3">
        <div class="flex flex-row gap-4">
          <div class="flex-grow">
            <FormInputGroup>
              <FormLabel for="qualifying_format" text="Format" required />
              <Select
                id="qualifying_format"
                :model-value="qualifyingFormat"
                :options="QUALIFYING_FORMAT_OPTIONS"
                option-label="label"
                option-value="value"
                placeholder="Select format"
                size="small"
                fluid
                :disabled="disabled"
                class="w-full"
                @update:model-value="emit('update:qualifyingFormat', $event)"
              />
              <FormError v-if="errors.qualifying_format">
                {{ errors.qualifying_format }}
              </FormError>
            </FormInputGroup>
          </div>

          <!-- Qualifying Length -->
          <div>
            <FormInputGroup>
              <FormLabel for="qualifying_length" text="Length (min)" />
              <StyledInputNumber
                :model-value="qualifyingLength"
                input-id="qualifying_length"
                :min="1"
                :max="999"
                :invalid="!!errors.qualifying_length"
                size="small"
                fluid
                :disabled="disabled"
                class="w-24"
                @update:model-value="emit('update:qualifyingLength', $event)"
              />
              <FormError v-if="errors.qualifying_length">
                {{ errors.qualifying_length }}
              </FormError>
            </FormInputGroup>
          </div>

          <!-- Qualifying Tire -->
          <div>
            <FormInputGroup>
              <FormLabel for="qualifying_tire" text="Tire" />
              <InputText
                id="qualifying_tire"
                :model-value="qualifyingTire"
                placeholder="e.g., Soft"
                size="small"
                :disabled="disabled"
                class="w-32"
                @update:model-value="handleQualifyingTireUpdate"
              />
            </FormInputGroup>
          </div>

          <div>
            <FormInputGroup>
              <FormLabel for="bonus_pole" text="Pole position bonus" />
              <div class="space-y-2">
                <div class="flex items-center gap-2 pt-1">
                  <BaseCheckbox
                    id="bonus_pole"
                    :model-value="qualifyingPole !== null && qualifyingPole > 0"
                    :disabled="disabled"
                    label="Enable pole bonus"
                    @update:model-value="
                      emit('update:qualifyingPole', $event ? 1 : null);
                      if (!$event) emit('update:qualifyingPoleTop10', false);
                    "
                  />
                  <StyledInputNumber
                    v-if="qualifyingPole !== null && qualifyingPole > 0"
                    :model-value="qualifyingPole"
                    :max-fraction-digits="2"
                    :min="1"
                    placeholder="Pts"
                    size="small"
                    fluid
                    :disabled="disabled"
                    class="w-20"
                    @update:model-value="emit('update:qualifyingPole', $event)"
                  />
                </div>
                <div v-if="qualifyingPole !== null && qualifyingPole > 0" class="ml-6">
                  <BaseCheckbox
                    id="bonus_pole_top_10"
                    :model-value="qualifyingPoleTop10"
                    :disabled="disabled"
                    label="Only award if driver finishes in top 10"
                    @update:model-value="emit('update:qualifyingPoleTop10', $event)"
                  />
                </div>
              </div>
            </FormInputGroup>
          </div>
        </div>
      </div>
    </template>

    <!-- Race Details (Only for race types) -->
    <template v-if="!isQualifying">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <!-- Left Column (66% - 2 cols) -->
        <div class="lg:col-span-2 space-y-3">
          <!-- Starting Grid -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Starting Grid</h3>
            <div class="space-y-2.5">
              <!-- Grid Source + Source Race on SAME row (grid-cols-2) -->
              <div class="grid grid-cols-2 gap-3">
                <FormInputGroup>
                  <FormLabel for="grid_source" text="Grid Source" required />
                  <Select
                    id="grid_source"
                    :model-value="gridSource"
                    :options="GRID_SOURCE_OPTIONS"
                    option-label="label"
                    option-value="value"
                    placeholder="Select source"
                    size="small"
                    fluid
                    :disabled="disabled"
                    class="w-full"
                    @update:model-value="emit('update:gridSource', $event)"
                  />
                  <FormError v-if="errors.grid_source">
                    {{ errors.grid_source }}
                  </FormError>
                </FormInputGroup>
                <FormInputGroup
                  v-if="
                    gridSource === 'qualifying' ||
                    gridSource === 'previous_race' ||
                    gridSource === 'reverse_previous'
                  "
                >
                  <FormLabel
                    for="grid_source_race_id"
                    :text="gridSource === 'qualifying' ? 'Select Qualifier' : 'Select Race'"
                  />
                  <Select
                    id="grid_source_race_id"
                    :model-value="gridSourceRaceId"
                    :options="sourceRaceOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="gridSource === 'qualifying' ? 'Select qualifier' : 'Select race'"
                    :invalid="!!errors.grid_source_race_id"
                    size="small"
                    fluid
                    :disabled="disabled"
                    class="w-full"
                    @update:model-value="emit('update:gridSourceRaceId', $event)"
                  />
                  <FormError v-if="errors.grid_source_race_id">
                    {{ errors.grid_source_race_id }}
                  </FormError>
                  <Message v-if="sourceRaceOptions.length === 0" severity="warn" :closable="false">
                    {{
                      gridSource === 'qualifying'
                        ? 'No qualifiers available'
                        : 'No previous races available'
                    }}
                  </Message>
                </FormInputGroup>
              </div>
            </div>
          </div>

          <!-- Race Length -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Race Length</h3>
            <div class="space-y-2.5">
              <!-- Length Type + Length Value on SAME row (grid-cols-2) -->
              <div class="grid grid-cols-2 gap-3">
                <FormInputGroup>
                  <FormLabel text="Length Type" required />
                  <div class="flex gap-4">
                    <div
                      v-for="option in RACE_LENGTH_TYPE_OPTIONS"
                      :key="option.value"
                      class="flex items-center"
                    >
                      <RadioButton
                        :model-value="lengthType"
                        :input-id="`length_type_${option.value}`"
                        :value="option.value"
                        :disabled="disabled"
                        @update:model-value="emit('update:lengthType', $event)"
                      />
                      <label :for="`length_type_${option.value}`" class="ml-2">{{
                        option.label
                      }}</label>
                    </div>
                  </div>
                  <FormError v-if="errors.length_type">
                    {{ errors.length_type }}
                  </FormError>
                </FormInputGroup>
                <FormInputGroup>
                  <FormLabel
                    for="length_value"
                    :text="lengthType === 'laps' ? 'Number of Laps' : 'Duration (minutes)'"
                    required
                  />
                  <StyledInputNumber
                    :model-value="lengthValue"
                    input-id="length_value"
                    :min="1"
                    :max="lengthType === 'laps' ? 999 : 9999"
                    :invalid="!!errors.length_value"
                    size="small"
                    fluid
                    :disabled="disabled"
                    class="w-full"
                    @update:model-value="emit('update:lengthValue', $event)"
                  />
                  <FormError v-if="errors.length_value">
                    {{ errors.length_value }}
                  </FormError>
                </FormInputGroup>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column (33% - 1 col) -->
        <div class="lg:col-span-1 space-y-3">
          <!-- Penalties & Rules -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Penalties & Rules</h3>
            <div class="space-y-2">
              <BaseCheckbox
                id="track_limits_enforced"
                :model-value="trackLimitsEnforced"
                :disabled="disabled"
                label="Track limits enforced"
                @update:model-value="emit('update:trackLimitsEnforced', $event)"
              />
              <BaseCheckbox
                id="false_start_detection"
                :model-value="falseStartDetection"
                :disabled="disabled"
                label="False start detection"
                @update:model-value="emit('update:falseStartDetection', $event)"
              />
              <BaseCheckbox
                id="mandatory_pit_stop"
                :model-value="mandatoryPitStop"
                :disabled="disabled"
                label="Mandatory pit stop"
                @update:model-value="emit('update:mandatoryPitStop', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
