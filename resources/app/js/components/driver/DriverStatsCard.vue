<script setup lang="ts">
import Card from 'primevue/card';

interface Props {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  bannedCount: number;
}

defineProps<Props>();
</script>

<template>
  <Card class="mb-4">
    <template #content>
      <div class="grid grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-900">{{ totalCount }}</div>
          <div class="text-sm text-gray-600 mt-1">Total Drivers</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ activeCount }}</div>
          <div class="text-sm text-gray-600 mt-1">Active</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-600">{{ inactiveCount }}</div>
          <div class="text-sm text-gray-600 mt-1">Inactive</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ bannedCount }}</div>
          <div class="text-sm text-gray-600 mt-1">Banned</div>
        </div>
      </div>
    </template>
  </Card>
</template>
