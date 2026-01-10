<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { PhTrophy } from '@phosphor-icons/vue';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useLeagueStore } from '@app/stores/leagueStore';
import { useLeaguePlatforms } from '@app/composables/useLeaguePlatforms';
import { useCompetitionValidation } from '@app/composables/useCompetitionValidation';
import { checkSlugAvailability } from '@app/services/competitionService';
import type {
  Competition,
  CompetitionForm,
  SlugCheckResponse,
  RGBColor,
} from '@app/types/competition';
import { logError } from '@app/utils/logger';

// PrimeVue Components
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { Button } from '@app/components/common/buttons';
import Dialog from 'primevue/dialog';
import ColorPicker from 'primevue/colorpicker';

// Common Components
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';

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
  competition_colour: null,
});

const originalName = ref(''); // For tracking name changes
const isSubmitting = ref(false);
const isLoadingData = ref(false);
const showNameChangeDialog = ref(false);

// Slug preview state
const slugPreview = ref('');
const slugStatus = ref<'checking' | 'available' | 'taken' | 'error' | null>(null);
const slugSuggestion = ref<string | null>(null);
const slugCheckAbortController = ref<AbortController | null>(null);

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
    !errors.logo &&
    !errors.competition_colour
  );
});

// Slug checking (debounced with request cancellation)
const checkSlug = useDebounceFn(async () => {
  if (!form.name || form.name.trim().length < 3) {
    slugPreview.value = '';
    slugStatus.value = null;
    return;
  }

  // Cancel previous request if it exists
  if (slugCheckAbortController.value) {
    slugCheckAbortController.value.abort();
  }

  // Create new AbortController for this request
  slugCheckAbortController.value = new AbortController();
  const currentController = slugCheckAbortController.value;

  slugStatus.value = 'checking';

  try {
    const result: SlugCheckResponse = await checkSlugAvailability(
      props.leagueId,
      form.name,
      props.competition?.id,
      currentController.signal,
    );

    // Only update state if this request wasn't aborted
    if (!currentController.signal.aborted) {
      slugPreview.value = result.slug;
      slugStatus.value = result.available ? 'available' : 'taken';
      slugSuggestion.value = result.suggestion;
    }
  } catch (error) {
    // Only update error state if this request wasn't aborted
    if (!currentController.signal.aborted) {
      logError('Slug check failed:', { context: 'CompetitionFormDrawer', data: error });
      slugStatus.value = 'error';
    }
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
        logError('Failed to load required data:', {
          context: 'CompetitionFormDrawer',
          data: error,
        });
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

// Helper Functions
function parseColourFromJson(colourJson: string | null): RGBColor | null {
  if (!colourJson) return null;
  try {
    const parsed = JSON.parse(colourJson);
    if (
      parsed &&
      typeof parsed.r === 'number' &&
      typeof parsed.g === 'number' &&
      typeof parsed.b === 'number'
    ) {
      return parsed as RGBColor;
    }
    return null;
  } catch {
    return null;
  }
}

function generateRandomColor(): RGBColor {
  // Generate vibrant colors by keeping RGB values between 50-230
  // This ensures colors are neither too dark nor too light for good visibility
  const randomValue = () => Math.floor(Math.random() * (230 - 50 + 1)) + 50;

  return {
    r: randomValue(),
    g: randomValue(),
    b: randomValue(),
  };
}

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
  form.competition_colour = parseColourFromJson(props.competition.competition_colour);

  originalName.value = props.competition.name;

  isLoadingData.value = false;
}

function resetForm(): void {
  form.name = '';
  form.description = '';
  form.platform_id = null;
  form.logo = null;
  form.logo_url = null;
  form.competition_colour = generateRandomColor();
  originalName.value = '';
  slugPreview.value = '';
  slugStatus.value = null;
  slugSuggestion.value = null;
  errors.name = undefined;
  errors.platform_id = undefined;
  errors.description = undefined;
  errors.logo = undefined;
  errors.competition_colour = undefined;
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
      const updated = await competitionStore.updateExistingCompetition(props.competition.id, form);

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
    logError('Failed to save competition:', { context: 'CompetitionFormDrawer', data: error });

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

/**
 * Clean up on unmount to prevent memory leaks
 */
onUnmounted(() => {
  // Abort any in-flight slug check requests
  if (slugCheckAbortController.value) {
    slugCheckAbortController.value.abort();
    slugCheckAbortController.value = null;
  }
});
</script>

<template>
  <BaseModal
    v-model:visible="localVisible"
    :header="modalTitle"
    width="4xl"
    :closable="!isSubmitting"
    :dismissable-mask="false"
    :loading="isLoadingData"
    :show-header="true"
    content-class="!p-0"
  >
    <template #header>
      <div
        class="w-9 h-9 flex items-center justify-center bg-[var(--cyan-dim)] rounded-lg border border-[var(--border)]"
      >
        <PhTrophy :size="18" weight="duotone" class="text-[var(--cyan)]" />
      </div>
      <div class="flex-auto pl-4">
        <div class="font-mono font-semibold tracking-wide text-[var(--text-primary)]">
          {{ modalTitle }}
        </div>
        <div class="text-[var(--text-secondary)]">
          {{ isEditMode ? 'Update competition settings' : 'Create a new competition' }}
        </div>
      </div>
    </template>

    <!-- Main Content -->
    <main class="overflow-y-auto bg-[var(--bg-dark)] p-6 min-h-[520px] max-h-[72vh]">
      <div class="space-y-6">
        <!-- Basic Info Section -->
        <div>
          <div class="mb-4">
            <h3 class="text-section-label mb-1">Basic Information</h3>
            <p class="text-[var(--text-secondary)] m-0">Core details about your competition</p>
          </div>

          <div class="space-y-4">
            <!-- Name Field -->
            <FormInputGroup>
              <FormLabel for="name" text="Competition Name" required />
              <InputText
                id="name"
                v-model="form.name"
                placeholder="e.g., Sunday Night Racing, GT3 Championship"
                :class="{ 'p-invalid': errors.name }"
                :disabled="isSubmitting"
                maxlength="100"
                class="w-full"
              />
              <FormError :error="errors.name" />

              <!-- Slug Preview -->
              <div v-if="slugPreview" class="mt-2 flex items-center gap-2">
                <template v-if="slugStatus === 'checking'">
                  <i class="pi pi-spinner pi-spin text-[var(--cyan)]"></i>
                  <small class="text-[var(--text-secondary)]">Checking availability...</small>
                </template>
                <template v-else-if="slugStatus === 'available'">
                  <i class="pi pi-check-circle text-[var(--green)]"></i>
                  <small class="text-[var(--text-secondary)]">
                    URL: <span class="font-mono text-[var(--green)]">{{ slugPreview }}</span>
                  </small>
                </template>
                <template v-else-if="slugStatus === 'taken'">
                  <i class="pi pi-info-circle text-[var(--amber)]"></i>
                  <small class="text-[var(--text-secondary)]">
                    Will use:
                    <span class="font-mono text-[var(--amber)]">{{ slugSuggestion }}</span>
                  </small>
                </template>
              </div>
            </FormInputGroup>

            <!-- Platform and Colour Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Platform Selection -->
              <FormInputGroup class="md:col-span-2">
                <FormLabel for="platform_id" text="Platform" required />
                <Select
                  id="platform_id"
                  v-model="form.platform_id"
                  :options="platformOptions"
                  option-label="name"
                  option-value="id"
                  placeholder="Select a platform"
                  :class="{ 'p-invalid': errors.platform_id }"
                  :disabled="isEditMode || isSubmitting"
                  class="w-full"
                />
                <small v-if="isEditMode" class="text-[var(--text-tertiary)] italic">
                  Platform cannot be changed after creation
                </small>
                <FormError :error="errors.platform_id" />
              </FormInputGroup>

              <!-- Competition Colour -->
              <FormInputGroup>
                <FormLabel for="competition_colour" text="Colour" />
                <ColorPicker
                  id="competition_colour"
                  v-model="form.competition_colour"
                  format="rgb"
                  :disabled="isSubmitting"
                  class="w-full"
                />
                <FormOptionalText text="Theme colour for this competition" />
                <FormError :error="errors.competition_colour" />
              </FormInputGroup>
            </div>

            <!-- Description -->
            <FormInputGroup>
              <FormLabel for="description" text="Description" />
              <Textarea
                id="description"
                v-model="form.description"
                rows="4"
                placeholder="Describe this competition, typical race format, skill level..."
                :class="{ 'p-invalid': errors.description }"
                :disabled="isSubmitting"
                maxlength="1000"
                class="w-full"
              />
              <FormOptionalText text="Tell participants what this competition is all about" />
              <FormError :error="errors.description" />
            </FormInputGroup>
          </div>
        </div>

        <!-- Media Section -->
        <div>
          <div class="mb-4">
            <h3 class="text-section-label mb-1">Media Assets</h3>
            <p class="text-[var(--text-secondary)] m-0">Visual branding for your competition</p>
          </div>

          <!-- Info Banner -->
          <div
            class="flex items-start gap-3 p-3 bg-[var(--cyan-dim)] border border-[var(--cyan)] rounded-lg mb-4"
          >
            <i class="pi pi-info-circle text-[var(--cyan)] pt-0.5"></i>
            <p class="text-[var(--text-primary)] m-0">
              Competition logo is optional. If not provided, the league logo will be used as a
              fallback.
            </p>
          </div>

          <!-- Logo Upload -->
          <div
            class="rounded-md border border-[var(--border)] content-center p-4 bg-[var(--bg-card)]"
          >
            <ImageUpload
              :model-value="form.logo"
              :existing-image-url="form.logo_url ?? null"
              label="Competition Logo"
              :required="false"
              :error="errors.logo"
              preview-size="small"
              helper-text="Square logo (400x400px recommended)"
              @update:model-value="form.logo = $event"
              @remove-existing="form.logo_url = null"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="Cancel" variant="secondary" :disabled="isSubmitting" @click="handleCancel" />
        <Button
          :label="isEditMode ? 'Update Competition' : 'Create Competition'"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          variant="success"
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
        <i class="pi pi-exclamation-triangle text-[var(--amber)]"></i>
        <span class="font-mono font-semibold tracking-wide text-[var(--text-primary)]">
          Update Competition Name?
        </span>
      </div>
    </template>

    <div class="py-4">
      <p class="mb-4 text-[var(--text-primary)]">Changing the name will update the public URL:</p>

      <div class="bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-lg mb-4 space-y-2">
        <div>
          <span class="font-semibold text-[var(--text-secondary)]">Old:</span>
          <code class="block font-mono mt-1 text-[var(--text-primary)]">
            /leagues/.../competitions/{{ competition?.slug || 'old-slug' }}
          </code>
        </div>
        <div>
          <span class="font-semibold text-[var(--text-secondary)]">New:</span>
          <code class="block font-mono mt-1 text-[var(--cyan)]">
            /leagues/.../competitions/{{ slugPreview }}
          </code>
        </div>
      </div>

      <div
        class="flex items-start gap-3 p-3 bg-[var(--amber-dim)] border border-[var(--amber)] rounded-lg"
      >
        <i class="pi pi-exclamation-triangle text-[var(--amber)] pt-0.5"></i>
        <p class="text-[var(--text-primary)] m-0">
          Existing bookmarks and shared links will break.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <Button label="Cancel" variant="secondary" @click="cancelNameChange" />
        <Button label="Continue" @click="confirmNameChange" />
      </div>
    </template>
  </Dialog>
</template>
