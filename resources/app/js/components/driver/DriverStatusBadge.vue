<script setup lang="ts">
import { computed } from 'vue';
import type { DriverStatus } from '@app/types/driver';
import { StatusIndicator } from '@app/components/common/indicators';

interface Props {
  status: DriverStatus;
}

const props = defineProps<Props>();

/**
 * Map driver status to StatusIndicator status type
 * - active: green 'active' status
 * - banned: red 'error' status (displayed as 'Banned')
 * - inactive: gray 'inactive' status
 */
const statusConfig = computed<{ status: 'active' | 'inactive' | 'error'; label: string }>(() => {
  if (props.status === 'active') {
    return { status: 'active', label: 'Active' };
  }
  if (props.status === 'banned') {
    return { status: 'error', label: 'Banned' };
  }
  return { status: 'inactive', label: 'Inactive' };
});
</script>

<template>
  <StatusIndicator
    :status="statusConfig.status"
    :label="statusConfig.label"
    :show-dot="true"
    size="md"
  />
</template>
