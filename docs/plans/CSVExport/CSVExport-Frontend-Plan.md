# CSV Export Feature - Frontend Plan

## Overview

This document outlines the frontend implementation for CSV export functionality in the app dashboard. The frontend will add download buttons that trigger backend API calls and handle file downloads.

---

## Components to Modify

### 1. RaceResultModal.vue
**Location:** `resources/app/js/components/result/RaceResultModal.vue`

**Changes:**
- Add download button in the footer (visible only in read-only mode)
- Button replaces "Reset All Results" position when in read-only mode
- Button triggers CSV download for race or qualifying results

**Button Placement:**
```vue
<template #footer>
  <div class="flex justify-between">
    <!-- Download button (read-only mode only) -->
    <div v-if="isReadOnly && formResults.length > 0">
      <Button
        label="Download CSV"
        variant="secondary"
        icon="pi pi-download"
        :loading="isDownloading"
        @click="handleDownloadCsv"
      />
    </div>
    <div v-else></div>

    <div class="flex gap-3">
      <!-- Existing buttons -->
    </div>
  </div>
</template>
```

### 2. RoundResultsModal.vue
**Location:** `resources/app/js/components/round/modals/RoundResultsModal.vue`

**Changes:**
- Add download button in the modal header (right-aligned)
- Add download buttons to each cross-division results tab panel

**Button Placements:**

**Header (Round Standings):**
```vue
<template #header>
  <div class="flex items-center justify-between w-full">
    <div class="flex items-center gap-3">
      <PhTrophy :size="24" class="text-amber-600" />
      <h2>Round {{ roundData?.round_number }} Results</h2>
    </div>
    <Button
      v-if="hasResults && isRoundCompleted"
      label="Download Round Results"
      variant="secondary"
      size="sm"
      icon="pi pi-download"
      :loading="isDownloadingStandings"
      @click="handleDownloadRoundStandings"
    />
  </div>
</template>
```

**Cross-Division Tab Panels:**
Add download button at the top of each panel:
- Qualifying Times: "Download Qualifying Times"
- Race Times: "Download Race Times"
- Fastest Laps: "Download Fastest Laps"

### 3. SeasonStandingsPanel.vue
**Location:** `resources/app/js/components/season/panels/SeasonStandingsPanel.vue`

**Changes:**
- Add download button in the panel header
- Button downloads full season standings CSV

**Button Placement:**
Add to the card header area or as a standalone button above the standings table.

---

## New Composable: useCsvExport

**Location:** `resources/app/js/composables/useCsvExport.ts`

This composable handles CSV download logic across all components.

```typescript
/**
 * useCsvExport Composable
 * Provides CSV export utilities for downloading results
 */

import { ref } from 'vue';
import { apiClient } from '@app/services/api';
import { useToast } from 'primevue/usetoast';

export interface UseCsvExportReturn {
  isDownloading: Ref<boolean>;
  downloadRaceResultsCsv: (raceId: number) => Promise<void>;
  downloadRoundStandingsCsv: (roundId: number) => Promise<void>;
  downloadCrossDivisionCsv: (roundId: number, type: CrossDivisionType) => Promise<void>;
  downloadSeasonStandingsCsv: (seasonId: number, divisionId?: number) => Promise<void>;
}

export type CrossDivisionType = 'fastest-laps' | 'race-times' | 'qualifying-times';

export function useCsvExport(): UseCsvExportReturn {
  const toast = useToast();
  const isDownloading = ref(false);

  /**
   * Generic download handler
   */
  async function downloadCsv(url: string, defaultFilename: string): Promise<void> {
    isDownloading.value = true;

    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header if present
      const contentDisposition = response.headers['content-disposition'];
      let filename = defaultFilename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.add({
        severity: 'success',
        summary: 'Download Complete',
        detail: `${filename} has been downloaded.`,
        life: 3000,
      });
    } catch (error) {
      console.error('CSV download failed:', error);
      toast.add({
        severity: 'error',
        summary: 'Download Failed',
        detail: 'Failed to download CSV file. Please try again.',
        life: 5000,
      });
    } finally {
      isDownloading.value = false;
    }
  }

  async function downloadRaceResultsCsv(raceId: number): Promise<void> {
    await downloadCsv(
      `/api/export/races/${raceId}/csv`,
      `race-${raceId}-results.csv`
    );
  }

  async function downloadRoundStandingsCsv(roundId: number): Promise<void> {
    await downloadCsv(
      `/api/export/rounds/${roundId}/standings/csv`,
      `round-${roundId}-standings.csv`
    );
  }

  async function downloadCrossDivisionCsv(
    roundId: number,
    type: CrossDivisionType
  ): Promise<void> {
    await downloadCsv(
      `/api/export/rounds/${roundId}/${type}/csv`,
      `round-${roundId}-${type}.csv`
    );
  }

  async function downloadSeasonStandingsCsv(
    seasonId: number,
    divisionId?: number
  ): Promise<void> {
    const params = divisionId ? `?division_id=${divisionId}` : '';
    await downloadCsv(
      `/api/export/seasons/${seasonId}/standings/csv${params}`,
      `season-${seasonId}-standings.csv`
    );
  }

  return {
    isDownloading,
    downloadRaceResultsCsv,
    downloadRoundStandingsCsv,
    downloadCrossDivisionCsv,
    downloadSeasonStandingsCsv,
  };
}
```

---

## API Endpoints Constants

**Location:** `resources/app/js/constants/apiEndpoints.ts`

Add new export endpoints:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints

  export: {
    raceResults: (raceId: number) => `/api/export/races/${raceId}/csv`,
    roundStandings: (roundId: number) => `/api/export/rounds/${roundId}/standings/csv`,
    crossDivision: (roundId: number, type: string) => `/api/export/rounds/${roundId}/${type}/csv`,
    seasonStandings: (seasonId: number) => `/api/export/seasons/${seasonId}/standings/csv`,
  },
};
```

---

## UI/UX Design

### Button Styling
- Use `variant="secondary"` for download buttons
- Include download icon (`pi pi-download`)
- Show loading state while download is in progress
- Disabled during download

### Button Labels
| Location | Label |
|----------|-------|
| Race Results Modal | "Download CSV" |
| Round Results Modal Header | "Download Round Results" |
| Qualifying Times Tab | "Download Qualifying Times" |
| Race Times Tab | "Download Race Times" |
| Fastest Laps Tab | "Download Fastest Laps" |
| Season Standings | "Download Standings" |

### Visibility Rules
- Download buttons only visible when:
  - Results exist (not empty)
  - Results are in read-only mode (completed)

---

## Component Updates Summary

### RaceResultModal.vue

```typescript
// Add imports
import { useCsvExport } from '@app/composables/useCsvExport';

// In setup
const { isDownloading, downloadRaceResultsCsv } = useCsvExport();

// Add handler
async function handleDownloadCsv(): Promise<void> {
  await downloadRaceResultsCsv(props.race.id);
}
```

### RoundResultsModal.vue

```typescript
// Add imports
import { useCsvExport, type CrossDivisionType } from '@app/composables/useCsvExport';

// In setup
const {
  isDownloading: isDownloadingStandings,
  downloadRoundStandingsCsv,
  downloadCrossDivisionCsv,
} = useCsvExport();

// Separate loading states for different downloads
const isDownloadingQualifying = ref(false);
const isDownloadingRaceTimes = ref(false);
const isDownloadingFastestLaps = ref(false);

// Add handlers
async function handleDownloadRoundStandings(): Promise<void> {
  await downloadRoundStandingsCsv(props.round.id);
}

async function handleDownloadCrossDivision(type: CrossDivisionType): Promise<void> {
  await downloadCrossDivisionCsv(props.round.id, type);
}
```

### SeasonStandingsPanel.vue

```typescript
// Add imports
import { useCsvExport } from '@app/composables/useCsvExport';

// In setup
const { isDownloading, downloadSeasonStandingsCsv } = useCsvExport();

// Add handler
async function handleDownloadStandings(): Promise<void> {
  await downloadSeasonStandingsCsv(props.seasonId);
}
```

---

## Cross-Division Results Section Update

### CrossDivisionResultsSection.vue

Add download button prop and handler:

```vue
<template>
  <div>
    <!-- Header with download button -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <Button
        v-if="results && results.length > 0"
        :label="downloadLabel"
        variant="secondary"
        size="sm"
        icon="pi pi-download"
        :loading="isDownloading"
        @click="$emit('download')"
      />
    </div>

    <!-- Existing table content -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  results: CrossDivisionResult[] | null;
  raceEvents: RaceEventResults[];
  divisions: Array<{ id: number; name: string }>;
  downloadLabel?: string;
  isDownloading?: boolean;
}

interface Emits {
  (e: 'download'): void;
}
</script>
```

---

## Testing

### Unit Tests
Create `resources/app/js/composables/__tests__/useCsvExport.test.ts`:

- Test `downloadRaceResultsCsv` triggers correct API call
- Test `downloadRoundStandingsCsv` triggers correct API call
- Test `downloadCrossDivisionCsv` with each type
- Test `downloadSeasonStandingsCsv` with and without division filter
- Test loading state management
- Test error handling and toast notifications
- Test filename extraction from headers

### E2E Tests
Add to Playwright tests:

- Test download button visibility (only in read-only mode)
- Test download triggers correctly
- Test file is downloaded with correct name

---

## Implementation Checklist

- [ ] Create `useCsvExport` composable
- [ ] Add export endpoints to `apiEndpoints.ts`
- [ ] Update `RaceResultModal.vue` with download button
- [ ] Update `RoundResultsModal.vue` with download buttons
- [ ] Update `CrossDivisionResultsSection.vue` with download button support
- [ ] Update `SeasonStandingsPanel.vue` with download button
- [ ] Write unit tests for composable
- [ ] Write E2E tests for download flows
- [ ] Manual testing of all download scenarios

---

## Notes

### Browser Compatibility
- Uses standard Blob API for file downloads
- Supported in all modern browsers
- Falls back gracefully if download fails

### File Size Considerations
- CSV files are typically small (< 1MB)
- No streaming required for expected data sizes
- Loading indicator provides feedback during download
