<script setup lang="ts">
import Select from 'primevue/select';
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import SettingCard from '@app/components/common/cards/SettingCard.vue';
import CompactToggle from '@app/components/common/forms/CompactToggle.vue';

interface FormState {
  team_championship_enabled: boolean;
  teams_drivers_for_calculation: number | 'all' | null;
  teams_drop_rounds: boolean;
  teams_total_drop_rounds: number | null;
}

interface Props {
  form: FormState;
  isSubmitting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:teamChampionshipEnabled': [value: boolean];
  'update:teamsDriversForCalculation': [value: number | 'all' | null];
  'update:teamsDropRounds': [value: boolean];
  'update:teamsTotalDropRounds': [value: number | null];
}>();

// Team championship options
const teamsDriversOptions = [
  { label: 'All drivers', value: 'all' },
  { label: 'Top 1', value: 1 },
  { label: 'Top 2', value: 2 },
  { label: 'Top 3', value: 3 },
  { label: 'Top 4', value: 4 },
  { label: 'Top 5', value: 5 },
  { label: 'Top 6', value: 6 },
  { label: 'Top 7', value: 7 },
  { label: 'Top 8', value: 8 },
  { label: 'Top 9', value: 9 },
  { label: 'Top 10', value: 10 },
];
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Team Championship</h3>
      <p class="text-[var(--text-secondary)] m-0">Configure team standings and scoring</p>
    </div>

    <div class="space-y-3">
      <!-- Enable Team Championship -->
      <SettingCard
        :model-value="form.team_championship_enabled"
        title="Enable Team Championship"
        description="Track team standings alongside individual drivers"
        :disabled="isSubmitting"
        @update:model-value="emit('update:teamChampionshipEnabled', $event)"
      >
        <div class="flex flex-row gap-2">
          <!-- Drivers for Team Calculation -->
          <FormInputGroup class="mb-3">
            <FormLabel for="teams_drivers_calculation" text="Drivers for Team Calculation" />
            <Select
              id="teams_drivers_calculation"
              :model-value="form.teams_drivers_for_calculation"
              :options="teamsDriversOptions"
              option-label="label"
              option-value="value"
              placeholder="Select number of drivers"
              size="small"
              class="w-full"
              :disabled="isSubmitting"
              @update:model-value="emit('update:teamsDriversForCalculation', $event)"
            />
            <div class="text-[var(--text-muted)] mt-1.5">
              How many drivers' points count towards team totals
            </div>
          </FormInputGroup>

          <!-- Team Drop Rounds Toggle -->
          <CompactToggle
            :model-value="form.teams_drop_rounds"
            label="Team Drop Rounds"
            label-position="above"
            slot-position="inline"
            :disabled="isSubmitting"
            @update:model-value="emit('update:teamsDropRounds', $event)"
          >
            <FormInputGroup>
              <FormLabel for="teams_total_drop_rounds" text="Total Team Drop Rounds" />
              <StyledInputNumber
                input-id="teams_total_drop_rounds"
                :model-value="form.teams_total_drop_rounds"
                :min="0"
                :max="10"
                :disabled="isSubmitting"
                show-buttons
                button-layout="horizontal"
                class="w-12"
                @update:model-value="emit('update:teamsTotalDropRounds', $event)"
              />
            </FormInputGroup>
          </CompactToggle>
        </div>
      </SettingCard>
    </div>
  </div>
</template>
