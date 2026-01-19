<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { PhTrophy, PhDownload } from '@phosphor-icons/vue';
import SeasonStandingsPanel from '@app/components/season/panels/SeasonStandingsPanel.vue';
import { Card, CardHeader } from '@app/components/common/cards';
import { Button } from '@app/components/common/buttons';
import { useCsvExport } from '@app/composables/useCsvExport';

const route = useRoute();
const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));

const { isDownloading, downloadSeasonStandingsCsv } = useCsvExport();

async function handleDownloadAllStandings(): Promise<void> {
  await downloadSeasonStandingsCsv(seasonId.value);
}
</script>

<template>
  <div>
    <Card :body-padding="false">
      <template #header>
        <CardHeader
          title="Season Standings"
          description="Championship points and driver rankings across all rounds"
          :icon="PhTrophy"
          icon-color="yellow-600"
        >
          <template #actions>
            <Button
              label="Download All Standings"
              variant="secondary"
              :icon="PhDownload"
              :loading="isDownloading"
              @click="handleDownloadAllStandings"
            />
          </template>
        </CardHeader>
      </template>
      <SeasonStandingsPanel :season-id="seasonId" />
    </Card>
  </div>
</template>
