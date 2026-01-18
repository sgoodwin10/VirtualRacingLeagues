<script setup lang="ts">
//
</script>

<template>
  <div class="bg-white">
    <!-- Hero Section -->
    <div class="relative isolate px-6 pt-14 lg:px-8">
      <div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome to {{ $appName || 'Our App' }}
          </h1>
          <p class="mt-6 text-lg leading-8 text-gray-600">
            Get started by signing up for a free account or logging in to your existing account.
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <router-link
              to="/register"
              class="rounded-md bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              Get started
            </router-link>
            <router-link to="/login" class="text-sm font-semibold leading-6 text-gray-900">
              Sign in <span aria-hidden="true">→</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
