<template>
  <div id="app">
    <Toast />
    <ConfirmDialog />
    <Header />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import Header from '@app/components/layout/Header.vue';
</script>
