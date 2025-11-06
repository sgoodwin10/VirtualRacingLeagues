import { describe, it, expect, beforeEach } from 'vitest';
import { reactive } from 'vue';
import { useCompetitionValidation } from '../useCompetitionValidation';
import type { CompetitionForm } from '@app/types/competition';

describe('useCompetitionValidation', () => {
  let form: CompetitionForm;

  beforeEach(() => {
    form = reactive({
      name: '',
      description: '',
      platform_id: null,
      logo: null,
      logo_url: null,
      competition_colour: null,
    });
  });

  describe('validateName', () => {
    it('should return error if name is empty', () => {
      form.name = '';
      const { validateName } = useCompetitionValidation(form);

      expect(validateName()).toBe('Competition name is required');
    });

    it('should return error if name is only whitespace', () => {
      form.name = '   ';
      const { validateName } = useCompetitionValidation(form);

      expect(validateName()).toBe('Competition name is required');
    });

    it('should return error if name is less than 3 characters', () => {
      form.name = 'GT';
      const { validateName } = useCompetitionValidation(form);

      expect(validateName()).toBe('Name must be at least 3 characters');
    });

    it('should return error if name exceeds 100 characters', () => {
      form.name = 'A'.repeat(101);
      const { validateName } = useCompetitionValidation(form);

      expect(validateName()).toBe('Name must not exceed 100 characters');
    });

    it('should return undefined for valid name', () => {
      form.name = 'GT3 Championship';
      const { validateName } = useCompetitionValidation(form);

      expect(validateName()).toBeUndefined();
    });
  });

  describe('validatePlatform', () => {
    it('should return error if platform_id is null', () => {
      form.platform_id = null;
      const { validatePlatform } = useCompetitionValidation(form);

      expect(validatePlatform()).toBe('Platform is required');
    });

    it('should return undefined for valid platform_id', () => {
      form.platform_id = 1;
      const { validatePlatform } = useCompetitionValidation(form);

      expect(validatePlatform()).toBeUndefined();
    });
  });

  describe('validateDescription', () => {
    it('should return undefined for empty description', () => {
      form.description = '';
      const { validateDescription } = useCompetitionValidation(form);

      expect(validateDescription()).toBeUndefined();
    });

    it('should return error if description exceeds 1000 characters', () => {
      form.description = 'A'.repeat(1001);
      const { validateDescription } = useCompetitionValidation(form);

      expect(validateDescription()).toBe('Description must not exceed 1000 characters');
    });

    it('should return undefined for valid description', () => {
      form.description = 'A competitive GT3 racing series';
      const { validateDescription } = useCompetitionValidation(form);

      expect(validateDescription()).toBeUndefined();
    });
  });

  describe('validateLogo', () => {
    it('should return undefined if logo is null', () => {
      form.logo = null;
      const { validateLogo } = useCompetitionValidation(form);

      expect(validateLogo()).toBeUndefined();
    });

    it('should return error for invalid file type', () => {
      form.logo = new File(['content'], 'logo.gif', { type: 'image/gif' });
      const { validateLogo } = useCompetitionValidation(form);

      expect(validateLogo()).toBe('Logo must be PNG or JPG format');
    });

    it('should return error if file size exceeds 2MB', () => {
      const largeFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      form.logo = largeFile;
      const { validateLogo } = useCompetitionValidation(form);

      expect(validateLogo()).toBe('Logo must be less than 2MB');
    });

    it('should return undefined for valid PNG file', () => {
      form.logo = new File(['content'], 'logo.png', { type: 'image/png' });
      const { validateLogo } = useCompetitionValidation(form);

      expect(validateLogo()).toBeUndefined();
    });

    it('should return undefined for valid JPG file', () => {
      form.logo = new File(['content'], 'logo.jpg', { type: 'image/jpeg' });
      const { validateLogo } = useCompetitionValidation(form);

      expect(validateLogo()).toBeUndefined();
    });
  });

  describe('validateAll', () => {
    it('should return false if any field is invalid', () => {
      form.name = ''; // Invalid
      form.platform_id = 1;
      const { validateAll } = useCompetitionValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return true if all fields are valid', () => {
      form.name = 'GT3 Championship';
      form.platform_id = 1;
      form.description = 'A competitive series';
      form.logo = new File(['content'], 'logo.png', { type: 'image/png' });

      const { validateAll } = useCompetitionValidation(form);

      expect(validateAll()).toBe(true);
    });

    it('should populate errors object with validation results', () => {
      form.name = '';
      form.platform_id = null;
      form.description = 'A'.repeat(1001);

      const { validateAll, errors } = useCompetitionValidation(form);

      validateAll();

      expect(errors.name).toBe('Competition name is required');
      expect(errors.platform_id).toBe('Platform is required');
      expect(errors.description).toBe('Description must not exceed 1000 characters');
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      form.name = '';
      form.platform_id = null;

      const { validateAll, clearErrors, errors } = useCompetitionValidation(form);

      validateAll();
      expect(errors.name).toBeDefined();
      expect(errors.platform_id).toBeDefined();

      clearErrors();
      expect(errors.name).toBeUndefined();
      expect(errors.platform_id).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('should clear a specific error', () => {
      form.name = '';
      form.platform_id = null;

      const { validateAll, clearError, errors } = useCompetitionValidation(form);

      validateAll();
      expect(errors.name).toBeDefined();
      expect(errors.platform_id).toBeDefined();

      clearError('name');
      expect(errors.name).toBeUndefined();
      expect(errors.platform_id).toBeDefined();
    });
  });

  describe('computed properties', () => {
    it('isValid should return true when no errors', () => {
      form.name = 'GT3 Championship';
      form.platform_id = 1;

      const { isValid } = useCompetitionValidation(form);

      expect(isValid.value).toBe(true);
    });

    it('isValid should return false when there are errors', () => {
      form.name = '';
      const { validateName, errors, isValid } = useCompetitionValidation(form);

      errors.name = validateName();

      expect(isValid.value).toBe(false);
    });

    it('hasErrors should return true when there are errors', () => {
      form.name = '';
      const { validateName, errors, hasErrors } = useCompetitionValidation(form);

      errors.name = validateName();

      expect(hasErrors.value).toBe(true);
    });

    it('hasErrors should return false when no errors', () => {
      form.name = 'GT3 Championship';
      form.platform_id = 1;

      const { hasErrors } = useCompetitionValidation(form);

      expect(hasErrors.value).toBe(false);
    });
  });
});
