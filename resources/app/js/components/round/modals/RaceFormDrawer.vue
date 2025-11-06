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
          <Dropdown
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
                <Dropdown
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
                <div class="flex items-center gap-2 pt-1">
                  <Checkbox id="bonus_pole" v-model="form.bonus_pole" :binary="true" />
                  <InputNumber
                    v-if="form.bonus_pole"
                    v-model="form.bonus_pole_points"
                    :min="1"
                    :max="99"
                    placeholder="Points"
                    size="small"
                    fluid
                    class="w-12"
                  />
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
                        <Dropdown
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
                        <Dropdown
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
                    <div class="flex items-center gap-2">
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

                <!-- Division Support -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-2">Division Support</h3>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <Checkbox id="race_divisions" v-model="form.race_divisions" :binary="true" />
                      <label for="race_divisions">Enable separate results per division</label>
                    </div>
                    <Message severity="info" :closable="false">
                      When enabled, race results and points will be tracked separately for each
                      division in the season.
                    </Message>
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
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <!-- Left Column (66% - 2 cols) -->
              <div class="lg:col-span-2 space-y-3">
                <!-- Points System -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-2">Points System</h3>
                  <div class="space-y-3">
                    <!-- Points Template radio buttons -->
                    <FormInputGroup>
                      <FormLabel text="Points Template" required />
                      <div class="flex gap-4">
                        <div class="flex items-center">
                          <RadioButton
                            v-model="form.points_template"
                            input-id="points_f1"
                            value="f1"
                            @change="applyF1Points"
                          />
                          <label for="points_f1" class="ml-2">F1 Standard (25-18-15...)</label>
                        </div>
                        <div class="flex items-center">
                          <RadioButton
                            v-model="form.points_template"
                            input-id="points_custom"
                            value="custom"
                          />
                          <label for="points_custom" class="ml-2">Custom Points</label>
                        </div>
                      </div>
                    </FormInputGroup>

                    <!-- Custom Points Table -->
                    <FormInputGroup v-if="form.points_template === 'custom'">
                      <FormLabel text="Custom Points Table" />
                      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <DataTable
                          :value="pointsTableData"
                          edit-mode="cell"
                          class="p-datatable-sm"
                          :pt="{
                            root: { class: 'border-0' },
                          }"
                        >
                          <Column field="position" header="Position" style="width: 40%" />
                          <Column field="points" header="Points" style="width: 40%">
                            <template #editor="{ data }">
                              <InputNumber
                                v-model="data.points"
                                :min="0"
                                size="small"
                                class="w-full"
                              />
                            </template>
                          </Column>
                          <Column style="width: 20%">
                            <template #body="{ index }">
                              <div class="flex gap-1">
                                <Button
                                  icon="pi pi-plus"
                                  size="small"
                                  text
                                  severity="success"
                                  @click="addPointsPosition"
                                />
                                <Button
                                  icon="pi pi-trash"
                                  size="small"
                                  severity="danger"
                                  text
                                  @click="removePointsPosition(index)"
                                />
                              </div>
                            </template>
                          </Column>
                        </DataTable>
                      </div>
                      <FormError :error="errors.points_system" />
                    </FormInputGroup>

                    <!-- Points Breakdown -->
                    <FormInputGroup>
                      <FormLabel text="Points Breakdown" />
                      <div class="bg-white rounded-lg border border-gray-200 p-3">
                        <div class="grid grid-cols-5 gap-2 text-sm">
                          <div
                            v-for="(points, position) in form.points_system"
                            :key="position"
                            class="flex items-center gap-1"
                          >
                            <span class="font-semibold text-gray-700">P{{ position }}:</span>
                            <span class="text-gray-900">{{ points }}</span>
                          </div>
                        </div>
                      </div>
                    </FormInputGroup>
                  </div>
                </div>
              </div>

              <!-- Right Column (33% - 1 col) -->
              <div class="lg:col-span-1 space-y-3">
                <!-- Bonus Points -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-2">Bonus Points</h3>
                  <div class="space-y-2">
                    <!-- Fastest Lap Bonus -->
                    <div v-if="showFastestLapBonus" class="space-y-2">
                      <div class="flex items-center gap-2">
                        <Checkbox
                          id="bonus_fastest_lap"
                          v-model="form.bonus_fastest_lap"
                          :binary="true"
                        />
                        <label for="bonus_fastest_lap" class="text-sm">Fastest lap</label>
                        <InputNumber
                          v-if="form.bonus_fastest_lap"
                          v-model="form.bonus_fastest_lap_points"
                          :min="1"
                          :max="99"
                          placeholder="Pts"
                          size="small"
                          class="w-20"
                        />
                      </div>
                      <div v-if="form.bonus_fastest_lap" class="ml-6">
                        <Checkbox
                          id="bonus_fastest_lap_top_10"
                          v-model="form.bonus_fastest_lap_top_10"
                          :binary="true"
                        />
                        <label for="bonus_fastest_lap_top_10" class="ml-2 text-sm"
                          >Only award if driver finishes in top 10</label
                        >
                      </div>
                    </div>
                    <!-- Message when round has fastest lap configured -->
                    <Message v-if="roundHasFastestLap" severity="info" :closable="false">
                      Fastest lap bonus is configured at the round level and will apply to all races
                      in this round.
                    </Message>
                  </div>
                </div>

                <!-- DNF/DNS Points -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-2">DNF/DNS Points</h3>
                  <div class="space-y-2">
                    <!-- DNF and DNS on SAME row (grid-cols-2) -->
                    <div class="grid grid-cols-2 gap-2">
                      <FormInputGroup>
                        <FormLabel for="dnf_points" text="DNF" />
                        <InputNumber
                          id="dnf_points"
                          v-model="form.dnf_points"
                          :min="0"
                          :max="99"
                          size="small"
                          fluid
                        />
                        <small class="text-xs text-gray-500">Did Not Finish</small>
                      </FormInputGroup>
                      <FormInputGroup>
                        <FormLabel for="dns_points" text="DNS" />
                        <InputNumber
                          id="dns_points"
                          v-model="form.dns_points"
                          :min="0"
                          :max="99"
                          size="small"
                          fluid
                        />
                        <small class="text-xs text-gray-500">Did Not Start</small>
                      </FormInputGroup>
                    </div>
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
import { useRaceStore } from '@app/stores/raceStore';
import { useRaceSettingsStore } from '@app/stores/raceSettingsStore';
import { useRoundStore } from '@app/stores/roundStore';
import { useRaceValidation } from '@app/composables/useRaceValidation';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import RadioButton from 'primevue/radiobutton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
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
  BonusPoints,
} from '@app/types/race';
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
const raceSettingsStore = useRaceSettingsStore();
const roundStore = useRoundStore();

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
  race_divisions: false,
  points_template: 'f1',
  points_system: { ...F1_STANDARD_POINTS },
  bonus_pole: false,
  bonus_pole_points: 1,
  bonus_fastest_lap: false,
  bonus_fastest_lap_points: 1,
  bonus_fastest_lap_top_10: true,
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

const pointsTableData = computed({
  get: () => {
    return Object.entries(form.points_system)
      .map(([position, points]) => ({
        position: parseInt(position),
        points,
      }))
      .sort((a, b) => a.position - b.position);
  },
  set: (value) => {
    const newPointsSystem: Record<number, number> = {};
    value.forEach((item) => {
      newPointsSystem[item.position] = item.points;
    });
    form.points_system = newPointsSystem;
  },
});

// Check if the parent round has fastest lap bonus configured
const roundHasFastestLap = computed(() => {
  const round = roundStore.getRoundById(props.roundId);
  return round && round.fastest_lap !== null && round.fastest_lap > 0;
});

// If round has fastest lap configured, hide the race-level fastest lap bonus
const showFastestLapBonus = computed(() => {
  return !isQualifying.value && !roundHasFastestLap.value;
});

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
  form.race_divisions = race.race_divisions;
  form.points_system = { ...race.points_system };
  form.dnf_points = race.dnf_points;
  form.dns_points = race.dns_points;
  form.race_notes = race.race_notes || '';

  // Determine points template
  const isF1Standard = JSON.stringify(race.points_system) === JSON.stringify(F1_STANDARD_POINTS);
  form.points_template = isF1Standard ? 'f1' : 'custom';

  // Load bonus points - reset first to ensure clean state
  form.bonus_pole = false;
  form.bonus_pole_points = 1;
  form.bonus_fastest_lap = false;
  form.bonus_fastest_lap_points = 1;
  form.bonus_fastest_lap_top_10 = true;

  if (race.bonus_points) {
    form.bonus_pole = !!race.bonus_points.pole;
    form.bonus_pole_points = race.bonus_points.pole || 1;
    form.bonus_fastest_lap = !!race.bonus_points.fastest_lap;
    form.bonus_fastest_lap_points = race.bonus_points.fastest_lap || 1;
    form.bonus_fastest_lap_top_10 = race.bonus_points.fastest_lap_top_10_only || false;
  }
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
  form.race_divisions = false;
  form.points_template = 'f1';
  form.points_system = { ...F1_STANDARD_POINTS };
  form.bonus_pole = false;
  form.bonus_pole_points = 1;
  form.bonus_fastest_lap = false;
  form.bonus_fastest_lap_points = 1;
  form.bonus_fastest_lap_top_10 = true;
  form.dnf_points = 0;
  form.dns_points = 0;
  form.race_notes = '';
}

function applyF1Points(): void {
  form.points_system = { ...F1_STANDARD_POINTS };
}

function addPointsPosition(): void {
  const maxPosition = Math.max(...Object.keys(form.points_system).map(Number));
  form.points_system[maxPosition + 1] = 0;
}

function removePointsPosition(index: number): void {
  const item = pointsTableData.value[index];
  if (!item) return;
  const position = item.position;
  const newSystem = { ...form.points_system };
  delete newSystem[position];
  form.points_system = newSystem;
}

async function handleSave(): Promise<void> {
  const validationResult = validateAll();

  if (!validationResult) {
    return;
  }

  saving.value = true;
  try {
    const bonusPoints: BonusPoints = {};
    if (isQualifying.value && form.bonus_pole) {
      bonusPoints.pole = form.bonus_pole_points;
    }
    // Only include fastest lap bonus for races (not qualifying)
    if (!isQualifying.value && form.bonus_fastest_lap) {
      bonusPoints.fastest_lap = form.bonus_fastest_lap_points;
      bonusPoints.fastest_lap_top_10_only = form.bonus_fastest_lap_top_10;
    }

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
              : undefined,
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
          race_divisions: form.race_divisions,
          points_system: form.points_system,
          bonus_points: Object.keys(bonusPoints).length > 0 ? bonusPoints : null,
          dnf_points: form.dnf_points,
          dns_points: form.dns_points,
          race_notes: form.race_notes.trim() || null,
        }
      : {
          // Regular race payload
          name: form.name.trim() || null,
          race_type: form.race_type || undefined,
          qualifying_format: undefined,
          qualifying_length: undefined,
          qualifying_tire: undefined,
          grid_source: form.grid_source,
          grid_source_race_id: requiresGridSourceRace.value
            ? form.grid_source_race_id || undefined
            : undefined,
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
          minimum_pit_time: form.mandatory_pit_stop ? form.minimum_pit_time : undefined,
          assists_restrictions: form.assists_restrictions.trim() || null,
          race_divisions: form.race_divisions,
          points_system: form.points_system,
          bonus_points: Object.keys(bonusPoints).length > 0 ? bonusPoints : null,
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
      await raceStore.updateExistingRace(props.race.id, updatePayload);
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
