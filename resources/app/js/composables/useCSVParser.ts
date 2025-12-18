/**
 * useCSVParser Composable
 * Provides CSV parsing utilities for driver imports
 */

export interface UseCSVParserReturn {
  processDriverCSV: (csvData: string) => string;
}

/**
 * Composable for parsing and processing CSV data
 * @returns Object containing CSV parsing utilities
 *
 * @example
 * const { processDriverCSV } = useCSVParser();
 *
 * const processedData = processDriverCSV(rawCSV);
 */
export function useCSVParser(): UseCSVParserReturn {
  /**
   * Process CSV data to handle missing nicknames
   * If nickname is empty, use Discord ID as fallback
   * @param csvData - Raw CSV data string
   * @returns Processed CSV data string
   */
  function processDriverCSV(csvData: string): string {
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
  }

  return {
    processDriverCSV,
  };
}
