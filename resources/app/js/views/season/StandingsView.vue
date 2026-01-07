<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { PhTrophy } from '@phosphor-icons/vue';
import SeasonStandingsPanel from '@app/components/season/panels/SeasonStandingsPanel.vue';
import { Card, CardHeader } from '@app/components/common/cards';

const route = useRoute();
const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
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
        />
      </template>
      <SeasonStandingsPanel :season-id="seasonId" />
    </Card>
  </div>
</template>
