<script setup lang="ts">
import IconButton from './IconButton.vue';
import { PhPencil } from '@phosphor-icons/vue';

interface Props {
  disabled?: boolean;
  ariaLabel?: string;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  ariaLabel: 'Edit',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent): void => {
  event.stopPropagation();
  emit('click', event);
};
</script>

<template>
  <IconButton
    :icon="PhPencil"
    variant="ghost"
    size="sm"
    :disabled="disabled"
    :tooltip="ariaLabel"
    :aria-label="ariaLabel"
    @click="handleClick"
  />
</template>
