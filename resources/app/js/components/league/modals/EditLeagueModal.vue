<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { PhFlag } from '@phosphor-icons/vue';
import { Button } from '@app/components/common/buttons';
import { useLeagueStore } from '@app/stores/leagueStore';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import EditLeagueSidebar from './partials/EditLeagueSidebar.vue';
import BasicInfoSection from './partials/sections/BasicInfoSection.vue';
import ContactSection from './partials/sections/ContactSection.vue';
import MediaSection from './partials/sections/MediaSection.vue';
import SocialSection from './partials/sections/SocialSection.vue';
import type {
  CreateLeagueForm,
  UpdateLeagueForm,
  FormErrors,
  LeagueVisibility,
} from '@app/types/league';
import type { SectionId } from './partials/EditLeagueSidebar.vue';
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

const activeSection = ref<SectionId>('basic');
const isSubmitting = ref(false);
const isLoadingLeague = ref(false);
const slugCheckController = ref<AbortController | null>(null);
const originalLeagueName = ref<string>('');

const form = reactive<CreateLeagueForm>({
  name: '',
  logo: null,
  logo_url: undefined,
  platform_ids: [],
  timezone: '',
  visibility: 'public',
  tagline: '',
  description: '',
  banner: null,
  banner_url: undefined,
  header_image: null,
  header_image_url: undefined,
  contact_email: '',
  organizer_name: '',
  discord_url: '',
  website_url: '',
  twitter_handle: '',
  instagram_handle: '',
  facebook_handle: '',
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

const modalTitle = computed(() =>
  props.isEditMode ? `Edit League: ${form.name}` : 'Create New League',
);

const submitButtonLabel = computed(() => (props.isEditMode ? 'Save Changes' : 'Create League'));

const canSubmit = computed(() => {
  return validateForm();
});

const mediaCount = computed(() => {
  let count = 0;
  if (form.logo || form.logo_url) count++;
  if (form.banner || form.banner_url) count++;
  if (form.header_image || form.header_image_url) count++;
  return count;
});

const isNameValid = computed(() => {
  return form.name.trim() !== '' && slugAvailable.value !== false;
});

const isPlatformsValid = computed(() => {
  return form.platform_ids.length > 0;
});

// Watch for name changes to check slug availability
watch(debouncedName, async (newName) => {
  if (!newName || !newName.trim()) {
    slugAvailable.value = null;
    return;
  }

  // Skip slug check if the name hasn't changed from the original (edit mode)
  if (props.isEditMode && newName === originalLeagueName.value) {
    slugAvailable.value = true;
    delete errors.name;
    return;
  }

  await checkSlugAvailability();
});

// Watch for modal visibility changes
watch(
  () => props.visible,
  async (newValue: boolean) => {
    if (newValue) {
      // Load platforms and timezones when modal opens
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
        closeModal();
      }
    } else {
      // Abort any pending slug checks when modal closes
      if (slugCheckController.value) {
        slugCheckController.value.abort();
        slugCheckController.value = null;
      }
      // Reset form when modal closes
      resetForm();
    }
  },
);

async function loadLeagueData(leagueId: number): Promise<void> {
  isLoadingLeague.value = true;
  try {
    const league = await leagueStore.fetchLeague(leagueId);

    // Store the original name for comparison
    originalLeagueName.value = league.name;

    // Pre-populate form with existing league data
    form.name = league.name;
    form.logo_url = league.logo?.original || league.logo_url || undefined;
    form.platform_ids = league.platform_ids;
    form.timezone = league.timezone;
    form.visibility = league.visibility;
    form.tagline = league.tagline || '';
    form.description = league.description || '';
    form.banner_url = league.banner?.original || league.banner_url || undefined;
    form.header_image_url = league.header_image?.original || league.header_image_url || undefined;
    form.contact_email = league.contact_email || '';
    form.organizer_name = league.organizer_name || '';
    form.discord_url = league.discord_url || '';
    form.website_url = league.website_url || '';
    form.twitter_handle = league.twitter_handle || '';
    form.instagram_handle = league.instagram_handle || '';
    form.facebook_handle = league.facebook_handle || '';
    form.youtube_url = league.youtube_url || '';
    form.twitch_url = league.twitch_url || '';
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load league data',
      life: 5000,
    });
    closeModal();
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

  // Abort any pending slug check
  if (slugCheckController.value) {
    slugCheckController.value.abort();
  }

  // Create new controller for this request
  slugCheckController.value = new AbortController();

  isCheckingSlug.value = true;

  try {
    const leagueIdToExclude = props.isEditMode ? props.leagueId : undefined;
    const result = await leagueStore.checkSlug(
      form.name,
      leagueIdToExclude,
      slugCheckController.value.signal,
    );

    slugAvailable.value = result.available;
    generatedSlug.value = result.slug;
    suggestedSlug.value = result.suggestion;

    if (!result.available) {
      errors.name = 'This league name is already taken';
    } else {
      delete errors.name;
    }
  } catch (error) {
    // Ignore abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
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
    // Switch to basic section if errors
    activeSection.value = 'basic';
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
        facebook_handle: form.facebook_handle,
        youtube_url: form.youtube_url,
        twitch_url: form.twitch_url,
      };

      // Only include files if they were uploaded
      if (form.logo) {
        updateData.logo = form.logo;
      }
      if (form.banner) {
        updateData.banner = form.banner;
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

    // Emit success event and close modal
    emit('league-saved');
    closeModal();
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

function closeModal(): void {
  emit('update:visible', false);
}

function resetForm(): void {
  // Abort any pending slug checks
  if (slugCheckController.value) {
    slugCheckController.value.abort();
    slugCheckController.value = null;
  }

  // Reset section to first
  activeSection.value = 'basic';

  // Reset form fields
  form.name = '';
  form.logo = null;
  form.logo_url = undefined;
  form.platform_ids = [];
  form.timezone = '';
  form.visibility = 'public';
  form.tagline = '';
  form.description = '';
  form.banner = null;
  form.banner_url = undefined;
  form.header_image = null;
  form.header_image_url = undefined;
  form.contact_email = '';
  form.organizer_name = '';
  form.discord_url = '';
  form.website_url = '';
  form.twitter_handle = '';
  form.instagram_handle = '';
  form.facebook_handle = '';
  form.youtube_url = '';
  form.twitch_url = '';

  // Reset slug checking state
  slugAvailable.value = null;
  generatedSlug.value = '';
  suggestedSlug.value = null;
  originalLeagueName.value = '';

  // Clear errors
  clearErrors();
}

// Cleanup on component unmount
onUnmounted(() => {
  if (slugCheckController.value) {
    slugCheckController.value.abort();
    slugCheckController.value = null;
  }
});

function handleSectionChange(sectionId: SectionId): void {
  activeSection.value = sectionId;
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :header="modalTitle"
    width="6xl"
    :closable="true"
    :block-scroll="true"
    :loading="isLoadingLeague"
    :show-header="true"
    content-class="!p-0"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <div
        class="w-9 h-9 flex items-center justify-center bg-[var(--cyan-dim)] rounded-lg border border-[var(--border)]"
      >
        <PhFlag :size="18" weight="duotone" class="text-[var(--cyan)]" />
      </div>
      <div class="flex-auto pl-4">
        <div class="font-mono font-semibold tracking-wide text-[var(--text-primary)]">
          {{ modalTitle }}
        </div>
        <div class="text-[var(--text-secondary)]">
          {{ isEditMode ? 'Update league settings' : 'Create new racing league' }}
        </div>
      </div>
    </template>

    <!-- Split Layout -->
    <div class="grid grid-cols-[200px_1fr] min-h-[520px] max-h-[72vh]">
      <!-- Sidebar -->
      <EditLeagueSidebar
        :active-section="activeSection"
        :league-name="form.name"
        :platform-count="form.platform_ids.length"
        :visibility="form.visibility"
        :media-count="mediaCount"
        :is-name-valid="isNameValid"
        :is-platforms-valid="isPlatformsValid"
        @change-section="handleSectionChange"
      />

      <!-- Main Content -->
      <main class="overflow-y-auto bg-[var(--bg-dark)] p-6">
        <!-- Basic Info Section -->
        <BasicInfoSection
          v-show="activeSection === 'basic'"
          :form="form"
          :errors="errors"
          :platforms="leagueStore.platforms"
          :timezones="leagueStore.timezones"
          :is-checking-slug="isCheckingSlug"
          :slug-available="slugAvailable"
          :generated-slug="generatedSlug"
          :suggested-slug="suggestedSlug"
          @update:name="form.name = $event"
          @update:tagline="form.tagline = $event"
          @update:platform-ids="form.platform_ids = $event"
          @update:description="form.description = $event"
          @update:visibility="form.visibility = $event as LeagueVisibility"
          @update:timezone="form.timezone = $event"
          @blur:name="checkSlugAvailability"
        />

        <!-- Contact Section -->
        <ContactSection
          v-show="activeSection === 'contact'"
          :form="form"
          :errors="errors"
          @update:contact-email="form.contact_email = $event"
          @update:organizer-name="form.organizer_name = $event"
        />

        <!-- Media Section -->
        <MediaSection
          v-show="activeSection === 'media'"
          :form="form"
          :errors="errors"
          @update:logo="form.logo = $event"
          @update:banner="form.banner = $event"
          @update:header-image="form.header_image = $event"
          @remove-existing-logo="form.logo_url = undefined"
          @remove-existing-banner="form.banner_url = undefined"
          @remove-existing-header="form.header_image_url = undefined"
        />

        <!-- Social Section -->
        <SocialSection
          v-show="activeSection === 'social'"
          :form="form"
          :errors="errors"
          @update:discord-url="form.discord_url = $event"
          @update:website-url="form.website_url = $event"
          @update:twitter-handle="form.twitter_handle = $event"
          @update:instagram-handle="form.instagram_handle = $event"
          @update:facebook-handle="form.facebook_handle = $event"
          @update:youtube-url="form.youtube_url = $event"
          @update:twitch-url="form.twitch_url = $event"
        />
      </main>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="Cancel" variant="secondary" :disabled="isSubmitting" @click="closeModal" />
        <Button
          :label="submitButtonLabel"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="submitForm"
        />
      </div>
    </template>
  </BaseModal>
</template>
