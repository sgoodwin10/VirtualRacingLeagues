import { describe, it, expect } from 'vitest';
import { useNameHelpers, type NamedEntity } from './useNameHelpers';

describe('useNameHelpers', () => {
  const {
    getFullName,
    getFirstName,
    getLastName,
    getUserInitials,
    getDisplayName,
    hasCompleteName,
  } = useNameHelpers();

  describe('getFullName', () => {
    it('should return name field if present', () => {
      const entity: NamedEntity = { name: 'John Doe' };
      expect(getFullName(entity)).toBe('John Doe');
    });

    it('should combine first_name and last_name if name not present', () => {
      const entity: NamedEntity = { first_name: 'John', last_name: 'Doe' };
      expect(getFullName(entity)).toBe('John Doe');
    });

    it('should return first_name only if last_name missing', () => {
      const entity: NamedEntity = { first_name: 'John' };
      expect(getFullName(entity)).toBe('John');
    });

    it('should return last_name only if first_name missing', () => {
      const entity: NamedEntity = { last_name: 'Doe' };
      expect(getFullName(entity)).toBe('Doe');
    });

    it('should return Unknown if no name fields present', () => {
      const entity: NamedEntity = {};
      expect(getFullName(entity)).toBe('Unknown');
    });

    it('should trim whitespace from name field', () => {
      const entity: NamedEntity = { name: '  John Doe  ' };
      expect(getFullName(entity)).toBe('John Doe');
    });

    it('should trim whitespace from first and last names', () => {
      const entity: NamedEntity = { first_name: '  John  ', last_name: '  Doe  ' };
      expect(getFullName(entity)).toBe('John Doe');
    });

    it('should prefer name field over first_name and last_name', () => {
      const entity: NamedEntity = { name: 'Jane Smith', first_name: 'John', last_name: 'Doe' };
      expect(getFullName(entity)).toBe('Jane Smith');
    });

    it('should return Unknown if name is empty string', () => {
      const entity: NamedEntity = { name: '   ' };
      expect(getFullName(entity)).toBe('Unknown');
    });
  });

  describe('getFirstName', () => {
    it('should return first_name if present', () => {
      const entity: NamedEntity = { first_name: 'John' };
      expect(getFirstName(entity)).toBe('John');
    });

    it('should extract first name from name field', () => {
      const entity: NamedEntity = { name: 'John Doe' };
      expect(getFirstName(entity)).toBe('John');
    });

    it('should prefer first_name over name field', () => {
      const entity: NamedEntity = { first_name: 'Jane', name: 'John Doe' };
      expect(getFirstName(entity)).toBe('Jane');
    });

    it('should return empty string if no name present', () => {
      const entity: NamedEntity = {};
      expect(getFirstName(entity)).toBe('');
    });

    it('should trim whitespace', () => {
      const entity: NamedEntity = { first_name: '  John  ' };
      expect(getFirstName(entity)).toBe('John');
    });

    it('should handle single name', () => {
      const entity: NamedEntity = { name: 'John' };
      expect(getFirstName(entity)).toBe('John');
    });
  });

  describe('getLastName', () => {
    it('should return last_name if present', () => {
      const entity: NamedEntity = { last_name: 'Doe' };
      expect(getLastName(entity)).toBe('Doe');
    });

    it('should extract last name from name field', () => {
      const entity: NamedEntity = { name: 'John Doe' };
      expect(getLastName(entity)).toBe('Doe');
    });

    it('should extract multi-word last name', () => {
      const entity: NamedEntity = { name: 'John van der Berg' };
      expect(getLastName(entity)).toBe('van der Berg');
    });

    it('should prefer last_name over name field', () => {
      const entity: NamedEntity = { last_name: 'Smith', name: 'John Doe' };
      expect(getLastName(entity)).toBe('Smith');
    });

    it('should return empty string if no name present', () => {
      const entity: NamedEntity = {};
      expect(getLastName(entity)).toBe('');
    });

    it('should trim whitespace', () => {
      const entity: NamedEntity = { last_name: '  Doe  ' };
      expect(getLastName(entity)).toBe('Doe');
    });

    it('should return empty string for single name', () => {
      const entity: NamedEntity = { name: 'John' };
      expect(getLastName(entity)).toBe('');
    });
  });

  describe('getUserInitials', () => {
    it('should return initials from first and last name', () => {
      const entity: NamedEntity = { first_name: 'John', last_name: 'Doe' };
      expect(getUserInitials(entity)).toBe('JD');
    });

    it('should return initials from name field', () => {
      const entity: NamedEntity = { name: 'John Doe' };
      expect(getUserInitials(entity)).toBe('JD');
    });

    it('should return first letter only for single name', () => {
      const entity: NamedEntity = { first_name: 'John' };
      expect(getUserInitials(entity)).toBe('J');
    });

    it('should return first two initials for multi-word first name', () => {
      const entity: NamedEntity = { first_name: 'Mary Jane' };
      expect(getUserInitials(entity)).toBe('MJ');
    });

    it('should return U for empty entity', () => {
      const entity: NamedEntity = {};
      expect(getUserInitials(entity)).toBe('U');
    });

    it('should return uppercase initials', () => {
      const entity: NamedEntity = { first_name: 'john', last_name: 'doe' };
      expect(getUserInitials(entity)).toBe('JD');
    });

    it('should handle last name only', () => {
      const entity: NamedEntity = { last_name: 'Doe' };
      expect(getUserInitials(entity)).toBe('D');
    });
  });

  describe('getDisplayName', () => {
    it('should return full name if present', () => {
      const entity: NamedEntity = { first_name: 'John', last_name: 'Doe' };
      expect(getDisplayName(entity)).toBe('John Doe');
    });

    it('should return email if name is Unknown', () => {
      const entity: NamedEntity = {};
      expect(getDisplayName(entity, 'john@example.com')).toBe('john@example.com');
    });

    it('should return Unknown User if no name and no email', () => {
      const entity: NamedEntity = {};
      expect(getDisplayName(entity)).toBe('Unknown User');
    });

    it('should prefer name over email', () => {
      const entity: NamedEntity = { first_name: 'John', last_name: 'Doe' };
      expect(getDisplayName(entity, 'jane@example.com')).toBe('John Doe');
    });
  });

  describe('hasCompleteName', () => {
    it('should return true if both first_name and last_name present', () => {
      const entity: NamedEntity = { first_name: 'John', last_name: 'Doe' };
      expect(hasCompleteName(entity)).toBe(true);
    });

    it('should return true if name has space', () => {
      const entity: NamedEntity = { name: 'John Doe' };
      expect(hasCompleteName(entity)).toBe(true);
    });

    it('should return false if only first_name', () => {
      const entity: NamedEntity = { first_name: 'John' };
      expect(hasCompleteName(entity)).toBe(false);
    });

    it('should return false if only last_name', () => {
      const entity: NamedEntity = { last_name: 'Doe' };
      expect(hasCompleteName(entity)).toBe(false);
    });

    it('should return false if name is single word', () => {
      const entity: NamedEntity = { name: 'John' };
      expect(hasCompleteName(entity)).toBe(false);
    });

    it('should return false for empty entity', () => {
      const entity: NamedEntity = {};
      expect(hasCompleteName(entity)).toBe(false);
    });
  });
});
