<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { useSeasonStore } from '@user/stores/seasonStore';
import { useSeasonValidation } from '@user/composables/useSeasonValidation';
import { checkSeasonSlugAvailability } from '@user/services/seasonService';
import type { Season, SeasonForm, SlugCheckResponse } from '@user/types/season';

// PrimeVue Components
import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import Checkbox from 'primevue/checkbox';
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
  competitionId: number;
  season?: Season | null;
  isEditMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  season: null,
  isEditMode: false,
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'season-saved', season: Season): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();
const seasonStore = useSeasonStore();

// State
const activeTab = ref('0');
const form = reactive<SeasonForm>({
  name: '',
  car_class: '',
  description: '',
  technical_specs: '',
  logo: null,
  logo_url: null,
  banner: null,
  banner_url: null,
  team_championship_enabled: false,
});

const originalName = ref('');
const isSubmitting = ref(false);
const isLoadingData = ref(false);
const showNameChangeDialog = ref(false);

// Slug preview state
const slugPreview = ref('');
const slugStatus = ref<'checking' | 'available' | 'taken' | 'error' | null>(null);
const slugSuggestion = ref<string | null>(null);

// Validation
const { errors, validateAll, clearError } = useSeasonValidation(form);

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const drawerTitle = computed(() => (props.isEditMode ? 'Edit Season' : 'Create Season'));
const drawerSubtitle = computed(() =>
  props.isEditMode ? 'Update season details' : 'Create a new season for this competition',
);

const nameChanged = computed(() => {
  return props.isEditMode && form.name !== originalName.value;
});

const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    form.name.trim().length >= 3 &&
    !errors.name &&
    !errors.car_class &&
    !errors.description &&
    !errors.technical_specs &&
    !errors.logo &&
    !errors.banner
  );
});

// Slug checking (debounced with timeout)
const checkSlug = useDebounceFn(async () => {
  if (!form.name || form.name.trim().length < 3) {
    slugPreview.value = '';
    slugStatus.value = null;
    return;
  }

  slugStatus.value = 'checking';

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Slug check timeout')), 10000);
  });

  try {
    const result: SlugCheckResponse = await Promise.race([
      checkSeasonSlugAvailability(props.competitionId, form.name, props.season?.id),
      timeoutPromise,
    ]);

    slugPreview.value = result.slug;
    slugStatus.value = result.available ? 'available' : 'taken';
    slugSuggestion.value = result.suggestion;
  } catch (error) {
    console.error('Slug check failed:', error);
    slugStatus.value = 'error';
    slugPreview.value = '';
    slugSuggestion.value = null;
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
      if (props.isEditMode && props.season) {
        loadSeasonData();
      } else {
        resetForm();
      }
    }
  },
);

// Methods
function loadSeasonData(): void {
  if (!props.season) return;

  isLoadingData.value = true;

  form.name = props.season.name;
  form.car_class = props.season.car_class || '';
  form.description = props.season.description || '';
  form.technical_specs = props.season.technical_specs || '';
  form.logo = null;
  form.logo_url = props.season.has_own_logo ? props.season.logo_url : null;
  form.banner = null;
  form.banner_url = props.season.banner_url;
  form.team_championship_enabled = props.season.team_championship_enabled;

  originalName.value = props.season.name;

  isLoadingData.value = false;
}

function resetForm(): void {
  activeTab.value = '0';
  form.name = '';
  form.car_class = '';
  form.description = '';
  form.technical_specs = '';
  form.logo = null;
  form.logo_url = null;
  form.banner = null;
  form.banner_url = null;
  form.team_championship_enabled = false;
  originalName.value = '';
  slugPreview.value = '';
  slugStatus.value = null;
  slugSuggestion.value = null;
  errors.name = undefined;
  errors.car_class = undefined;
  errors.description = undefined;
  errors.technical_specs = undefined;
  errors.logo = undefined;
  errors.banner = undefined;
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
    if (props.isEditMode && props.season) {
      const updated = await seasonStore.updateExistingSeason(props.season.id, {
        name: form.name,
        car_class: form.car_class || null,
        description: form.description || null,
        technical_specs: form.technical_specs || null,
        logo: form.logo,
        banner: form.banner,
        team_championship_enabled: form.team_championship_enabled,
      });

      toast.add({
        severity: 'success',
        summary: 'Season Updated',
        detail: 'Season has been updated successfully',
        life: 3000,
      });

      emit('season-saved', updated);
    } else {
      const created = await seasonStore.createNewSeason(props.competitionId, {
        name: form.name,
        car_class: form.car_class || undefined,
        description: form.description || undefined,
        technical_specs: form.technical_specs || undefined,
        logo: form.logo || undefined,
        banner: form.banner || undefined,
        team_championship_enabled: form.team_championship_enabled,
      });

      toast.add({
        severity: 'success',
        summary: 'Season Created!',
        detail: 'You can now assign drivers to this season.',
        life: 5000,
      });

      emit('season-saved', created);
    }

    localVisible.value = false;
    resetForm();
  } catch (error: unknown) {
    console.error('Failed to save season:', error);

    // Clear file inputs on error to prevent stale file objects
    form.logo = null;
    form.banner = null;

    const errorMessage = error instanceof Error ? error.message : 'Failed to save season';

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
  <Drawer v-model:visible="localVisible" position="bottom" class="!h-[60vh] w-full bg-gray-50">
    <template #header>
      <DrawerHeader :title="drawerTitle" :subtitle="drawerSubtitle" />
    </template>

    <DrawerLoading v-if="isLoadingData" message="Loading season..." />

    <div v-else class="container mx-auto flex flex-col max-w-5xl px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left Column (66%) -->
        <div class="md:col-span-2 space-y-6">
          <!-- Name Field -->
          <FormInputGroup>
            <FormLabel for="name" text="Season Name" required />
            <InputText
              id="name"
              v-model="form.name"
              size="small"
              placeholder="e.g., Season 1, 2024 Winter Championship"
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

          <!-- Car Class -->
          <FormInputGroup>
            <FormLabel for="car_class" text="Car Class" />
            <InputText
              id="car_class"
              v-model="form.car_class"
              size="small"
              placeholder="e.g., GT3, Formula 1, LMP1"
              :class="{ 'p-invalid': errors.car_class }"
              :disabled="isSubmitting"
              maxlength="150"
              class="w-full"
            />
            <FormOptionalText text="Specify the car class used in this season" />
            <FormError :error="errors.car_class" />
          </FormInputGroup>

          <!-- Description -->
          <FormInputGroup>
            <FormLabel for="description" text="Description" />
            <Textarea
              id="description"
              v-model="form.description"
              rows="5"
              placeholder="Describe this season, race format, rules..."
              :class="{ 'p-invalid': errors.description }"
              :disabled="isSubmitting"
              maxlength="2000"
              class="w-full"
            />
            <FormOptionalText text="Tell participants about this season" />
            <FormError :error="errors.description" />
          </FormInputGroup>

          <!-- Technical Specs -->
          <FormInputGroup>
            <FormLabel for="technical_specs" text="Technical Specifications" />
            <Textarea
              id="technical_specs"
              v-model="form.technical_specs"
              rows="5"
              placeholder="Car setup rules, performance restrictions, balance of performance..."
              :class="{ 'p-invalid': errors.technical_specs }"
              :disabled="isSubmitting"
              maxlength="2000"
              class="w-full"
            />
            <FormOptionalText text="Technical rules and car setup information" />
            <FormError :error="errors.technical_specs" />
          </FormInputGroup>
        </div>

        <!-- Right Column (33%) -->
        <div class="space-y-6">
          <!-- Team Championship Toggle -->
          <FormInputGroup>
            <div class="flex items-center gap-3">
              <Checkbox
                v-model="form.team_championship_enabled"
                input-id="team_championship"
                :binary="true"
                :disabled="isSubmitting"
              />
              <FormLabel
                for="team_championship"
                text="Enable Team Championship"
                class="mb-0 cursor-pointer"
              />
            </div>
            <FormOptionalText text="Track team standings alongside individual drivers" />
          </FormInputGroup>

          <!-- Info Message -->
          <Message severity="info" :closable="false">
            <i class="pi pi-info-circle mr-2"></i>
            Logo inherits from competition by default. You can upload a custom logo in the branding
            tab.
          </Message>
        </div>
      </div>

      <!-- Tabs Section -->
      <Tabs v-model:value="activeTab" class="flex-1 flex flex-col mt-6">
        <TabList class="bg-gray-50">
          <Tab value="0" class="bg-white border-r border-gray-100">Branding</Tab>
        </TabList>
        <TabPanels class="flex-1">
          <!-- Tab: Branding -->
          <TabPanel value="0">
            <div class="mt-4">
              <div class="mb-4">
                Upload custom branding for this season. If not provided, the competition logo will
                be used.
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Logo Upload -->
                <BasePanel header="Season Logo">
                  <ImageUpload
                    v-model="form.logo"
                    label="Season Logo"
                    :existing-image-url="form.logo_url"
                    accept="image/png,image/jpeg,image/jpg"
                    :max-file-size="2 * 1024 * 1024"
                    :min-dimensions="{ width: 200, height: 200 }"
                    :recommended-dimensions="{ width: 500, height: 500 }"
                    preview-size="small"
                    helper-text="A square logo. Recommended: 500x500px. Inherits from competition if not uploaded."
                  />
                  <FormError :error="errors.logo" />
                </BasePanel>

                <!-- Banner Upload -->
                <BasePanel header="Season Banner">
                  <ImageUpload
                    v-model="form.banner"
                    label="Season Banner"
                    :existing-image-url="form.banner_url"
                    accept="image/png,image/jpeg,image/jpg"
                    :max-file-size="5 * 1024 * 1024"
                    :min-dimensions="{ width: 800, height: 200 }"
                    :recommended-dimensions="{ width: 1920, height: 400 }"
                    preview-size="large"
                    helper-text="A wide banner image. Recommended: 1920x400px"
                  />
                  <FormError :error="errors.banner" />
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
              :label="isEditMode ? 'Save Changes' : 'Create Season'"
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
        <span class="text-xl font-semibold">Update Season Name?</span>
      </div>
    </template>

    <div class="py-4">
      <p class="mb-4">Changing the name will update the public URL:</p>

      <div class="bg-gray-50 p-3 rounded mb-4 space-y-2">
        <div>
          <span class="text-sm font-semibold text-gray-600">Old:</span>
          <code class="block text-xs mt-1 text-gray-700">
            /seasons/{{ season?.slug || 'old-slug' }}
          </code>
        </div>
        <div>
          <span class="text-sm font-semibold text-gray-600">New:</span>
          <code class="block text-xs mt-1 text-blue-700"> /seasons/{{ slugPreview }} </code>
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
