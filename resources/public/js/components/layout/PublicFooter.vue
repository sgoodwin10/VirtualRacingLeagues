<template>
  <footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Company info -->
        <div class="col-span-1 md:col-span-2">
          <h3 class="text-lg font-semibold mb-4">{{ appName }}</h3>
          <p class="text-gray-400 mb-4">
            Your description here. Build amazing applications with our platform.
          </p>
        </div>

        <!-- Quick links -->
        <div>
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Quick Links
          </h4>
          <ul class="space-y-2">
            <li>
              <router-link to="/" class="text-gray-400 hover:text-white"> Home </router-link>
            </li>
            <li>
              <router-link to="/login" class="text-gray-400 hover:text-white"> Login </router-link>
            </li>
            <li>
              <router-link to="/register" class="text-gray-400 hover:text-white">
                Register
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Support</h4>
          <ul class="space-y-2">
            <li>
              <a href="#" class="text-gray-400 hover:text-white"> Help Center </a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-white"> Contact Us </a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-white"> Privacy Policy </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-gray-800 mt-8 pt-8">
        <p class="text-center text-gray-400">
          &copy; {{ currentYear }} {{ appName }}. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const appName = computed(() => {
  return import.meta.env.VITE_APP_NAME || 'Your App';
});

const currentYear = new Date().getFullYear();
</script>
