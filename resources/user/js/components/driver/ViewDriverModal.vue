<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import DriverStatusBadge from './DriverStatusBadge.vue';
import { useDateFormatter } from '@user/composables/useDateFormatter';
import type { LeagueDriver } from '@user/types/driver';

interface Props {
  visible: boolean;
  driver: LeagueDriver | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'edit'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { formatDate } = useDateFormatter();

/**
 * Get driver's full name
 */
const driverName = computed(() => {
  if (!props.driver?.driver) return 'Unknown Driver';
  return props.driver.driver.display_name;
});

/**
 * Get driver's contact info
 */
const contactInfo = computed(() => {
  if (!props.driver?.driver) return [];

  const info = [];
  const driver = props.driver.driver;

  if (driver.email) {
    info.push({ label: 'Email', value: driver.email, type: 'email' });
  }
  if (driver.phone) {
    info.push({ label: 'Phone', value: driver.phone, type: 'text' });
  }

  return info;
});

/**
 * Get driver's platform IDs
 */
const platformIds = computed(() => {
  if (!props.driver?.driver) return [];

  const platforms = [];
  const driver = props.driver.driver;

  if (driver.psn_id) {
    platforms.push({ label: 'PSN ID', value: driver.psn_id });
  }
  if (driver.gt7_id) {
    platforms.push({ label: 'GT7 ID', value: driver.gt7_id });
  }
  if (driver.iracing_id) {
    platforms.push({ label: 'iRacing ID', value: driver.iracing_id });
  }
  if (driver.iracing_customer_id) {
    platforms.push({ label: 'iRacing Customer ID', value: driver.iracing_customer_id.toString() });
  }

  return platforms;
});

/**
 * Handle close button
 */
const handleClose = (): void => {
  emit('close');
  emit('update:visible', false);
};

/**
 * Handle edit button
 */
const handleEdit = (): void => {
  emit('edit');
};
</script>

<template>
  <Dialog
    :visible="visible"
    :header="`Driver Details - ${driverName}`"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="w-full max-w-3xl"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="driver" class="space-y-6">
      <!-- Personal Information -->
      <section>
        <h3 class="font-semibold mb-4 pb-2 border-b">Personal Information</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="font-medium text-gray-600">Full Name</label>
            <p class="mt-1">{{ driver.driver.display_name }}</p>
          </div>
          <div v-if="driver.driver.nickname">
            <label class="font-medium text-gray-600">Nickname</label>
            <p class="mt-1">"{{ driver.driver.nickname }}"</p>
          </div>
        </div>

        <!-- Contact Information -->
        <div v-if="contactInfo.length > 0" class="grid grid-cols-2 gap-4 mt-4">
          <div v-for="info in contactInfo" :key="info.label">
            <label class="font-medium text-gray-600">{{ info.label }}</label>
            <p v-if="info.type === 'email'" class="mt-1">
              <a :href="`mailto:${info.value}`" class="text-blue-600 hover:underline">
                {{ info.value }}
              </a>
            </p>
            <p v-else class="mt-1">{{ info.value }}</p>
          </div>
        </div>
        <p v-else class="text-gray-500 mt-4">No contact information available</p>
      </section>

      <!-- Platform IDs -->
      <section>
        <h3 class="font-semibold mb-4 pb-2 border-b">Platform Identifiers</h3>
        <div v-if="platformIds.length > 0" class="grid grid-cols-2 gap-4">
          <div v-for="platform in platformIds" :key="platform.label">
            <label class="font-medium text-gray-600">{{ platform.label }}</label>
            <p class="mt-1 font-mono">{{ platform.value }}</p>
          </div>
        </div>
        <p v-else class="text-gray-500">No platform IDs available</p>

        <div v-if="driver.driver.primary_platform_id" class="mt-4">
          <label class="font-medium text-gray-600">Primary Platform</label>
          <div class="mt-1">
            <Chip :label="driver.driver.primary_platform_id" class="bg-blue-100 text-blue-800" />
          </div>
        </div>
      </section>

      <!-- League-Specific Information -->
      <section>
        <h3 class="font-semibold mb-4 pb-2 border-b">League Information</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="font-medium text-gray-600">Driver Number</label>
            <p class="mt-1 font-semibold">{{ driver.driver_number ?? 'Not assigned' }}</p>
          </div>
          <div>
            <label class="font-medium text-gray-600">Status</label>
            <div class="mt-1">
              <DriverStatusBadge :status="driver.status" />
            </div>
          </div>
          <div>
            <label class="font-medium text-gray-600">Added to League</label>
            <p class="mt-1">{{ formatDate(driver.added_to_league_at) }}</p>
          </div>
        </div>

        <!-- League Notes -->
        <div v-if="driver.league_notes" class="mt-4">
          <label class="font-medium text-gray-600">League Notes</label>
          <div class="mt-1 p-3 bg-gray-50 rounded border">
            <p class="whitespace-pre-wrap">{{ driver.league_notes }}</p>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Close" severity="secondary" @click="handleClose" />
        <Button label="Edit Driver" icon="pi pi-pencil" @click="handleEdit" />
      </div>
    </template>
  </Dialog>
</template>
