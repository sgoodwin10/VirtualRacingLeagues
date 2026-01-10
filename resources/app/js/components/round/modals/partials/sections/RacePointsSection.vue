<script setup lang="ts">
import BaseCheckbox from '@app/components/common/inputs/BaseCheckbox.vue';
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import PointsSystemEditor from '@app/components/common/forms/PointsSystemEditor.vue';
import SettingCard from '@app/components/common/cards/SettingCard.vue';
import type { PointsSystemMap } from '@app/types/race';
import FormHelper from '@app/components/common/forms/FormHelper.vue';

interface Props {
  isQualifying: boolean;
  racePoints: boolean;
  pointsSystem: PointsSystemMap;
  fastestLap: number | null;
  fastestLapTop10: boolean;
  dnfPoints: number;
  canCopyRoundPoints: boolean;
  canCopyRace1Points: boolean;
  isFirstRace: boolean;
  errors: {
    race_points?: string;
    points_system?: string;
    fastest_lap?: string;
  };
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:racePoints': [value: boolean];
  'update:pointsSystem': [value: PointsSystemMap];
  'update:fastestLap': [value: number | null];
  'update:fastestLapTop10': [value: boolean];
  'update:dnfPoints': [value: number | null];
  'copy-round-points': [];
  'copy-race1-points': [];
  'blur-race-points': [];
  'blur-fastest-lap': [];
}>();

function handleCopyRoundPoints(): void {
  emit('copy-round-points');
}

function handleCopyRace1Points(): void {
  emit('copy-race1-points');
}
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Points Configuration</h3>
      <p class="text-[var(--text-secondary)] m-0">Define race points, bonuses, and penalties</p>
    </div>

    <div class="space-y-3">
      <!-- Race Points Toggle -->
      <SettingCard
        :model-value="racePoints"
        title="Race Points"
        description="Enable race-level points calculation using a custom points system"
        :disabled="disabled"
        @update:model-value="emit('update:racePoints', $event)"
      >
        <!-- Nested content when enabled -->
        <FormInputGroup>
          <FormLabel text="Points Distribution" />
          <PointsSystemEditor
            :model-value="pointsSystem"
            :disabled="disabled"
            :show-copy-button="isFirstRace ? canCopyRoundPoints : canCopyRace1Points"
            :copy-button-label="isFirstRace ? 'Copy Round Points' : 'Copy Race 1 Points'"
            @update:model-value="emit('update:pointsSystem', $event)"
            @copy="isFirstRace ? handleCopyRoundPoints() : handleCopyRace1Points()"
          />
          <FormError v-if="errors.points_system">
            {{ errors.points_system }}
          </FormError>
        </FormInputGroup>

        <div class="w-56">
          <FormInputGroup>
            <FormLabel for="dnf_points" text="DNF Points" />
            <StyledInputNumber
              :model-value="dnfPoints"
              input-id="dnf_points"
              :max-fraction-digits="2"
              :min="0"
              :max="99"
              size="small"
              fluid
              :disabled="disabled"
              class="w-full"
              @update:model-value="emit('update:dnfPoints', $event)"
            />
            <FormHelper text="Points awarded for Did Not Finish" />
          </FormInputGroup>
        </div>
      </SettingCard>

      <!-- Fastest Lap Bonus SettingCard (only shown when race points enabled) -->
      <SettingCard
        v-if="racePoints && !isQualifying"
        :model-value="fastestLap !== null && fastestLap > 0"
        title="Fastest Lap Bonus"
        description="Award points for fastest lap in this race"
        :disabled="disabled"
        @update:model-value="
          emit('update:fastestLap', $event ? 1 : null);
          if (!$event) emit('update:fastestLapTop10', false);
        "
      >
        <!-- Nested content when enabled -->
        <div class="flex flex-row gap-4 items-center">
          <FormInputGroup>
            <FormLabel text="Points" />
            <StyledInputNumber
              :model-value="fastestLap"
              :min="1"
              :max="99"
              :disabled="disabled"
              fluid
              :invalid="!!errors.fastest_lap"
              placeholder="Enter points"
              @update:model-value="emit('update:fastestLap', $event)"
              @blur="emit('blur-fastest-lap')"
            />
            <FormError v-if="errors.fastest_lap">
              {{ errors.fastest_lap }}
            </FormError>
          </FormInputGroup>

          <BaseCheckbox
            id="bonus_fastest_lap_top_10"
            class="mt-2"
            :model-value="fastestLapTop10"
            :disabled="disabled"
            label="Only award if driver finishes in top 10"
            @update:model-value="emit('update:fastestLapTop10', $event)"
          />
        </div>
      </SettingCard>

      <!-- DNF Points (shown when race points enabled) -->
      <div v-if="racePoints && !isQualifying" class="space-y-3"></div>
    </div>
  </div>
</template>
