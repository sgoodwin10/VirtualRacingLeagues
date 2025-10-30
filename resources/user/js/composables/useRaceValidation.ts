import { reactive, type Ref, unref } from 'vue';
import type { RaceForm, RaceFormErrors } from '@user/types/race';

export function useRaceValidation(form: RaceForm, isQualifier: Ref<boolean> | boolean = false) {
  const errors = reactive<RaceFormErrors>({});

  // Helper to get the current value of isQualifier (whether it's a ref or boolean)
  const getIsQualifier = (): boolean => {
    return unref(isQualifier);
  };

  function validateRaceNumber(): string | undefined {
    // Skip validation for qualifiers (always 0)
    if (getIsQualifier()) {
      return undefined;
    }

    if (!form.race_number) {
      return 'Race number is required';
    }
    if (form.race_number < 1 || form.race_number > 99) {
      return 'Race number must be between 1 and 99';
    }
    return undefined;
  }

  function validateName(): string | undefined {
    if (!form.name) {
      return undefined; // Optional field
    }
    if (form.name.trim().length < 3) {
      return 'Name must be at least 3 characters';
    }
    if (form.name.length > 100) {
      return 'Name cannot exceed 100 characters';
    }
    return undefined;
  }

  function validateQualifyingLength(): string | undefined {
    // Only validate if qualifying is enabled
    if (form.qualifying_format === 'none' || form.qualifying_format === 'previous_race') {
      return undefined;
    }

    if (!form.qualifying_length || form.qualifying_length <= 0) {
      return 'Qualifying length must be a positive number';
    }

    if (form.qualifying_length > 999) {
      return 'Qualifying length cannot exceed 999 minutes';
    }

    return undefined;
  }

  function validateLengthValue(): string | undefined {
    // Skip validation for qualifiers (they use qualifying_length instead)
    if (getIsQualifier()) {
      return undefined;
    }

    if (!form.length_value || form.length_value <= 0) {
      return 'Race length must be a positive number';
    }

    if (form.length_type === 'laps' && form.length_value > 999) {
      return 'Laps cannot exceed 999';
    }

    if (form.length_type === 'time' && form.length_value > 9999) {
      return 'Time cannot exceed 9999 minutes';
    }

    return undefined;
  }

  function validateMinimumPitTime(): string | undefined {
    // Skip validation for qualifiers (no pit stops)
    if (getIsQualifier()) {
      return undefined;
    }

    // Only validate if mandatory pit stop is enabled
    if (!form.mandatory_pit_stop) {
      return undefined;
    }

    if (!form.minimum_pit_time || form.minimum_pit_time <= 0) {
      return 'Minimum pit time must be a positive number when mandatory pit stop is enabled';
    }

    if (form.minimum_pit_time > 999) {
      return 'Minimum pit time cannot exceed 999 seconds';
    }

    return undefined;
  }

  function validatePointsSystem(): string | undefined {
    // For custom points, ensure at least position 1 has points
    if (form.points_template === 'custom') {
      if (!form.points_system || Object.keys(form.points_system).length === 0) {
        return 'Points system must define at least one position';
      }

      if (!form.points_system[1]) {
        return 'Points for 1st position must be defined';
      }

      // Validate all points are non-negative
      for (const position in form.points_system) {
        const points = form.points_system[position];
        if (points !== undefined && points < 0) {
          return 'Points cannot be negative';
        }
      }
    }

    return undefined;
  }

  function validateAll(): boolean {
    errors.race_number = validateRaceNumber();
    errors.name = validateName();
    errors.qualifying_length = validateQualifyingLength();
    errors.length_value = validateLengthValue();
    errors.minimum_pit_time = validateMinimumPitTime();
    errors.points_system = validatePointsSystem();

    return !Object.values(errors).some((error) => error !== undefined);
  }

  function clearErrors(): void {
    Object.keys(errors).forEach((key) => {
      delete errors[key as keyof RaceFormErrors];
    });
  }

  return {
    errors,
    validateRaceNumber,
    validateName,
    validateQualifyingLength,
    validateLengthValue,
    validateMinimumPitTime,
    validatePointsSystem,
    validateAll,
    clearErrors,
  };
}
