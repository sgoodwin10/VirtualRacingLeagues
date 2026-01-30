<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-message">{{ error }}</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!standingsData || standingsData.standings.length === 0" class="empty-state">
      <div class="empty-message">No standings data available yet.</div>
    </div>

    <!-- Standings Content -->
    <div v-else class="standings-container">
      <!-- Tabs (when divisions or teams championship) -->
      <div
        v-if="
          (standingsData.has_divisions && divisionsWithStandings.length > 0) ||
          showTeamsChampionship
        "
      >
        <!-- Tab Navigation -->
        <div class="standings-tabs">
          <div class="flex gap-2 md:gap-8">
            <button
              v-for="division in divisionsWithStandings"
              :key="`division-${division.division_id}`"
              :class="[
                'standings-tab',
                { active: activeTabId === `division-${division.division_id}` },
              ]"
              @click="activeTabId = `division-${division.division_id}`"
            >
              <span class="hidden md:block">
                {{ division.division_name }}
              </span>
              <span class="block md:hidden">
                {{
                  division.division_name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                }}
              </span>
            </button>

            <button
              v-if="!standingsData.has_divisions && showTeamsChampionship"
              :class="['standings-tab', { active: activeTabId === 'drivers' }]"
              @click="activeTabId = 'drivers'"
            >
              Drivers
            </button>

            <button
              v-if="showTeamsChampionship"
              :class="['standings-tab', { active: activeTabId === 'teams' }]"
              @click="activeTabId = 'teams'"
            >
              <span class="hidden md:block"> Team Championship </span>
              <span class="block md:hidden"> Teams </span>
            </button>
          </div>

          <VrlButton
            variant="secondary"
            outline
            size="sm"
            :label="exportButtonLabel"
            :icon="PhDownloadSimple"
            class="ml-auto"
            @click="exportToCSV()"
          />
        </div>

        <!-- Tab Content -->
        <div class="standings-content">
          <!-- Division Tables -->
          <div
            v-for="division in divisionsWithStandings"
            v-show="activeTabId === `division-${division.division_id}`"
            :key="`division-${division.division_id}`"
          >
            <div class="standings-section">
              <table class="standings-table">
                <thead>
                  <tr>
                    <th class="th-position" rowspan="2">#</th>
                    <th class="th-driver" rowspan="2">Driver</th>
                    <th class="th-podiums" rowspan="2">Podiums</th>
                    <th
                      v-for="roundNum in getRoundNumbers(division.drivers)"
                      :key="`header-${roundNum}`"
                      :colspan="3"
                      class="th-round"
                    >
                      R{{ roundNum }}
                    </th>
                    <th class="th-total" rowspan="2">Total</th>
                    <th v-if="standingsData.drop_round_enabled" class="th-drop" rowspan="2">
                      Drop
                    </th>
                  </tr>
                  <tr class="sub-header">
                    <template
                      v-for="roundNum in getRoundNumbers(division.drivers)"
                      :key="`sub-${roundNum}`"
                    >
                      <th class="th-sub">P</th>
                      <th class="th-sub">FL</th>
                      <th class="th-sub">Pts</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="driver in division.drivers"
                    :key="driver.driver_id"
                    :class="getRowClass(driver.position)"
                  >
                    <td :class="['td-position', getPositionClass(driver.position)]">
                      {{ driver.position }}
                    </td>
                    <td class="td-driver">
                      <div class="driver-info">
                        <span class="driver-name">{{ driver.driver_name }}</span>
                        <span v-if="driver.team_logo" class="team-logo">
                          <img :src="driver.team_logo" :alt="driver.team_name || 'Team'" />
                        </span>
                        <span v-else-if="driver.team_name" class="team-name">{{
                          driver.team_name
                        }}</span>
                      </div>
                    </td>
                    <td class="td-podiums">{{ driver.podiums }}</td>
                    <template
                      v-for="roundNum in getRoundNumbers(division.drivers)"
                      :key="`round-${driver.driver_id}-${roundNum}`"
                    >
                      <td class="text-center">
                        <PhCheck
                          v-if="getRoundData(driver, roundNum)?.has_pole"
                          :size="14"
                          weight="bold"
                          class="icon-pole"
                        />
                      </td>
                      <td class="td-round">
                        <PhCheck
                          v-if="getRoundData(driver, roundNum)?.has_fastest_lap"
                          :size="14"
                          weight="bold"
                          class="icon-fl self-center"
                        />
                      </td>
                      <td
                        :class="[
                          'td-round',
                          (getRoundData(driver, roundNum)?.total_penalties ?? 0) > 0
                            ? 'has-penalty'
                            : '',
                        ]"
                      >
                        {{ getRoundData(driver, roundNum)?.points ?? '' }}
                      </td>
                    </template>
                    <td class="td-total">{{ driver.total_points }}</td>
                    <td v-if="standingsData.drop_round_enabled" class="td-drop">
                      {{ driver.drop_total }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Drivers Table (when no divisions but teams championship) -->
          <div
            v-if="!standingsData.has_divisions && showTeamsChampionship"
            v-show="activeTabId === 'drivers'"
          >
            <div class="standings-section">
              <table class="standings-table">
                <thead>
                  <tr>
                    <th class="th-position" rowspan="2">#</th>
                    <th class="th-driver" rowspan="2">Driver</th>
                    <th class="th-podiums" rowspan="2">Podiums</th>
                    <th
                      v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                      :key="`header-${roundNum}`"
                      :colspan="3"
                      class="th-round"
                    >
                      R{{ roundNum }}
                    </th>
                    <th class="th-total" rowspan="2">Total</th>
                    <th v-if="standingsData.drop_round_enabled" class="th-drop" rowspan="2">
                      Drop
                    </th>
                  </tr>
                  <tr class="sub-header">
                    <template
                      v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                      :key="`sub-${roundNum}`"
                    >
                      <th class="th-sub">P</th>
                      <th class="th-sub">FL</th>
                      <th class="th-sub">Pts</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="driver in flatDriverStandings"
                    :key="driver.driver_id"
                    :class="getRowClass(driver.position)"
                  >
                    <td :class="['td-position', getPositionClass(driver.position)]">
                      {{ driver.position }}
                    </td>
                    <td class="td-driver">
                      <div class="driver-info">
                        <span class="driver-name">{{ driver.driver_name }}</span>
                        <span v-if="driver.team_logo" class="team-logo">
                          <img :src="driver.team_logo" :alt="driver.team_name || 'Team'" />
                        </span>
                        <span v-else-if="driver.team_name" class="team-name">{{
                          driver.team_name
                        }}</span>
                      </div>
                    </td>
                    <td class="td-podiums">{{ driver.podiums }}</td>
                    <template
                      v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                      :key="`round-${driver.driver_id}-${roundNum}`"
                    >
                      <td class="td-round">
                        <PhCheck
                          v-if="getRoundData(driver, roundNum)?.has_pole"
                          :size="14"
                          weight="bold"
                          class="icon-pole"
                        />
                      </td>
                      <td class="td-round">
                        <PhCheck
                          v-if="getRoundData(driver, roundNum)?.has_fastest_lap"
                          :size="14"
                          weight="bold"
                          class="icon-fl"
                        />
                      </td>
                      <td
                        :class="[
                          'td-round',
                          (getRoundData(driver, roundNum)?.total_penalties ?? 0) > 0
                            ? 'has-penalty'
                            : '',
                        ]"
                      >
                        {{ getRoundData(driver, roundNum)?.points ?? '' }}
                      </td>
                    </template>
                    <td class="td-total">{{ driver.total_points }}</td>
                    <td v-if="standingsData.drop_round_enabled" class="td-drop">
                      {{ driver.drop_total }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Teams Table -->
          <div v-if="showTeamsChampionship" v-show="activeTabId === 'teams'">
            <div class="standings-section">
              <table class="standings-table teams-table">
                <thead>
                  <tr>
                    <th class="th-position">#</th>
                    <th class="th-team-logo">Logo</th>
                    <th class="th-driver">Team</th>
                    <th
                      v-for="roundNum in getTeamRoundNumbers(teamChampionshipResults)"
                      :key="`team-header-${roundNum}`"
                      class="th-round-single"
                    >
                      R{{ roundNum }}
                    </th>
                    <th class="th-total">Total</th>
                    <th v-if="teamsDropRoundEnabled" class="th-drop">Drop</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="team in teamChampionshipResults"
                    :key="team.team_id"
                    :class="getRowClass(team.position)"
                  >
                    <td :class="['td-position', getPositionClass(team.position)]">
                      {{ team.position }}
                    </td>
                    <td class="td-team-logo">
                      <img
                        v-if="team.team_logo"
                        :src="team.team_logo"
                        :alt="team.team_name"
                        class="team-championship-logo"
                      />
                    </td>
                    <td class="td-driver">
                      <span class="driver-name">{{ team.team_name }}</span>
                    </td>
                    <template
                      v-for="roundNum in getTeamRoundNumbers(teamChampionshipResults)"
                      :key="`team-round-${team.team_id}-${roundNum}`"
                    >
                      <td class="td-round">
                        {{ getTeamRoundData(team, roundNum)?.points ?? 0 }}
                      </td>
                    </template>
                    <td class="td-total">{{ team.total_points }}</td>
                    <td v-if="teamsDropRoundEnabled" class="td-drop">{{ team.drop_total }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- No Divisions and No Teams: Single Table -->
      <div v-else>
        <!-- Export button for single table -->
        <div class="standings-tabs">
          <VrlButton
            variant="secondary"
            outline
            size="sm"
            :label="exportButtonLabel"
            :icon="PhDownloadSimple"
            class="ml-auto"
            @click="exportToCSV()"
          />
        </div>

        <div class="standings-section">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="th-position" rowspan="2">#</th>
                <th class="th-driver" rowspan="2">Driver</th>
                <th class="th-podiums" rowspan="2">Podiums</th>
                <th
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`header-${roundNum}`"
                  :colspan="3"
                  class="th-round"
                >
                  R{{ roundNum }}
                </th>
                <th class="th-total" rowspan="2">Total</th>
                <th v-if="standingsData.drop_round_enabled" class="th-drop" rowspan="2">Drop</th>
              </tr>
              <tr class="sub-header">
                <template
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`sub-${roundNum}`"
                >
                  <th class="th-sub">P</th>
                  <th class="th-sub">FL</th>
                  <th class="th-sub">Pts</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="driver in flatDriverStandings"
                :key="driver.driver_id"
                :class="getRowClass(driver.position)"
              >
                <td :class="['td-position', getPositionClass(driver.position)]">
                  {{ driver.position }}
                </td>
                <td class="td-driver">
                  <div class="driver-info">
                    <span class="driver-name">{{ driver.driver_name }}</span>
                    <span v-if="driver.team_logo" class="team-logo">
                      <img :src="driver.team_logo" :alt="driver.team_name || 'Team'" />
                    </span>
                    <span v-else-if="driver.team_name" class="team-name">{{
                      driver.team_name
                    }}</span>
                  </div>
                </td>
                <td class="td-podiums">{{ driver.podiums }}</td>
                <template
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`round-${driver.driver_id}-${roundNum}`"
                >
                  <td class="td-round">
                    <PhCheck
                      v-if="getRoundData(driver, roundNum)?.has_pole"
                      :size="14"
                      weight="bold"
                      class="icon-pole"
                    />
                  </td>
                  <td class="td-round">
                    <PhCheck
                      v-if="getRoundData(driver, roundNum)?.has_fastest_lap"
                      :size="14"
                      weight="bold"
                      class="icon-fl"
                    />
                  </td>
                  <td
                    :class="[
                      'td-round',
                      (getRoundData(driver, roundNum)?.total_penalties ?? 0) > 0
                        ? 'has-penalty'
                        : '',
                    ]"
                  >
                    {{ getRoundData(driver, roundNum)?.points ?? '' }}
                  </td>
                </template>
                <td class="td-total">{{ driver.total_points }}</td>
                <td v-if="standingsData.drop_round_enabled" class="td-drop">
                  {{ driver.drop_total }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import * as Sentry from '@sentry/vue';
import { PhCheck, PhDownloadSimple } from '@phosphor-icons/vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import { leagueService } from '@public/services/leagueService';
import type {
  PublicSeasonDetailResponse,
  SeasonStandingDriver,
  SeasonStandingDivision,
  RoundPoints,
  TeamChampionshipStanding,
} from '@public/types/public';

interface Props {
  seasonId: number;
  leagueSlug: string;
  seasonSlug: string;
}

const props = defineProps<Props>();

const isLoading = ref(false);
const error = ref<string | null>(null);
const standingsData = ref<PublicSeasonDetailResponse | null>(null);
const activeTabId = ref<string>('drivers');

const divisionsWithStandings = computed<readonly SeasonStandingDivision[]>(() => {
  if (!standingsData.value) return [];
  if (standingsData.value.has_divisions && Array.isArray(standingsData.value.standings)) {
    const firstItem = standingsData.value.standings[0];
    if (firstItem && 'division_id' in firstItem) {
      const divisions = standingsData.value.standings as SeasonStandingDivision[];
      return [...divisions].sort((a, b) => a.order - b.order);
    }
  }
  return [];
});

const flatDriverStandings = computed<readonly SeasonStandingDriver[]>(() => {
  if (!standingsData.value) return [];
  if (!standingsData.value.has_divisions && Array.isArray(standingsData.value.standings)) {
    const firstItem = standingsData.value.standings[0];
    if (firstItem && !('division_id' in firstItem)) {
      return standingsData.value.standings as SeasonStandingDriver[];
    }
  }
  return [];
});

const showTeamsChampionship = computed<boolean>(() => {
  return standingsData.value?.team_championship_enabled === true;
});

const teamsDropRoundEnabled = computed<boolean>(() => {
  return standingsData.value?.teams_drop_rounds_enabled === true;
});

const teamChampionshipResults = computed<readonly TeamChampionshipStanding[]>(() => {
  if (!standingsData.value || !showTeamsChampionship.value) return [];
  const results = standingsData.value.team_championship_results ?? [];
  return [...results].sort((a, b) => a.position - b.position);
});

const exportButtonLabel = computed<string>(() => {
  if (activeTabId.value === 'teams') {
    return 'Export Team Championship Data';
  }
  if (activeTabId.value === 'drivers') {
    return 'Export Drivers Data';
  }
  if (activeTabId.value.startsWith('division-')) {
    const divisionId = parseInt(activeTabId.value.replace('division-', ''));
    const division = divisionsWithStandings.value.find((d) => d.division_id === divisionId);
    if (division) {
      return `Export ${division.division_name} Data`;
    }
  }
  return 'Export Standings Data';
});

function getRoundNumbers(drivers: readonly SeasonStandingDriver[]): number[] {
  if (!drivers || drivers.length === 0) return [];
  const roundNumbers = new Set<number>();
  for (const driver of drivers) {
    if (driver.rounds) {
      for (const round of driver.rounds) {
        roundNumbers.add(round.round_number);
      }
    }
  }
  return Array.from(roundNumbers).sort((a, b) => a - b);
}

function getTeamRoundNumbers(teams: readonly TeamChampionshipStanding[]): number[] {
  if (!teams || teams.length === 0) return [];
  const roundNumbers = new Set<number>();
  for (const team of teams) {
    if (team.rounds) {
      for (const round of team.rounds) {
        roundNumbers.add(round.round_number);
      }
    }
  }
  return Array.from(roundNumbers).sort((a, b) => a - b);
}

function getRoundData(driver: SeasonStandingDriver, roundNumber: number): RoundPoints | undefined {
  return driver.rounds?.find((r) => r.round_number === roundNumber);
}

function getTeamRoundData(team: TeamChampionshipStanding, roundNumber: number) {
  return team.rounds.find((r) => r.round_number === roundNumber);
}

function getRowClass(position: number): string {
  if (position === 1) return 'row-podium-1';
  if (position === 2) return 'row-podium-2';
  if (position === 3) return 'row-podium-3';
  return '';
}

function getPositionClass(position: number): string {
  if (position === 1) return 'pos-1';
  if (position === 2) return 'pos-2';
  if (position === 3) return 'pos-3';
  return '';
}

async function fetchStandings(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  try {
    standingsData.value = await leagueService.getSeasonDetail(props.leagueSlug, props.seasonSlug);

    if (standingsData.value.has_divisions && divisionsWithStandings.value.length > 0) {
      const firstDivision = divisionsWithStandings.value[0];
      if (firstDivision) {
        activeTabId.value = `division-${firstDivision.division_id}`;
      }
    } else if (standingsData.value.team_championship_enabled) {
      activeTabId.value = 'drivers';
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'fetch_season_standings' },
    });
    error.value = 'Failed to load season standings';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchStandings();
});

watch(
  () => props.seasonId,
  (newSeasonId, oldSeasonId) => {
    if (newSeasonId && newSeasonId !== oldSeasonId) {
      fetchStandings();
    }
  },
);

function exportToCSV(): void {
  if (!standingsData.value) return;

  let csvContent = '';
  let filename = '';

  const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  if (activeTabId.value === 'teams') {
    // Export team championship data
    csvContent = generateTeamChampionshipCSV();
    filename = `${sanitize(props.leagueSlug)}_${sanitize(props.seasonSlug)}_team_championship_standings.csv`;
  } else {
    // Export driver standings (division or flat)
    const isDriversTab = activeTabId.value === 'drivers';
    const isDivisionTab = activeTabId.value.startsWith('division-');

    if (isDivisionTab) {
      const divisionId = parseInt(activeTabId.value.replace('division-', ''));
      const division = divisionsWithStandings.value.find((d) => d.division_id === divisionId);
      if (division) {
        csvContent = generateDriverStandingsCSV(division.drivers);
        filename = `${sanitize(props.leagueSlug)}_${sanitize(props.seasonSlug)}_${sanitize(division.division_name)}_standings.csv`;
      }
    } else {
      csvContent = generateDriverStandingsCSV(flatDriverStandings.value);
      const tabName = isDriversTab ? 'drivers' : 'standings';
      filename = `${sanitize(props.leagueSlug)}_${sanitize(props.seasonSlug)}_${tabName}.csv`;
    }
  }

  if (!csvContent) return;

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateDriverStandingsCSV(drivers: readonly SeasonStandingDriver[]): string {
  if (!drivers || drivers.length === 0) return '';

  const roundNumbers = getRoundNumbers(drivers);
  const hasDropRounds = standingsData.value?.drop_round_enabled ?? false;

  // Check if any driver has a team
  const hasTeams = drivers.some((d) => d.team_name);

  // Build headers
  const headers: string[] = ['position', 'driver_name'];

  if (hasTeams) {
    headers.push('team');
  }

  headers.push('podiums');

  // Add round columns
  for (const roundNum of roundNumbers) {
    headers.push(`r${roundNum}_pole`, `r${roundNum}_fl`, `r${roundNum}_pts`);
  }

  headers.push('total');

  if (hasDropRounds) {
    headers.push('drop');
  }

  // Build rows
  const rows = drivers.map((driver) => {
    const row: (string | number)[] = [driver.position, driver.driver_name];

    if (hasTeams) {
      row.push(driver.team_name || '');
    }

    row.push(driver.podiums);

    // Add round data
    for (const roundNum of roundNumbers) {
      const roundData = getRoundData(driver, roundNum);
      row.push(
        roundData?.has_pole ? 'Yes' : 'No',
        roundData?.has_fastest_lap ? 'Yes' : 'No',
        roundData?.points ?? '',
      );
    }

    row.push(driver.total_points);

    if (hasDropRounds) {
      row.push(driver.drop_total ?? 0);
    }

    return row;
  });

  // Convert to CSV format
  return [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(','),
    ),
  ].join('\n');
}

function generateTeamChampionshipCSV(): string {
  if (!teamChampionshipResults.value || teamChampionshipResults.value.length === 0) return '';

  const roundNumbers = getTeamRoundNumbers(teamChampionshipResults.value);
  const hasDropRounds = teamsDropRoundEnabled.value;

  // Build headers
  const headers: string[] = ['position', 'team_name'];

  // Add round columns
  for (const roundNum of roundNumbers) {
    headers.push(`r${roundNum}_pts`);
  }

  headers.push('total');

  if (hasDropRounds) {
    headers.push('drop');
  }

  // Build rows
  const rows = teamChampionshipResults.value.map((team) => {
    const row: (string | number)[] = [team.position, team.team_name];

    // Add round data
    for (const roundNum of roundNumbers) {
      const roundData = getTeamRoundData(team, roundNum);
      row.push(roundData?.points ?? 0);
    }

    row.push(team.total_points);

    if (hasDropRounds) {
      row.push(team.drop_total ?? 0);
    }

    return row;
  });

  // Convert to CSV format
  return [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(','),
    ),
  ].join('\n');
}
</script>

<style scoped>
/* States */
.loading-state {
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 2px solid transparent;
  border-bottom-color: var(--cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  padding: 2rem;
}

.error-message {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.2);
  border-radius: 8px;
  padding: 1rem;
  color: #f85149;
}

.empty-state {
  padding: 2rem;
}

.empty-message {
  text-align: center;
  color: var(--text-muted);
}

/* Container */
.standings-container {
  width: 100%;
}

/* Tabs */
.standings-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1rem 16px;
  border-bottom: 1px solid var(--border);
}

.standings-tab {
  background: transparent;
  border: none;
  padding: 0.5rem 0;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.standings-tab:hover {
  color: var(--text-secondary);
}

.standings-tab.active {
  color: var(--cyan);
}

.standings-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--cyan);
}

/* Table Wrapper */
.standings-section {
  overflow-x: auto;
}

/* Table */
.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
}

/* Table Headers - Main Row */
.standings-table thead tr:first-child th {
  background-color: var(--bg-card);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  padding: 8px 4px;
  text-align: center;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

/* Position Column Header */
.standings-table th.th-position {
  width: 48px;
  text-align: center;
}

/* Driver Column Header */
.standings-table th.th-driver {
  text-align: left !important;
  min-width: 160px;
}

/* Podiums Column Header */
.standings-table th.th-podiums {
  width: 64px;
  font-size: 10px;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

/* Round Group Headers */
.standings-table th.th-round {
  padding: 4px 4px;
  border-right: 1px solid var(--border);
}

/* Team Championship Single Round Header */
.standings-table th.th-round-single {
  width: 64px;
  padding: 12px 16px;
  border-right: 1px solid var(--border);
}

/* Total Column Header */
.standings-table th.th-total {
  width: 64px;
  background-color: var(--bg-elevated);
}

/* Drop Column Header */
.standings-table th.th-drop {
  width: 64px;
  background-color: var(--bg-elevated);
}

/* Sub-header Row (P, FL, Pts) */
.standings-table .sub-header th {
  background-color: var(--bg-card);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  padding: 8px 4px;
  text-align: center;
  border-bottom: 1px solid var(--border);
}

/* Sub-header individual columns */
.standings-table .sub-header th.th-sub {
  padding: 8px 2px;
}

/* Last Pts column in each round group should have right border */
.standings-table .sub-header th.th-sub:nth-child(3n) {
  border-right: 1px solid var(--border);
}

/* Table Body Cells */
.standings-table td {
  padding: 12px 2px;
  border-bottom: 1px solid var(--border-muted);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-secondary);
}

.standings-table tbody tr:last-child td {
  border-bottom: none;
}

/* Row Hover */
.standings-table tbody tr {
  transition: background-color 0.15s ease;
}

.standings-table tbody tr:hover {
  background-color: var(--bg-elevated) !important;
}

/* Podium Rows */
.standings-table tbody tr.row-podium-1 {
  background-color: rgba(210, 153, 34, 0.08);
}

.standings-table tbody tr.row-podium-2 {
  background-color: rgba(110, 118, 129, 0.08);
}

.standings-table tbody tr.row-podium-3 {
  background-color: rgba(240, 136, 62, 0.08);
}

/* Position Cell */
.td-position {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  min-width: 48px;
  font-family: var(--font-display);
}

.td-position.pos-1 {
  color: #d29922;
}

.td-position.pos-2 {
  color: #6e7681;
}

.td-position.pos-3 {
  color: #f0883e;
}

/* Driver Cell */
.td-driver {
  min-width: 160px;
  width: 80%;
  font-size: 15px;
  font-weight: 500;
  text-align: left;
}

.driver-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.driver-name {
  font-size: 15px;
  /* font-weight: 500; */
  text-align: left;
  color: var(--text-primary);
  font-family: var(--font-body);
}

.team-logo {
  margin-left: auto;
  padding-right: 4px;
}

.team-logo img {
  height: 20px;
  width: auto;
  max-width: 60px;
  object-fit: contain;
}

.team-name {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
  text-align: right;
}

/* Podiums Cell */
.td-podiums {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 16px;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
  color: var(--text-secondary);
}

/* Round Cells (P, FL, Pts) */
.td-round {
  min-width: 36px;
  text-align: center;
  padding: 10px 2px;
  font-size: 13px;
  color: var(--text-secondary);
}

/* Center icons in cells */
.td-round :deep(svg),
.text-center :deep(svg) {
  display: block;
  margin: 0 auto;
}

/* Round cell with penalty */
.td-round.has-penalty {
  color: #ef4444;
}

/* Pole position icon */
.icon-pole {
  color: var(--cyan);
}

/* Fastest lap icon */
.icon-fl {
  color: var(--purple);
}

/* Add right border to last cell in each round group (Pts column) */
.td-round:nth-child(3n + 6) {
  border-right: 1px solid var(--border);
}

/* Total Cell */
.td-total {
  font-size: 16px !important;
  font-weight: 800;
  text-align: center;
  min-width: 64px;
  background-color: var(--bg-elevated);
  /* font-family: var(--font-display); */
  color: var(--text-primary) !important;
  padding: 10px 10px;
}

/* Drop Cell */
.td-drop {
  font-size: 16px !important;
  /* font-family: var(--font-display); */
  font-weight: 600;
  text-align: center;
  min-width: 64px;
  color: var(--cyan) !important;
  background-color: var(--bg-cyan);
  padding: 10px 10px;
}

/* Teams Table Specific Styles */
.teams-table thead tr th {
  background-color: var(--bg-card);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.teams-table th.th-position {
  width: 48px;
  text-align: center;
}

.teams-table th.th-team-logo {
  width: 80px;
  text-align: center;
}

.teams-table th.th-driver {
  text-align: left !important;
  min-width: 160px;
}

.teams-table th.th-round-single {
  width: 64px;
  padding: 12px 16px;
  border-right: 1px solid var(--border);
}

.teams-table th.th-total {
  width: 64px;
  background-color: var(--bg-elevated);
}

.teams-table th.th-drop {
  width: 64px;
  background-color: var(--bg-elevated);
}

.teams-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-muted);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-secondary) !important;
}

.teams-table .td-position {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  width: 48px;
  font-family: var(--font-display);
}

/* Team Championship Position Colors */
.teams-table .td-position.pos-1 {
  color: #d29922;
}

.teams-table .td-position.pos-2 {
  color: #6e7681;
}

.teams-table .td-position.pos-3 {
  color: #f0883e;
}

.teams-table .td-team-logo {
  width: 80px;
  text-align: center;
  padding: 8px 4px;
}

.team-championship-logo {
  height: 28px;
  width: auto;
  max-width: 70px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.teams-table .td-total {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  background-color: var(--bg-elevated);
  color: var(--text-primary) !important;
  padding: 10px 16px;
}

.teams-table .td-drop {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  color: var(--cyan) !important;
  background-color: var(--bg-elevated);
  padding: 10px 16px;
}
</style>
