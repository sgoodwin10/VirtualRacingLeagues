# Lap-Based Time Calculation Feature

## Overview

This feature adds support for calculating race time differences based on the number of laps a driver is behind, rather than requiring an exact time difference. This is particularly useful when importing CSV data from race results where drivers are classified as "X laps down" instead of having a specific time gap.

## Implementation

### Location

- **Component**: `/var/www/resources/app/js/components/result/ResultCsvImport.vue`
- **Tests**: `/var/www/resources/app/js/components/result/__tests__/ResultCsvImport.test.ts`

### How It Works

When parsing CSV data for race results, the system now detects if the `original_race_time_difference` column contains values in the format:
- `"1 lap"` or `"1 laps"`
- `"2 laps"`
- `"3 laps"`, etc.

The format is case-insensitive and handles varying whitespace (e.g., `"1lap"`, `"2  laps"`, `"1 LAP"`).

### Calculation Formula

When a lap-based format is detected, the race time difference is calculated using:

```
race_time_difference = (fastest_lap_time + 500ms) × number_of_laps
```

**Example:**
- Driver's fastest lap: `01:30.000` (90,000ms)
- Laps down: `2 laps`
- Calculation: `(90,000 + 500) × 2 = 181,000ms = 00:03:01.000`

The additional 500ms accounts for the fact that a driver who is lapped is typically slightly slower than their fastest lap time.

### CSV Format

The CSV import expects the following columns:

```csv
driver,race_time,original_race_time_difference,fastest_lap_time
Winner,,00:00:00.000,01:30.000
Second,,00:00:05.123,01:30.500
Third,,1 lap,01:31.000
Fourth,,2 laps,01:32.000
DNF Driver,,DNF,01:35.000
```

### Error Handling

The system provides clear error messages when:
- Lap format is used without a fastest lap time: `"Cannot calculate race time from laps: fastest lap time is required"`
- Invalid fastest lap time format: `"Cannot calculate race time from laps: invalid fastest lap time format"`

## Usage

1. Navigate to a race in the season detail view
2. Open the Race Results modal
3. Click "Upload CSV" or paste CSV data into the text area
4. Include lap-based differences in the `original_race_time_difference` column
5. Ensure each driver with lap-based difference has a `fastest_lap_time`
6. Click "Parse CSV"

The system will automatically calculate the time differences and populate the results table.

## Time Format Support

The feature leverages the existing `useRaceTimeCalculation` composable which supports flexible time input formats:
- Full format: `hh:mm:ss.ms` (e.g., `01:23:45.678`)
- Minutes format: `mm:ss.ms` (e.g., `01:30.000`)
- Seconds format: `ss.ms` (e.g., `14.567`)

All formats are automatically normalized to the full `hh:mm:ss.ms` format before calculation.

## Testing

Comprehensive test coverage includes:
- Basic lap format parsing (`"1 lap"`, `"2 laps"`)
- Case-insensitive matching
- Whitespace handling
- Complex fastest lap times
- Mixed data (normal time differences, lap format, and DNF)
- Error scenarios
- Edge cases (zero laps, empty rows)

All tests are located in `/var/www/resources/app/js/components/result/__tests__/ResultCsvImport.test.ts` and can be run with:

```bash
npm run test:app -- ResultCsvImport
```

## Future Enhancements

Potential improvements could include:
- Configurable time penalty (currently fixed at 500ms)
- Support for fractional laps (e.g., "1.5 laps")
- Alternative calculation methods based on league preferences
