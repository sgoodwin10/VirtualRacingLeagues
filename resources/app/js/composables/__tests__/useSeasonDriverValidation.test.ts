import { describe, it, expect, beforeEach } from 'vitest';
import { reactive } from 'vue';
import { useSeasonDriverValidation } from '../useSeasonDriverValidation';
import type { SeasonDriverForm } from '@app/types/seasonDriver';

describe('useSeasonDriverValidation', () => {
  let form: SeasonDriverForm;

  beforeEach(() => {
    form = reactive({
      driver_id: 1,
      status: 'active',
      race_number: null,
      team_id: null,
      division_id: null,
      notes: '',
    });
  });

  describe('validateStatus', () => {
    it('should return error if status is empty', () => {
      form.status = '' as any;
      const { validateStatus } = useSeasonDriverValidation(form);

      expect(validateStatus()).toBe('Status is required');
    });

    it('should return error for invalid status value', () => {
      form.status = 'invalid' as any;
      const { validateStatus } = useSeasonDriverValidation(form);

      expect(validateStatus()).toBe('Invalid status value');
    });

    it('should return undefined for status "active"', () => {
      form.status = 'active';
      const { validateStatus } = useSeasonDriverValidation(form);

      expect(validateStatus()).toBeUndefined();
    });

    it('should return undefined for status "reserve"', () => {
      form.status = 'reserve';
      const { validateStatus } = useSeasonDriverValidation(form);

      expect(validateStatus()).toBeUndefined();
    });

    it('should return undefined for status "withdrawn"', () => {
      form.status = 'withdrawn';
      const { validateStatus } = useSeasonDriverValidation(form);

      expect(validateStatus()).toBeUndefined();
    });
  });

  describe('validateNotes', () => {
    it('should return undefined for empty notes', () => {
      form.notes = '';
      const { validateNotes } = useSeasonDriverValidation(form);

      expect(validateNotes()).toBeUndefined();
    });

    it('should return error if notes exceed 1000 characters', () => {
      form.notes = 'A'.repeat(1001);
      const { validateNotes } = useSeasonDriverValidation(form);

      expect(validateNotes()).toBe('Notes must not exceed 1000 characters');
    });

    it('should return undefined for valid notes', () => {
      form.notes = 'Driver has improved significantly this season';
      const { validateNotes } = useSeasonDriverValidation(form);

      expect(validateNotes()).toBeUndefined();
    });

    it('should return undefined for notes exactly 1000 characters', () => {
      form.notes = 'A'.repeat(1000);
      const { validateNotes } = useSeasonDriverValidation(form);

      expect(validateNotes()).toBeUndefined();
    });
  });

  describe('validateAll', () => {
    it('should return false if status is invalid', () => {
      form.status = '' as any;
      const { validateAll } = useSeasonDriverValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return false if notes are invalid', () => {
      form.status = 'active';
      form.notes = 'A'.repeat(1001);
      const { validateAll } = useSeasonDriverValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return true if all fields are valid', () => {
      form.status = 'active';
      form.notes = 'Valid notes';
      const { validateAll } = useSeasonDriverValidation(form);

      expect(validateAll()).toBe(true);
    });

    it('should populate errors object with validation results', () => {
      form.status = '' as any;
      form.notes = 'A'.repeat(1001);

      const { validateAll, errors } = useSeasonDriverValidation(form);

      validateAll();

      expect(errors.status).toBe('Status is required');
      expect(errors.notes).toBe('Notes must not exceed 1000 characters');
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      form.status = '' as any;
      form.notes = 'A'.repeat(1001);

      const { validateAll, clearErrors, errors } = useSeasonDriverValidation(form);

      validateAll();
      expect(errors.status).toBeDefined();
      expect(errors.notes).toBeDefined();

      clearErrors();
      expect(errors.status).toBeUndefined();
      expect(errors.notes).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('should clear a specific error', () => {
      form.status = '' as any;
      form.notes = 'A'.repeat(1001);

      const { validateAll, clearError, errors } = useSeasonDriverValidation(form);

      validateAll();
      expect(errors.status).toBeDefined();
      expect(errors.notes).toBeDefined();

      clearError('status');
      expect(errors.status).toBeUndefined();
      expect(errors.notes).toBeDefined();
    });

    it('should clear notes error specifically', () => {
      form.status = '' as any;
      form.notes = 'A'.repeat(1001);

      const { validateAll, clearError, errors } = useSeasonDriverValidation(form);

      validateAll();
      expect(errors.status).toBeDefined();
      expect(errors.notes).toBeDefined();

      clearError('notes');
      expect(errors.notes).toBeUndefined();
      expect(errors.status).toBeDefined();
    });
  });

  describe('computed properties', () => {
    it('isValid should return true when no errors', () => {
      form.status = 'active';
      form.notes = '';

      const { isValid } = useSeasonDriverValidation(form);

      expect(isValid.value).toBe(true);
    });

    it('isValid should return false when there are errors', () => {
      form.status = '' as any;
      const { validateStatus, errors, isValid } = useSeasonDriverValidation(form);

      errors.status = validateStatus();

      expect(isValid.value).toBe(false);
    });

    it('hasErrors should return true when there are errors', () => {
      form.status = '' as any;
      const { validateStatus, errors, hasErrors } = useSeasonDriverValidation(form);

      errors.status = validateStatus();

      expect(hasErrors.value).toBe(true);
    });

    it('hasErrors should return false when no errors', () => {
      form.status = 'active';

      const { hasErrors } = useSeasonDriverValidation(form);

      expect(hasErrors.value).toBe(false);
    });
  });
});
