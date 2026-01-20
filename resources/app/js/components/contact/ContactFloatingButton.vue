<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import ContactModal from './ContactModal.vue';
import { useGtm } from '@app/composables/useGtm';

const isOpen = ref(false);
const { trackEvent } = useGtm();

function openModal() {
  isOpen.value = true;
  trackEvent('contact_form_open', { source: 'app' });
}

function handleSuccess() {
  // Toast handled in modal
}

function handleError() {
  // Toast handled in modal
}
</script>

<template>
  <div class="contact-floating-container">
    <Button
      icon="pi pi-comment"
      rounded
      raised
      :severity="isOpen ? 'secondary' : 'primary'"
      size="large"
      aria-label="Contact Support"
      class="contact-fab"
      @click="openModal"
    />

    <ContactModal
      v-model:visible="isOpen"
      source="app"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
.contact-floating-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
}

.contact-fab {
  width: 3.5rem;
  height: 3.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.contact-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style>
