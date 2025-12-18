<script setup lang="ts">
import { ref } from 'vue';
import DriverInfoModal from './overlays/modals/DriverInfoModal.vue';

interface Props {
  driverName: string;
  driverId: number;
}

defineProps<Props>();

const showModal = ref(false);

const handleClick = () => {
  showModal.value = true;
};
</script>

<template>
  <span>
    <button type="button" class="driver-name-link" @click="handleClick">
      {{ driverName }}
    </button>

    <DriverInfoModal v-model="showModal" :season-driver-id="driverId" />
  </span>
</template>

<style scoped>
.driver-name-link {
  display: inline;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--text-primary);
  cursor: pointer;
  text-decoration: none;
  position: relative;
  transition: color 0.2s;
}

.driver-name-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: var(--racing-gold);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.2s;
}

.driver-name-link:hover {
  color: var(--racing-gold);
}

.driver-name-link:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

.driver-name-link:focus {
  outline: 2px solid var(--racing-gold);
  outline-offset: 2px;
  border-radius: 2px;
}

.driver-name-link:active {
  color: var(--racing-gold-dark);
}
</style>
