<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useLeagueStore } from '@app/stores/leagueStore';
import { useLeaguePlatforms } from '@app/composables/useLeaguePlatforms';
import { useCompetitionValidation } from '@app/composables/useCompetitionValidation';
import { checkSlugAvailability } from '@app/services/competitionService';
import type { Competition, CompetitionForm, SlugCheckResponse } from '@app/types/competition';

// PrimeVue Components
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';

// Common Components
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';

// Props
interface Props {
  visible: boolean;
  leagueId: number;
  competition?: Competition | null;
  isEditMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  competition: null,
  isEditMode: false,
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'competition-saved', competition: Competition): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();
const competitionStore = useCompetitionStore();
const leagueStore = useLeagueStore();
const { platformOptions } = useLeaguePlatforms(() => props.leagueId);

// State
const form = reactive<CompetitionForm>({
  name: '',
  description: '',
  platform_id: null,
  logo: null,
  logo_url: null,
});

const originalName = ref(''); // For tracking name changes
const isSubmitting = ref(false);
const isLoadingData = ref(false);
const showNameChangeDialog = ref(false);

// Slug preview state
const slugPreview = ref('');
const slugStatus = ref<'checking' | 'available' | 'taken' | 'error' | null>(null);
const slugSuggestion = ref<string | null>(null);

// Validation
const { errors, validateAll, clearError } = useCompetitionValidation(form);

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const modalTitle = computed(() => (props.isEditMode ? 'Edit Competition' : 'Create Competition'));

const nameChanged = computed(() => {
  return props.isEditMode && form.name !== originalName.value;
});

const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    form.name.trim().length >= 3 &&
    form.platform_id !== null &&
    !errors.name &&
    !errors.platform_id &&
    !errors.description &&
    !errors.logo
  );
});

// Slug checking (debounced)
const checkSlug = useDebounceFn(async () => {
  if (!form.name || form.name.trim().length < 3) {
    slugPreview.value = '';
    slugStatus.value = null;
    return;
  }

  slugStatus.value = 'checking';

  try {
    const result: SlugCheckResponse = await checkSlugAvailability(
      props.leagueId,
      form.name,
      props.competition?.id,
    );

    slugPreview.value = result.slug;
    slugStatus.value = result.available ? 'available' : 'taken';
    slugSuggestion.value = result.suggestion;
  } catch (error) {
    console.error('Slug check failed:', error);
    slugStatus.value = 'error';
  }
}, 500);

// Watch name changes for slug preview
watch(
  () => form.name,
  () => {
    clearError('name');
    checkSlug();
  },
);

// Watch drawer visibility
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      // Ensure platforms and league are loaded before opening the drawer
      try {
        await leagueStore.fetchPlatforms();

        // Load the league into currentLeague if not already loaded
        if (leagueStore.currentLeague?.id !== props.leagueId) {
          await leagueStore.fetchLeague(props.leagueId);
        }
      } catch (error) {
        console.error('Failed to load required data:', error);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load required data. Please try again.',
          life: 5000,
        });
        return;
      }

      if (props.isEditMode && props.competition) {
        loadCompetitionData();
      } else {
        resetForm();
      }
    }
  },
);

// Methods
function loadCompetitionData(): void {
  if (!props.competition) return;

  isLoadingData.value = true;

  form.name = props.competition.name;
  form.description = props.competition.description || '';
  form.platform_id = props.competition.platform_id;
  form.logo = null;
  // Only set logo_url if competition has its own logo (not using league fallback)
  form.logo_url = props.competition.has_own_logo ? props.competition.logo_url : null;

  originalName.value = props.competition.name;

  isLoadingData.value = false;
}

function resetForm(): void {
  form.name = '';
  form.description = '';
  form.platform_id = null;
  form.logo = null;
  form.logo_url = null;
  originalName.value = '';
  slugPreview.value = '';
  slugStatus.value = null;
  slugSuggestion.value = null;
  errors.name = undefined;
  errors.platform_id = undefined;
  errors.description = undefined;
  errors.logo = undefined;
}

function handleCancel(): void {
  localVisible.value = false;
  resetForm();
}

async function handleSubmit(): Promise<void> {
  // If name changed in edit mode, show confirmation
  if (nameChanged.value) {
    showNameChangeDialog.value = true;
    return;
  }

  await submitForm();
}

async function submitForm(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (props.isEditMode && props.competition) {
      const updated = await competitionStore.updateExistingCompetition(props.competition.id, {
        name: form.name !== originalName.value ? form.name : undefined,
        description: form.description,
        logo: form.logo,
      });

      toast.add({
        severity: 'success',
        summary: 'Competition Updated',
        detail: 'Competition has been updated successfully',
        life: 3000,
      });

      emit('competition-saved', updated);
    } else {
      const created = await competitionStore.createNewCompetition(props.leagueId, form);

      toast.add({
        severity: 'success',
        summary: 'Competition Created!',
        detail: 'You can now create seasons for this competition.',
        life: 5000,
      });

      emit('competition-saved', created);
    }

    localVisible.value = false;
    resetForm();
  } catch (error) {
    console.error('Failed to save competition:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to save competition';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

function confirmNameChange(): void {
  showNameChangeDialog.value = false;
  submitForm();
}

function cancelNameChange(): void {
  showNameChangeDialog.value = false;
}
</script>

<template>
  <BaseModal
    v-model:visible="localVisible"
    :header="modalTitle"
    width="3xl"
    :closable="!isSubmitting"
    :dismissable-mask="false"
    :loading="isLoadingData"
    content-class="bg-slate-50"
  >
    <div class="space-y-4">
      <!-- Name and Platform Fields - Side by Side on Desktop -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Name Field (2/3 width on desktop) -->
        <FormInputGroup class="md:col-span-2">
          <FormLabel for="name" text="Competition Name" required />
          <InputText
            id="name"
            v-model="form.name"
            size="small"
            placeholder="e.g., Sunday Night Racing, GT3 Championship"
            :class="{ 'p-invalid': errors.name }"
            :disabled="isSubmitting"
            maxlength="100"
            class="w-full"
          />
          <FormError :error="errors.name" />

          <!-- Slug Preview - More Compact -->
          <div v-if="slugPreview" class="mt-1.5 flex items-center gap-1.5">
            <template v-if="slugStatus === 'checking'">
              <i class="pi pi-spinner pi-spin text-xs text-blue-500"></i>
              <small class="text-gray-600">Checking...</small>
            </template>
            <template v-else-if="slugStatus === 'available'">
              <i class="pi pi-check-circle text-xs text-green-500"></i>
              <small class="text-gray-600">
                URL: <span class="font-mono text-green-600">{{ slugPreview }}</span>
              </small>
            </template>
            <template v-else-if="slugStatus === 'taken'">
              <i class="pi pi-info-circle text-xs text-amber-500"></i>
              <small class="text-gray-600">
                Will use: <span class="font-mono text-amber-700">{{ slugSuggestion }}</span>
              </small>
            </template>
          </div>
        </FormInputGroup>

        <!-- Platform Selection (1/3 width on desktop) -->
        <FormInputGroup class="md:col-span-1">
          <FormLabel for="platform_id" text="Platform" required class="mb-0" />

          <Select
            id="platform_id"
            v-model="form.platform_id"
            :options="platformOptions"
            option-label="name"
            option-value="id"
            placeholder="Select a platform"
            size="small"
            :class="{ 'p-invalid': errors.platform_id }"
            :disabled="isEditMode || isSubmitting"
            class="w-full"
          />
          <small v-if="isEditMode" class="text-gray-500 italic"
            >Cannot be changed after creation</small
          >
          <FormError :error="errors.platform_id" />
        </FormInputGroup>
      </div>

      <!-- Description -->
      <FormInputGroup>
        <FormLabel for="description" text="Description" />
        <Textarea
          id="description"
          v-model="form.description"
          rows="3"
          placeholder="Describe this competition, typical race format, skill level..."
          :class="{ 'p-invalid': errors.description }"
          :disabled="isSubmitting"
          maxlength="1000"
          class="w-full"
        />
        <FormOptionalText text="Tell participants what this competition is all about" />
        <FormError :error="errors.description" />
      </FormInputGroup>

      <!-- Logo Upload Section -->
      <FormInputGroup>
        <FormLabel text="Competition Logo" />
        <BasePanel>
          <div class="rounded-md border border-gray-200 content-center p-2">
            <ImageUpload
              v-model="form.logo"
              :existing-image-url="form.logo_url"
              accept="image/png,image/jpeg,image/jpg"
              :max-file-size="2 * 1024 * 1024"
              :min-dimensions="{ width: 200, height: 200 }"
              :recommended-dimensions="{ width: 500, height: 500 }"
              preview-size="small"
              helper-text="Square logo, 500x500px recommended. League logo used if not provided."
            />
          </div>
        </BasePanel>
        <FormError :error="errors.logo" />
      </FormInputGroup>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="isSubmitting"
          @click="handleCancel"
        />
        <Button
          :label="isEditMode ? 'Save Changes' : 'Create Competition'"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>

  <!-- Name Change Confirmation Dialog -->
  <Dialog
    v-model:visible="showNameChangeDialog"
    :modal="true"
    :closable="false"
    :style="{ width: '32rem' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
        <span class="text-xl font-semibold">Update Competition Name?</span>
      </div>
    </template>

    <div class="py-4">
      <p class="mb-4">Changing the name will update the public URL:</p>

      <div class="bg-gray-50 p-3 rounded mb-4 space-y-2">
        <div>
          <span class="text-sm font-semibold text-gray-600">Old:</span>
          <code class="block text-xs mt-1 text-gray-700">
            /leagues/.../competitions/{{ competition?.slug || 'old-slug' }}
          </code>
        </div>
        <div>
          <span class="text-sm font-semibold text-gray-600">New:</span>
          <code class="block text-xs mt-1 text-blue-700">
            /leagues/.../competitions/{{ slugPreview }}
          </code>
        </div>
      </div>

      <Message severity="warn" :closable="false">
        Existing bookmarks and shared links will break.
      </Message>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" outlined @click="cancelNameChange" />
        <Button label="Continue" severity="warning" @click="confirmNameChange" />
      </div>
    </template>
  </Dialog>
</template>
