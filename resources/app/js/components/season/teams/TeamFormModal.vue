<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useTeamStore } from '@app/stores/teamStore';
import type { Team, TeamForm, TeamFormErrors } from '@app/types/team';

// PrimeVue Components
import { Button } from '@app/components/common/buttons';
import InputText from 'primevue/inputtext';

// Common Components
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';

// Props
interface Props {
  visible: boolean;
  mode: 'add' | 'edit';
  seasonId: number;
  team?: Team | null;
}

const props = withDefaults(defineProps<Props>(), {
  team: null,
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', team: Team): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();
const teamStore = useTeamStore();

// State
const form = reactive<TeamForm>({
  name: '',
  logo: null,
  logo_url: null,
});

const errors = reactive<TeamFormErrors>({
  name: undefined,
  logo: undefined,
});

const isSubmitting = ref(false);

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const modalTitle = computed(() => (props.mode === 'add' ? 'Add Team' : 'Edit Team'));

const canSubmit = computed(() => {
  return !isSubmitting.value && form.name.trim().length >= 2 && !errors.name && !errors.logo;
});

// Watch drawer visibility
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.mode === 'edit' && props.team) {
        loadTeamData();
      } else {
        resetForm();
      }
    }
  },
);

// Methods
function loadTeamData(): void {
  if (!props.team) return;

  form.name = props.team.name;
  form.logo = null;
  // Prefer new media format, fallback to old URL format
  form.logo_url = props.team.logo?.original ?? props.team.logo_url;
}

function resetForm(): void {
  form.name = '';
  form.logo = null;
  form.logo_url = null;
  errors.name = undefined;
  errors.logo = undefined;
}

function validateName(): boolean {
  errors.name = undefined;

  if (!form.name.trim()) {
    errors.name = 'Team name is required';
    return false;
  }

  if (form.name.trim().length < 2) {
    errors.name = 'Team name must be at least 2 characters';
    return false;
  }

  if (form.name.length > 60) {
    errors.name = 'Team name must not exceed 60 characters';
    return false;
  }

  return true;
}

function validateAll(): boolean {
  return validateName();
}

function handleCancel(): void {
  localVisible.value = false;
  resetForm();
}

async function handleSubmit(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (props.mode === 'edit' && props.team) {
      const updated = await teamStore.updateTeam(props.seasonId, props.team.id, {
        name: form.name,
        logo: form.logo,
      });

      toast.add({
        severity: 'success',
        summary: 'Team Updated',
        detail: 'Team has been updated successfully',
        life: 3000,
      });

      emit('save', updated);
    } else {
      const created = await teamStore.createTeam(props.seasonId, {
        name: form.name,
        logo: form.logo || undefined,
      });

      toast.add({
        severity: 'success',
        summary: 'Team Created',
        detail: 'Team has been created successfully',
        life: 3000,
      });

      emit('save', created);
    }

    localVisible.value = false;
    resetForm();
  } catch (error: unknown) {
    // Clear file input on error to prevent stale file objects
    form.logo = null;

    const errorMessage = error instanceof Error ? error.message : 'Failed to save team';

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

function clearNameError(): void {
  errors.name = undefined;
}
</script>

<template>
  <BaseModal
    v-model:visible="localVisible"
    :header="modalTitle"
    width="lg"
    :closable="!isSubmitting"
    :dismissable-mask="false"
  >
    <div class="space-y-6">
      <!-- Team Name Field -->
      <FormInputGroup>
        <FormLabel for="team-name" text="Team Name" required />
        <InputText
          id="team-name"
          v-model="form.name"
          size="sm"
          placeholder="e.g., Red Bull Racing, Mercedes AMG"
          :class="{ 'p-invalid': errors.name }"
          :disabled="isSubmitting"
          maxlength="60"
          class="w-full"
          @input="clearNameError"
        />
        <FormError :error="errors.name" />
      </FormInputGroup>

      <!-- Team Logo Upload -->
      <FormInputGroup>
        <ImageUpload
          v-model="form.logo"
          label="Team Logo"
          label-text="Team Logo"
          :existing-image-url="form.logo_url"
          accept="image/png,image/jpeg,image/jpg"
          :max-file-size="2 * 1024 * 1024"
          :min-dimensions="{ width: 100, height: 100 }"
          :recommended-dimensions="{ width: 300, height: 300 }"
          preview-size="sm"
          helper-text="A square logo. Recommended: 300x300px. Optional."
        />
        <FormError :error="errors.logo" />
      </FormInputGroup>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" variant="secondary" :disabled="isSubmitting" @click="handleCancel" />
        <Button
          :label="mode === 'add' ? 'Create Team' : 'Save Changes'"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
