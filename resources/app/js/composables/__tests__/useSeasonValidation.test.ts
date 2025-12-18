import { describe, it, expect, beforeEach } from 'vitest';
import { reactive } from 'vue';
import { useSeasonValidation } from '../useSeasonValidation';
import type { SeasonForm } from '@app/types/season';

describe('useSeasonValidation', () => {
  let form: SeasonForm;

  beforeEach(() => {
    form = reactive({
      name: '',
      car_class: '',
      description: '',
      technical_specs: '',
      logo: null,
      logo_url: null,
      banner: null,
      banner_url: null,
      race_divisions_enabled: false,
      team_championship_enabled: false,
      race_times_required: true,
      drop_round: false,
      total_drop_rounds: 0,
      teams_drivers_for_calculation: null,
      teams_drop_rounds: false,
      teams_total_drop_rounds: null,
    });
  });

  describe('validateName', () => {
    it('should return error if name is empty', () => {
      form.name = '';
      const { validateName } = useSeasonValidation(form);

      expect(validateName()).toBe('Season name is required');
    });

    it('should return error if name is only whitespace', () => {
      form.name = '   ';
      const { validateName } = useSeasonValidation(form);

      expect(validateName()).toBe('Season name is required');
    });

    it('should return error if name is less than 3 characters', () => {
      form.name = 'S1';
      const { validateName } = useSeasonValidation(form);

      expect(validateName()).toBe('Name must be at least 3 characters');
    });

    it('should return error if name exceeds 100 characters', () => {
      form.name = 'A'.repeat(101);
      const { validateName } = useSeasonValidation(form);

      expect(validateName()).toBe('Name must not exceed 100 characters');
    });

    it('should return undefined for valid name', () => {
      form.name = 'Season 1';
      const { validateName } = useSeasonValidation(form);

      expect(validateName()).toBeUndefined();
    });

    it('should return undefined for name exactly 3 characters', () => {
      form.name = 'S 1';
      const { validateName } = useSeasonValidation(form);

      expect(validateName()).toBeUndefined();
    });

    it('should return undefined for name exactly 100 characters', () => {
      form.name = 'A'.repeat(100);
      const { validateName } = useSeasonValidation(form);

      expect(validateName()).toBeUndefined();
    });
  });

  describe('validateCarClass', () => {
    it('should return undefined for empty car class', () => {
      form.car_class = '';
      const { validateCarClass } = useSeasonValidation(form);

      expect(validateCarClass()).toBeUndefined();
    });

    it('should return error if car class exceeds 150 characters', () => {
      form.car_class = 'A'.repeat(151);
      const { validateCarClass } = useSeasonValidation(form);

      expect(validateCarClass()).toBe('Car class must not exceed 150 characters');
    });

    it('should return undefined for valid car class', () => {
      form.car_class = 'GT3';
      const { validateCarClass } = useSeasonValidation(form);

      expect(validateCarClass()).toBeUndefined();
    });

    it('should return undefined for car class exactly 150 characters', () => {
      form.car_class = 'A'.repeat(150);
      const { validateCarClass } = useSeasonValidation(form);

      expect(validateCarClass()).toBeUndefined();
    });
  });

  describe('validateDescription', () => {
    it('should return undefined for empty description', () => {
      form.description = '';
      const { validateDescription } = useSeasonValidation(form);

      expect(validateDescription()).toBeUndefined();
    });

    it('should return error if description exceeds 2000 characters', () => {
      form.description = 'A'.repeat(2001);
      const { validateDescription } = useSeasonValidation(form);

      expect(validateDescription()).toBe('Description must not exceed 2000 characters');
    });

    it('should return undefined for valid description', () => {
      form.description = 'A competitive season of GT3 racing';
      const { validateDescription } = useSeasonValidation(form);

      expect(validateDescription()).toBeUndefined();
    });

    it('should return undefined for description exactly 2000 characters', () => {
      form.description = 'A'.repeat(2000);
      const { validateDescription } = useSeasonValidation(form);

      expect(validateDescription()).toBeUndefined();
    });
  });

  describe('validateTechnicalSpecs', () => {
    it('should return undefined for empty technical specs', () => {
      form.technical_specs = '';
      const { validateTechnicalSpecs } = useSeasonValidation(form);

      expect(validateTechnicalSpecs()).toBeUndefined();
    });

    it('should return error if technical specs exceeds 2000 characters', () => {
      form.technical_specs = 'A'.repeat(2001);
      const { validateTechnicalSpecs } = useSeasonValidation(form);

      expect(validateTechnicalSpecs()).toBe('Technical specs must not exceed 2000 characters');
    });

    it('should return undefined for valid technical specs', () => {
      form.technical_specs = 'BOP: Enabled, Tyre Wear: Medium';
      const { validateTechnicalSpecs } = useSeasonValidation(form);

      expect(validateTechnicalSpecs()).toBeUndefined();
    });

    it('should return undefined for technical specs exactly 2000 characters', () => {
      form.technical_specs = 'A'.repeat(2000);
      const { validateTechnicalSpecs } = useSeasonValidation(form);

      expect(validateTechnicalSpecs()).toBeUndefined();
    });
  });

  describe('validateLogo', () => {
    it('should return undefined if logo is null', () => {
      form.logo = null;
      const { validateLogo } = useSeasonValidation(form);

      expect(validateLogo()).toBeUndefined();
    });

    it('should return error for invalid file type', () => {
      form.logo = new File(['content'], 'logo.gif', { type: 'image/gif' });
      const { validateLogo } = useSeasonValidation(form);

      expect(validateLogo()).toBe('Logo must be PNG or JPG format');
    });

    it('should return error if file size exceeds 2MB', () => {
      const largeFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      form.logo = largeFile;
      const { validateLogo } = useSeasonValidation(form);

      expect(validateLogo()).toBe('Logo must be less than 2MB');
    });

    it('should return undefined for valid PNG file', () => {
      form.logo = new File(['content'], 'logo.png', { type: 'image/png' });
      const { validateLogo } = useSeasonValidation(form);

      expect(validateLogo()).toBeUndefined();
    });

    it('should return undefined for valid JPG file', () => {
      form.logo = new File(['content'], 'logo.jpg', { type: 'image/jpeg' });
      const { validateLogo } = useSeasonValidation(form);

      expect(validateLogo()).toBeUndefined();
    });

    it('should return undefined for valid JPEG file with jpg extension', () => {
      form.logo = new File(['content'], 'logo.jpg', { type: 'image/jpg' });
      const { validateLogo } = useSeasonValidation(form);

      expect(validateLogo()).toBeUndefined();
    });

    it('should return undefined for file exactly 2MB', () => {
      const exactSizeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      form.logo = exactSizeFile;
      const { validateLogo } = useSeasonValidation(form);

      expect(validateLogo()).toBeUndefined();
    });
  });

  describe('validateBanner', () => {
    it('should return undefined if banner is null', () => {
      form.banner = null;
      const { validateBanner } = useSeasonValidation(form);

      expect(validateBanner()).toBeUndefined();
    });

    it('should return error for invalid file type', () => {
      form.banner = new File(['content'], 'banner.gif', { type: 'image/gif' });
      const { validateBanner } = useSeasonValidation(form);

      expect(validateBanner()).toBe('Banner must be PNG or JPG format');
    });

    it('should return error if file size exceeds 5MB', () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'banner.png', {
        type: 'image/png',
      });
      form.banner = largeFile;
      const { validateBanner } = useSeasonValidation(form);

      expect(validateBanner()).toBe('Banner must be less than 5MB');
    });

    it('should return undefined for valid PNG file', () => {
      form.banner = new File(['content'], 'banner.png', { type: 'image/png' });
      const { validateBanner } = useSeasonValidation(form);

      expect(validateBanner()).toBeUndefined();
    });

    it('should return undefined for valid JPG file', () => {
      form.banner = new File(['content'], 'banner.jpg', { type: 'image/jpeg' });
      const { validateBanner } = useSeasonValidation(form);

      expect(validateBanner()).toBeUndefined();
    });

    it('should return undefined for valid JPEG file with jpg extension', () => {
      form.banner = new File(['content'], 'banner.jpg', { type: 'image/jpg' });
      const { validateBanner } = useSeasonValidation(form);

      expect(validateBanner()).toBeUndefined();
    });

    it('should return undefined for file exactly 5MB', () => {
      const exactSizeFile = new File([new ArrayBuffer(5 * 1024 * 1024)], 'banner.png', {
        type: 'image/png',
      });
      form.banner = exactSizeFile;
      const { validateBanner } = useSeasonValidation(form);

      expect(validateBanner()).toBeUndefined();
    });
  });

  describe('validateAll', () => {
    it('should return false if name is invalid', () => {
      form.name = ''; // Invalid
      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return false if car class is invalid', () => {
      form.name = 'Season 1';
      form.car_class = 'A'.repeat(151); // Invalid
      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return false if description is invalid', () => {
      form.name = 'Season 1';
      form.description = 'A'.repeat(2001); // Invalid
      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return false if technical specs is invalid', () => {
      form.name = 'Season 1';
      form.technical_specs = 'A'.repeat(2001); // Invalid
      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return false if logo is invalid', () => {
      form.name = 'Season 1';
      form.logo = new File(['content'], 'logo.gif', { type: 'image/gif' }); // Invalid
      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return false if banner is invalid', () => {
      form.name = 'Season 1';
      form.banner = new File(['content'], 'banner.gif', { type: 'image/gif' }); // Invalid
      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(false);
    });

    it('should return true if all required fields are valid', () => {
      form.name = 'Season 1';
      form.car_class = 'GT3';
      form.description = 'A great season';
      form.technical_specs = 'BOP enabled';
      form.logo = new File(['content'], 'logo.png', { type: 'image/png' });
      form.banner = new File(['content'], 'banner.png', { type: 'image/png' });

      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(true);
    });

    it('should return true if only required field (name) is valid', () => {
      form.name = 'Season 1';

      const { validateAll } = useSeasonValidation(form);

      expect(validateAll()).toBe(true);
    });

    it('should populate errors object with validation results', () => {
      form.name = '';
      form.car_class = 'A'.repeat(151);
      form.description = 'A'.repeat(2001);
      form.technical_specs = 'A'.repeat(2001);
      form.logo = new File(['content'], 'logo.gif', { type: 'image/gif' });
      form.banner = new File(['content'], 'banner.gif', { type: 'image/gif' });

      const { validateAll, errors } = useSeasonValidation(form);

      validateAll();

      expect(errors.name).toBe('Season name is required');
      expect(errors.car_class).toBe('Car class must not exceed 150 characters');
      expect(errors.description).toBe('Description must not exceed 2000 characters');
      expect(errors.technical_specs).toBe('Technical specs must not exceed 2000 characters');
      expect(errors.logo).toBe('Logo must be PNG or JPG format');
      expect(errors.banner).toBe('Banner must be PNG or JPG format');
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      form.name = '';
      form.car_class = 'A'.repeat(151);

      const { validateAll, clearErrors, errors } = useSeasonValidation(form);

      validateAll();
      expect(errors.name).toBeDefined();
      expect(errors.car_class).toBeDefined();

      clearErrors();
      expect(errors.name).toBeUndefined();
      expect(errors.car_class).toBeUndefined();
      expect(errors.description).toBeUndefined();
      expect(errors.technical_specs).toBeUndefined();
      expect(errors.logo).toBeUndefined();
      expect(errors.banner).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('should clear a specific error', () => {
      form.name = '';
      form.car_class = 'A'.repeat(151);

      const { validateAll, clearError, errors } = useSeasonValidation(form);

      validateAll();
      expect(errors.name).toBeDefined();
      expect(errors.car_class).toBeDefined();

      clearError('name');
      expect(errors.name).toBeUndefined();
      expect(errors.car_class).toBeDefined();
    });

    it('should clear car_class error specifically', () => {
      form.name = '';
      form.car_class = 'A'.repeat(151);

      const { validateAll, clearError, errors } = useSeasonValidation(form);

      validateAll();
      expect(errors.name).toBeDefined();
      expect(errors.car_class).toBeDefined();

      clearError('car_class');
      expect(errors.car_class).toBeUndefined();
      expect(errors.name).toBeDefined();
    });
  });

  describe('computed properties', () => {
    it('isValid should return true when no errors', () => {
      form.name = 'Season 1';

      const { isValid } = useSeasonValidation(form);

      expect(isValid.value).toBe(true);
    });

    it('isValid should return false when there are errors', () => {
      form.name = '';
      const { validateName, errors, isValid } = useSeasonValidation(form);

      errors.name = validateName();

      expect(isValid.value).toBe(false);
    });

    it('hasErrors should return true when there are errors', () => {
      form.name = '';
      const { validateName, errors, hasErrors } = useSeasonValidation(form);

      errors.name = validateName();

      expect(hasErrors.value).toBe(true);
    });

    it('hasErrors should return false when no errors', () => {
      form.name = 'Season 1';

      const { hasErrors } = useSeasonValidation(form);

      expect(hasErrors.value).toBe(false);
    });

    it('isValid should react to changes in errors', () => {
      form.name = 'Season 1';

      const { errors, isValid } = useSeasonValidation(form);

      expect(isValid.value).toBe(true);

      errors.name = 'Season name is required';

      expect(isValid.value).toBe(false);
    });

    it('hasErrors should react to changes in errors', () => {
      form.name = 'Season 1';

      const { errors, hasErrors } = useSeasonValidation(form);

      expect(hasErrors.value).toBe(false);

      errors.description = 'Description is too long';

      expect(hasErrors.value).toBe(true);
    });
  });
});
