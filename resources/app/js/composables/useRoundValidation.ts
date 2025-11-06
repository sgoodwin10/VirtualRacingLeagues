import { ref } from 'vue';
import type { RoundForm, RoundFormErrors } from '@app/types/round';

export function useRoundValidation() {
  const errors = ref<RoundFormErrors>({});

  function validateRoundNumber(value: number): boolean {
    if (!value || value < 1 || value > 99) {
      errors.value.round_number = 'Round number must be between 1 and 99';
      return false;
    }
    delete errors.value.round_number;
    return true;
  }

  function validateName(value: string): boolean {
    if (value && value.trim().length > 0) {
      if (value.trim().length < 3) {
        errors.value.name = 'Name must be at least 3 characters';
        return false;
      }
      if (value.length > 100) {
        errors.value.name = 'Name must not exceed 100 characters';
        return false;
      }
    }
    delete errors.value.name;
    return true;
  }

  function validateScheduledAt(value: Date | null): boolean {
    // Optional field - allow null/undefined
    if (!value) {
      delete errors.value.scheduled_at;
      return true;
    }
    delete errors.value.scheduled_at;
    return true;
  }

  function validatePlatformTrackId(value: number | null): boolean {
    // Optional field - allow null/undefined
    if (!value) {
      delete errors.value.platform_track_id;
      return true;
    }
    delete errors.value.platform_track_id;
    return true;
  }

  function validateStreamUrl(value: string): boolean {
    if (value && value.trim().length > 0) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(value.trim())) {
        errors.value.stream_url = 'Stream URL must be a valid URL (http:// or https://)';
        return false;
      }
    }
    delete errors.value.stream_url;
    return true;
  }

  function validateTechnicalNotes(value: string): boolean {
    if (value && value.length > 2000) {
      errors.value.technical_notes = 'Technical notes must not exceed 2000 characters';
      return false;
    }
    delete errors.value.technical_notes;
    return true;
  }

  function validateTrackLayout(value: string): boolean {
    if (value && value.length > 100) {
      errors.value.track_layout = 'Track layout must not exceed 100 characters';
      return false;
    }
    delete errors.value.track_layout;
    return true;
  }

  function validateTrackConditions(value: string): boolean {
    if (value && value.length > 100) {
      errors.value.track_conditions = 'Track conditions must not exceed 100 characters';
      return false;
    }
    delete errors.value.track_conditions;
    return true;
  }

  function validateInternalNotes(value: string): boolean {
    if (value && value.length > 2000) {
      errors.value.internal_notes = 'Internal notes must not exceed 2000 characters';
      return false;
    }
    delete errors.value.internal_notes;
    return true;
  }

  function validateFastestLap(value: number | null): boolean {
    // Optional field - allow null
    if (value === null || value === undefined) {
      delete errors.value.fastest_lap;
      return true;
    }
    if (value < 0 || value > 99) {
      errors.value.fastest_lap = 'Fastest lap bonus must be between 0 and 99';
      return false;
    }
    delete errors.value.fastest_lap;
    return true;
  }

  function validateFastestLapTop10(_value: boolean): boolean {
    // Boolean field - always valid
    delete errors.value.fastest_lap_top_10;
    return true;
  }

  function validateAll(form: RoundForm): boolean {
    const isRoundNumberValid = validateRoundNumber(form.round_number);
    const isNameValid = validateName(form.name);
    const isScheduledAtValid = validateScheduledAt(form.scheduled_at);
    const isPlatformTrackIdValid = validatePlatformTrackId(form.platform_track_id);
    const isStreamUrlValid = validateStreamUrl(form.stream_url);
    const isTechnicalNotesValid = validateTechnicalNotes(form.technical_notes);
    const isTrackLayoutValid = validateTrackLayout(form.track_layout);
    const isTrackConditionsValid = validateTrackConditions(form.track_conditions);
    const isInternalNotesValid = validateInternalNotes(form.internal_notes);
    const isFastestLapValid = validateFastestLap(form.fastest_lap);
    const isFastestLapTop10Valid = validateFastestLapTop10(form.fastest_lap_top_10);

    return (
      isRoundNumberValid &&
      isNameValid &&
      isScheduledAtValid &&
      isPlatformTrackIdValid &&
      isStreamUrlValid &&
      isTechnicalNotesValid &&
      isTrackLayoutValid &&
      isTrackConditionsValid &&
      isInternalNotesValid &&
      isFastestLapValid &&
      isFastestLapTop10Valid
    );
  }

  function clearErrors(): void {
    errors.value = {};
  }

  return {
    errors,
    validateRoundNumber,
    validateName,
    validateScheduledAt,
    validatePlatformTrackId,
    validateStreamUrl,
    validateTechnicalNotes,
    validateTrackLayout,
    validateTrackConditions,
    validateInternalNotes,
    validateFastestLap,
    validateFastestLapTop10,
    validateAll,
    clearErrors,
  };
}
