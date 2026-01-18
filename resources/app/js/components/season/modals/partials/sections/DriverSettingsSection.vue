<script setup lang="ts">
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import SettingCard from '@app/components/common/cards/SettingCard.vue';
import TiebreakerRulesList from '../TiebreakerRulesList.vue';
import type { SeasonTiebreakerRule } from '@app/types/season';

interface FormState {
  race_divisions_enabled: boolean;
  race_times_required: boolean;
  drop_round: boolean;
  total_drop_rounds: number;
  round_totals_tiebreaker_rules_enabled: boolean;
}

interface Props {
  form: FormState;
  isSubmitting: boolean;
  orderedRules: SeasonTiebreakerRule[];
  isLoadingRules: boolean;
  tiebreakerRulesError: string | null;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:raceDivisionsEnabled': [value: boolean];
  'update:raceTimesRequired': [value: boolean];
  'update:dropRound': [value: boolean];
  'update:totalDropRounds': [value: number];
  'update:tiebreakerRulesEnabled': [value: boolean];
  'update:orderedRules': [value: SeasonTiebreakerRule[]];
  'retry:tiebreakerRules': [];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Driver Settings</h3>
      <p class="text-[var(--text-secondary)] m-0">Configure driver championship options</p>
    </div>

    <div class="space-y-3">
      <!-- Race Divisions -->
      <SettingCard
        :model-value="form.race_divisions_enabled"
        title="Race Divisions"
        description="Organise drivers into competitive divisions based on skill level"
        :disabled="isSubmitting"
        @update:model-value="emit('update:raceDivisionsEnabled', $event)"
      />

      <!-- Race Times Required -->
      <SettingCard
        :model-value="form.race_times_required"
        title="Require Race Times"
        description="Require lap times to be recorded for race results"
        :disabled="isSubmitting"
        @update:model-value="emit('update:raceTimesRequired', $event)"
      />

      <!-- Drop Rounds -->
      <SettingCard
        :model-value="form.drop_round"
        title="Drop Rounds"
        description="Exclude lowest scoring rounds from championship standings"
        :disabled="isSubmitting"
        @update:model-value="emit('update:dropRound', $event)"
      >
        <div class="w-1/3">
          <FormInputGroup>
            <FormLabel for="total_drop_rounds" text="Total Drop Rounds" />
            <StyledInputNumber
              input-id="total_drop_rounds"
              :model-value="form.total_drop_rounds"
              :min="0"
              :max="10"
              :disabled="isSubmitting"
              show-buttons
              button-layout="horizontal"
              class="w-full"
              @update:model-value="emit('update:totalDropRounds', $event)"
            />
          </FormInputGroup>
        </div>
      </SettingCard>

      <!-- Tiebreaker Rules -->
      <SettingCard
        :model-value="form.round_totals_tiebreaker_rules_enabled"
        title="Tiebreaker Rules"
        description="Apply tiebreaker rules when drivers have equal points for a round"
        :disabled="isSubmitting"
        @update:model-value="emit('update:tiebreakerRulesEnabled', $event)"
      >
        <FormInputGroup>
          <FormLabel text="Drag to reorder priority" />
          <TiebreakerRulesList
            :model-value="orderedRules"
            :loading="isLoadingRules"
            :error="tiebreakerRulesError"
            @update:model-value="emit('update:orderedRules', $event)"
            @retry="emit('retry:tiebreakerRules')"
          />
        </FormInputGroup>
      </SettingCard>
    </div>
  </div>
</template>
