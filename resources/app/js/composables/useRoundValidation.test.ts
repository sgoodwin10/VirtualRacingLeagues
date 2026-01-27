import { describe, it, expect, beforeEach } from 'vitest';
import { useRoundValidation } from './useRoundValidation';
import type { RoundForm } from '@app/types/round';

describe('useRoundValidation', () => {
  let form: RoundForm;
  let validation: ReturnType<typeof useRoundValidation>;

  beforeEach(() => {
    form = {
      round_number: 1,
      name: '',
      scheduled_at: null,
      platform_track_id: null,
      stream_url: '',
      technical_notes: '',
      track_layout: '',
      track_conditions: '',
      internal_notes: '',
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      points_system: { 1: 25, 2: 18, 3: 15 },
      round_points: false,
    };
    validation = useRoundValidation();
  });

  describe('validateRoundNumber', () => {
    it('should return false and set error for round number < 1', () => {
      const result = validation.validateRoundNumber(0);

      expect(result).toBe(false);
      expect(validation.errors.value.round_number).toBe('Round number must be between 1 and 99');
    });

    it('should return false and set error for round number > 99', () => {
      const result = validation.validateRoundNumber(100);

      expect(result).toBe(false);
      expect(validation.errors.value.round_number).toBe('Round number must be between 1 and 99');
    });

    it('should return false and set error for round number null/undefined', () => {
      const result = validation.validateRoundNumber(null as any);

      expect(result).toBe(false);
      expect(validation.errors.value.round_number).toBe('Round number must be between 1 and 99');
    });

    it('should return true and clear error for round number 1', () => {
      const result = validation.validateRoundNumber(1);

      expect(result).toBe(true);
      expect(validation.errors.value.round_number).toBeUndefined();
    });

    it('should return true and clear error for round number 99', () => {
      const result = validation.validateRoundNumber(99);

      expect(result).toBe(true);
      expect(validation.errors.value.round_number).toBeUndefined();
    });

    it('should return true for valid round number 50', () => {
      const result = validation.validateRoundNumber(50);

      expect(result).toBe(true);
      expect(validation.errors.value.round_number).toBeUndefined();
    });
  });

  describe('validateName', () => {
    it('should return true for empty name', () => {
      const result = validation.validateName('');

      expect(result).toBe(true);
      expect(validation.errors.value.name).toBeUndefined();
    });

    it('should return false and set error for name with < 3 characters', () => {
      const result = validation.validateName('AB');

      expect(result).toBe(false);
      expect(validation.errors.value.name).toBe('Name must be at least 3 characters');
    });

    it('should return false and set error for name > 100 characters', () => {
      const result = validation.validateName('A'.repeat(101));

      expect(result).toBe(false);
      expect(validation.errors.value.name).toBe('Name must not exceed 100 characters');
    });

    it('should return true for valid name', () => {
      const result = validation.validateName('Round 1');

      expect(result).toBe(true);
      expect(validation.errors.value.name).toBeUndefined();
    });

    it('should return true for name exactly 3 characters', () => {
      const result = validation.validateName('R 1');

      expect(result).toBe(true);
      expect(validation.errors.value.name).toBeUndefined();
    });

    it('should return true for name exactly 100 characters', () => {
      const result = validation.validateName('A'.repeat(100));

      expect(result).toBe(true);
      expect(validation.errors.value.name).toBeUndefined();
    });

    it('should return true for whitespace-only name', () => {
      const result = validation.validateName('   ');

      expect(result).toBe(true);
      expect(validation.errors.value.name).toBeUndefined();
    });
  });

  describe('validateScheduledAt', () => {
    it('should return true for null scheduled_at', () => {
      const result = validation.validateScheduledAt(null);

      expect(result).toBe(true);
      expect(validation.errors.value.scheduled_at).toBeUndefined();
    });

    it('should return true for valid date', () => {
      const result = validation.validateScheduledAt(new Date());

      expect(result).toBe(true);
      expect(validation.errors.value.scheduled_at).toBeUndefined();
    });
  });

  describe('validatePlatformTrackId', () => {
    it('should return true for null platform_track_id', () => {
      const result = validation.validatePlatformTrackId(null);

      expect(result).toBe(true);
      expect(validation.errors.value.platform_track_id).toBeUndefined();
    });

    it('should return true for valid platform_track_id', () => {
      const result = validation.validatePlatformTrackId(123);

      expect(result).toBe(true);
      expect(validation.errors.value.platform_track_id).toBeUndefined();
    });
  });

  describe('validateStreamUrl', () => {
    it('should return true for empty stream URL', () => {
      const result = validation.validateStreamUrl('');

      expect(result).toBe(true);
      expect(validation.errors.value.stream_url).toBeUndefined();
    });

    it('should return false and set error for invalid URL format', () => {
      const result = validation.validateStreamUrl('not-a-url');

      expect(result).toBe(false);
      expect(validation.errors.value.stream_url).toBe(
        'Stream URL must be a valid URL (http:// or https://)',
      );
    });

    it('should return true for valid HTTP URL', () => {
      const result = validation.validateStreamUrl('http://example.com/stream');

      expect(result).toBe(true);
      expect(validation.errors.value.stream_url).toBeUndefined();
    });

    it('should return true for valid HTTPS URL', () => {
      const result = validation.validateStreamUrl('https://example.com/stream');

      expect(result).toBe(true);
      expect(validation.errors.value.stream_url).toBeUndefined();
    });

    it('should return true for whitespace-only URL', () => {
      const result = validation.validateStreamUrl('   ');

      expect(result).toBe(true);
      expect(validation.errors.value.stream_url).toBeUndefined();
    });
  });

  describe('validateTechnicalNotes', () => {
    it('should return true for empty technical notes', () => {
      const result = validation.validateTechnicalNotes('');

      expect(result).toBe(true);
      expect(validation.errors.value.technical_notes).toBeUndefined();
    });

    it('should return false and set error for notes > 2000 characters', () => {
      const result = validation.validateTechnicalNotes('A'.repeat(2001));

      expect(result).toBe(false);
      expect(validation.errors.value.technical_notes).toBe(
        'Technical notes must not exceed 2000 characters',
      );
    });

    it('should return true for valid technical notes', () => {
      const result = validation.validateTechnicalNotes('BOP enabled, fixed setup');

      expect(result).toBe(true);
      expect(validation.errors.value.technical_notes).toBeUndefined();
    });

    it('should return true for notes exactly 2000 characters', () => {
      const result = validation.validateTechnicalNotes('A'.repeat(2000));

      expect(result).toBe(true);
      expect(validation.errors.value.technical_notes).toBeUndefined();
    });
  });

  describe('validateTrackLayout', () => {
    it('should return true for empty track layout', () => {
      const result = validation.validateTrackLayout('');

      expect(result).toBe(true);
      expect(validation.errors.value.track_layout).toBeUndefined();
    });

    it('should return false and set error for layout > 100 characters', () => {
      const result = validation.validateTrackLayout('A'.repeat(101));

      expect(result).toBe(false);
      expect(validation.errors.value.track_layout).toBe(
        'Track layout must not exceed 100 characters',
      );
    });

    it('should return true for valid track layout', () => {
      const result = validation.validateTrackLayout('GP Circuit');

      expect(result).toBe(true);
      expect(validation.errors.value.track_layout).toBeUndefined();
    });

    it('should return true for layout exactly 100 characters', () => {
      const result = validation.validateTrackLayout('A'.repeat(100));

      expect(result).toBe(true);
      expect(validation.errors.value.track_layout).toBeUndefined();
    });
  });

  describe('validateTrackConditions', () => {
    it('should return true for empty track conditions', () => {
      const result = validation.validateTrackConditions('');

      expect(result).toBe(true);
      expect(validation.errors.value.track_conditions).toBeUndefined();
    });

    it('should return false and set error for conditions > 100 characters', () => {
      const result = validation.validateTrackConditions('A'.repeat(101));

      expect(result).toBe(false);
      expect(validation.errors.value.track_conditions).toBe(
        'Track conditions must not exceed 100 characters',
      );
    });

    it('should return true for valid track conditions', () => {
      const result = validation.validateTrackConditions('Dry, 25°C');

      expect(result).toBe(true);
      expect(validation.errors.value.track_conditions).toBeUndefined();
    });

    it('should return true for conditions exactly 100 characters', () => {
      const result = validation.validateTrackConditions('A'.repeat(100));

      expect(result).toBe(true);
      expect(validation.errors.value.track_conditions).toBeUndefined();
    });
  });

  describe('validateInternalNotes', () => {
    it('should return true for empty internal notes', () => {
      const result = validation.validateInternalNotes('');

      expect(result).toBe(true);
      expect(validation.errors.value.internal_notes).toBeUndefined();
    });

    it('should return false and set error for notes > 2000 characters', () => {
      const result = validation.validateInternalNotes('A'.repeat(2001));

      expect(result).toBe(false);
      expect(validation.errors.value.internal_notes).toBe(
        'Internal notes must not exceed 2000 characters',
      );
    });

    it('should return true for valid internal notes', () => {
      const result = validation.validateInternalNotes('Admin notes here');

      expect(result).toBe(true);
      expect(validation.errors.value.internal_notes).toBeUndefined();
    });

    it('should return true for notes exactly 2000 characters', () => {
      const result = validation.validateInternalNotes('A'.repeat(2000));

      expect(result).toBe(true);
      expect(validation.errors.value.internal_notes).toBeUndefined();
    });
  });

  describe('validateFastestLap', () => {
    it('should return true for null fastest lap', () => {
      const result = validation.validateFastestLap(null);

      expect(result).toBe(true);
      expect(validation.errors.value.fastest_lap).toBeUndefined();
    });

    it('should return true for undefined fastest lap', () => {
      const result = validation.validateFastestLap(undefined as any);

      expect(result).toBe(true);
      expect(validation.errors.value.fastest_lap).toBeUndefined();
    });

    it('should return false and set error for fastest lap < 0', () => {
      const result = validation.validateFastestLap(-1);

      expect(result).toBe(false);
      expect(validation.errors.value.fastest_lap).toBe(
        'Fastest lap bonus must be between 0 and 99',
      );
    });

    it('should return false and set error for fastest lap > 99', () => {
      const result = validation.validateFastestLap(100);

      expect(result).toBe(false);
      expect(validation.errors.value.fastest_lap).toBe(
        'Fastest lap bonus must be between 0 and 99',
      );
    });

    it('should return true for fastest lap 0', () => {
      const result = validation.validateFastestLap(0);

      expect(result).toBe(true);
      expect(validation.errors.value.fastest_lap).toBeUndefined();
    });

    it('should return true for fastest lap 99', () => {
      const result = validation.validateFastestLap(99);

      expect(result).toBe(true);
      expect(validation.errors.value.fastest_lap).toBeUndefined();
    });

    it('should return true for valid fastest lap 5', () => {
      const result = validation.validateFastestLap(5);

      expect(result).toBe(true);
      expect(validation.errors.value.fastest_lap).toBeUndefined();
    });
  });

  describe('validateFastestLapTop10', () => {
    it('should return true for false value', () => {
      const result = validation.validateFastestLapTop10(false);

      expect(result).toBe(true);
      expect(validation.errors.value.fastest_lap_top_10).toBeUndefined();
    });

    it('should return true for true value', () => {
      const result = validation.validateFastestLapTop10(true);

      expect(result).toBe(true);
      expect(validation.errors.value.fastest_lap_top_10).toBeUndefined();
    });
  });

  describe('validatePointsSystem', () => {
    it('should return true when round_points is disabled', () => {
      const result = validation.validatePointsSystem({}, false);

      expect(result).toBe(true);
      expect(validation.errors.value.points_system).toBeUndefined();
    });

    it('should return false when round_points is enabled but points_system is empty', () => {
      const result = validation.validatePointsSystem({}, true);

      expect(result).toBe(false);
      expect(validation.errors.value.points_system).toBe(
        'Points system is required when round points are enabled',
      );
    });

    it('should return true for valid points_system with round_points enabled', () => {
      const result = validation.validatePointsSystem({ 1: 25, 2: 18, 3: 15 }, true);

      expect(result).toBe(true);
      expect(validation.errors.value.points_system).toBeUndefined();
    });

    it('should return false for invalid position (zero)', () => {
      const result = validation.validatePointsSystem({ 0: 25, 1: 18 }, true);

      expect(result).toBe(false);
      expect(validation.errors.value.points_system).toBe('All positions must be positive integers');
    });

    it('should return false for negative points value', () => {
      const result = validation.validatePointsSystem({ 1: -5, 2: 18 }, true);

      expect(result).toBe(false);
      expect(validation.errors.value.points_system).toBe(
        'All points values must be non-negative integers',
      );
    });

    it('should return true for zero points value', () => {
      const result = validation.validatePointsSystem({ 1: 25, 2: 0 }, true);

      expect(result).toBe(true);
      expect(validation.errors.value.points_system).toBeUndefined();
    });
  });

  describe('validateRoundPoints', () => {
    it('should return true for false value', () => {
      const result = validation.validateRoundPoints(false);

      expect(result).toBe(true);
      expect(validation.errors.value.round_points).toBeUndefined();
    });

    it('should return true for true value', () => {
      const result = validation.validateRoundPoints(true);

      expect(result).toBe(true);
      expect(validation.errors.value.round_points).toBeUndefined();
    });
  });

  describe('validateAll', () => {
    it('should return false if round number is invalid', () => {
      form.round_number = 0;
      const result = validation.validateAll(form);

      expect(result).toBe(false);
      expect(validation.errors.value.round_number).toBeDefined();
    });

    it('should return false if name is invalid', () => {
      form.round_number = 1;
      form.name = 'AB';
      const result = validation.validateAll(form);

      expect(result).toBe(false);
      expect(validation.errors.value.name).toBeDefined();
    });

    it('should return false if stream URL is invalid', () => {
      form.round_number = 1;
      form.stream_url = 'not-a-url';
      const result = validation.validateAll(form);

      expect(result).toBe(false);
      expect(validation.errors.value.stream_url).toBeDefined();
    });

    it('should return true for valid form with only required field', () => {
      form.round_number = 1;
      const result = validation.validateAll(form);

      expect(result).toBe(true);
    });

    it('should return true for fully populated valid form', () => {
      form.round_number = 5;
      form.name = 'Monaco Grand Prix';
      form.scheduled_at = new Date();
      form.platform_track_id = 123;
      form.stream_url = 'https://youtube.com/stream';
      form.technical_notes = 'BOP enabled';
      form.track_layout = 'GP Circuit';
      form.track_conditions = 'Dry, 25°C';
      form.internal_notes = 'Notes here';
      form.fastest_lap = 5;
      form.fastest_lap_top_10 = true;

      const result = validation.validateAll(form);

      expect(result).toBe(true);
    });

    it('should validate all fields and populate errors', () => {
      form.round_number = 0;
      form.name = 'AB';
      form.stream_url = 'invalid';
      form.technical_notes = 'A'.repeat(2001);
      form.track_layout = 'A'.repeat(101);
      form.track_conditions = 'A'.repeat(101);
      form.internal_notes = 'A'.repeat(2001);
      form.fastest_lap = 100;

      const result = validation.validateAll(form);

      expect(result).toBe(false);
      expect(validation.errors.value.round_number).toBeDefined();
      expect(validation.errors.value.name).toBeDefined();
      expect(validation.errors.value.stream_url).toBeDefined();
      expect(validation.errors.value.technical_notes).toBeDefined();
      expect(validation.errors.value.track_layout).toBeDefined();
      expect(validation.errors.value.track_conditions).toBeDefined();
      expect(validation.errors.value.internal_notes).toBeDefined();
      expect(validation.errors.value.fastest_lap).toBeDefined();
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      validation.validateRoundNumber(0);
      validation.validateName('AB');

      expect(validation.errors.value.round_number).toBeDefined();
      expect(validation.errors.value.name).toBeDefined();

      validation.clearErrors();

      expect(Object.keys(validation.errors.value).length).toBe(0);
    });
  });
});
