import { describe, it, expect } from 'vitest';
import { useCSVParser } from '../useCSVParser';

describe('useCSVParser', () => {
  describe('processDriverCSV', () => {
    it('should return empty CSV data unchanged', () => {
      const { processDriverCSV } = useCSVParser();
      const result = processDriverCSV('');

      expect(result).toBe('');
    });

    it('should return CSV without required headers unchanged', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = 'Name,Email\nJohn,john@example.com';

      const result = processDriverCSV(csvData);

      expect(result).toBe(csvData);
    });

    it('should use Discord ID as nickname when nickname is empty', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = 'Nickname,DiscordID,PSN_ID\n,john#1234,john_psn\nJane,jane#5678,jane_psn';

      const result = processDriverCSV(csvData);

      const lines = result.split('\n');
      expect(lines[1]).toBe('john#1234,john#1234,john_psn');
      expect(lines[2]).toBe('Jane,jane#5678,jane_psn');
    });

    it('should handle case-insensitive header names', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = 'name,discord_id,PSN_ID\n,john#1234,john_psn';

      const result = processDriverCSV(csvData);

      const lines = result.split('\n');
      expect(lines[1]).toBe('john#1234,john#1234,john_psn');
    });

    it('should skip empty lines', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = 'Nickname,DiscordID,PSN_ID\n,john#1234,john_psn\n\nJane,jane#5678,jane_psn';

      const result = processDriverCSV(csvData);

      const lines = result.split('\n');
      expect(lines).toHaveLength(3); // Header + 2 data rows (empty line skipped)
    });

    it('should not change nickname when both nickname and Discord ID are present', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = 'Nickname,DiscordID,PSN_ID\nJohn,john#1234,john_psn';

      const result = processDriverCSV(csvData);

      const lines = result.split('\n');
      expect(lines[1]).toBe('John,john#1234,john_psn');
    });

    it('should trim whitespace from headers and values', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = ' Nickname , DiscordID , PSN_ID \n , john#1234 , john_psn ';

      const result = processDriverCSV(csvData);

      const lines = result.split('\n');
      expect(lines[1]).toBe('john#1234,john#1234,john_psn');
    });

    it('should handle CSV with only headers', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = 'Nickname,DiscordID,PSN_ID';

      const result = processDriverCSV(csvData);

      expect(result).toBe(csvData);
    });

    it('should not modify rows where both nickname and Discord ID are empty', () => {
      const { processDriverCSV } = useCSVParser();
      const csvData = 'Nickname,DiscordID,PSN_ID\n,,john_psn';

      const result = processDriverCSV(csvData);

      const lines = result.split('\n');
      expect(lines[1]).toBe(',,john_psn');
    });
  });
});
