<template>
  <Button
    icon="pi pi-eye"
    size="small"
    text
    :disabled="disabled"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import Button from 'primevue/button';

interface Props {
  disabled?: boolean;
  ariaLabel?: string;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  ariaLabel: 'View',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event?: MouseEvent): void => {
  event?.stopPropagation();
  emit('click', event as MouseEvent);
};
</script>
