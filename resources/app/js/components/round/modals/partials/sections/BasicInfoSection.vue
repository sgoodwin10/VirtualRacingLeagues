<script setup lang="ts">
import InputText from 'primevue/inputtext';
import AutoComplete from 'primevue/autocomplete';
import DatePicker from 'primevue/datepicker';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import { PhArrowRight } from '@phosphor-icons/vue';
import type { Track, TrackLocationGroup } from '@app/types/track';

interface Props {
  roundName: string;
  selectedTrack: Track | null;
  trackSuggestions: TrackLocationGroup[];
  scheduledAt: Date | null;
  errors: {
    name?: string;
    platform_track_id?: string;
    scheduled_at?: string;
  };
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:roundName': [value: string];
  'update:scheduledAt': [value: Date | null];
  'track-search': [query: string];
  'track-select': [track: Track];
  'blur-name': [];
  'blur-track': [];
  'blur-schedule': [];
}>();

function formatTrackDisplay(track: Track | null): string {
  if (!track) return '';

  const locationName = track.location?.name || '';
  const trackName = track.name;

  return `${locationName} - ${trackName}`;
}

function handleTrackSearch(event: { query: string }): void {
  emit('track-search', event.query);
}

function handleTrackSelect(event: { value: Track }): void {
  emit('track-select', event.value);
}
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Basic Information</h3>
      <p class="text-[var(--text-secondary)] m-0">Round name, track, and scheduling</p>
    </div>

    <div class="flex flex-row gap-3">
      <!-- Round Name -->
      <div class="w-2/3">
        <FormInputGroup>
          <FormLabel for="name" text="Round Name" />
          <InputText
            id="name"
            :model-value="roundName"
            size="sm"
            placeholder="e.g., Season Opener, Championship Finale"
            :invalid="!!errors.name"
            :disabled="disabled"
            class="w-full"
            @update:model-value="emit('update:roundName', $event)"
            @blur="emit('blur-name')"
          />
          <FormOptionalText text="Custom name for this round" />
          <FormError v-if="errors.name">
            {{ errors.name }}
          </FormError>
        </FormInputGroup>
      </div>
      <div class="w-1/3">
        <!-- Scheduled Date & Time -->
        <FormInputGroup>
          <FormLabel for="scheduled_at" text="Scheduled Date & Time" />
          <DatePicker
            id="scheduled_at"
            :model-value="scheduledAt"
            show-time
            hour-format="24"
            date-format="yy-mm-dd"
            :step-minute="15"
            :invalid="!!errors.scheduled_at"
            :disabled="disabled"
            placeholder="Select date and time"
            size="sm"
            fluid
            class="w-full"
            @update:model-value="emit('update:scheduledAt', $event)"
            @blur="emit('blur-schedule')"
          />
          <FormOptionalText
            :show-optional="false"
            text="When this round is scheduled to take place"
          />
          <FormError v-if="errors.scheduled_at">
            {{ errors.scheduled_at }}
          </FormError>
        </FormInputGroup>
      </div>
    </div>

    <!-- Track Selection -->
    <FormInputGroup>
      <FormLabel for="track" text="Track" />
      <AutoComplete
        id="track"
        :model-value="selectedTrack"
        :suggestions="trackSuggestions"
        option-group-label="name"
        option-group-children="tracks"
        :option-label="formatTrackDisplay"
        placeholder="Search for a location..."
        :invalid="!!errors.platform_track_id"
        :disabled="disabled"
        force-selection
        size="sm"
        fluid
        class="w-full"
        @complete="handleTrackSearch"
        @item-select="handleTrackSelect"
        @blur="emit('blur-track')"
      >
        <template #optiongroup="slotProps">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-[var(--text-primary)]">{{
              slotProps.option.name
            }}</span>
            <span v-if="slotProps.option.country" class="text-sm text-[var(--text-muted)]">
              ({{ slotProps.option.country }})
            </span>
          </div>
        </template>
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-2">
              <PhArrowRight size="16" class="text-[var(--text-muted)]" />
              {{ formatTrackDisplay(slotProps.option) }}
            </span>
          </div>
        </template>
        <template #chip="slotProps">
          <span>{{ formatTrackDisplay(slotProps.value) }}</span>
        </template>
      </AutoComplete>
      <FormOptionalText :show-optional="false" text="Search and select the track for this round" />
      <FormError v-if="errors.platform_track_id">
        {{ errors.platform_track_id }}
      </FormError>
    </FormInputGroup>
  </div>
</template>
