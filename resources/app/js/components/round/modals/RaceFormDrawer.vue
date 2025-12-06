<template>
  <BaseModal
    v-model:visible="localVisible"
    width="4xl"
    :closable="!saving"
    :dismissable-mask="false"
    content-class="bg-slate-50"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">
          {{
            mode === 'edit'
              ? isQualifying
                ? 'Edit Qualifying'
                : 'Edit Race'
              : isQualifying
                ? 'Create Qualifying'
                : 'Create Race'
          }}
        </h2>
      </div>
    </template>

    <div class="space-y-3">
      <!-- Top Section: Race Type + Race Name -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <!-- Race Type (20% width) -->
        <div class="md:col-span-1">
          <FormLabel for="race_type" text="Race Type" required />
          <Select
            id="race_type"
            v-model="form.race_type"
            :options="RACE_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            placeholder="Select type"
            :invalid="!!errors.race_type"
            size="small"
            fluid
            class="w-full"
          />
          <FormError :error="errors.race_type" />
          <small v-if="mode === 'edit'" class="text-xs text-gray-500">
            Changing type will adjust available fields
          </small>
        </div>

        <!-- Race Name (80% width) -->
        <div class="md:col-span-4 space-y-1">
          <FormLabel for="name" text="Race Name" />
          <InputText
            id="name"
            v-model="form.name"
            :invalid="!!errors.name"
            placeholder="e.g., Sprint Race, Feature Race"
            size="small"
            class="w-full"
          />
          <FormOptionalText :show-optional="false" text="Custom name for this race" />
          <FormError :error="errors.name" />
        </div>
      </div>

      <!-- Section: Qualifying Configuration (Only for qualifying type) -->
      <Accordion v-if="isQualifying" :value="['0']" :multiple="true">
        <AccordionPanel value="0">
          <AccordionHeader>Qualifying Configuration</AccordionHeader>
          <AccordionContent
            :pt="{
              root: { class: 'bg-inherit' },
              content: { class: 'p-4 bg-inherit border border-slate-200 rounded-b bg-surface-50' },
            }"
          >
            <div class="flex flex-row gap-4">
              <div class="flex-grow">
                <FormLabel for="qualifying_format" text="Format" required />
                <Select
                  id="qualifying_format"
                  v-model="form.qualifying_format"
                  :options="QUALIFYING_FORMAT_OPTIONS"
                  option-label="label"
                  option-value="value"
                  placeholder="Select format"
                  size="small"
                  fluid
                  class="w-full"
                />
              </div>

              <!-- Qualifying Length -->
              <div>
                <FormLabel for="qualifying_length" text="Length (min)" />
                <InputNumber
                  id="qualifying_length"
                  v-model="form.qualifying_length"
                  :min="1"
                  :max="999"
                  :invalid="!!errors.qualifying_length"
                  size="small"
                  fluid
                  class="w-24"
                />
                <FormError :error="errors.qualifying_length" />
              </div>

              <!-- Qualifying Tire -->
              <div>
                <FormLabel for="qualifying_tire" text="Tire" />
                <InputText
                  id="qualifying_tire"
                  v-model="form.qualifying_tire"
                  placeholder="e.g., Soft"
                  size="small"
                  class="w-32"
                />
              </div>

              <div class="space-y-2">
                <label for="bonus_pole" class="text-sm font-medium text-gray-900"
                  >Pole position bonus</label
                >
                <div class="space-y-2">
                  <div class="flex items-center gap-2 pt-1">
                    <Checkbox id="bonus_pole" v-model="hasQualifyingPole" :binary="true" />
                    <label for="bonus_pole" class="text-sm">Enable pole bonus</label>
                    <InputNumber
                      v-if="hasQualifyingPole"
                      v-model="form.qualifying_pole"
                      :min="1"
                      placeholder="Pts"
                      size="small"
                      fluid
                      class="w-20"
                    />
                  </div>
                  <div
                    v-if="hasQualifyingPole && form.qualifying_pole && form.qualifying_pole > 0"
                    class="ml-6"
                  >
                    <Checkbox
                      id="bonus_pole_top_10"
                      v-model="form.qualifying_pole_top_10"
                      :binary="true"
                    />
                    <label for="bonus_pole_top_10" class="ml-2 text-sm"
                      >Only award if driver finishes in top 10</label
                    >
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section: Race Details (Only for race types) -->
      <Accordion v-if="!isQualifying" :value="['0']" :multiple="true">
        <AccordionPanel value="0">
          <AccordionHeader>Race Details</AccordionHeader>
          <AccordionContent>
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
                          v-model="form.grid_source"
                          :options="GRID_SOURCE_OPTIONS"
                          option-label="label"
                          option-value="value"
                          placeholder="Select source"
                          size="small"
                          fluid
                          class="w-full"
                        />
                      </FormInputGroup>
                      <FormInputGroup v-if="requiresGridSourceRace">
                        <FormLabel for="grid_source_race_id" :text="sourceRaceLabel" />
                        <Select
                          id="grid_source_race_id"
                          v-model="form.grid_source_race_id"
                          :options="sourceRaceOptions"
                          option-label="label"
                          option-value="value"
                          :placeholder="
                            form.grid_source === 'qualifying' ? 'Select qualifier' : 'Select race'
                          "
                          :invalid="!!errors.grid_source_race_id"
                          size="small"
                          fluid
                          class="w-full"
                        />
                        <FormError :error="errors.grid_source_race_id" />
                        <Message
                          v-if="sourceRaceOptions.length === 0"
                          severity="warn"
                          :closable="false"
                        >
                          {{
                            form.grid_source === 'qualifying'
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
                              v-model="form.length_type"
                              :input-id="`length_type_${option.value}`"
                              :value="option.value"
                            />
                            <label :for="`length_type_${option.value}`" class="ml-2">{{
                              option.label
                            }}</label>
                          </div>
                        </div>
                      </FormInputGroup>
                      <FormInputGroup>
                        <FormLabel
                          for="length_value"
                          :text="
                            form.length_type === 'laps' ? 'Number of Laps' : 'Duration (minutes)'
                          "
                          required
                        />
                        <InputNumber
                          id="length_value"
                          v-model="form.length_value"
                          :min="1"
                          :max="form.length_type === 'laps' ? 999 : 9999"
                          :invalid="!!errors.length_value"
                          size="small"
                          fluid
                          class="w-full"
                        />
                        <FormError :error="errors.length_value" />
                      </FormInputGroup>
                    </div>
                    <!-- Extra lap after time checkbox -->
                    <div class="flex items-center gap-2 hidden">
                      <Checkbox
                        id="extra_lap_after_time"
                        v-model="form.extra_lap_after_time"
                        :binary="true"
                      />
                      <label for="extra_lap_after_time"
                        >Complete current lap after time expires</label
                      >
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
                    <div class="flex items-center gap-2">
                      <Checkbox
                        id="track_limits_enforced"
                        v-model="form.track_limits_enforced"
                        :binary="true"
                      />
                      <label for="track_limits_enforced">Track limits enforced</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <Checkbox
                        id="false_start_detection"
                        v-model="form.false_start_detection"
                        :binary="true"
                      />
                      <label for="false_start_detection">False start detection</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <Checkbox
                        id="mandatory_pit_stop"
                        v-model="form.mandatory_pit_stop"
                        :binary="true"
                      />
                      <label for="mandatory_pit_stop">Mandatory pit stop</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section: Points (Only for race types) -->
      <Accordion v-if="!isQualifying" :value="['0']" :multiple="true">
        <AccordionPanel value="0">
          <AccordionHeader>Points</AccordionHeader>
          <AccordionContent>
            <div class="space-y-3">
              <!-- Race Points Toggle -->
              <FormInputGroup>
                <FormLabel text="Race Points" />
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <ToggleSwitch
                      id="race_points"
                      v-model="form.race_points"
                      aria-label="Enable race points"
                    />
                    <label for="race_points" class="text-sm font-medium"
                      >Enable race-level points calculation</label
                    >
                  </div>
                  <FormOptionalText
                    :show-optional="false"
                    text="When enabled, race results create standings using this race's points system"
                  />
                </div>
              </FormInputGroup>

              <!-- Points System Section - Only show when race_points is enabled -->
              <div v-if="form.race_points" class="space-y-3">
                <!-- Horizontal Rule -->
                <hr class="border-gray-300" />

                <!-- 2/3 - 1/3 Layout: Points System + Bonuses -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <!-- Left Column (66% width): Points System -->
                  <div class="lg:col-span-2">
                    <FormInputGroup>
                      <div class="bg-white rounded-lg border border-gray-200 p-4">
                        <div class="grid grid-cols-5 gap-3">
                          <InputGroup
                            v-for="position in Object.keys(form.points_system).map(Number)"
                            :key="position"
                          >
                            <InputGroupAddon class="bg-slate-100">P{{ position }}</InputGroupAddon>
                            <InputNumber
                              :id="`position_${position}`"
                              v-model="form.points_system[position]"
                              :max-fraction-digits="2"
                              :min="0"
                              :max="999"
                              size="small"
                              fluid
                              class="w-full"
                            />
                          </InputGroup>
                        </div>
                        <div class="mt-3 flex gap-2">
                          <Button
                            label="Add Position"
                            icon="pi pi-plus"
                            size="small"
                            severity="success"
                            outlined
                            @click="addPointsPosition"
                          />
                          <Button
                            label="Remove Last"
                            icon="pi pi-trash"
                            size="small"
                            severity="danger"
                            outlined
                            :disabled="Object.keys(form.points_system).length <= 1"
                            @click="removeLastPointsPosition"
                          />
                          <!-- Copy Round Points (only for Race #1) -->
                          <Button
                            v-if="isFirstRace"
                            label="Copy Round Points"
                            icon="pi pi-copy"
                            size="small"
                            severity="secondary"
                            outlined
                            :disabled="!canCopyRoundPoints"
                            @click="copyRoundPoints"
                          />
                          <!-- Copy Race 1 Points (only for Race #2+) -->
                          <Button
                            v-if="!isFirstRace && !isQualifying"
                            label="Copy Race 1 Points"
                            icon="pi pi-copy"
                            size="small"
                            severity="secondary"
                            outlined
                            :disabled="!canCopyRace1Points"
                            @click="copyRace1Points"
                          />
                        </div>
                      </div>
                      <FormError :error="errors.points_system" />
                    </FormInputGroup>
                  </div>

                  <!-- Right Column (33% width): Bonuses -->
                  <div class="lg:col-span-1 space-y-3">
                    <!-- Fastest Lap Bonus -->
                    <FormInputGroup>
                      <FormLabel text="Fastest Lap Bonus" />
                      <div class="space-y-2">
                        <div class="flex items-center gap-2">
                          <Checkbox
                            id="bonus_fastest_lap"
                            v-model="hasFastestLapBonus"
                            :binary="true"
                          />
                          <label for="bonus_fastest_lap" class="text-sm"
                            >Enable fastest lap bonus</label
                          >
                          <InputNumber
                            v-if="hasFastestLapBonus"
                            v-model="form.fastest_lap"
                            :min="1"
                            :max="99"
                            fluid
                            placeholder="Pts"
                            size="small"
                            class="w-20"
                          />
                        </div>
                        <div
                          v-if="hasFastestLapBonus && form.fastest_lap && form.fastest_lap > 0"
                          class="ml-6"
                        >
                          <Checkbox
                            id="bonus_fastest_lap_top_10"
                            v-model="form.fastest_lap_top_10"
                            :binary="true"
                          />
                          <label for="bonus_fastest_lap_top_10" class="ml-2 text-sm"
                            >Only award if driver finishes in top 10</label
                          >
                        </div>
                      </div>
                      <FormOptionalText
                        :show-optional="false"
                        text="Award points for fastest lap in this race"
                      />
                    </FormInputGroup>

                    <hr class="border-gray-300" />

                    <!-- DNF Points -->
                    <FormInputGroup>
                      <FormLabel for="dnf_points" text="DNF Points" />
                      <InputNumber
                        id="dnf_points"
                        v-model="form.dnf_points"
                        :min="0"
                        :max="99"
                        size="small"
                        fluid
                        class="w-full"
                      />
                      <small class="text-xs text-gray-500">Points awarded for Did Not Finish</small>
                    </FormInputGroup>
                  </div>
                </div>
              </div>

              <!-- Horizontal Rule -->
              <hr v-if="!form.race_points" class="border-gray-300" />

              <!-- Bonus Points Section (shown when race_points is disabled) -->
              <div v-if="!form.race_points" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Fastest Lap Bonus (for non-qualifying races) -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-2">Bonus Points</h3>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <Checkbox
                        id="bonus_fastest_lap_disabled"
                        v-model="hasFastestLapBonus"
                        :binary="true"
                      />
                      <label for="bonus_fastest_lap_disabled" class="text-sm">Fastest lap</label>
                      <InputNumber
                        v-if="hasFastestLapBonus"
                        v-model="form.fastest_lap"
                        :min="1"
                        placeholder="Pts"
                        size="small"
                        class="w-20"
                      />
                    </div>
                    <div
                      v-if="hasFastestLapBonus && form.fastest_lap && form.fastest_lap > 0"
                      class="ml-6"
                    >
                      <Checkbox
                        id="bonus_fastest_lap_top_10_disabled"
                        v-model="form.fastest_lap_top_10"
                        :binary="true"
                      />
                      <label for="bonus_fastest_lap_top_10_disabled" class="ml-2 text-sm"
                        >Only award if driver finishes in top 10</label
                      >
                    </div>
                  </div>
                </div>

                <!-- DNF/DNS Points -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-2">DNF Points</h3>
                  <div class="grid grid-cols-2 gap-2">
                    <FormInputGroup>
                      <FormLabel for="dnf_points_disabled" text="DNF" />
                      <InputNumber
                        id="dnf_points_disabled"
                        v-model="form.dnf_points"
                        :min="0"
                        :max="99"
                        size="small"
                        fluid
                      />
                      <small class="text-xs text-gray-500">Did Not Finish</small>
                    </FormInputGroup>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section: Notes (Only for race types) -->
      <Accordion v-if="!isQualifying" :value="['0']" :multiple="true">
        <AccordionPanel value="0">
          <AccordionHeader>Notes</AccordionHeader>
          <AccordionContent>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <!-- Left Column (66% - 2 cols) -->
              <div class="lg:col-span-2">
                <FormInputGroup>
                  <FormLabel for="race_notes" text="Race Notes" />
                  <Textarea
                    id="race_notes"
                    v-model="form.race_notes"
                    rows="4"
                    placeholder="Additional race notes, special rules, etc."
                    class="w-full"
                  />
                  <FormOptionalText text="Additional race notes, special rules, etc." />
                </FormInputGroup>
              </div>

              <!-- Right Column (33% - 1 col) -->
              <div class="lg:col-span-1">
                <!-- Empty -->
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="saving"
          @click="handleCancel"
        />
        <Button
          :label="
            mode === 'edit'
              ? isQualifying
                ? 'Update Qualifying'
                : 'Update Race'
              : isQualifying
                ? 'Create Qualifying'
                : 'Create Race'
          "
          :loading="saving"
          @click="handleSave"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRaceStore } from '@app/stores/raceStore';
import { useRoundStore } from '@app/stores/roundStore';
import { useRaceSettingsStore } from '@app/stores/raceSettingsStore';
import { useRaceValidation } from '@app/composables/useRaceValidation';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import RadioButton from 'primevue/radiobutton';
import ToggleSwitch from 'primevue/toggleswitch';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Message from 'primevue/message';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import type {
  Race,
  RaceForm,
  CreateRaceRequest,
  UpdateRaceRequest,
  PlatformRaceSettings,
} from '@app/types/race';
import type { PointsSystemMap } from '@app/types/round';
import {
  RACE_TYPE_OPTIONS,
  QUALIFYING_FORMAT_OPTIONS,
  GRID_SOURCE_OPTIONS,
  RACE_LENGTH_TYPE_OPTIONS,
  F1_STANDARD_POINTS,
} from '@app/types/race';

interface Props {
  visible: boolean;
  roundId: number;
  platformId: number;
  race?: Race | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  race: null,
  mode: 'create',
});

const emit = defineEmits<Emits>();

const raceStore = useRaceStore();
const roundStore = useRoundStore();
const raceSettingsStore = useRaceSettingsStore();
const toast = useToast();

const form = reactive<RaceForm>({
  race_number: 1,
  name: '',
  race_type: 'sprint',
  qualifying_format: 'standard',
  qualifying_length: 15,
  qualifying_tire: '',
  grid_source: 'qualifying',
  grid_source_race_id: null,
  length_type: 'laps',
  length_value: 20,
  extra_lap_after_time: false,
  weather: '',
  tire_restrictions: '',
  fuel_usage: '',
  damage_model: '',
  track_limits_enforced: true,
  false_start_detection: true,
  collision_penalties: true,
  mandatory_pit_stop: false,
  minimum_pit_time: 0,
  assists_restrictions: '',
  race_points: false,
  points_system: { ...F1_STANDARD_POINTS },
  fastest_lap: 1,
  fastest_lap_top_10: false,
  qualifying_pole: 1,
  qualifying_pole_top_10: false,
  dnf_points: 0,
  dns_points: 0,
  race_notes: '',
});

const isQualifying = computed(() => form.race_type === 'qualifying');

// Pass the reactive computed ref to useRaceValidation so validation adapts dynamically
const { errors, validateAll, clearErrors } = useRaceValidation(form, isQualifying);

// Watch for race type changes and apply appropriate defaults
watch(
  () => form.race_type,
  (newType, oldType) => {
    // Only apply defaults when type changes (not on initial load)
    if (oldType !== null && newType !== oldType) {
      if (newType === 'qualifying') {
        // Switching to qualifying - apply qualifying defaults
        form.qualifying_format = 'standard';
        form.qualifying_length = 15;
        form.grid_source = 'qualifying';
        form.grid_source_race_id = null;
        form.length_type = 'time';
        form.length_value = form.qualifying_length;
        form.extra_lap_after_time = false;
        form.mandatory_pit_stop = false;
        form.minimum_pit_time = 0;
        // Clear race-specific errors
        clearErrors();
      } else if (oldType === 'qualifying') {
        // Switching from qualifying to race - apply race defaults
        form.grid_source = 'qualifying';
        form.grid_source_race_id = null;
        form.length_type = 'laps';
        form.length_value = 20;
        form.extra_lap_after_time = false;
        // Clear qualifying-specific errors
        clearErrors();
      }
    }
  },
);

const saving = ref(false);
const platformSettings = ref<PlatformRaceSettings | null>(null);
const loadingSettings = ref(false);

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const requiresGridSourceRace = computed(() => {
  return (
    form.grid_source === 'qualifying' ||
    form.grid_source === 'previous_race' ||
    form.grid_source === 'reverse_previous'
  );
});

const availableQualifiers = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  return races
    .filter((race) => race.is_qualifier && race.id !== props.race?.id)
    .map((race) => ({
      value: race.id,
      label: race.name ? race.name : 'Qualifying',
    }));
});

const availableRaces = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  return races
    .filter((race) => !race.is_qualifier && race.id !== props.race?.id)
    .map((race) => ({
      value: race.id,
      label: `Race ${race.race_number}${race.name ? ` - ${race.name}` : ''}`,
    }));
});

const sourceRaceOptions = computed(() => {
  if (form.grid_source === 'qualifying') {
    return availableQualifiers.value;
  } else if (form.grid_source === 'previous_race' || form.grid_source === 'reverse_previous') {
    return availableRaces.value;
  }
  return [];
});

const sourceRaceLabel = computed(() => {
  if (form.grid_source === 'qualifying') {
    return 'Select Qualifier';
  } else if (form.grid_source === 'previous_race' || form.grid_source === 'reverse_previous') {
    return 'Select Race';
  }
  return 'Source Race';
});

// Computed property for fastest lap bonus checkbox
const hasFastestLapBonus = computed({
  get: () => form.fastest_lap !== null && form.fastest_lap > 0,
  set: (enabled: boolean) => {
    if (enabled) {
      form.fastest_lap = 1;
    } else {
      form.fastest_lap = null;
      form.fastest_lap_top_10 = false;
    }
  },
});

// Computed property for qualifying pole bonus checkbox
const hasQualifyingPole = computed({
  get: () => form.qualifying_pole !== null && form.qualifying_pole > 0,
  set: (enabled: boolean) => {
    if (enabled) {
      form.qualifying_pole = 1;
    } else {
      form.qualifying_pole = null;
      form.qualifying_pole_top_10 = false;
    }
  },
});

// Computed property to check if this is the first race (race_number === 1)
const isFirstRace = computed(() => {
  if (props.mode === 'create') {
    // In create mode, check how many non-qualifier races exist in this round
    const races = raceStore.racesByRoundId(props.roundId);
    const nonQualifierRaces = races.filter((race) => !race.is_qualifier);
    return nonQualifierRaces.length === 0; // This will be the first race
  } else if (props.race) {
    // In edit mode, check the race_number
    return props.race.race_number === 1;
  }
  return false;
});

// Get the current round
const currentRound = computed(() => {
  return roundStore.getRoundById(props.roundId);
});

// Check if round points system is available
const canCopyRoundPoints = computed(() => {
  const round = currentRound.value;
  if (!round || !round.points_system) {
    return false;
  }
  try {
    const parsed = JSON.parse(round.points_system) as PointsSystemMap;
    return Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
});

// Get race 1 (first non-qualifier race) for this round
const race1 = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  const nonQualifierRaces = races
    .filter((race) => !race.is_qualifier)
    .sort((a, b) => a.race_number - b.race_number);
  return nonQualifierRaces[0] || null;
});

// Check if race 1 points system is available
const canCopyRace1Points = computed(() => {
  const firstRace = race1.value;
  if (!firstRace || !firstRace.race_points) {
    return false;
  }
  return Object.keys(firstRace.points_system).length > 0;
});

// Function to copy round points to race
function copyRoundPoints(): void {
  const round = currentRound.value;
  if (!round || !round.points_system) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Round points system is not available',
      life: 3000,
    });
    return;
  }

  try {
    const roundPoints = JSON.parse(round.points_system) as PointsSystemMap;
    form.points_system = { ...roundPoints };
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Round points copied successfully',
      life: 3000,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to parse round points system',
      life: 3000,
    });
  }
}

// Function to copy race 1 points to current race
function copyRace1Points(): void {
  const firstRace = race1.value;
  if (!firstRace || !firstRace.race_points) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Race 1 points system is not available',
      life: 3000,
    });
    return;
  }

  form.points_system = { ...firstRace.points_system };
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Race 1 points copied successfully',
    life: 3000,
  });
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      clearErrors();
      await loadPlatformSettings();
      if (props.race) {
        loadRaceIntoForm(props.race);
      } else {
        resetForm();
      }
    }
  },
);

// Watch for changes to the race prop (e.g., when switching between edit races)
watch(
  () => props.race,
  (newRace) => {
    if (newRace && props.visible) {
      loadRaceIntoForm(newRace);
    }
  },
  { deep: true },
);

async function loadPlatformSettings(): Promise<void> {
  loadingSettings.value = true;
  try {
    platformSettings.value = await raceSettingsStore.fetchRaceSettings(props.platformId);
  } catch (error) {
    console.error('Failed to load platform settings:', error);
  } finally {
    loadingSettings.value = false;
  }
}

function loadRaceIntoForm(race: Race): void {
  // Clear errors first to prevent stale validation messages
  clearErrors();

  form.race_number = race.race_number;
  form.name = race.name || '';
  form.race_type = race.race_type;
  form.qualifying_format = race.qualifying_format;
  form.qualifying_length = race.qualifying_length || 15;
  form.qualifying_tire = race.qualifying_tire || '';
  form.grid_source = race.grid_source;
  form.grid_source_race_id = race.grid_source_race_id;
  form.length_type = race.length_type;
  form.length_value = race.length_value;
  form.extra_lap_after_time = race.extra_lap_after_time;
  form.weather = race.weather || '';
  form.tire_restrictions = race.tire_restrictions || '';
  form.fuel_usage = race.fuel_usage || '';
  form.damage_model = race.damage_model || '';
  form.track_limits_enforced = race.track_limits_enforced;
  form.false_start_detection = race.false_start_detection;
  form.collision_penalties = race.collision_penalties;
  form.mandatory_pit_stop = race.mandatory_pit_stop;
  form.minimum_pit_time = race.minimum_pit_time || 0;
  form.assists_restrictions = race.assists_restrictions || '';
  form.race_points = race.race_points;
  form.points_system = { ...race.points_system };
  form.fastest_lap = race.fastest_lap;
  form.fastest_lap_top_10 = race.fastest_lap_top_10;
  form.qualifying_pole = race.qualifying_pole;
  form.qualifying_pole_top_10 = race.qualifying_pole_top_10;
  form.dnf_points = race.dnf_points;
  form.dns_points = race.dns_points;
  form.race_notes = race.race_notes || '';
}

function resetForm(): void {
  form.race_number = 1;
  form.name = '';
  form.race_type = 'sprint';
  form.qualifying_format = 'standard';
  form.qualifying_length = 15;
  form.qualifying_tire = '';
  form.grid_source = 'qualifying';
  form.grid_source_race_id = null;
  form.length_type = 'laps';
  form.length_value = 20;
  form.extra_lap_after_time = false;
  form.weather = '';
  form.tire_restrictions = '';
  form.fuel_usage = '';
  form.damage_model = '';
  form.track_limits_enforced = true;
  form.false_start_detection = true;
  form.collision_penalties = true;
  form.mandatory_pit_stop = false;
  form.minimum_pit_time = 0;
  form.assists_restrictions = '';
  form.race_points = false;
  form.points_system = { ...F1_STANDARD_POINTS };
  form.fastest_lap = 1;
  form.fastest_lap_top_10 = false;
  form.qualifying_pole = 1;
  form.qualifying_pole_top_10 = false;
  form.dnf_points = 0;
  form.dns_points = 0;
  form.race_notes = '';
}

function addPointsPosition(): void {
  const keys = Object.keys(form.points_system);
  // Guard against empty object - start at position 1 if empty
  const maxPosition = keys.length > 0 ? Math.max(...keys.map(Number)) : 0;
  form.points_system[maxPosition + 1] = 0;
}

function removeLastPointsPosition(): void {
  const positions = Object.keys(form.points_system)
    .map(Number)
    .sort((a, b) => a - b);
  if (positions.length > 1) {
    const lastPosition = positions[positions.length - 1];
    if (lastPosition !== undefined) {
      const newSystem = { ...form.points_system };
      delete newSystem[lastPosition];
      form.points_system = newSystem;
    }
  }
}

async function handleSave(): Promise<void> {
  const validationResult = validateAll();

  if (!validationResult) {
    return;
  }

  saving.value = true;
  try {
    // Build payload conditionally based on whether this is a qualifier or race
    const payload: CreateRaceRequest | UpdateRaceRequest = isQualifying.value
      ? {
          // Qualifier-specific payload
          race_number: 0, // Signal to backend this is a qualifier
          name: form.name.trim() || null,
          // Omit race_type for qualifiers
          qualifying_format: form.qualifying_format,
          qualifying_length:
            form.qualifying_format !== 'none' && form.qualifying_format !== 'previous_race'
              ? form.qualifying_length
              : null,
          qualifying_tire: form.qualifying_tire.trim() || null,
          // Qualifiers always use qualifying as grid source
          grid_source: 'qualifying',
          // Omit grid_source_race_id for qualifiers
          length_type: 'time',
          length_value: form.qualifying_length,
          extra_lap_after_time: false,
          weather: form.weather.trim() || null,
          tire_restrictions: form.tire_restrictions.trim() || null,
          fuel_usage: form.fuel_usage.trim() || null,
          damage_model: form.damage_model.trim() || null,
          // Omit penalty fields for qualifiers - they will be set to defaults in backend
          assists_restrictions: form.assists_restrictions.trim() || null,
          race_points: form.race_points,
          points_system: form.points_system,
          fastest_lap: null,
          fastest_lap_top_10: false,
          qualifying_pole: form.qualifying_pole,
          qualifying_pole_top_10: form.qualifying_pole_top_10,
          dnf_points: form.dnf_points,
          dns_points: form.dns_points,
          race_notes: form.race_notes.trim() || null,
        }
      : {
          // Regular race payload
          name: form.name.trim() || null,
          race_type: form.race_type || null,
          qualifying_format: null,
          qualifying_length: null,
          qualifying_tire: null,
          grid_source: form.grid_source,
          grid_source_race_id: requiresGridSourceRace.value
            ? form.grid_source_race_id || null
            : null,
          length_type: form.length_type,
          length_value: form.length_value,
          extra_lap_after_time: form.extra_lap_after_time,
          weather: form.weather.trim() || null,
          tire_restrictions: form.tire_restrictions.trim() || null,
          fuel_usage: form.fuel_usage.trim() || null,
          damage_model: form.damage_model.trim() || null,
          track_limits_enforced: form.track_limits_enforced,
          false_start_detection: form.false_start_detection,
          collision_penalties: form.collision_penalties,
          mandatory_pit_stop: form.mandatory_pit_stop,
          minimum_pit_time: form.mandatory_pit_stop ? form.minimum_pit_time : null,
          assists_restrictions: form.assists_restrictions.trim() || null,
          race_points: form.race_points,
          points_system: form.points_system,
          fastest_lap: form.fastest_lap,
          fastest_lap_top_10: form.fastest_lap_top_10,
          qualifying_pole: null,
          qualifying_pole_top_10: false,
          dnf_points: form.dnf_points,
          dns_points: form.dns_points,
          race_notes: form.race_notes.trim() || null,
        };

    if (props.mode === 'edit' && props.race) {
      // Include race_number for edit mode
      const updatePayload = {
        ...payload,
        race_number: form.race_number,
      };
      await raceStore.updateExistingRace(props.race.id, updatePayload, isQualifying.value);
    } else {
      // Don't include race_number for create mode - backend will auto-generate
      await raceStore.createNewRace(props.roundId, payload as CreateRaceRequest);
    }

    emit('saved');
    localVisible.value = false;
  } catch (error) {
    console.error('[RaceFormDrawer] Failed to save race:', error);
  } finally {
    saving.value = false;
  }
}

function handleCancel(): void {
  emit('cancel');
  localVisible.value = false;
}
</script>
