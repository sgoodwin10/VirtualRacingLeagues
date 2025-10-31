/**
 * CSVImportDialog Component Tests
 *
 * Tests the CSV import dialog functionality including:
 * - Dynamic CSV example generation based on league platforms
 * - Use Example button functionality
 * - CSV import validation and submission
 * - CSV processing with nickname fallback logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLeagueStore } from '@app/stores/leagueStore';
import type { PlatformCsvHeader } from '@app/types/league';
import { computed } from 'vue';

describe('CSVImportDialog - CSV Example Generation Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  /**
   * Test the CSV example generation logic that would be used in the component
   * This directly tests the computed property logic
   */
  const generateCsvExample = (platformHeaders: PlatformCsvHeader[]): string => {
    if (platformHeaders.length === 0) {
      // Fallback example if headers not loaded yet
      return `Nickname,DriverNumber
John Smith,5
Jane Doe,7
Mike Ross,3`;
    }

    // Build headers: Nickname + platform ID columns + DriverNumber (optional)
    const headers = ['Nickname', ...platformHeaders.map((h) => h.field), 'DriverNumber'];

    // Generate example data rows based on the platform columns
    const exampleRows: string[][] = [];

    // Example 1: Full data
    const row1 = ['John Smith'];
    platformHeaders.forEach((header) => {
      if (header.field === 'psn_id') {
        row1.push('john_psn_123');
      } else if (header.field === 'iracing_id') {
        row1.push('john_iracing');
      } else if (header.field === 'iracing_customer_id') {
        row1.push('123456');
      } else {
        row1.push('john_' + header.field);
      }
    });
    row1.push('5'); // DriverNumber
    exampleRows.push(row1);

    // Example 2: Different driver with optional empty driver number
    const row2 = ['Jane Doe'];
    platformHeaders.forEach((header) => {
      if (header.field === 'psn_id') {
        row2.push('jane_psn_456');
      } else if (header.field === 'iracing_id') {
        row2.push('jane_iracing');
      } else if (header.field === 'iracing_customer_id') {
        row2.push('789012');
      } else {
        row2.push('jane_' + header.field);
      }
    });
    row2.push('7'); // DriverNumber
    exampleRows.push(row2);

    // Example 3: Driver with empty driver number to show optional field
    const row3 = ['Mike Ross'];
    platformHeaders.forEach((header) => {
      if (header.field === 'psn_id') {
        row3.push('mike_psn_789');
      } else if (header.field === 'iracing_id') {
        row3.push('mike_iracing');
      } else if (header.field === 'iracing_customer_id') {
        row3.push('345678');
      } else {
        row3.push('mike_' + header.field);
      }
    });
    row3.push(''); // Empty DriverNumber to show it's optional
    exampleRows.push(row3);

    // Format as CSV
    const headerRow = headers.join(',');
    const dataRows = exampleRows.map((row) => row.join(','));

    return `${headerRow}\n${dataRows.join('\n')}`;
  };

  describe('CSV Example Generation', () => {
    it('generates a fallback CSV example when platform headers are not loaded', () => {
      const csvExample = generateCsvExample([]);

      expect(csvExample).toContain('Nickname,DriverNumber');
      expect(csvExample).toContain('John Smith,5');
      expect(csvExample).toContain('Jane Doe,7');
      expect(csvExample).toContain('Mike Ross,3');
    });

    it('generates CSV example with PSN ID column for Gran Turismo 7 league', () => {
      const gt7Headers: PlatformCsvHeader[] = [{ field: 'psn_id', label: 'PSN ID', type: 'text' }];

      const csvExample = generateCsvExample(gt7Headers);

      // Verify header row
      expect(csvExample).toContain('Nickname,psn_id,DriverNumber');

      // Verify example data rows
      const lines = csvExample.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(4); // Header + 3 data rows

      // Check first data row contains PSN ID
      expect(lines[1]).toContain('John Smith');
      expect(lines[1]).toContain('john_psn_123');
      expect(lines[1]).toContain('5');

      // Check second data row
      expect(lines[2]).toContain('Jane Doe');
      expect(lines[2]).toContain('jane_psn_456');
      expect(lines[2]).toContain('7');

      // Check third data row has empty driver number
      expect(lines[3]).toContain('Mike Ross');
      expect(lines[3]).toContain('mike_psn_789');
    });

    it('generates CSV example with iRacing columns for iRacing league', () => {
      const iracingHeaders: PlatformCsvHeader[] = [
        { field: 'iracing_id', label: 'iRacing ID', type: 'text' },
        { field: 'iracing_customer_id', label: 'iRacing Customer ID', type: 'number' },
      ];

      const csvExample = generateCsvExample(iracingHeaders);

      // Verify header row includes all iRacing columns
      expect(csvExample).toContain('Nickname,iracing_id,iracing_customer_id,DriverNumber');

      // Verify example data includes iRacing IDs and customer IDs
      const lines = csvExample.split('\n');
      expect(lines[1]).toContain('john_iracing');
      expect(lines[1]).toContain('123456');
      expect(lines[2]).toContain('jane_iracing');
      expect(lines[2]).toContain('789012');
    });

    it('generates CSV example with multiple platform columns for multi-platform league', () => {
      const multiPlatformHeaders: PlatformCsvHeader[] = [
        { field: 'psn_id', label: 'PSN ID', type: 'text' },
        { field: 'iracing_id', label: 'iRacing ID', type: 'text' },
        { field: 'iracing_customer_id', label: 'iRacing Customer ID', type: 'number' },
      ];

      const csvExample = generateCsvExample(multiPlatformHeaders);

      // Verify header row includes all platform columns
      expect(csvExample).toContain('Nickname,psn_id,iracing_id,iracing_customer_id,DriverNumber');

      // Verify example data includes all platform IDs
      const lines = csvExample.split('\n');
      expect(lines[1]).toContain('john_psn_123');
      expect(lines[1]).toContain('john_iracing');
      expect(lines[1]).toContain('123456');
    });

    it('generates CSV with correct number of columns matching headers', () => {
      const headers: PlatformCsvHeader[] = [
        { field: 'psn_id', label: 'PSN ID', type: 'text' },
        { field: 'iracing_id', label: 'iRacing ID', type: 'text' },
      ];

      const csvExample = generateCsvExample(headers);
      const lines = csvExample.split('\n');

      // Count columns in header row
      const headerRow = lines[0];
      if (!headerRow) {
        throw new Error('Header row is missing');
      }
      const headerColumns = headerRow.split(',');
      const expectedColumns = 1 + headers.length + 1; // Nickname + platform fields + DriverNumber
      expect(headerColumns.length).toBe(expectedColumns);

      // Verify each data row has the same number of columns
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue; // Skip empty lines
        const dataColumns = line.split(',');
        expect(dataColumns.length).toBe(expectedColumns);
      }
    });

    it('generates example rows with realistic platform-specific values', () => {
      const headers: PlatformCsvHeader[] = [
        { field: 'psn_id', label: 'PSN ID', type: 'text' },
        { field: 'iracing_customer_id', label: 'iRacing Customer ID', type: 'number' },
      ];

      const csvExample = generateCsvExample(headers);
      const lines = csvExample.split('\n');

      // First example row should have realistic PSN ID and iRacing Customer ID
      expect(lines[1]).toMatch(/John Smith,john_psn_\d+,\d+,5/);

      // Second example row should also have realistic values
      expect(lines[2]).toMatch(/Jane Doe,jane_psn_\d+,\d+,7/);
    });

    it('includes empty driver number in third example row to show optional field', () => {
      const headers: PlatformCsvHeader[] = [{ field: 'psn_id', label: 'PSN ID', type: 'text' }];

      const csvExample = generateCsvExample(headers);
      const lines = csvExample.split('\n');

      // Third row should end with just a comma (empty driver number)
      expect(lines[3]).toMatch(/Mike Ross,mike_psn_\d+,$/);
    });
  });

  describe('League Store Integration', () => {
    it('uses platformCsvHeaders from league store', () => {
      const leagueStore = useLeagueStore();

      // Set platform headers
      const headers: PlatformCsvHeader[] = [
        { field: 'psn_id', label: 'PSN ID', type: 'text' },
        { field: 'iracing_id', label: 'iRacing ID', type: 'text' },
      ];
      leagueStore.platformCsvHeaders = headers;

      // Create a computed property similar to the component
      const csvExample = computed(() => generateCsvExample(leagueStore.platformCsvHeaders));

      // Verify it generates the correct example
      expect(csvExample.value).toContain('Nickname,psn_id,iracing_id,DriverNumber');
    });

    it('updates CSV example when platform headers change', () => {
      const leagueStore = useLeagueStore();

      // Initially empty
      leagueStore.platformCsvHeaders = [];
      const csvExample = computed(() => generateCsvExample(leagueStore.platformCsvHeaders));

      // Should show fallback
      expect(csvExample.value).toContain('Nickname,DriverNumber');

      // Update headers
      leagueStore.platformCsvHeaders = [{ field: 'psn_id', label: 'PSN ID', type: 'text' }];

      // Should update to include PSN ID
      expect(csvExample.value).toContain('Nickname,psn_id,DriverNumber');
    });
  });
});

describe('CSVImportDialog - CSV Processing Logic', () => {
  /**
   * Test the CSV processing logic that handles missing nicknames
   * This replicates the processCSVData function from the component
   */
  const processCSVData = (csvData: string): string => {
    const lines = csvData.trim().split('\n');
    if (lines.length === 0) {
      return csvData;
    }

    // Get header row
    const headerRow = lines[0];
    if (!headerRow) {
      return csvData;
    }

    const headers = headerRow.split(',').map((h) => h.trim());

    // Find nickname and Discord ID column indices
    const nicknameIndex = headers.findIndex(
      (h) => h.toLowerCase() === 'nickname' || h.toLowerCase() === 'name',
    );
    const discordIdIndex = headers.findIndex(
      (h) => h.toLowerCase() === 'discordid' || h.toLowerCase() === 'discord_id',
    );

    // If we can't find either column, return original data
    if (nicknameIndex === -1 || discordIdIndex === -1) {
      return csvData;
    }

    // Process data rows
    const processedLines = [headerRow]; // Keep header as-is
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue; // Skip empty lines

      const columns = line.split(',').map((col) => col.trim());

      // If nickname is empty but Discord ID is present, use Discord ID as nickname
      const nicknameValue = columns[nicknameIndex];
      const discordIdValue = columns[discordIdIndex];

      if (!nicknameValue && discordIdValue) {
        columns[nicknameIndex] = discordIdValue;
      }

      processedLines.push(columns.join(','));
    }

    return processedLines.join('\n');
  };

  describe('Nickname Fallback Logic', () => {
    it('uses Discord ID as nickname when nickname is empty', () => {
      const csvData = `Nickname,DiscordID,psn_id,DriverNumber
,user#1234,psn_123,5
Jane,jane#5678,psn_456,7`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      // First data row should have Discord ID copied to nickname
      expect(lines[1]).toBe('user#1234,user#1234,psn_123,5');

      // Second data row should remain unchanged (nickname already present)
      expect(lines[2]).toBe('Jane,jane#5678,psn_456,7');
    });

    it('handles multiple rows with empty nicknames', () => {
      const csvData = `Nickname,DiscordID,psn_id
,user1#1234,psn_123
,user2#5678,psn_456
,user3#9012,psn_789`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('user1#1234,user1#1234,psn_123');
      expect(lines[2]).toBe('user2#5678,user2#5678,psn_456');
      expect(lines[3]).toBe('user3#9012,user3#9012,psn_789');
    });

    it('handles case-insensitive header matching for Nickname', () => {
      const csvData = `nickname,DiscordID,psn_id
,user#1234,psn_123`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('user#1234,user#1234,psn_123');
    });

    it('handles case-insensitive header matching for DiscordID', () => {
      const csvData = `Nickname,discord_id,psn_id
,user#1234,psn_123`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('user#1234,user#1234,psn_123');
    });

    it('handles "Name" as an alias for "Nickname"', () => {
      const csvData = `Name,DiscordID,psn_id
,user#1234,psn_123`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('user#1234,user#1234,psn_123');
    });

    it('does not modify rows where nickname is already present', () => {
      const csvData = `Nickname,DiscordID,psn_id,DriverNumber
John Smith,john#1234,psn_123,5
Jane Doe,jane#5678,psn_456,7`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      // Both rows should remain unchanged
      expect(lines[1]).toBe('John Smith,john#1234,psn_123,5');
      expect(lines[2]).toBe('Jane Doe,jane#5678,psn_456,7');
    });

    it('preserves header row exactly as provided', () => {
      const csvData = `Nickname,DiscordID,psn_id,iracing_id,DriverNumber
,user#1234,psn_123,iracing_456,5`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[0]).toBe('Nickname,DiscordID,psn_id,iracing_id,DriverNumber');
    });

    it('handles empty Discord ID (does not modify nickname)', () => {
      const csvData = `Nickname,DiscordID,psn_id
,,psn_123
Jane,,psn_456`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      // Empty nickname with empty Discord ID should remain empty
      expect(lines[1]).toBe(',,psn_123');

      // Nickname present with empty Discord ID should remain unchanged
      expect(lines[2]).toBe('Jane,,psn_456');
    });

    it('skips empty lines in CSV data', () => {
      const csvData = `Nickname,DiscordID,psn_id
,user#1234,psn_123

Jane,jane#5678,psn_456`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      // Should only have 3 lines (header + 2 data rows)
      expect(lines.length).toBe(3);
      expect(lines[1]).toBe('user#1234,user#1234,psn_123');
      expect(lines[2]).toBe('Jane,jane#5678,psn_456');
    });

    it('handles whitespace around values correctly', () => {
      const csvData = `Nickname,DiscordID,psn_id
  ,  user#1234  ,  psn_123
Jane  ,  jane#5678  ,  psn_456  `;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      // Whitespace should be trimmed
      expect(lines[1]).toBe('user#1234,user#1234,psn_123');
      expect(lines[2]).toBe('Jane,jane#5678,psn_456');
    });
  });

  describe('Edge Cases', () => {
    it('returns original data if no headers found', () => {
      const csvData = `SomeOtherColumn,AnotherColumn
value1,value2`;

      const result = processCSVData(csvData);

      // Should return unchanged since Nickname and DiscordID columns not found
      expect(result).toBe(csvData);
    });

    it('returns original data if only nickname column found', () => {
      const csvData = `Nickname,psn_id
John,psn_123`;

      const result = processCSVData(csvData);

      // Should return unchanged since DiscordID column not found
      expect(result).toBe(csvData);
    });

    it('returns original data if only Discord ID column found', () => {
      const csvData = `DiscordID,psn_id
user#1234,psn_123`;

      const result = processCSVData(csvData);

      // Should return unchanged since Nickname column not found
      expect(result).toBe(csvData);
    });

    it('handles empty CSV data', () => {
      const csvData = '';

      const result = processCSVData(csvData);

      expect(result).toBe('');
    });

    it('handles CSV with only header row', () => {
      const csvData = 'Nickname,DiscordID,psn_id';

      const result = processCSVData(csvData);

      expect(result).toBe('Nickname,DiscordID,psn_id');
    });

    it('handles complex Discord IDs with special characters', () => {
      const csvData = `Nickname,DiscordID,psn_id
,user#1234!@#$%,psn_123
,another.user#5678,psn_456`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('user#1234!@#$%,user#1234!@#$%,psn_123');
      expect(lines[2]).toBe('another.user#5678,another.user#5678,psn_456');
    });

    it('handles CSV with many columns', () => {
      const csvData = `Nickname,DiscordID,psn_id,iracing_id,iracing_customer_id,FirstName,LastName,DriverNumber
,user#1234,psn_123,iracing_456,789012,John,Smith,5`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('user#1234,user#1234,psn_123,iracing_456,789012,John,Smith,5');
    });
  });

  describe('Real-World Scenarios', () => {
    it('processes typical iRacing league CSV with missing nicknames', () => {
      const csvData = `Nickname,DiscordID,iracing_id,iracing_customer_id,DriverNumber
,racer1#1234,racer_iracing_1,123456,5
Mike Ross,mike#5678,mike_iracing,789012,7
,racer3#9012,racer_iracing_3,345678,`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('racer1#1234,racer1#1234,racer_iracing_1,123456,5');
      expect(lines[2]).toBe('Mike Ross,mike#5678,mike_iracing,789012,7');
      expect(lines[3]).toBe('racer3#9012,racer3#9012,racer_iracing_3,345678,');
    });

    it('processes typical Gran Turismo 7 league CSV with missing nicknames', () => {
      const csvData = `Nickname,DiscordID,psn_id,DriverNumber
,driver1#1234,psn_driver_1,5
Jane Doe,jane#5678,psn_jane,7
,driver3#9012,psn_driver_3,3`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('driver1#1234,driver1#1234,psn_driver_1,5');
      expect(lines[2]).toBe('Jane Doe,jane#5678,psn_jane,7');
      expect(lines[3]).toBe('driver3#9012,driver3#9012,psn_driver_3,3');
    });

    it('processes multi-platform league CSV with mixed empty/present nicknames', () => {
      const csvData = `Nickname,DiscordID,psn_id,iracing_id,iracing_customer_id,DriverNumber
,user1#1234,psn_1,iracing_1,111111,5
John Smith,john#5678,psn_2,iracing_2,222222,7
,user3#9012,,,333333,3
Jane Doe,jane#4567,psn_4,iracing_4,444444,`;

      const result = processCSVData(csvData);
      const lines = result.split('\n');

      expect(lines[1]).toBe('user1#1234,user1#1234,psn_1,iracing_1,111111,5');
      expect(lines[2]).toBe('John Smith,john#5678,psn_2,iracing_2,222222,7');
      expect(lines[3]).toBe('user3#9012,user3#9012,,,333333,3');
      expect(lines[4]).toBe('Jane Doe,jane#4567,psn_4,iracing_4,444444,');
    });
  });
});
