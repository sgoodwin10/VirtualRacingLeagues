import { computed, type Ref } from 'vue';

export interface PasswordStrength {
  score: number; // 0-4 (weak to strong)
  label: string;
  color: string;
}

export interface PasswordValidationResult {
  passwordStrength: Ref<PasswordStrength>;
  passwordErrors: Ref<string[]>;
  isPasswordValid: Ref<boolean>;
}

/**
 * Composable for password strength validation
 * @param password - Reactive password ref
 * @returns Object with password strength, errors, and validity
 */
export function usePasswordValidation(password: Ref<string>): PasswordValidationResult {
  const passwordErrors = computed<string[]>(() => {
    const errors: string[] = [];
    const pwd = password.value;

    if (!pwd) {
      return errors;
    }

    if (pwd.length < 8) {
      errors.push('Must be at least 8 characters');
    }

    if (!/[a-z]/.test(pwd)) {
      errors.push('Must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push('Must contain at least one uppercase letter');
    }

    if (!/\d/.test(pwd)) {
      errors.push('Must contain at least one number');
    }

    return errors;
  });

  const isPasswordValid = computed<boolean>(() => {
    return password.value.length > 0 && passwordErrors.value.length === 0;
  });

  const passwordStrength = computed<PasswordStrength>(() => {
    const pwd = password.value;

    if (!pwd) {
      return { score: 0, label: '', color: '' };
    }

    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[^a-zA-Z0-9]/.test(pwd),
      longLength: pwd.length >= 12,
    };

    // Calculate score based on criteria met
    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;

    // Bonus points for special characters and longer length
    if (checks.special) score++;
    if (checks.longLength) score++;

    // Normalize score to 0-4 range
    const normalizedScore = Math.min(4, Math.floor((score / 6) * 4)) as 0 | 1 | 2 | 3 | 4;

    // Map score to label and color
    const strengthMap: Record<0 | 1 | 2 | 3 | 4, { label: string; color: string }> = {
      0: { label: 'Very Weak', color: 'var(--color-dnf)' },
      1: { label: 'Weak', color: 'var(--color-dnf)' },
      2: { label: 'Fair', color: '#f59e0b' }, // amber-500
      3: { label: 'Good', color: 'var(--color-podium)' },
      4: { label: 'Strong', color: 'var(--color-pole)' },
    };

    const result = strengthMap[normalizedScore];
    return {
      score: normalizedScore,
      label: result.label,
      color: result.color,
    };
  });

  return {
    passwordStrength,
    passwordErrors,
    isPasswordValid,
  };
}
