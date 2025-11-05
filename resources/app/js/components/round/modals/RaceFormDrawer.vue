<template>
  <BaseModal
    v-model:visible="localVisible"
    width="1000px"
    :closable="!saving"
    :dismissable-mask="false"
    content-class="bg-slate-50"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">
          {{
            mode === 'edit'
              ? isQualifier
                ? 'Edit Qualifying'
                : 'Edit Race'
              : isQualifier
                ? 'Create Qualifying'
                : 'Create Race'
          }}
        </h2>
      </div>
    </template>

    <div class="space-y-3">
      <!-- Section 1: Basic Details -->
      <Accordion :value="['basic']" :multiple="true">
        <AccordionPanel value="basic">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Basic Details</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Race Number -->
              <div>
                <FormLabel for="race_number" text="Race Number" :required="true" />
                <InputNumber
                  id="race_number"
                  v-model="form.race_number"
                  :min="1"
                  :max="99"
                  :invalid="!!errors.race_number"
                  class="w-full"
                />
                <FormError :error="errors.race_number" />
              </div>

              <!-- Race Name -->
              <div>
                <FormLabel for="name" text="Race Name (optional)" />
                <InputText
                  id="name"
                  v-model="form.name"
                  :invalid="!!errors.name"
                  placeholder="e.g., Sprint Race, Feature Race"
                  class="w-full"
                />
                <FormError :error="errors.name" />
              </div>

              <!-- Race Type -->
              <div>
                <FormLabel for="race_type" text="Race Type" />
                <Dropdown
                  id="race_type"
                  v-model="form.race_type"
                  :options="RACE_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  placeholder="Select race type"
                  class="w-full"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 2: Qualifying Configuration -->
      <Accordion :value="['qualifying']" :multiple="true">
        <AccordionPanel value="qualifying">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Qualifying Configuration</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Qualifying Format -->
              <div>
                <FormLabel for="qualifying_format" text="Qualifying Format" :required="true" />
                <Dropdown
                  id="qualifying_format"
                  v-model="form.qualifying_format"
                  :options="QUALIFYING_FORMAT_OPTIONS"
                  option-label="label"
                  option-value="value"
                  placeholder="Select qualifying format"
                  class="w-full"
                />
              </div>

              <!-- Qualifying Length -->
              <div>
                <FormLabel for="qualifying_length" text="Qualifying Length (minutes)" />
                <InputNumber
                  id="qualifying_length"
                  v-model="form.qualifying_length"
                  :min="1"
                  :max="999"
                  :invalid="!!errors.qualifying_length"
                  class="w-full"
                />
                <FormError :error="errors.qualifying_length" />
              </div>

              <!-- Qualifying Tire -->
              <div>
                <FormLabel for="qualifying_tire" text="Qualifying Tire (optional)" />
                <InputText
                  id="qualifying_tire"
                  v-model="form.qualifying_tire"
                  placeholder="e.g., Soft, Medium"
                  class="w-full"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 3: Starting Grid -->
      <Accordion :value="['grid']" :multiple="true">
        <AccordionPanel value="grid">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Starting Grid</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Grid Source -->
              <div>
                <FormLabel for="grid_source" text="Grid Source" :required="true" />
                <Dropdown
                  id="grid_source"
                  v-model="form.grid_source"
                  :options="GRID_SOURCE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  placeholder="Select grid source"
                  class="w-full"
                />
              </div>

              <!-- Grid Source Race -->
              <div>
                <FormLabel for="grid_source_race_id" text="Source Race" :required="true" />
                <Dropdown
                  id="grid_source_race_id"
                  v-model="form.grid_source_race_id"
                  :options="availableSourceRaces"
                  option-label="label"
                  option-value="value"
                  placeholder="Select source race"
                  class="w-full"
                />
                <Message v-if="availableSourceRaces.length === 0" severity="warn" :closable="false">
                  No previous races available in this round
                </Message>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 4: Race Length -->
      <Accordion :value="['length']" :multiple="true">
        <AccordionPanel value="length">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Race Length</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Length Type -->
              <div>
                <FormLabel text="Length Type" :required="true" />
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
              </div>

              <!-- Length Value -->
              <div>
                <FormLabel
                  for="length_value"
                  :text="form.length_type === 'laps' ? 'Number of Laps' : 'Race Duration (minutes)'"
                  :required="true"
                />
                <InputNumber
                  id="length_value"
                  v-model="form.length_value"
                  :min="1"
                  :max="form.length_type === 'laps' ? 999 : 9999"
                  :invalid="!!errors.length_value"
                  class="w-full"
                />
                <FormError :error="errors.length_value" />
              </div>

              <!-- Extra Lap After Time -->
              <div class="flex items-center gap-2">
                <Checkbox
                  id="extra_lap_after_time"
                  v-model="form.extra_lap_after_time"
                  :binary="true"
                />
                <label for="extra_lap_after_time">Complete current lap after time expires</label>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 5: Platform Settings -->
      <Accordion :value="['platform']" :multiple="true">
        <AccordionPanel value="platform">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Platform Settings</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Weather -->
              <div>
                <FormLabel for="weather" text="Weather" />
                <Dropdown
                  id="weather"
                  v-model="form.weather"
                  :options="platformSettings?.weather_conditions || []"
                  option-label="label"
                  option-value="value"
                  placeholder="Select weather"
                  class="w-full"
                />
              </div>

              <!-- Tire Restrictions -->
              <div>
                <FormLabel for="tire_restrictions" text="Tire Restrictions" />
                <Dropdown
                  id="tire_restrictions"
                  v-model="form.tire_restrictions"
                  :options="platformSettings?.tire_restrictions || []"
                  option-label="label"
                  option-value="value"
                  placeholder="Select tire restrictions"
                  class="w-full"
                />
              </div>

              <!-- Fuel Usage -->
              <div>
                <FormLabel for="fuel_usage" text="Fuel Usage" />
                <Dropdown
                  id="fuel_usage"
                  v-model="form.fuel_usage"
                  :options="platformSettings?.fuel_usage || []"
                  option-label="label"
                  option-value="value"
                  placeholder="Select fuel usage"
                  class="w-full"
                />
              </div>

              <!-- Damage Model -->
              <div>
                <FormLabel for="damage_model" text="Damage Model" />
                <Dropdown
                  id="damage_model"
                  v-model="form.damage_model"
                  :options="platformSettings?.damage_model || []"
                  option-label="label"
                  option-value="value"
                  placeholder="Select damage model"
                  class="w-full"
                />
              </div>

              <!-- Assists Restrictions -->
              <div>
                <FormLabel for="assists_restrictions" text="Assists Restrictions" />
                <Dropdown
                  id="assists_restrictions"
                  v-model="form.assists_restrictions"
                  :options="platformSettings?.assists_restrictions || []"
                  option-label="label"
                  option-value="value"
                  placeholder="Select assists restrictions"
                  class="w-full"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 6: Penalties & Rules -->
      <Accordion :value="['penalties']" :multiple="true">
        <AccordionPanel value="penalties">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Penalties & Rules</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Track Limits Enforced -->
              <div class="flex items-center gap-2">
                <Checkbox
                  id="track_limits_enforced"
                  v-model="form.track_limits_enforced"
                  :binary="true"
                />
                <label for="track_limits_enforced">Track limits enforced</label>
              </div>

              <!-- False Start Detection -->
              <div class="flex items-center gap-2">
                <Checkbox
                  id="false_start_detection"
                  v-model="form.false_start_detection"
                  :binary="true"
                />
                <label for="false_start_detection">False start detection</label>
              </div>

              <!-- Collision Penalties -->
              <div class="flex items-center gap-2">
                <Checkbox
                  id="collision_penalties"
                  v-model="form.collision_penalties"
                  :binary="true"
                />
                <label for="collision_penalties">Collision penalties</label>
              </div>

              <!-- Mandatory Pit Stop -->
              <div class="flex items-center gap-2">
                <Checkbox
                  id="mandatory_pit_stop"
                  v-model="form.mandatory_pit_stop"
                  :binary="true"
                />
                <label for="mandatory_pit_stop">Mandatory pit stop</label>
              </div>

              <!-- Minimum Pit Time -->
              <div>
                <FormLabel for="minimum_pit_time" text="Minimum Pit Time (seconds)" />
                <InputNumber
                  id="minimum_pit_time"
                  v-model="form.minimum_pit_time"
                  :min="0"
                  :max="999"
                  :invalid="!!errors.minimum_pit_time"
                  class="w-full"
                />
                <FormError :error="errors.minimum_pit_time" />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 7: Division Support -->
      <Accordion :value="['divisions']" :multiple="true">
        <AccordionPanel value="divisions">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Division Support</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Race Divisions Enabled -->
              <div class="flex items-center gap-2">
                <Checkbox id="race_divisions" v-model="form.race_divisions" :binary="true" />
                <label for="race_divisions">Enable separate results per division</label>
              </div>

              <Message severity="info" :closable="false">
                When enabled, race results and points will be tracked separately for each division
                in the season.
              </Message>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 8: Points System -->
      <Accordion :value="['points']" :multiple="true">
        <AccordionPanel value="points">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Points System</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Points Template -->
              <div>
                <FormLabel text="Points Template" :required="true" />
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
              </div>

              <!-- Custom Points Table -->
              <div>
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
                        <InputNumber v-model="data.points" :min="0" size="small" class="w-full" />
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
              </div>

              <!-- F1 Points Preview -->
              <div>
                <FormLabel text="Points Breakdown" />
                <div class="bg-white rounded-lg border border-gray-200 p-3">
                  <div class="grid grid-cols-5 gap-2 text-sm">
                    <div
                      v-for="(points, position) in F1_STANDARD_POINTS"
                      :key="position"
                      class="flex items-center gap-1"
                    >
                      <span class="font-semibold text-gray-700">P{{ position }}:</span>
                      <span class="text-gray-900">{{ points }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 9: Bonus Points -->
      <Accordion :value="['bonus']" :multiple="true">
        <AccordionPanel value="bonus">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Bonus Points</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- Pole Position Bonus -->
              <div class="flex items-center gap-4">
                <Checkbox id="bonus_pole" v-model="form.bonus_pole" :binary="true" />
                <label for="bonus_pole">Pole position bonus</label>
                <InputNumber
                  v-model="form.bonus_pole_points"
                  :min="1"
                  :max="99"
                  placeholder="Points"
                  class="w-32"
                />
              </div>

              <!-- Fastest Lap Bonus -->
              <div class="space-y-2">
                <div class="flex items-center gap-4">
                  <Checkbox
                    id="bonus_fastest_lap"
                    v-model="form.bonus_fastest_lap"
                    :binary="true"
                  />
                  <label for="bonus_fastest_lap">Fastest lap bonus</label>
                  <InputNumber
                    v-model="form.bonus_fastest_lap_points"
                    :min="1"
                    :max="99"
                    placeholder="Points"
                    class="w-32"
                  />
                </div>
                <div class="ml-8">
                  <Checkbox
                    id="bonus_fastest_lap_top_10"
                    v-model="form.bonus_fastest_lap_top_10"
                    :binary="true"
                  />
                  <label for="bonus_fastest_lap_top_10" class="ml-2"
                    >Only award if driver finishes in top 10</label
                  >
                </div>
              </div>

              <!-- Info message -->
              <Message severity="info" :closable="false">
                Pole position bonus is available for qualifying sessions. Fastest lap bonus is only
                available for races.
              </Message>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 10: DNF/DNS -->
      <Accordion :value="['dnf']" :multiple="true">
        <AccordionPanel value="dnf">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">DNF/DNS Points</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="space-y-3 pt-2">
              <!-- DNF Points -->
              <div>
                <FormLabel for="dnf_points" text="DNF Points" />
                <InputNumber
                  id="dnf_points"
                  v-model="form.dnf_points"
                  :min="0"
                  :max="99"
                  class="w-full"
                />
                <small class="text-xs text-gray-500 mt-1">Points awarded for Did Not Finish</small>
              </div>

              <!-- DNS Points -->
              <div>
                <FormLabel for="dns_points" text="DNS Points" />
                <InputNumber
                  id="dns_points"
                  v-model="form.dns_points"
                  :min="0"
                  :max="99"
                  class="w-full"
                />
                <small class="text-xs text-gray-500 mt-1">Points awarded for Did Not Start</small>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Section 11: Notes -->
      <Accordion :value="['notes']" :multiple="true">
        <AccordionPanel value="notes">
          <AccordionHeader>
            <span class="font-semibold text-gray-900">Race Notes</span>
          </AccordionHeader>
          <AccordionContent>
            <div class="pt-2">
              <FormLabel for="race_notes" text="Notes (optional)" />
              <Textarea
                id="race_notes"
                v-model="form.race_notes"
                rows="4"
                placeholder="Additional race notes, special rules, etc."
                class="w-full"
              />
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
              ? isQualifier
                ? 'Update Qualifying'
                : 'Update Race'
              : isQualifier
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
  raceType?: 'race' | 'qualifier';
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  race: null,
  mode: 'create',
  raceType: 'race',
});

const emit = defineEmits<Emits>();

const raceStore = useRaceStore();
const raceSettingsStore = useRaceSettingsStore();

const form = reactive<RaceForm>({
  race_number: 1,
  name: '',
  race_type: null,
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

const isQualifier = computed(() => props.raceType === 'qualifier');

// Pass the reactive computed ref to useRaceValidation so validation adapts dynamically
const { errors, validateAll, clearErrors } = useRaceValidation(form, isQualifier);

const saving = ref(false);
const platformSettings = ref<PlatformRaceSettings | null>(null);
const loadingSettings = ref(false);

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const requiresGridSourceRace = computed(() => {
  return form.grid_source === 'previous_race' || form.grid_source === 'reverse_previous';
});

const availableSourceRaces = computed(() => {
  const races = raceStore.racesByRoundId(props.roundId);
  return races
    .filter((race) => race.id !== props.race?.id)
    .map((race) => ({
      value: race.id,
      label: `Race ${race.race_number}${race.name ? ` - ${race.name}` : ''}`,
    }));
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
        // Auto-calculate next race number (skip for qualifiers)
        if (!isQualifier.value) {
          const roundRaces = raceStore.racesByRoundId(props.roundId);
          // Filter out qualifiers (race_number !== 0)
          const actualRaces = roundRaces.filter((r) => r.race_number !== 0);
          form.race_number = actualRaces.length + 1;
        }
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

  // Load bonus points
  if (race.bonus_points) {
    form.bonus_pole = !!race.bonus_points.pole;
    form.bonus_pole_points = race.bonus_points.pole || 1;
    form.bonus_fastest_lap = !!race.bonus_points.fastest_lap;
    form.bonus_fastest_lap_points = race.bonus_points.fastest_lap || 1;
    form.bonus_fastest_lap_top_10 = race.bonus_points.fastest_lap_top_10_only || false;
  }
}

function resetForm(): void {
  form.race_number = isQualifier.value ? 0 : 1; // Qualifiers always have race_number 0
  form.name = '';
  form.race_type = isQualifier.value ? 'qualifying' : null; // Set race_type for qualifiers
  form.qualifying_format = 'standard';
  form.qualifying_length = 15;
  form.qualifying_tire = '';
  form.grid_source = 'qualifying'; // Qualifiers use 'qualifying'
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
  if (!validateAll()) {
    return;
  }

  saving.value = true;
  try {
    const bonusPoints: BonusPoints = {};
    if (form.bonus_pole) {
      bonusPoints.pole = form.bonus_pole_points;
    }
    // Only include fastest lap bonus for races (not qualifiers)
    if (!isQualifier.value && form.bonus_fastest_lap) {
      bonusPoints.fastest_lap = form.bonus_fastest_lap_points;
      bonusPoints.fastest_lap_top_10_only = form.bonus_fastest_lap_top_10;
    }

    const payload: CreateRaceRequest | UpdateRaceRequest = {
      race_number: isQualifier.value ? 0 : form.race_number,
      name: form.name || undefined,
      race_type: isQualifier.value ? 'qualifying' : form.race_type || undefined,
      qualifying_format: form.qualifying_format,
      qualifying_length:
        form.qualifying_format !== 'none' && form.qualifying_format !== 'previous_race'
          ? form.qualifying_length
          : undefined,
      qualifying_tire: form.qualifying_tire || undefined,
      grid_source: isQualifier.value ? 'qualifying' : form.grid_source,
      grid_source_race_id:
        !isQualifier.value && requiresGridSourceRace.value
          ? form.grid_source_race_id || undefined
          : undefined,
      // For qualifiers, use sensible defaults for length fields (backend expects them)
      length_type: isQualifier.value ? 'time' : form.length_type,
      length_value: isQualifier.value ? form.qualifying_length : form.length_value,
      extra_lap_after_time: isQualifier.value ? false : form.extra_lap_after_time,
      weather: form.weather || undefined,
      tire_restrictions: form.tire_restrictions || undefined,
      fuel_usage: form.fuel_usage || undefined,
      damage_model: form.damage_model || undefined,
      track_limits_enforced: form.track_limits_enforced,
      false_start_detection: form.false_start_detection,
      collision_penalties: form.collision_penalties,
      mandatory_pit_stop: !isQualifier.value && form.mandatory_pit_stop,
      minimum_pit_time:
        !isQualifier.value && form.mandatory_pit_stop ? form.minimum_pit_time : undefined,
      assists_restrictions: form.assists_restrictions || undefined,
      race_divisions: form.race_divisions,
      points_system: form.points_system,
      bonus_points: Object.keys(bonusPoints).length > 0 ? bonusPoints : undefined,
      dnf_points: form.dnf_points,
      dns_points: form.dns_points,
      race_notes: form.race_notes || undefined,
    };

    if (props.mode === 'edit' && props.race) {
      await raceStore.updateExistingRace(props.race.id, payload);
    } else {
      await raceStore.createNewRace(props.roundId, payload as CreateRaceRequest);
    }

    emit('saved');
    localVisible.value = false;
  } catch (error) {
    console.error('Failed to save race:', error);
  } finally {
    saving.value = false;
  }
}

function handleCancel(): void {
  emit('cancel');
  localVisible.value = false;
}
</script>
