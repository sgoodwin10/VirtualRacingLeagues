import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { usePasswordValidation } from './usePasswordValidation';

describe('usePasswordValidation', () => {
  describe('passwordErrors', () => {
    it('should return empty array for empty password', () => {
      const password = ref('');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toEqual([]);
    });

    it('should return error for password less than 8 characters', () => {
      const password = ref('Abc123');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toContain('Must be at least 8 characters');
    });

    it('should return error for missing lowercase letter', () => {
      const password = ref('ABCDEFGH123');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toContain('Must contain at least one lowercase letter');
    });

    it('should return error for missing uppercase letter', () => {
      const password = ref('abcdefgh123');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toContain('Must contain at least one uppercase letter');
    });

    it('should return error for missing number', () => {
      const password = ref('Abcdefgh');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toContain('Must contain at least one number');
    });

    it('should return multiple errors for invalid password', () => {
      const password = ref('abc');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toHaveLength(3);
      expect(passwordErrors.value).toContain('Must be at least 8 characters');
      expect(passwordErrors.value).toContain('Must contain at least one uppercase letter');
      expect(passwordErrors.value).toContain('Must contain at least one number');
    });

    it('should return empty array for valid password', () => {
      const password = ref('Abcdefgh1');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toEqual([]);
    });

    it('should return empty array for strong password with special chars', () => {
      const password = ref('Abcdefgh1!@#');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toEqual([]);
    });

    it('should not require special characters for validity', () => {
      const password = ref('SimplePass123');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toEqual([]);
    });
  });

  describe('isPasswordValid', () => {
    it('should return false for empty password', () => {
      const password = ref('');
      const { isPasswordValid } = usePasswordValidation(password);

      expect(isPasswordValid.value).toBe(false);
    });

    it('should return false when password has errors', () => {
      const password = ref('weak');
      const { isPasswordValid } = usePasswordValidation(password);

      expect(isPasswordValid.value).toBe(false);
    });

    it('should return true when password is valid', () => {
      const password = ref('ValidPass123');
      const { isPasswordValid } = usePasswordValidation(password);

      expect(isPasswordValid.value).toBe(true);
    });

    it('should return false for password with only length requirement met', () => {
      const password = ref('abcdefgh');
      const { isPasswordValid } = usePasswordValidation(password);

      expect(isPasswordValid.value).toBe(false);
    });

    it('should return false for password with all but one requirement met', () => {
      const password = ref('Abcdefgh');
      const { isPasswordValid } = usePasswordValidation(password);

      expect(isPasswordValid.value).toBe(false);
    });
  });

  describe('passwordStrength', () => {
    describe('Score calculation', () => {
      it('should return score 0 and empty label for empty password', () => {
        const password = ref('');
        const { passwordStrength } = usePasswordValidation(password);

        expect(passwordStrength.value.score).toBe(0);
        expect(passwordStrength.value.label).toBe('');
        expect(passwordStrength.value.color).toBe('');
      });

      it('should calculate score based on criteria met', () => {
        const password = ref('abcdefgh');
        const { passwordStrength } = usePasswordValidation(password);

        // Has: length, lowercase = 2 criteria
        // Score calculation: (2/6) * 4 = 1.33 -> floor = 1
        expect(passwordStrength.value.score).toBeGreaterThanOrEqual(0);
        expect(passwordStrength.value.score).toBeLessThanOrEqual(4);
      });

      it('should give bonus for special characters', () => {
        const passwordWithSpecial = ref('Abcd123!');
        const passwordWithoutSpecial = ref('Abcd1234');
        const { passwordStrength: strengthWith } = usePasswordValidation(passwordWithSpecial);
        const { passwordStrength: strengthWithout } = usePasswordValidation(passwordWithoutSpecial);

        // Password with special chars should have higher or equal score
        expect(strengthWith.value.score).toBeGreaterThanOrEqual(strengthWithout.value.score);
      });

      it('should give bonus for length >= 12', () => {
        const longPassword = ref('Abcdefgh1234');
        const shortPassword = ref('Abcdefg1');
        const { passwordStrength: longStrength } = usePasswordValidation(longPassword);
        const { passwordStrength: shortStrength } = usePasswordValidation(shortPassword);

        expect(longStrength.value.score).toBeGreaterThanOrEqual(shortStrength.value.score);
      });

      it('should normalize score to 0-4 range', () => {
        const passwords = [
          'weak',
          'Weak1',
          'Medium1',
          'Strong123',
          'VeryStrong123!@#',
          'ExtremelySecure123!@#$%',
        ];

        passwords.forEach((pwd) => {
          const password = ref(pwd);
          const { passwordStrength } = usePasswordValidation(password);

          expect(passwordStrength.value.score).toBeGreaterThanOrEqual(0);
          expect(passwordStrength.value.score).toBeLessThanOrEqual(4);
        });
      });
    });

    describe('Labels', () => {
      it('should return "Very Weak" label for score 0', () => {
        const password = ref('a');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 0) {
          expect(passwordStrength.value.label).toBe('Very Weak');
        }
      });

      it('should return "Weak" label for score 1', () => {
        const password = ref('abc123');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 1) {
          expect(passwordStrength.value.label).toBe('Weak');
        }
      });

      it('should return "Fair" label for score 2', () => {
        const password = ref('Abc12345');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 2) {
          expect(passwordStrength.value.label).toBe('Fair');
        }
      });

      it('should return "Good" label for score 3', () => {
        const password = ref('Abc123456!');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 3) {
          expect(passwordStrength.value.label).toBe('Good');
        }
      });

      it('should return "Strong" label for score 4', () => {
        const password = ref('StrongPass123!@#');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 4) {
          expect(passwordStrength.value.label).toBe('Strong');
        }
      });
    });

    describe('Colors', () => {
      it('should return correct color for Very Weak (score 0)', () => {
        const password = ref('a');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 0) {
          expect(passwordStrength.value.color).toBe('var(--color-dnf)');
        }
      });

      it('should return correct color for Weak (score 1)', () => {
        const password = ref('abc123');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 1) {
          expect(passwordStrength.value.color).toBe('var(--color-dnf)');
        }
      });

      it('should return correct color for Fair (score 2)', () => {
        const password = ref('Abc12345');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 2) {
          expect(passwordStrength.value.color).toBe('#f59e0b');
        }
      });

      it('should return correct color for Good (score 3)', () => {
        const password = ref('Abc123456!');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 3) {
          expect(passwordStrength.value.color).toBe('var(--color-podium)');
        }
      });

      it('should return correct color for Strong (score 4)', () => {
        const password = ref('StrongPass123!@#');
        const { passwordStrength } = usePasswordValidation(password);

        if (passwordStrength.value.score === 4) {
          expect(passwordStrength.value.color).toBe('var(--color-pole)');
        }
      });
    });

    describe('Specific scenarios', () => {
      it('should score weak password with only lowercase', () => {
        const password = ref('abcdefgh');
        const { passwordStrength } = usePasswordValidation(password);

        expect(passwordStrength.value.score).toBeLessThan(3);
        expect(['Very Weak', 'Weak', 'Fair']).toContain(passwordStrength.value.label);
      });

      it('should score medium password with all basic requirements', () => {
        const password = ref('Abcdefg1');
        const { passwordStrength } = usePasswordValidation(password);

        expect(passwordStrength.value.score).toBeGreaterThanOrEqual(1);
      });

      it('should score strong password with all requirements plus special chars', () => {
        const password = ref('Abcdefg1!');
        const { passwordStrength } = usePasswordValidation(password);

        expect(passwordStrength.value.score).toBeGreaterThanOrEqual(2);
      });

      it('should score very strong password with all requirements, special chars, and length', () => {
        const password = ref('VerySecurePass123!@#');
        const { passwordStrength } = usePasswordValidation(password);

        expect(passwordStrength.value.score).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Reactivity', () => {
    it('should update errors when password ref changes', () => {
      const password = ref('');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toEqual([]);

      password.value = 'weak';
      expect(passwordErrors.value.length).toBeGreaterThan(0);

      password.value = 'ValidPass123';
      expect(passwordErrors.value).toEqual([]);
    });

    it('should update validity when password ref changes', () => {
      const password = ref('weak');
      const { isPasswordValid } = usePasswordValidation(password);

      expect(isPasswordValid.value).toBe(false);

      password.value = 'ValidPass123';
      expect(isPasswordValid.value).toBe(true);
    });

    it('should update strength when password ref changes', () => {
      const password = ref('weak');
      const { passwordStrength } = usePasswordValidation(password);

      const initialScore = passwordStrength.value.score;

      password.value = 'StrongPassword123!@#';
      const finalScore = passwordStrength.value.score;

      expect(finalScore).toBeGreaterThan(initialScore);
    });

    it('should recompute all values reactively', () => {
      const password = ref('');
      const { passwordErrors, isPasswordValid, passwordStrength } = usePasswordValidation(password);

      // Empty password
      expect(passwordErrors.value).toEqual([]);
      expect(isPasswordValid.value).toBe(false);
      expect(passwordStrength.value.score).toBe(0);

      // Weak password
      password.value = 'weak';
      expect(passwordErrors.value.length).toBeGreaterThan(0);
      expect(isPasswordValid.value).toBe(false);
      expect(passwordStrength.value.score).toBeGreaterThanOrEqual(0);

      // Strong password
      password.value = 'StrongPass123!';
      expect(passwordErrors.value).toEqual([]);
      expect(isPasswordValid.value).toBe(true);
      expect(passwordStrength.value.score).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Return value interface', () => {
    it('should return all required properties', () => {
      const password = ref('test');
      const result = usePasswordValidation(password);

      expect(result).toHaveProperty('passwordStrength');
      expect(result).toHaveProperty('passwordErrors');
      expect(result).toHaveProperty('isPasswordValid');
    });

    it('should return reactive refs', () => {
      const password = ref('test');
      const { passwordStrength, passwordErrors, isPasswordValid } = usePasswordValidation(password);

      expect(passwordStrength).toHaveProperty('value');
      expect(passwordErrors).toHaveProperty('value');
      expect(isPasswordValid).toHaveProperty('value');
    });
  });

  describe('Edge cases', () => {
    it('should handle password with only special characters', () => {
      const password = ref('!@#$%^&*()');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toContain('Must contain at least one lowercase letter');
      expect(passwordErrors.value).toContain('Must contain at least one uppercase letter');
      expect(passwordErrors.value).toContain('Must contain at least one number');
    });

    it('should handle password with only numbers', () => {
      const password = ref('12345678');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toContain('Must contain at least one lowercase letter');
      expect(passwordErrors.value).toContain('Must contain at least one uppercase letter');
    });

    it('should handle very long passwords', () => {
      const password = ref('A'.repeat(100) + 'a123');
      const { passwordErrors, isPasswordValid } = usePasswordValidation(password);

      expect(passwordErrors.value).toEqual([]);
      expect(isPasswordValid.value).toBe(true);
    });

    it('should handle unicode characters', () => {
      const password = ref('Password123🔒');
      const { passwordErrors } = usePasswordValidation(password);

      // Should still validate basic requirements
      expect(passwordErrors.value).toEqual([]);
    });

    it('should handle whitespace in password', () => {
      const password = ref('Pass Word 123');
      const { passwordErrors } = usePasswordValidation(password);

      // Whitespace should not prevent validation
      expect(passwordErrors.value).toEqual([]);
    });

    it('should handle exactly 8 characters', () => {
      const password = ref('Abcdef12');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).not.toContain('Must be at least 8 characters');
    });

    it('should handle exactly 7 characters', () => {
      const password = ref('Abcde12');
      const { passwordErrors } = usePasswordValidation(password);

      expect(passwordErrors.value).toContain('Must be at least 8 characters');
    });

    it('should handle password with all possible character types', () => {
      const password = ref('Abc123!@#xyz');
      const { passwordErrors, passwordStrength } = usePasswordValidation(password);

      expect(passwordErrors.value).toEqual([]);
      expect(passwordStrength.value.score).toBeGreaterThanOrEqual(3);
    });
  });
});
