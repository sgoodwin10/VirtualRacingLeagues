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
import ImageUpload from '@user/components/league/partials/ImageUpload.vue';
import PlatformMultiSelect from '@user/components/league/partials/PlatformMultiSelect.vue';
import SocialMediaFields from '@user/components/league/partials/SocialMediaFields.vue';
import FormLabel from '@user/components/common/FormLabel.vue';
import FormError from '@user/components/common/FormError.vue';
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
const debouncedName = useDebounce(
  computed(() => form.name),
  500
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
    : 'Complete the information below to create your racing league'
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
  }
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
    form.contact_email = league.contact_email;
    form.organizer_name = league.organizer_name;
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
    return;
  }

  isCheckingSlug.value = true;

  try {
    slugAvailable.value = await leagueStore.checkSlug(form.name);

    if (!slugAvailable.value) {
      errors.name = 'This league name is already taken';
    } else {
      delete errors.name;
    }
  } catch (error) {
    console.error('Error checking slug:', error);
  } finally {
    isCheckingSlug.value = false;
  }
}

function validateForm(): boolean {
  let isValid = true;

  // Required fields from Information tab
  if (!form.name.trim()) {
    isValid = false;
  }

  if (form.platform_ids.length === 0) {
    isValid = false;
  }

  if (!form.contact_email.trim() || !isValidEmail(form.contact_email)) {
    isValid = false;
  }

  if (!form.organizer_name.trim()) {
    isValid = false;
  }

  if (!form.visibility) {
    isValid = false;
  }

  if (!form.timezone) {
    isValid = false;
  }

  // Logo is only required for create mode, not edit mode
  if (!props.isEditMode && !form.logo) {
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

  // Validate required fields
  if (!form.name.trim()) {
    errors.name = 'League name is required';
    hasErrors = true;
  }

  // Logo is only required for create mode
  if (!props.isEditMode && !form.logo) {
    errors.logo = 'League logo is required';
    hasErrors = true;
  }

  if (form.platform_ids.length === 0) {
    errors.platform_ids = 'Please select at least one platform';
    hasErrors = true;
  }

  if (!form.timezone) {
    errors.timezone = 'Timezone is required';
    hasErrors = true;
  }

  if (!form.visibility) {
    errors.visibility = 'Visibility is required';
    hasErrors = true;
  }

  if (!form.contact_email.trim()) {
    errors.contact_email = 'Contact email is required';
    hasErrors = true;
  } else if (!isValidEmail(form.contact_email)) {
    errors.contact_email = 'Please enter a valid email address';
    hasErrors = true;
  }

  if (!form.organizer_name.trim()) {
    errors.organizer_name = 'Organizer name is required';
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

  // Clear errors
  clearErrors();
}
</script>

<template>
  <Drawer
    :visible="visible"
    position="bottom"
    class="!h-[80vh] bg-gray-50"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <div class="container w-full xl:mx-auto px-4">
        <h2 class="text-2xl font-bold mb-1">{{ drawerTitle }}</h2>
        <p class="text-gray-600">{{ drawerSubtitle }}</p>
      </div>
    </template>

    <div v-if="isLoadingLeague" class="h-full flex items-center justify-center">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
        <p class="text-gray-600">Loading league data...</p>
      </div>
    </div>

    <div v-else class="h-full flex flex-col">
      <Tabs v-model:value="activeTab" class="flex-1 flex flex-col">
        <TabList>
          <Tab value="0">Information</Tab>
          <Tab value="1">Media</Tab>
        </TabList>
        <TabPanels class="flex-1">
          <!-- Tab 1: Information -->
          <TabPanel value="0" class="flex-1">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Left Column (66%) -->
              <div class="lg:col-span-2 space-y-4">
                <div class="flex space-x-2">
                  <!-- League Name -->
                  <div class="space-y-1 w-1/3 class=" :required="true">
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
                    <div class="flex items-center gap-2">
                      <i v-if="isCheckingSlug" class="pi pi-spin pi-spinner text-sm"></i>
                      <i
                        v-else-if="slugAvailable === true"
                        class="pi pi-check-circle text-green-500 text-sm"
                      ></i>
                      <i
                        v-else-if="slugAvailable === false"
                        class="pi pi-times-circle text-red-500 text-sm"
                      ></i>
                      <small v-if="isCheckingSlug" class="text-gray-600"
                        >Checking availability...</small
                      >
                      <small v-else-if="slugAvailable === true" class="text-green-600">
                        League name is available
                      </small>
                    </div>
                    <FormError :error="errors.name" />
                  </div>

                  <!-- Tagline -->
                  <div class="space-y-1 w-2/3">
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
                    <p class="text-xs text-gray-500">
                      <span class="font-medium">Optional:</span> A brief one-liner about your league
                      (max 150 characters)
                    </p>
                    <FormError :error="errors.tagline" />
                  </div>
                </div>

                <!-- Description -->
                <div class="space-y-1">
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
                  <p class="text-xs text-gray-500">
                    <span class="font-medium">Optional:</span> Tell potential members what your
                    league is all about
                  </p>
                  <FormError :error="errors.description" />
                </div>

                <!-- Platforms -->
                <PlatformMultiSelect
                  v-model="form.platform_ids"
                  :platforms="leagueStore.platforms"
                  :error="errors.platform_ids"
                  :required="true"
                />
              </div>

              <!-- Right Column (33%) -->
              <div class="space-y-6">
                <!-- Contact Email -->
                <div class="space-y-1">
                  <FormLabel for="contact-email" text="Contact Email" :required="true" />
                  <InputText
                    id="contact-email"
                    v-model="form.contact_email"
                    type="email"
                    size="small"
                    placeholder="league@example.com"
                    :class="{ 'p-invalid': !!errors.contact_email }"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500">Visible to league members for inquiries</p>
                  <FormError :error="errors.contact_email" />
                </div>

                <!-- Organizer Name -->
                <div class="space-y-1">
                  <FormLabel for="organizer-name" text="Contact Name" :required="true" />
                  <InputText
                    id="organizer-name"
                    v-model="form.organizer_name"
                    placeholder="Your name or organization"
                    maxlength="100"
                    size="small"
                    :class="{ 'p-invalid': !!errors.organizer_name }"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500">Displayed as the league organizer</p>
                  <FormError :error="errors.organizer_name" />
                </div>

                <!-- Visibility (Compact) -->
                <div class="space-y-1">
                  <FormLabel text="Visibility" :required="true" />
                  <div class="flex gap-2">
                    <button
                      v-for="option in visibilityOptions"
                      :key="option.value"
                      v-tooltip.top="option.description"
                      type="button"
                      class="flex-1 px-3 py-2 border rounded-lg transition-all flex items-center justify-center gap-2"
                      :class="{
                        'border-blue-500 bg-blue-50 text-blue-700':
                          form.visibility === option.value,
                        'border-gray-300 hover:border-gray-400': form.visibility !== option.value,
                      }"
                      @click="form.visibility = option.value as LeagueVisibility"
                    >
                      <i :class="option.icon" class="text-sm"></i>
                      <span class="text-sm font-medium">{{ option.label }}</span>
                    </button>
                  </div>
                  <FormError :error="errors.visibility" />
                </div>

                <!-- Timezone -->
                <div class="space-y-1">
                  <FormLabel for="timezone" text="Timezone" :required="true" />
                  <Select
                    id="timezone"
                    v-model="form.timezone"
                    :options="timezoneOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select timezone"
                    :filter="true"
                    :class="{ 'p-invalid': !!errors.timezone }"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500">Used for scheduling events and race times</p>
                  <FormError :error="errors.timezone" />
                </div>
              </div>
            </div>

            <!-- Full Width Section: Social Media -->
            <div class="mt-8 pt-6 border-t">
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
          <TabPanel value="1">
            <div class="space-y-6 max-w-2xl">
              <div>
                <h2 class="text-2xl font-bold mb-2">League Media</h2>
                <p class="text-gray-600">Upload logo and header image for your league</p>
              </div>

              <!-- Logo Upload -->
              <ImageUpload
                v-model="form.logo"
                :existing-image-url="form.logo_url ?? null"
                label="League Logo"
                :required="!isEditMode"
                :error="errors.logo"
                preview-size="small"
                @remove-existing="form.logo_url = null"
              />

              <!-- Header Image -->
              <ImageUpload
                v-model="form.header_image"
                :existing-image-url="form.header_image_url ?? null"
                label="Header Image"
                :required="false"
                :error="errors.header_image"
                preview-size="large"
                @remove-existing="form.header_image_url = null"
              />
              <p class="text-sm text-gray-600">
                Optional: A banner image for your league's profile page (recommended: 1200x400px)
              </p>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <!-- Action Buttons -->
      <div class="flex justify-between pt-6 border-t mt-4">
        <div>
          <Button
            label="Cancel"
            severity="secondary"
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
  </Drawer>
</template>
