<script setup lang="ts">
import { computed } from 'vue';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import { Button } from '@app/components/common/buttons';
import { PhPlus, PhTrash, PhCopy } from '@phosphor-icons/vue';
import type { PointsSystemMap } from '@app/types/race';

interface Props {
  modelValue: PointsSystemMap;
  disabled?: boolean;
  showCopyButton?: boolean;
  copyButtonLabel?: string;
}

interface Emits {
  (e: 'update:modelValue', value: PointsSystemMap): void;
  (e: 'copy'): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showCopyButton: false,
  copyButtonLabel: 'Copy from Round 1',
});

const emit = defineEmits<Emits>();

const sortedPositions = computed(() => {
  return Object.keys(props.modelValue)
    .map(Number)
    .sort((a, b) => a - b);
});

function updatePoints(position: number, value: number | null): void {
  const newSystem = { ...props.modelValue };
  if (value !== null) {
    newSystem[position] = value;
  } else {
    delete newSystem[position];
  }
  emit('update:modelValue', newSystem);
}

function addPointsPosition(): void {
  const maxPosition = sortedPositions.value.length > 0 ? Math.max(...sortedPositions.value) : 0;
  const newSystem = { ...props.modelValue };
  newSystem[maxPosition + 1] = 0;
  emit('update:modelValue', newSystem);
}

function removeLastPointsPosition(): void {
  if (sortedPositions.value.length > 1) {
    const lastPosition = sortedPositions.value[sortedPositions.value.length - 1];
    if (lastPosition !== undefined) {
      const newSystem = { ...props.modelValue };
      delete newSystem[lastPosition];
      emit('update:modelValue', newSystem);
    }
  }
}

function handleCopy(): void {
  emit('copy');
}
</script>

<template>
  <div>
    <div class="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-4">
      <div class="grid grid-cols-6 gap-3">
        <InputGroup v-for="position in sortedPositions" :key="position">
          <InputGroupAddon class="bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
            >P{{ position }}</InputGroupAddon
          >
          <StyledInputNumber
            :model-value="modelValue[position]"
            :input-id="`position_${position}`"
            :max-fraction-digits="2"
            :min="0"
            :max="999"
            :disabled="disabled"
            size="small"
            fluid
            class="w-full"
            @update:model-value="updatePoints(position, $event)"
          />
        </InputGroup>
      </div>
      <div class="mt-3 flex gap-2">
        <Button
          v-tooltip.top="'Add new position'"
          label="Add Position"
          :icon="PhPlus"
          size="sm"
          variant="success"
          :disabled="disabled"
          @click="addPointsPosition"
        />
        <Button
          v-tooltip.top="'Remove last position'"
          label="Remove Last"
          :icon="PhTrash"
          size="sm"
          variant="danger"
          :disabled="disabled || sortedPositions.length <= 1"
          @click="removeLastPointsPosition"
        />
        <Button
          v-if="showCopyButton"
          v-tooltip.top="'Copy Round 1 points configuration'"
          :label="copyButtonLabel"
          :icon="PhCopy"
          size="sm"
          variant="secondary"
          :disabled="disabled"
          @click="handleCopy"
        />
      </div>
    </div>
  </div>
</template>
