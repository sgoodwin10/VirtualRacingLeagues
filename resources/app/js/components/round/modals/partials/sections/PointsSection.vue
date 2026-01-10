<script setup lang="ts">
import BaseCheckbox from '@app/components/common/inputs/BaseCheckbox.vue';
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import PointsSystemEditor from '@app/components/common/forms/PointsSystemEditor.vue';
import SettingCard from '@app/components/common/cards/SettingCard.vue';
import type { PointsSystemMap } from '@app/types/race';

interface Props {
  roundPoints: boolean;
  pointsSystem: PointsSystemMap;
  fastestLap: number | null;
  fastestLapTop10: boolean;
  qualifyingPole: number | null;
  qualifyingPoleTop10: boolean;
  canCopyFromRoundOne: boolean;
  errors: {
    round_points?: string;
    points_system?: string;
    fastest_lap?: string;
    qualifying_pole?: string;
  };
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:roundPoints': [value: boolean];
  'update:pointsSystem': [value: PointsSystemMap];
  'update:fastestLap': [value: number | null];
  'update:fastestLapTop10': [value: boolean];
  'update:qualifyingPole': [value: number | null];
  'update:qualifyingPoleTop10': [value: boolean];
  'copy-from-round-one': [];
  'blur-round-points': [];
  'blur-fastest-lap': [];
  'blur-qualifying-pole': [];
}>();

function handleCopyFromRoundOne(): void {
  emit('copy-from-round-one');
}
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Points Configuration</h3>
      <p class="text-[var(--text-secondary)] m-0">Configure round-level points and bonuses</p>
    </div>

    <div class="space-y-3">
      <!-- Round Points Toggle -->
      <SettingCard
        :model-value="roundPoints"
        title="Round Points"
        description="Enable round-level points calculation using a custom points system"
        :disabled="disabled"
        @update:model-value="emit('update:roundPoints', $event)"
      >
        <!-- Nested content when enabled -->
        <FormInputGroup>
          <FormLabel text="Points Distribution" />
          <PointsSystemEditor
            :model-value="pointsSystem"
            :disabled="disabled"
            :show-copy-button="canCopyFromRoundOne"
            copy-button-label="Copy from Round 1"
            @update:model-value="emit('update:pointsSystem', $event)"
            @copy="handleCopyFromRoundOne"
          />
          <FormError v-if="errors.points_system">
            {{ errors.points_system }}
          </FormError>
        </FormInputGroup>
      </SettingCard>

      <!-- Fastest Lap Bonus SettingCard (only shown when round points enabled) -->
      <SettingCard
        v-if="roundPoints"
        :model-value="fastestLap !== null && fastestLap > 0"
        title="Fastest Lap Bonus"
        description="Award points for fastest lap across all races in this round (excluding qualifying)"
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

      <!-- Qualifying Pole Bonus SettingCard (only shown when round points enabled) -->
      <SettingCard
        v-if="roundPoints"
        :model-value="qualifyingPole !== null && qualifyingPole > 0"
        title="Qualifying Pole Bonus"
        description="Award points for qualifying pole position"
        :disabled="disabled"
        @update:model-value="
          emit('update:qualifyingPole', $event ? 1 : null);
          if (!$event) emit('update:qualifyingPoleTop10', false);
        "
      >
        <!-- Nested content when enabled -->
        <div class="flex flex-row gap-4 items-center">
          <FormInputGroup>
            <FormLabel text="Points" />
            <StyledInputNumber
              :model-value="qualifyingPole"
              :min="1"
              :max="99"
              :disabled="disabled"
              fluid
              :invalid="!!errors.qualifying_pole"
              placeholder="Enter points"
              @update:model-value="emit('update:qualifyingPole', $event)"
              @blur="emit('blur-qualifying-pole')"
            />
            <FormError v-if="errors.qualifying_pole">
              {{ errors.qualifying_pole }}
            </FormError>
          </FormInputGroup>

          <BaseCheckbox
            id="bonus_qualifying_pole_top_10"
            class="mt-2"
            :model-value="qualifyingPoleTop10"
            :disabled="disabled"
            label="Only award if driver finishes in top 10"
            @update:model-value="emit('update:qualifyingPoleTop10', $event)"
          />
        </div>
      </SettingCard>
    </div>
  </div>
</template>
