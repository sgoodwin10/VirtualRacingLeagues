<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { useCompetitionStore } from '@user/stores/competitionStore';
import { useLeaguePlatforms } from '@user/composables/useLeaguePlatforms';
import { useCompetitionValidation } from '@user/composables/useCompetitionValidation';
import { checkSlugAvailability } from '@user/services/competitionService';
import type { Competition, CompetitionForm, SlugCheckResponse } from '@user/types/competition';

// PrimeVue Components
import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

// Common Components
import DrawerHeader from '@user/components/common/modals/DrawerHeader.vue';
import DrawerLoading from '@user/components/common/modals/DrawerLoading.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import FormError from '@user/components/common/forms/FormError.vue';
import FormInputGroup from '@user/components/common/forms/FormInputGroup.vue';
import FormOptionalText from '@user/components/common/forms/FormOptionalText.vue';
import ImageUpload from '@user/components/common/forms/ImageUpload.vue';
import BasePanel from '@user/components/common/panels/BasePanel.vue';

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
const { platformOptions } = useLeaguePlatforms(() => props.leagueId);

// State
const activeTab = ref('0');
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

const drawerTitle = computed(() => (props.isEditMode ? 'Edit Competition' : 'Create Competition'));
const drawerSubtitle = computed(() =>
  props.isEditMode ? 'Update competition details' : 'Create a new competition for your league',
);

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
  (visible) => {
    if (visible) {
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
  form.logo_url = props.competition.logo_url;

  originalName.value = props.competition.name;

  isLoadingData.value = false;
}

function resetForm(): void {
  activeTab.value = '0';
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
  } catch (error: any) {
    console.error('Failed to save competition:', error);

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save competition',
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
  <Drawer v-model:visible="localVisible" position="bottom" class="!h-[60vh] w-full bg-gray-50">
    <template #header>
      <DrawerHeader :title="drawerTitle" :subtitle="drawerSubtitle" />
    </template>

    <DrawerLoading v-if="isLoadingData" message="Loading competition..." />

    <div v-else class="container mx-auto flex flex-col max-w-5xl px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left Column (66%) -->
        <div class="md:col-span-2 space-y-6">
          <!-- Name Field -->
          <FormInputGroup>
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

            <!-- Slug Preview -->
            <div v-if="slugPreview" class="mt-2">
              <div class="flex items-center gap-2">
                <span v-if="slugStatus === 'checking'" class="text-blue-500">
                  <i class="pi pi-spinner pi-spin text-sm"></i>
                  <small class="ml-2 text-gray-600">Checking availability...</small>
                </span>
                <span v-else-if="slugStatus === 'available'" class="flex items-center gap-2">
                  <i class="pi pi-check-circle text-green-500 text-sm"></i>
                  <small class="text-green-600">
                    URL: <span class="font-mono font-semibold">{{ slugPreview }}</span>
                  </small>
                </span>
                <span v-else-if="slugStatus === 'taken'" class="flex items-center gap-2">
                  <i class="pi pi-info-circle text-amber-500 text-sm"></i>
                  <small class="text-amber-700">
                    Name taken. Will use URL:
                    <span class="font-mono font-semibold">{{ slugSuggestion }}</span>
                  </small>
                </span>
              </div>
            </div>
          </FormInputGroup>

          <!-- Description -->
          <FormInputGroup>
            <FormLabel for="description" text="Description" />
            <Textarea
              id="description"
              v-model="form.description"
              rows="5"
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

        <!-- Right Column (33%) -->
        <div class="space-y-6">
          <!-- Platform Selection -->
          <FormInputGroup>
            <FormLabel for="platform_id" text="Platform" required />
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
            <FormError :error="errors.platform_id" />

            <!-- Platform locked message in edit mode -->
            <Message v-if="isEditMode" severity="info" :closable="false" class="mt-2">
              Platform cannot be changed after creation
            </Message>
          </FormInputGroup>

          <!-- Info Message -->
          <Message severity="info" :closable="false" class="mt-14">
            <i class="pi pi-info-circle mr-2"></i>
            Car restrictions, race types, and other details will be configured when you create
            seasons.
          </Message>
        </div>
      </div>

      <!-- Tabs Section -->
      <Tabs v-model:value="activeTab" class="flex-1 flex flex-col mt-6">
        <TabList class="bg-gray-50">
          <Tab value="0" class="bg-white border-r border-gray-100">Competition Logo</Tab>
        </TabList>
        <TabPanels class="flex-1">
          <!-- Tab: Logo -->
          <TabPanel value="0">
            <div class="mt-4">
              <div class="mb-4">
                Upload a logo to personalise your competition. If not provided, the league logo will
                be used.
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Logo Upload -->
                <BasePanel header="Competition Logo" class="lg:col-span-1">
                  <ImageUpload
                    v-model="form.logo"
                    label="Competition Logo"
                    :existing-image-url="form.logo_url"
                    accept="image/png,image/jpeg,image/jpg"
                    :max-file-size="2 * 1024 * 1024"
                    :min-dimensions="{ width: 200, height: 200 }"
                    :recommended-dimensions="{ width: 500, height: 500 }"
                    preview-size="small"
                    helper-text="A square logo. Recommended: 500x500px"
                  />
                  <FormError :error="errors.logo" />
                </BasePanel>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Footer -->
    <div v-if="!isLoadingData" class="bg-tertiary mt-4 shadow-reverse border-t border-gray-200">
      <div class="container mx-auto flex flex-col max-w-5xl">
        <div class="flex justify-between p-4">
          <div>
            <Button
              label="Cancel"
              severity="danger"
              class="bg-white"
              outlined
              :disabled="isSubmitting"
              @click="handleCancel"
            />
          </div>

          <div>
            <Button
              :label="isEditMode ? 'Save Changes' : 'Create Competition'"
              :loading="isSubmitting"
              :disabled="!canSubmit"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>
    </div>
  </Drawer>

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
