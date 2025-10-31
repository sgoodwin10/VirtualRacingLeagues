<template>
  <Drawer
    v-model:visible="isVisible"
    :header="mode === 'create' ? 'Create Round' : 'Edit Round'"
    position="bottom"
    class="!w-full h-[90vh]"
    @hide="handleClose"
  >
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Round Number -->
      <div>
        <FormLabel for="round_number" text="Round Number" required />
        <InputNumber
          id="round_number"
          v-model="form.round_number"
          :min="1"
          :max="99"
          :invalid="!!validationErrors.round_number"
          show-buttons
          class="w-full"
          @blur="validation.validateRoundNumber(form.round_number)"
        />
        <FormError v-if="validationErrors.round_number">
          {{ validationErrors.round_number }}
        </FormError>
      </div>

      <!-- Round Name -->
      <div>
        <FormLabel for="name" text="Round Name (Optional)" />
        <InputText
          id="name"
          v-model="form.name"
          placeholder="e.g., Season Opener, Championship Finale"
          :invalid="!!validationErrors.name"
          class="w-full"
          @blur="validation.validateName(form.name)"
        />
        <FormError v-if="validationErrors.name">
          {{ validationErrors.name }}
        </FormError>
      </div>

      <!-- Scheduled Date & Time -->
      <div>
        <FormLabel for="scheduled_at" text="Scheduled Date & Time (Optional)" />
        <DatePicker
          id="scheduled_at"
          v-model="form.scheduled_at"
          show-time
          hour-format="24"
          date-format="yy-mm-dd"
          :invalid="!!validationErrors.scheduled_at"
          placeholder="Select date and time"
          class="w-full"
          @blur="validation.validateScheduledAt(form.scheduled_at)"
        />
        <FormError v-if="validationErrors.scheduled_at">
          {{ validationErrors.scheduled_at }}
        </FormError>
      </div>

      <!-- Track Selection -->
      <div>
        <FormLabel for="track" text="Track (Optional)" />
        <AutoComplete
          id="track"
          v-model="selectedTrack"
          :suggestions="trackSearch.searchResults.value"
          option-group-label="name"
          option-group-children="tracks"
          option-label="name"
          placeholder="Search for a location..."
          :invalid="!!validationErrors.platform_track_id"
          force-selection
          class="w-full"
          @complete="handleTrackSearch"
          @item-select="handleTrackSelect"
          @blur="validation.validatePlatformTrackId(form.platform_track_id)"
        >
          <template #optiongroup="slotProps">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ slotProps.option.name }}</span>
              <span v-if="slotProps.option.country" class="text-sm text-gray-500">
                ({{ slotProps.option.country }})
              </span>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <span>{{ slotProps.option.name }}</span>
              <Tag
                v-if="slotProps.option.is_reverse"
                value="Reverse"
                severity="info"
                size="small"
              />
            </div>
          </template>
        </AutoComplete>
        <FormError v-if="validationErrors.platform_track_id">
          {{ validationErrors.platform_track_id }}
        </FormError>
      </div>

      <!-- Track Layout -->
      <div>
        <FormLabel for="track_layout" text="Track Layout (Optional)" />
        <InputText
          id="track_layout"
          v-model="form.track_layout"
          placeholder="e.g., GP Circuit, Short Circuit"
          :invalid="!!validationErrors.track_layout"
          class="w-full"
          @blur="validation.validateTrackLayout(form.track_layout)"
        />
        <FormError v-if="validationErrors.track_layout">
          {{ validationErrors.track_layout }}
        </FormError>
      </div>

      <!-- Track Conditions -->
      <div>
        <FormLabel for="track_conditions" text="Track Conditions (Optional)" />
        <InputText
          id="track_conditions"
          v-model="form.track_conditions"
          placeholder="e.g., Dry, Wet, Mixed"
          :invalid="!!validationErrors.track_conditions"
          class="w-full"
          @blur="validation.validateTrackConditions(form.track_conditions)"
        />
        <FormError v-if="validationErrors.track_conditions">
          {{ validationErrors.track_conditions }}
        </FormError>
      </div>

      <!-- Technical Notes -->
      <div>
        <FormLabel for="technical_notes" text="Technical Notes (Optional)" />
        <Textarea
          id="technical_notes"
          v-model="form.technical_notes"
          rows="4"
          placeholder="Server settings, race parameters, etc."
          :invalid="!!validationErrors.technical_notes"
          class="w-full"
          @blur="validation.validateTechnicalNotes(form.technical_notes)"
        />
        <small class="text-gray-600">{{ form.technical_notes.length }}/2000 characters</small>
        <FormError v-if="validationErrors.technical_notes">
          {{ validationErrors.technical_notes }}
        </FormError>
      </div>

      <!-- Stream URL -->
      <div>
        <FormLabel for="stream_url" text="Stream URL (Optional)" />
        <InputText
          id="stream_url"
          v-model="form.stream_url"
          type="url"
          placeholder="https://..."
          :invalid="!!validationErrors.stream_url"
          class="w-full"
          @blur="validation.validateStreamUrl(form.stream_url)"
        />
        <FormError v-if="validationErrors.stream_url">
          {{ validationErrors.stream_url }}
        </FormError>
      </div>

      <!-- Internal Notes -->
      <div>
        <FormLabel for="internal_notes" text="Internal Notes (Optional)" />
        <Textarea
          id="internal_notes"
          v-model="form.internal_notes"
          rows="4"
          placeholder="Private notes for organizers only"
          :invalid="!!validationErrors.internal_notes"
          class="w-full"
          @blur="validation.validateInternalNotes(form.internal_notes)"
        />
        <small class="text-gray-600">{{ form.internal_notes.length }}/2000 characters</small>
        <FormError v-if="validationErrors.internal_notes">
          {{ validationErrors.internal_notes }}
        </FormError>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="saving"
          @click="handleClose"
        />
        <Button label="Save Round" type="submit" :loading="saving" :disabled="saving" />
      </div>
    </form>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { format } from 'date-fns';
import { useToast } from 'primevue/usetoast';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import AutoComplete from 'primevue/autocomplete';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import { useRoundStore } from '@app/stores/roundStore';
import { useTrackStore } from '@app/stores/trackStore';
import { useRoundValidation } from '@app/composables/useRoundValidation';
import { useTrackSearch } from '@app/composables/useTrackSearch';
import type { Round, RoundForm, CreateRoundRequest, UpdateRoundRequest } from '@app/types/round';
import type { Track } from '@app/types/track';

interface Props {
  visible: boolean;
  seasonId: number;
  platformId: number;
  round?: Round | null;
  mode: 'create' | 'edit';
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const roundStore = useRoundStore();
const trackStore = useTrackStore();
const toast = useToast();
const validation = useRoundValidation();
const trackSearch = useTrackSearch();

const saving = ref(false);
const selectedTrack = ref<Track | null>(null);

const form = ref<RoundForm>({
  round_number: 1,
  name: '',
  scheduled_at: null,
  platform_track_id: null,
  track_layout: '',
  track_conditions: '',
  technical_notes: '',
  stream_url: '',
  internal_notes: '',
});

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const validationErrors = computed(() => validation.errors.value);

// Watch for drawer opening to initialize form
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await initializeForm();
    }
  },
);

async function initializeForm(): Promise<void> {
  validation.clearErrors();

  if (props.mode === 'create') {
    // Reset form for create mode
    form.value = {
      round_number: 1,
      name: '',
      scheduled_at: null,
      platform_track_id: null,
      track_layout: '',
      track_conditions: '',
      technical_notes: '',
      stream_url: '',
      internal_notes: '',
    };
    selectedTrack.value = null;

    // Fetch next round number
    try {
      const nextNumber = await roundStore.fetchNextRoundNumber(props.seasonId);
      form.value.round_number = nextNumber;
    } catch (error) {
      console.error('Failed to fetch next round number:', error);
    }
  } else if (props.mode === 'edit' && props.round) {
    // Populate form for edit mode
    form.value = {
      round_number: props.round.round_number,
      name: props.round.name || '',
      scheduled_at: props.round.scheduled_at ? new Date(props.round.scheduled_at) : null,
      platform_track_id: props.round.platform_track_id,
      track_layout: props.round.track_layout || '',
      track_conditions: props.round.track_conditions || '',
      technical_notes: props.round.technical_notes || '',
      stream_url: props.round.stream_url || '',
      internal_notes: props.round.internal_notes || '',
    };

    // Load selected track
    if (props.round.platform_track_id) {
      try {
        const track = await trackStore.fetchTrack(props.round.platform_track_id);
        selectedTrack.value = track;
      } catch (error) {
        console.error('Failed to load track:', error);
      }
    }
  }
}

function handleTrackSearch(event: { query: string }): void {
  trackSearch.search(props.platformId, event.query);
}

function handleTrackSelect(event: { value: Track }): void {
  form.value.platform_track_id = event.value.id;
  selectedTrack.value = event.value;
  validation.validatePlatformTrackId(form.value.platform_track_id);
}

async function handleSubmit(): Promise<void> {
  if (!validation.validateAll(form.value)) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix the validation errors before saving',
      life: 5000,
    });
    return;
  }

  saving.value = true;

  try {
    if (props.mode === 'create') {
      const requestData: CreateRoundRequest = {
        round_number: form.value.round_number,
      };

      if (form.value.scheduled_at) {
        requestData.scheduled_at = format(form.value.scheduled_at, 'yyyy-MM-dd HH:mm:ss');
      }
      if (form.value.platform_track_id) {
        requestData.platform_track_id = form.value.platform_track_id;
      }
      if (form.value.name.trim()) requestData.name = form.value.name.trim();
      if (form.value.track_layout.trim()) requestData.track_layout = form.value.track_layout.trim();
      if (form.value.track_conditions.trim())
        requestData.track_conditions = form.value.track_conditions.trim();
      if (form.value.technical_notes.trim())
        requestData.technical_notes = form.value.technical_notes.trim();
      if (form.value.stream_url.trim()) requestData.stream_url = form.value.stream_url.trim();
      if (form.value.internal_notes.trim())
        requestData.internal_notes = form.value.internal_notes.trim();

      await roundStore.createNewRound(props.seasonId, requestData);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Round created successfully',
        life: 3000,
      });
    } else if (props.round) {
      const requestData: UpdateRoundRequest = {};

      if (form.value.round_number !== props.round.round_number) {
        requestData.round_number = form.value.round_number;
      }
      if ((form.value.name || '').trim() !== (props.round.name || '')) {
        requestData.name = form.value.name.trim() || undefined;
      }
      // Handle scheduled_at changes including null
      const currentScheduledAt = form.value.scheduled_at
        ? format(form.value.scheduled_at, 'yyyy-MM-dd HH:mm:ss')
        : null;
      const originalScheduledAt = props.round.scheduled_at || null;

      if (currentScheduledAt !== originalScheduledAt) {
        requestData.scheduled_at = currentScheduledAt;
      }
      if (form.value.platform_track_id !== props.round.platform_track_id) {
        requestData.platform_track_id = form.value.platform_track_id ?? undefined;
      }
      if ((form.value.track_layout || '').trim() !== (props.round.track_layout || '')) {
        requestData.track_layout = form.value.track_layout.trim() || undefined;
      }
      if ((form.value.track_conditions || '').trim() !== (props.round.track_conditions || '')) {
        requestData.track_conditions = form.value.track_conditions.trim() || undefined;
      }
      if ((form.value.technical_notes || '').trim() !== (props.round.technical_notes || '')) {
        requestData.technical_notes = form.value.technical_notes.trim() || undefined;
      }
      if ((form.value.stream_url || '').trim() !== (props.round.stream_url || '')) {
        requestData.stream_url = form.value.stream_url.trim() || undefined;
      }
      if ((form.value.internal_notes || '').trim() !== (props.round.internal_notes || '')) {
        requestData.internal_notes = form.value.internal_notes.trim() || undefined;
      }

      if (Object.keys(requestData).length > 0) {
        await roundStore.updateExistingRound(props.round.id, requestData);

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Round updated successfully',
          life: 3000,
        });
      }
    }

    emit('saved');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to save round',
      life: 5000,
    });
  } finally {
    saving.value = false;
  }
}

function handleClose(): void {
  validation.clearErrors();
  trackSearch.clearSearch();
  isVisible.value = false;
}
</script>
