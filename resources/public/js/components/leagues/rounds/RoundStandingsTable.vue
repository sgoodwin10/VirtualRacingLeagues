<template>
  <VrlAccordionItem value="standings" class="mt-2">
    <template #header="{ active }">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <i class="ph ph-trophy text-xl text-[var(--orange)]"></i>
          <div class="flex flex-col gap-1">
            <h5
              class="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]"
            >
              Round Standings
            </h5>
            <span class="text-xs text-[var(--text-secondary)] font-body">
              {{ standingsSummaryText }}
            </span>
          </div>
        </div>
        <i
          :class="[
            'ph ph-caret-down text-xl text-[var(--text-secondary)] transition-transform',
            active && 'rotate-180',
          ]"
        ></i>
      </div>
    </template>

    <div class="bg-[var(--bg-dark)]">
      <VrlDataTable
        :value="standings"
        :podium-highlight="true"
        position-field="position"
        :paginated="false"
        :hoverable="true"
        :striped="false"
        empty-message="No standings data available"
        table-class="!rounded-none"
      >
        <!-- Position Column -->
        <Column field="position" header="Pos" style="width: 60px">
          <template #body="{ data }">
            <VrlPositionCell :position="data.position" />
          </template>
        </Column>

        <!-- Driver Name Column -->
        <Column field="driver_name" header="Driver">
          <template #body="{ data }">
            <div class="font-body font-medium text-[var(--text-primary)] text-lg">
              {{ data.driver_name }}
            </div>
          </template>
        </Column>

        <!-- Total Race Points Column (conditional) -->
        <Column
          v-if="hasRacePoints"
          field="race_points"
          header="Total Race Points"
          style="width: 140px"
          header-class="!text-center"
        >
          <template #body="{ data }">
            <VrlPointsCell :value="data.race_points" />
          </template>
        </Column>

        <!-- Fastest Lap Points Column -->
        <Column
          field="fastest_lap_points"
          header="Fastest Lap"
          style="width: 100px"
          header-class="!text-center"
        >
          <template #body="{ data }">
            <div v-if="data.fastest_lap_points" class="flex items-center justify-center gap-2">
              <i class="ph ph-lightning text-[var(--purple)]"></i>
              <span class="font-[family-name:var(--font-mono)] text-[var(--text-primary)]">{{
                data.fastest_lap_points
              }}</span>
            </div>
          </template>
        </Column>

        <!-- Pole Position Points Column -->
        <Column
          field="pole_position_points"
          header="Pole Position"
          style="width: 120px"
          header-class="!text-center"
        >
          <template #body="{ data }">
            <div
              v-if="data.pole_position_points"
              class="flex items-center justify-center gap-2 text-[var(--purple)] font-bold"
            >
              <i class="ph ph-medal text-[var(--purple)]"></i>
              <span class="font-[family-name:var(--font-mono)] text-[var(--text-primary)]">{{
                data.pole_position_points
              }}</span>
            </div>
          </template>
        </Column>

        <!-- Positions Gained Column -->
        <Column field="total_positions_gained" header="+/-" style="width: 80px">
          <template #body="{ data }">
            <div
              class="text-center font-[family-name:var(--font-mono)] font-semibold"
              :class="getPositionsGainedClass(data.total_positions_gained)"
            >
              {{ formatPositionsGained(data.total_positions_gained) }}
            </div>
          </template>
        </Column>

        <!-- Final Points Column -->
        <Column
          field="total_points"
          header="Round Points"
          style="width: 100px"
          header-class="!text-center"
        >
          <template #body="{ data }">
            <VrlPointsCell :value="data.total_points" :bold="true" />
          </template>
        </Column>
      </VrlDataTable>
    </div>
  </VrlAccordionItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Column from 'primevue/column';
import type { RoundStandingDriver } from '@public/types/public';
import VrlAccordionItem from '@public/components/common/accordions/VrlAccordionItem.vue';
import VrlDataTable from '@public/components/common/tables/VrlDataTable.vue';
import VrlPositionCell from '@public/components/common/tables/cells/VrlPositionCell.vue';
import VrlPointsCell from '@public/components/common/tables/cells/VrlPointsCell.vue';

interface Props {
  standings: RoundStandingDriver[];
  hasRacePointsEnabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hasRacePointsEnabled: false,
});

const standingsSummaryText = computed(() => {
  if (props.standings.length === 0) {
    return 'No standings data';
  }

  const leader = props.standings[0];
  return leader ? `Winner: ${leader.driver_name}` : 'No standings data';
});

const hasRacePoints = computed(() => {
  return props.hasRacePointsEnabled;
});

function formatPositionsGained(value: number): string {
  if (value === 0) {
    return '0';
  }
  return value > 0 ? `+${value}` : String(value);
}

function getPositionsGainedClass(value: number): string {
  if (value > 0) {
    return 'text-[var(--green)]';
  }
  if (value < 0) {
    return 'text-[var(--red)]';
  }
  return 'text-[var(--text-secondary)]';
}
</script>
