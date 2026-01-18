<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="bg-[var(--bg-panel)] border-t border-[var(--border)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center text-sm text-[var(--text-muted)]">
        &copy; {{ currentYear }} {{ $appName || 'App' }}. All rights reserved.
      </div>
    </div>
  </footer>
</template>
