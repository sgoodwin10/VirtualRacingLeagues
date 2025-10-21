<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Drawer from 'primevue/drawer';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Editor from 'primevue/editor';
import { useLeagueStore } from '@user/stores/leagueStore';
import ImageUpload from '@user/components/common/forms/ImageUpload.vue';
import PlatformMultiSelect from '@user/components/league/partials/PlatformMultiSelect.vue';
import SocialMediaFields from '@user/components/league/partials/SocialMediaFields.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import FormError from '@user/components/common/forms/FormError.vue';
import FormInputGroup from '@user/components/common/forms/FormInputGroup.vue';
import FormOptionalText from '@user/components/common/forms/FormOptionalText.vue';
import BasePanel from '@user/components/common/panels/BasePanel.vue';
import DrawerHeader from '@user/components/common/modals/DrawerHeader.vue';
import DrawerLoading from '@user/components/common/modals/DrawerLoading.vue';
import type {
  CreateLeagueForm,
  UpdateLeagueForm,
  FormErrors,
  LeagueVisibility,
} from '@user/types/league';
import type { AxiosError } from 'axios';
import { useDebounce } from '@vueuse/core';

interface Props {
  visible: boolean;
  isEditMode?: boolean;
  leagueId?: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'league-saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const leagueStore = useLeagueStore();

const activeTab = ref('0');
const isSubmitting = ref(false);
const isLoadingLeague = ref(false);

const form = reactive<CreateLeagueForm>({
  name: '',
  logo: null,
  logo_url: null,
  platform_ids: [],
  timezone: '',
  visibility: 'public',
  tagline: '',
  description: '',
  header_image: null,
  header_image_url: null,
  contact_email: '',
  organizer_name: '',
  discord_url: '',
  website_url: '',
  twitter_handle: '',
  instagram_handle: '',
  youtube_url: '',
  twitch_url: '',
});

const errors = reactive<FormErrors>({});

// Slug checking
const isCheckingSlug = ref(false);
const slugAvailable = ref<boolean | null>(null);
const generatedSlug = ref<string>('');
const suggestedSlug = ref<string | null>(null);
const debouncedName = useDebounce(
  computed(() => form.name),
  500,
);

// Visibility options with tooltips
const visibilityOptions = ref([
  {
    label: 'Public',
    value: 'public',
    icon: 'pi pi-globe',
    description: 'Anyone can find and view your league',
  },
  {
    label: 'Private',
    value: 'private',
    icon: 'pi pi-lock',
    description: 'Only invited members can access',
  },
  {
    label: 'Unlisted',
    value: 'unlisted',
    icon: 'pi pi-eye-slash',
    description: 'Hidden from search, accessible via link',
  },
]);

const timezoneOptions = computed(() => {
  return leagueStore.timezones.map((tz) => ({
    label: tz.label,
    value: tz.value,
  }));
});

const canSubmit = computed(() => {
  return validateForm();
});

const drawerTitle = computed(() => (props.isEditMode ? 'Edit League' : 'Create New League'));

const drawerSubtitle = computed(() =>
  props.isEditMode
    ? 'Update your league information'
    : 'Complete the information below to create your racing league',
);

const submitButtonLabel = computed(() => (props.isEditMode ? 'Save Changes' : 'Create League'));

// Watch for name changes to check slug availability
watch(debouncedName, async (newName) => {
  if (!newName || !newName.trim()) {
    slugAvailable.value = null;
    return;
  }

  await checkSlugAvailability();
});

// Watch for drawer visibility changes
watch(
  () => props.visible,
  async (newValue: boolean) => {
    if (newValue) {
      // Load platforms and timezones when drawer opens
      try {
        await Promise.all([leagueStore.fetchPlatforms(), leagueStore.fetchTimezones()]);

        // If in edit mode, load the league data
        if (props.isEditMode && props.leagueId) {
          await loadLeagueData(props.leagueId);
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load required data. Please try again.',
          life: 5000,
        });
        closeDrawer();
      }
    } else {
      // Reset form when drawer closes
      resetForm();
    }
  },
);

async function loadLeagueData(leagueId: number): Promise<void> {
  isLoadingLeague.value = true;
  try {
    const league = await leagueStore.fetchLeague(leagueId);

    // Pre-populate form with existing league data
    form.name = league.name;
    form.logo_url = league.logo_url;
    form.platform_ids = league.platform_ids;
    form.timezone = league.timezone;
    form.visibility = league.visibility;
    form.tagline = league.tagline || '';
    form.description = league.description || '';
    form.header_image_url = league.header_image_url;
    form.contact_email = league.contact_email || '';
    form.organizer_name = league.organizer_name || '';
    form.discord_url = league.discord_url || '';
    form.website_url = league.website_url || '';
    form.twitter_handle = league.twitter_handle || '';
    form.instagram_handle = league.instagram_handle || '';
    form.youtube_url = league.youtube_url || '';
    form.twitch_url = league.twitch_url || '';

    // Note: logo and header_image are File objects and will remain null
    // unless the user uploads new ones
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load league data',
      life: 5000,
    });
    closeDrawer();
  } finally {
    isLoadingLeague.value = false;
  }
}

async function checkSlugAvailability(): Promise<void> {
  if (!form.name || !form.name.trim()) {
    slugAvailable.value = null;
    generatedSlug.value = '';
    suggestedSlug.value = null;
    return;
  }

  isCheckingSlug.value = true;

  try {
    // Pass the league ID when in edit mode to exclude it from the check
    const leagueIdToExclude = props.isEditMode ? props.leagueId : undefined;
    const result = await leagueStore.checkSlug(form.name, leagueIdToExclude);

    slugAvailable.value = result.available;
    generatedSlug.value = result.slug;
    suggestedSlug.value = result.suggestion;

    if (!result.available) {
      errors.name = 'This league name is already taken';
    } else {
      delete errors.name;
    }
  } catch (error) {
    console.error('Error checking slug:', error);
    slugAvailable.value = null;
    generatedSlug.value = '';
    suggestedSlug.value = null;
  } finally {
    isCheckingSlug.value = false;
  }
}

function validateForm(): boolean {
  let isValid = true;

  // Required fields: only name and platforms
  if (!form.name.trim()) {
    isValid = false;
  }

  if (form.platform_ids.length === 0) {
    isValid = false;
  }

  // Validate email format if email is provided (optional field)
  if (form.contact_email && form.contact_email.trim() && !isValidEmail(form.contact_email)) {
    isValid = false;
  }

  return isValid;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function clearErrors(): void {
  Object.keys(errors).forEach((key) => {
    delete errors[key as keyof FormErrors];
  });
}

async function submitForm(): Promise<void> {
  clearErrors();
  let hasErrors = false;

  // Validate required fields: only name and platforms
  if (!form.name.trim()) {
    errors.name = 'League name is required';
    hasErrors = true;
  }

  if (form.platform_ids.length === 0) {
    errors.platform_ids = 'Please select at least one platform';
    hasErrors = true;
  }

  // Validate email format if provided (optional field)
  if (form.contact_email && form.contact_email.trim() && !isValidEmail(form.contact_email)) {
    errors.contact_email = 'Please enter a valid email address';
    hasErrors = true;
  }

  if (hasErrors) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields correctly',
      life: 3000,
    });
    return;
  }

  isSubmitting.value = true;

  try {
    if (props.isEditMode && props.leagueId) {
      // Update existing league
      const updateData: UpdateLeagueForm = {
        name: form.name,
        platform_ids: form.platform_ids,
        timezone: form.timezone,
        visibility: form.visibility,
        tagline: form.tagline,
        description: form.description,
        contact_email: form.contact_email,
        organizer_name: form.organizer_name,
        discord_url: form.discord_url,
        website_url: form.website_url,
        twitter_handle: form.twitter_handle,
        instagram_handle: form.instagram_handle,
        youtube_url: form.youtube_url,
        twitch_url: form.twitch_url,
      };

      // Only include files if they were uploaded
      if (form.logo) {
        updateData.logo = form.logo;
      }
      if (form.header_image) {
        updateData.header_image = form.header_image;
      }

      await leagueStore.updateExistingLeague(props.leagueId, updateData);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'League updated successfully!',
        life: 3000,
      });
    } else {
      // Create new league
      await leagueStore.createNewLeague(form);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'League created successfully!',
        life: 3000,
      });
    }

    // Emit success event and close drawer
    emit('league-saved');
    closeDrawer();
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string; errors?: Record<string, string[]> }>;

    if (axiosError.response?.data?.errors) {
      // Handle validation errors from backend
      const backendErrors = axiosError.response.data.errors;
      Object.keys(backendErrors).forEach((key) => {
        const errorArray = backendErrors[key];
        if (errorArray && errorArray[0]) {
          errors[key as keyof FormErrors] = errorArray[0];
        }
      });

      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please check the form for errors',
        life: 5000,
      });
    } else {
      const actionWord = props.isEditMode ? 'update' : 'create';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail:
          axiosError.response?.data?.message || `Failed to ${actionWord} league. Please try again.`,
        life: 5000,
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

function closeDrawer(): void {
  emit('update:visible', false);
}

function resetForm(): void {
  // Reset tab to first
  activeTab.value = '0';

  // Reset form fields
  form.name = '';
  form.logo = null;
  form.logo_url = null;
  form.platform_ids = [];
  form.timezone = '';
  form.visibility = 'public';
  form.tagline = '';
  form.description = '';
  form.header_image = null;
  form.header_image_url = null;
  form.contact_email = '';
  form.organizer_name = '';
  form.discord_url = '';
  form.website_url = '';
  form.twitter_handle = '';
  form.instagram_handle = '';
  form.youtube_url = '';
  form.twitch_url = '';

  // Reset slug checking state
  slugAvailable.value = null;
  generatedSlug.value = '';
  suggestedSlug.value = null;

  // Clear errors
  clearErrors();
}
</script>

<template>
  <Drawer
    :visible="visible"
    position="bottom"
    class="!h-[60vh] bg-gray-50"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <DrawerHeader :title="drawerTitle" :subtitle="drawerSubtitle" />
    </template>

    <DrawerLoading v-if="isLoadingLeague" message="Loading league data..." />

    <div v-else class="container mx-auto flex flex-col max-w-5xl px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left Column (66%) -->
        <div class="md:col-span-2 space-y-4">
          <div class="flex space-x-2">
            <!-- League Name -->
            <FormInputGroup class="w-1/3">
              <FormLabel for="league-name" text="League Name" :required="true" />
              <InputText
                id="league-name"
                v-model="form.name"
                size="small"
                placeholder="Enter your league name"
                :class="{ 'p-invalid': !!errors.name }"
                class="w-full"
                @blur="checkSlugAvailability"
              />
              <div class="flex flex-col gap-1">
                <!-- Checking status -->
                <div v-if="isCheckingSlug" class="flex items-center gap-2">
                  <i class="pi pi-spin pi-spinner text-sm text-gray-500"></i>
                  <small class="text-gray-600">Checking availability...</small>
                </div>

                <!-- Available - show the slug that will be used -->
                <div
                  v-else-if="slugAvailable === true && generatedSlug"
                  class="flex items-center gap-2"
                >
                  <i class="pi pi-check-circle text-green-500 text-sm"></i>
                  <small class="text-green-600">
                    League URL: <span class="font-mono font-semibold">{{ generatedSlug }}</span>
                  </small>
                </div>

                <!-- Not available - show the suggested unique slug -->
                <div
                  v-else-if="slugAvailable === false && suggestedSlug"
                  class="flex items-center gap-2"
                >
                  <i class="pi pi-info-circle text-amber-500 text-sm"></i>
                  <small class="text-amber-700">
                    Name taken. League will use URL:
                    <span class="font-mono font-semibold">{{ suggestedSlug }}</span>
                  </small>
                </div>
              </div>
              <FormError :error="errors.name" />
            </FormInputGroup>

            <!-- Tagline -->
            <FormInputGroup class="w-2/3">
              <FormLabel for="tagline" text="Tagline" />
              <InputText
                id="tagline"
                v-model="form.tagline"
                size="small"
                placeholder="A short, catchy phrase describing your league"
                maxlength="150"
                :class="{ 'p-invalid': !!errors.tagline }"
                class="w-full"
              />
              <FormOptionalText text="A brief one-liner about your league (max 150 characters)" />
              <FormError :error="errors.tagline" />
            </FormInputGroup>
          </div>

          <!-- Platforms -->
          <PlatformMultiSelect
            v-model="form.platform_ids"
            :platforms="leagueStore.platforms"
            :error="errors.platform_ids"
            :required="true"
          />

          <!-- Description -->
          <FormInputGroup>
            <FormLabel for="description" text="Description" />
            <Editor
              id="description"
              v-model="form.description"
              editor-style="height: 200px"
              :class="{ 'p-invalid': !!errors.description }"
            >
              <template #toolbar>
                <span class="ql-formats">
                  <button class="ql-bold" type="button"></button>
                  <button class="ql-italic" type="button"></button>
                  <button class="ql-underline" type="button"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-list" value="ordered" type="button"></button>
                  <button class="ql-list" value="bullet" type="button"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-link" type="button"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-clean" type="button"></button>
                </span>
              </template>
            </Editor>
            <FormOptionalText text="Tell potential members what your league is all about" />
            <FormError :error="errors.description" />
          </FormInputGroup>
        </div>

        <!-- Right Column (33%) -->
        <div class="space-y-6">
          <!-- Contact Email -->
          <FormInputGroup>
            <FormLabel for="contact-email" text="Contact Email" />
            <InputText
              id="contact-email"
              v-model="form.contact_email"
              type="email"
              size="small"
              placeholder="league@example.com"
              :class="{ 'p-invalid': !!errors.contact_email }"
              class="w-full"
            />
            <FormOptionalText text="Visible to league members for inquiries" />
            <FormError :error="errors.contact_email" />
          </FormInputGroup>

          <!-- Organizer Name -->
          <FormInputGroup>
            <FormLabel for="organizer-name" text="Contact Name" />
            <InputText
              id="organizer-name"
              v-model="form.organizer_name"
              placeholder="Your name or organisation"
              maxlength="100"
              size="small"
              :class="{ 'p-invalid': !!errors.organizer_name }"
              class="w-full"
            />
            <FormOptionalText text="Displayed as the league organiser" />
            <FormError :error="errors.organizer_name" />
          </FormInputGroup>

          <!-- Visibility (Compact) -->
          <FormInputGroup>
            <FormLabel text="Visibility" />
            <div class="flex gap-2">
              <button
                v-for="option in visibilityOptions"
                :key="option.value"
                v-tooltip.top="option.description"
                type="button"
                class="flex-1 px-3 py-2 border rounded-lg transition-all flex items-center justify-center gap-2"
                :class="{
                  'border-blue-500 bg-blue-100 text-blue-700': form.visibility === option.value,
                  'border-gray-300 hover:border-gray-400 bg-white':
                    form.visibility !== option.value,
                }"
                @click="form.visibility = option.value as LeagueVisibility"
              >
                <i :class="option.icon" class="text-sm"></i>
                <span class="text-sm font-medium">{{ option.label }}</span>
              </button>
            </div>
            <FormOptionalText text="Choose how your league appears in searches" />
            <FormError :error="errors.visibility" />
          </FormInputGroup>

          <!-- Timezone -->
          <FormInputGroup>
            <FormLabel for="timezone" text="Timezone" />
            <Select
              id="timezone"
              v-model="form.timezone"
              :options="timezoneOptions"
              option-label="label"
              option-value="value"
              placeholder="Select timezone"
              :filter="true"
              size="small"
              :class="{ 'p-invalid': !!errors.timezone }"
              class="w-full"
            />
            <FormOptionalText text="Used for scheduling events and race times" />
            <FormError :error="errors.timezone" />
          </FormInputGroup>
        </div>
      </div>

      <Tabs v-model:value="activeTab" class="flex-1 flex flex-col mt-4">
        <TabList class="bg-gray-50">
          <Tab value="0" class="bg-white border-r border-gray-100">Logo & Header Image</Tab>
          <Tab value="1" class="bg-white">Social Media</Tab>
        </TabList>
        <TabPanels class="flex-1">
          <!-- Tab 1: Information -->
          <TabPanel value="1" class="flex-1">
            <div class="">
              <SocialMediaFields
                :discord-url="form.discord_url"
                :website-url="form.website_url"
                :twitter-handle="form.twitter_handle"
                :instagram-handle="form.instagram_handle"
                :youtube-url="form.youtube_url"
                :twitch-url="form.twitch_url"
                :errors="{
                  discord_url: errors.discord_url,
                  website_url: errors.website_url,
                  twitter_handle: errors.twitter_handle,
                  instagram_handle: errors.instagram_handle,
                  youtube_url: errors.youtube_url,
                  twitch_url: errors.twitch_url,
                }"
                @update:discord-url="form.discord_url = $event"
                @update:website-url="form.website_url = $event"
                @update:twitter-handle="form.twitter_handle = $event"
                @update:instagram-handle="form.instagram_handle = $event"
                @update:youtube-url="form.youtube_url = $event"
                @update:twitch-url="form.twitch_url = $event"
              />
            </div>
          </TabPanel>

          <!-- Tab 2: Media -->
          <TabPanel value="0">
            <div>
              <div>Upload images to personalise your league.</div>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                <!-- Logo Upload -->
                <BasePanel :header="'League Logo'" class="lg:col-span-1">
                  <ImageUpload
                    v-model="form.logo"
                    :existing-image-url="form.logo_url ?? null"
                    label="League Logo"
                    :required="false"
                    :error="errors.logo"
                    preview-size="small"
                    helper-text="A square logo. Recommended: 400x400px"
                    @remove-existing="form.logo_url = null"
                  />
                </BasePanel>

                <!-- Header Image -->
                <BasePanel :header="'League Header Image'" class="lg:col-span-2">
                  <ImageUpload
                    v-model="form.header_image"
                    :existing-image-url="form.header_image_url ?? null"
                    label="League Header Image"
                    :required="false"
                    :error="errors.header_image"
                    preview-size="large"
                    helper-text="A banner image for your league's profile page.Recommended: 1200x400px"
                    @remove-existing="form.header_image_url = null"
                  />
                </BasePanel>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <div v-if="!isLoadingLeague" class="bg-tertiary mt-4 shadow-reverse border-t border-gray-200">
      <!-- Action Buttons -->
      <div class="container mx-auto flex flex-col max-w-5xl">
        <div class="flex justify-between p-4">
          <div>
            <Button
              label="Cancel"
              severity="danger"
              class="bg-white"
              outlined
              :disabled="isSubmitting"
              @click="closeDrawer"
            />
          </div>

          <div>
            <Button
              :label="submitButtonLabel"
              :loading="isSubmitting"
              :disabled="!canSubmit"
              @click="submitForm"
            />
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>
