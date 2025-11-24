import { describe, it, expect, beforeEach } from 'vitest';
import { reactive, ref } from 'vue';
import { useRaceValidation } from '../useRaceValidation';
import type { RaceForm } from '@app/types/race';

describe('useRaceValidation', () => {
  let form: RaceForm;

  beforeEach(() => {
    form = reactive({
      race_type: 'sprint',
      race_number: 1,
      name: '',
      qualifying_format: 'none',
      qualifying_length: 0,
      qualifying_tire: '',
      grid_source: 'manual',
      grid_source_race_id: null,
      length_type: 'laps',
      length_value: 10,
      extra_lap_after_time: false,
      weather: '',
      tire_restrictions: '',
      fuel_usage: '',
      damage_model: '',
      track_limits_enforced: false,
      false_start_detection: false,
      collision_penalties: false,
      mandatory_pit_stop: false,
      minimum_pit_time: 0,
      assists_restrictions: '',
      race_divisions: false,
      points_template: 'f1',
      points_system: {},
      bonus_pole: false,
      bonus_pole_points: 0,
      bonus_fastest_lap: false,
      bonus_fastest_lap_points: 0,
      bonus_fastest_lap_top_10: false,
      dnf_points: 0,
      dns_points: 0,
      race_notes: '',
    });
  });

  describe('validateRaceType', () => {
    it('should return error if race_type is empty', () => {
      form.race_type = null;
      const { validateRaceType } = useRaceValidation(form);

      expect(validateRaceType()).toBe('Race type is required');
    });

    it('should return undefined for valid race_type', () => {
      form.race_type = 'sprint';
      const { validateRaceType } = useRaceValidation(form);

      expect(validateRaceType()).toBeUndefined();
    });
  });

  describe('validateRaceNumber', () => {
    it('should return undefined for qualifiers', () => {
      const { validateRaceNumber } = useRaceValidation(form, true);

      expect(validateRaceNumber()).toBeUndefined();
    });

    it('should return error if race_number is missing for non-qualifiers', () => {
      form.race_number = null as any;
      const { validateRaceNumber } = useRaceValidation(form, false);

      expect(validateRaceNumber()).toBe('Race number is required');
    });

    it('should return error if race_number is 0', () => {
      form.race_number = 0;
      const { validateRaceNumber } = useRaceValidation(form);

      // 0 is falsy, so it triggers "Race number is required" first
      expect(validateRaceNumber()).toBe('Race number is required');
    });

    it('should return error if race_number > 99', () => {
      form.race_number = 100;
      const { validateRaceNumber } = useRaceValidation(form);

      expect(validateRaceNumber()).toBe('Race number must be between 1 and 99');
    });

    it('should return undefined for valid race_number', () => {
      form.race_number = 1;
      const { validateRaceNumber } = useRaceValidation(form);

      expect(validateRaceNumber()).toBeUndefined();
    });

    it('should work with isQualifier as ref', () => {
      const isQualifier = ref(true);
      form.race_number = null as any;
      const { validateRaceNumber } = useRaceValidation(form, isQualifier);

      expect(validateRaceNumber()).toBeUndefined();
    });
  });

  describe('validateName', () => {
    it('should return undefined for empty name', () => {
      form.name = '';
      const { validateName } = useRaceValidation(form);

      expect(validateName()).toBeUndefined();
    });

    it('should return error if name < 3 characters', () => {
      form.name = 'AB';
      const { validateName } = useRaceValidation(form);

      expect(validateName()).toBe('Name must be at least 3 characters');
    });

    it('should return error if name > 100 characters', () => {
      form.name = 'A'.repeat(101);
      const { validateName } = useRaceValidation(form);

      expect(validateName()).toBe('Name cannot exceed 100 characters');
    });

    it('should return undefined for valid name', () => {
      form.name = 'Sprint Race';
      const { validateName } = useRaceValidation(form);

      expect(validateName()).toBeUndefined();
    });
  });

  describe('validateQualifyingLength', () => {
    it('should return undefined when qualifying format is none', () => {
      form.qualifying_format = 'none';
      const { validateQualifyingLength } = useRaceValidation(form);

      expect(validateQualifyingLength()).toBeUndefined();
    });

    it('should return error if qualifying_length is missing when required', () => {
      form.qualifying_format = 'standard';
      form.qualifying_length = 0;
      const { validateQualifyingLength } = useRaceValidation(form);

      expect(validateQualifyingLength()).toBe('Qualifying length must be a positive number');
    });

    it('should return error if qualifying_length > 999', () => {
      form.qualifying_format = 'standard';
      form.qualifying_length = 1000;
      const { validateQualifyingLength } = useRaceValidation(form);

      expect(validateQualifyingLength()).toBe('Qualifying length cannot exceed 999 minutes');
    });

    it('should return undefined for valid qualifying_length', () => {
      form.qualifying_format = 'standard';
      form.qualifying_length = 30;
      const { validateQualifyingLength } = useRaceValidation(form);

      expect(validateQualifyingLength()).toBeUndefined();
    });
  });

  describe('validateLengthValue', () => {
    it('should return undefined for qualifiers', () => {
      const { validateLengthValue } = useRaceValidation(form, true);

      expect(validateLengthValue()).toBeUndefined();
    });

    it('should return error if length_value is missing', () => {
      form.length_value = null as any;
      const { validateLengthValue } = useRaceValidation(form);

      expect(validateLengthValue()).toBe('Race length must be a positive number');
    });

    it('should return error if laps > 999', () => {
      form.length_type = 'laps';
      form.length_value = 1000;
      const { validateLengthValue } = useRaceValidation(form);

      expect(validateLengthValue()).toBe('Laps cannot exceed 999');
    });

    it('should return error if time > 9999', () => {
      form.length_type = 'time';
      form.length_value = 10000;
      const { validateLengthValue } = useRaceValidation(form);

      expect(validateLengthValue()).toBe('Time cannot exceed 9999 minutes');
    });

    it('should return undefined for valid length_value', () => {
      form.length_value = 50;
      const { validateLengthValue } = useRaceValidation(form);

      expect(validateLengthValue()).toBeUndefined();
    });
  });

  describe('validateMinimumPitTime', () => {
    it('should return undefined for qualifiers', () => {
      form.mandatory_pit_stop = true;
      const { validateMinimumPitTime } = useRaceValidation(form, true);

      expect(validateMinimumPitTime()).toBeUndefined();
    });

    it('should return undefined when mandatory_pit_stop is false', () => {
      form.mandatory_pit_stop = false;
      const { validateMinimumPitTime } = useRaceValidation(form);

      expect(validateMinimumPitTime()).toBeUndefined();
    });

    it('should return error if minimum_pit_time is missing when required', () => {
      form.mandatory_pit_stop = true;
      form.minimum_pit_time = 0;
      const { validateMinimumPitTime } = useRaceValidation(form);

      expect(validateMinimumPitTime()).toBe(
        'Minimum pit time must be a positive number when mandatory pit stop is enabled',
      );
    });

    it('should return error if minimum_pit_time > 999', () => {
      form.mandatory_pit_stop = true;
      form.minimum_pit_time = 1000;
      const { validateMinimumPitTime } = useRaceValidation(form);

      expect(validateMinimumPitTime()).toBe('Minimum pit time cannot exceed 999 seconds');
    });

    it('should return undefined for valid minimum_pit_time', () => {
      form.mandatory_pit_stop = true;
      form.minimum_pit_time = 60;
      const { validateMinimumPitTime } = useRaceValidation(form);

      expect(validateMinimumPitTime()).toBeUndefined();
    });
  });

  describe('validatePointsSystem', () => {
    it('should return undefined for non-custom points template', () => {
      form.points_template = 'f1';
      const { validatePointsSystem } = useRaceValidation(form);

      expect(validatePointsSystem()).toBeUndefined();
    });

    it('should return error if custom points_system is empty', () => {
      form.points_template = 'custom';
      form.points_system = {};
      const { validatePointsSystem } = useRaceValidation(form);

      expect(validatePointsSystem()).toBe('Points system must define at least one position');
    });

    it('should return error if position 1 is not defined', () => {
      form.points_template = 'custom';
      form.points_system = { 2: 18, 3: 15 };
      const { validatePointsSystem } = useRaceValidation(form);

      expect(validatePointsSystem()).toBe('Points for 1st position must be defined');
    });

    it('should return error if points are negative', () => {
      form.points_template = 'custom';
      form.points_system = { 1: 25, 2: -5 };
      const { validatePointsSystem } = useRaceValidation(form);

      expect(validatePointsSystem()).toBe('Points cannot be negative');
    });

    it('should return undefined for valid custom points_system', () => {
      form.points_template = 'custom';
      form.points_system = { 1: 25, 2: 18, 3: 15 };
      const { validatePointsSystem } = useRaceValidation(form);

      expect(validatePointsSystem()).toBeUndefined();
    });
  });

  describe('validateGridSourceRaceId', () => {
    it('should return undefined for qualifiers', () => {
      form.grid_source = 'qualifying';
      form.grid_source_race_id = null;
      const { validateGridSourceRaceId } = useRaceValidation(form, true);

      expect(validateGridSourceRaceId()).toBeUndefined();
    });

    it('should return error if grid_source_race_id is missing when required', () => {
      form.grid_source = 'qualifying';
      form.grid_source_race_id = null;
      const { validateGridSourceRaceId } = useRaceValidation(form);

      expect(validateGridSourceRaceId()).toBe('Source race is required for this grid source');
    });

    it('should return undefined when grid_source_race_id is provided', () => {
      form.grid_source = 'qualifying';
      form.grid_source_race_id = 1;
      const { validateGridSourceRaceId } = useRaceValidation(form);

      expect(validateGridSourceRaceId()).toBeUndefined();
    });
  });

  describe('validateAll', () => {
    it('should return true for valid form', () => {
      const { validateAll } = useRaceValidation(form);

      expect(validateAll()).toBe(true);
    });

    it('should return false and populate errors for invalid form', () => {
      form.race_type = null;
      form.race_number = 0;
      form.name = 'AB';

      const { validateAll, errors } = useRaceValidation(form);

      expect(validateAll()).toBe(false);
      expect(errors.race_type).toBeDefined();
      expect(errors.race_number).toBeDefined();
      expect(errors.name).toBeDefined();
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      form.race_type = null;
      const { validateAll, clearErrors, errors } = useRaceValidation(form);

      validateAll();
      expect(errors.race_type).toBeDefined();

      clearErrors();
      expect(errors.race_type).toBeUndefined();
    });
  });
});
