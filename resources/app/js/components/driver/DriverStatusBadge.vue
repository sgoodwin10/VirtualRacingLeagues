<script setup lang="ts">
import { computed } from 'vue';
import Chip from 'primevue/chip';
import type { DriverStatus } from '@app/types/driver';

interface Props {
  status: DriverStatus;
}

const props = defineProps<Props>();

const chipClass = computed(() => {
  switch (props.status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'banned':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
});

const statusLabel = computed(() => {
  switch (props.status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'banned':
      return 'Banned';
    default:
      return props.status;
  }
});
</script>

<template>
  <Chip :label="statusLabel" :class="chipClass" class="text-sm font-medium" />
</template>
