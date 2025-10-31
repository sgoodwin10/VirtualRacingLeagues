<script setup lang="ts">
import { useUserStore } from '@app/stores/userStore';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {{ userStore.userFirstName }}!
        </h1>
        <p class="text-lg text-gray-600">Here's what's happening with your account today.</p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <template #title>
            <div class="flex items-center gap-3">
              <i class="pi pi-user text-blue-600 text-2xl"></i>
              <span>Profile</span>
            </div>
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">Manage your profile information and settings.</p>
            <Button
              label="View Profile"
              icon="pi pi-arrow-right"
              severity="primary"
              outlined
              @click="router.push({ name: 'profile' })"
            />
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-3">
              <i class="pi pi-shield text-green-600 text-2xl"></i>
              <span>Account Status</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2">
                <i
                  :class="[
                    'pi',
                    userStore.isEmailVerified
                      ? 'pi-check-circle text-green-600'
                      : 'pi-times-circle text-red-600',
                  ]"
                ></i>
                <span class="text-gray-700">
                  Email {{ userStore.isEmailVerified ? 'Verified' : 'Not Verified' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                <span class="text-gray-700">Account Active</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Dashboard Stats or Additional Content -->
      <Card>
        <template #title>Dashboard Overview</template>
        <template #content>
          <p class="text-gray-600">
            Your personalized dashboard content will appear here. This is your central hub for
            managing all aspects of your account.
          </p>
        </template>
      </Card>
    </div>
  </div>
</template>
