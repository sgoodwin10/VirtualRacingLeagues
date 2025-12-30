<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="p-8 flex items-center justify-center">
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <!-- Error State -->
    <Message v-else-if="error" severity="error" class="m-4">{{ error }}</Message>

    <!-- Empty State -->
    <div v-else-if="!standingsData || standingsData.standings.length === 0" class="p-8">
      <Message severity="info">No standings data available yet.</Message>
    </div>

    <!-- Standings Content -->
    <div v-else class="overflow-x-auto">
      <!-- Divisions or Teams: TabView -->
      <Tabs
        v-if="
          (standingsData.has_divisions && divisionsWithStandings.length > 0) ||
          showTeamsChampionship
        "
        v-model:value="activeTabId"
      >
        <TabList>
          <!-- Division Tabs -->
          <Tab
            v-for="division in divisionsWithStandings"
            :key="`division-${division.division_id}`"
            :value="`division-${division.division_id}`"
          >
            {{ division.division_name }}
          </Tab>

          <!-- Drivers Tab (when no divisions but teams championship enabled) -->
          <Tab v-if="!standingsData.has_divisions && showTeamsChampionship" :value="'drivers'">
            Drivers
          </Tab>

          <!-- Teams Tab -->
          <Tab v-if="showTeamsChampionship" :value="'teams'">Team Championship</Tab>
        </TabList>

        <TabPanels>
          <!-- Division Panels -->
          <TabPanel
            v-for="division in divisionsWithStandings"
            :key="`division-${division.division_id}`"
            :value="`division-${division.division_id}`"
          >
            <StandingsTable
              :drivers="division.drivers"
              :rounds="getRoundNumbers(division.drivers)"
              :drop-round-enabled="standingsData.drop_round_enabled"
            />
          </TabPanel>

          <!-- Drivers Panel (when no divisions but teams championship enabled) -->
          <TabPanel v-if="!standingsData.has_divisions && showTeamsChampionship" :value="'drivers'">
            <StandingsTable
              :drivers="flatDriverStandings"
              :rounds="getRoundNumbers(flatDriverStandings)"
              :drop-round-enabled="standingsData.drop_round_enabled"
            />
          </TabPanel>

          <!-- Teams Panel -->
          <TabPanel v-if="showTeamsChampionship" :value="'teams'">
            <TeamsStandingsTable
              :teams="teamChampionshipResults"
              :rounds="getTeamRoundNumbers(teamChampionshipResults)"
              :teams-drop-round-enabled="teamsDropRoundEnabled"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <!-- No Divisions and No Teams: Single Table -->
      <StandingsTable
        v-else
        :drivers="flatDriverStandings"
        :rounds="getRoundNumbers(flatDriverStandings)"
        :drop-round-enabled="standingsData.drop_round_enabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h, defineComponent } from 'vue';
import { PhCheck } from '@phosphor-icons/vue';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { getSeasonStandings } from '@app/services/seasonService';
import { getPodiumRowClass } from '@app/constants/podiumColors';
import type {
  SeasonStandingsResponse,
  SeasonStandingDriver,
  SeasonStandingDivision,
  RoundPoints,
  TeamChampionshipStanding,
} from '@app/types/seasonStandings';
import { isDivisionStandings } from '@app/types/seasonStandings';

interface Props {
  seasonId: number;
}

const props = defineProps<Props>();

const isLoading = ref(false);
const error = ref<string | null>(null);
const standingsData = ref<SeasonStandingsResponse | null>(null);
/**
 * Active tab ID for tab selection
 * Format: 'division-{id}', 'drivers', or 'teams'
 * Will be set to the first available tab when standings data loads
 */
const activeTabId = ref<string>('drivers');

/**
 * Get divisions with standings (only when divisions enabled), sorted by order
 */
const divisionsWithStandings = computed<readonly SeasonStandingDivision[]>(() => {
  if (!standingsData.value) {
    return [];
  }

  if (isDivisionStandings(standingsData.value)) {
    return [...standingsData.value.standings].sort((a, b) => a.order - b.order);
  }

  return [];
});

/**
 * Get flat driver standings (only when divisions disabled)
 */
const flatDriverStandings = computed<readonly SeasonStandingDriver[]>(() => {
  if (!standingsData.value) {
    return [];
  }

  if (!isDivisionStandings(standingsData.value)) {
    return standingsData.value.standings;
  }

  return [];
});

/**
 * Check if teams championship should be displayed
 */
const showTeamsChampionship = computed<boolean>(() => {
  return standingsData.value?.team_championship_enabled === true;
});

/**
 * Check if teams drop rounds are enabled
 */
const teamsDropRoundEnabled = computed<boolean>(() => {
  return standingsData.value?.teams_drop_rounds_enabled === true;
});

/**
 * Get team championship results, ensuring they are sorted by position
 */
const teamChampionshipResults = computed<readonly TeamChampionshipStanding[]>(() => {
  if (!standingsData.value || !showTeamsChampionship.value) {
    return [];
  }

  // Ensure results are sorted by position (should already be sorted from API)
  return [...standingsData.value.team_championship_results].sort((a, b) => a.position - b.position);
});

/**
 * Extract unique round numbers from drivers array
 * Aggregates round numbers from ALL drivers to ensure all rounds are included
 */
function getRoundNumbers(drivers: readonly SeasonStandingDriver[]): number[] {
  if (!drivers || drivers.length === 0) {
    return [];
  }

  // Aggregate unique round numbers from all drivers
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

/**
 * Extract unique round numbers from teams array
 * Aggregates round numbers from ALL teams to ensure all rounds are included
 */
function getTeamRoundNumbers(teams: readonly TeamChampionshipStanding[]): number[] {
  if (!teams || teams.length === 0) {
    return [];
  }

  // Aggregate unique round numbers from all teams
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

/**
 * Fetch season standings from API
 */
async function fetchStandings(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    standingsData.value = await getSeasonStandings(props.seasonId);

    // Set initial active tab based on available data
    if (standingsData.value.has_divisions && divisionsWithStandings.value.length > 0) {
      // If divisions exist, set to first division
      const firstDivision = divisionsWithStandings.value[0];
      if (firstDivision) {
        activeTabId.value = `division-${firstDivision.division_id}`;
      }
    } else if (standingsData.value.team_championship_enabled) {
      // If no divisions but teams championship enabled, default to drivers tab
      activeTabId.value = 'drivers';
    }
  } catch (err) {
    console.error('Failed to fetch season standings:', err);
    error.value = 'Failed to load season standings';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchStandings();
});

// Watch for seasonId changes to reload data when navigating between seasons
watch(
  () => props.seasonId,
  (newSeasonId, oldSeasonId) => {
    if (newSeasonId && newSeasonId !== oldSeasonId) {
      fetchStandings();
    }
  },
);

/**
 * TeamsStandingsTable - Internal component for rendering the teams standings table with round-by-round points
 */
const TeamsStandingsTable = defineComponent({
  name: 'TeamsStandingsTable',
  props: {
    teams: {
      type: Array as () => readonly TeamChampionshipStanding[],
      required: true,
    },
    rounds: {
      type: Array as () => readonly number[],
      required: true,
    },
    teamsDropRoundEnabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(tableProps) {
    /**
     * Get round data for a team
     */
    function getTeamRoundData(
      team: TeamChampionshipStanding,
      roundNumber: number,
    ): { points: number } | null {
      return team.rounds.find((r) => r.round_number === roundNumber) ?? null;
    }

    return () =>
      h('div', { class: 'overflow-x-auto' }, [
        h(
          'table',
          {
            class: 'w-full border-collapse',
            style: {
              fontFamily: 'var(--font-mono)',
            },
          },
          [
            // Header
            h('thead', {}, [
              h(
                'tr',
                {
                  style: {
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                  },
                },
                [
                  h(
                    'th',
                    {
                      class: 'w-12 text-center uppercase',
                      style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        color: 'var(--text-muted)',
                        padding: '12px 16px',
                      },
                    },
                    '#',
                  ),
                  h(
                    'th',
                    {
                      class: 'text-left uppercase min-w-[160px]',
                      style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        color: 'var(--text-muted)',
                        padding: '12px 16px',
                      },
                    },
                    'Team',
                  ),
                  ...tableProps.rounds.map((roundNum) =>
                    h(
                      'th',
                      {
                        key: `round-${roundNum}`,
                        class: 'w-16 text-center uppercase',
                        style: {
                          fontSize: '10px',
                          fontWeight: '600',
                          letterSpacing: '1px',
                          color: 'var(--text-muted)',
                          padding: '12px 16px',
                        },
                      },
                      `R${roundNum}`,
                    ),
                  ),
                  h(
                    'th',
                    {
                      class: 'w-20 text-center uppercase',
                      style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        color: 'var(--text-muted)',
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-elevated)',
                      },
                    },
                    'Total',
                  ),
                  ...(tableProps.teamsDropRoundEnabled
                    ? [
                        h(
                          'th',
                          {
                            class: 'w-20 text-center uppercase',
                            style: {
                              fontSize: '10px',
                              fontWeight: '600',
                              letterSpacing: '1px',
                              color: 'var(--text-muted)',
                              padding: '12px 16px',
                              backgroundColor: 'var(--bg-elevated)',
                            },
                          },
                          'Drop',
                        ),
                      ]
                    : []),
                ],
              ),
            ]),
            // Body
            h(
              'tbody',
              {},
              tableProps.teams.map((team) => {
                const podiumClass = getPodiumRowClass(team.position);
                const podiumBg =
                  team.position === 1
                    ? 'rgba(210, 153, 34, 0.08)'
                    : team.position === 2
                      ? 'rgba(110, 118, 129, 0.08)'
                      : team.position === 3
                        ? 'rgba(240, 136, 62, 0.08)'
                        : 'transparent';
                const positionColor =
                  team.position === 1
                    ? '#d29922'
                    : team.position === 2
                      ? '#6e7681'
                      : team.position === 3
                        ? '#f0883e'
                        : 'var(--text-primary)';

                return h(
                  'tr',
                  {
                    key: team.team_id,
                    class: podiumClass,
                    style: {
                      backgroundColor: podiumBg,
                      borderBottom: '1px solid var(--border-muted)',
                    },
                  },
                  [
                    // Position
                    h(
                      'td',
                      {
                        class: 'text-center',
                        style: {
                          fontSize: '14px',
                          fontWeight: '600',
                          color: positionColor,
                          padding: '14px 16px',
                        },
                      },
                      team.position,
                    ),
                    // Team name
                    h(
                      'td',
                      {
                        style: {
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          padding: '14px 16px',
                        },
                      },
                      team.team_name,
                    ),
                    // Round columns
                    ...tableProps.rounds.map((roundNum) => {
                      const roundData = getTeamRoundData(team, roundNum);
                      return h(
                        'td',
                        {
                          key: `${team.team_id}-${roundNum}`,
                          class: 'text-center',
                          style: {
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            padding: '14px 16px',
                          },
                        },
                        roundData?.points ?? 0,
                      );
                    }),
                    // Total points
                    h(
                      'td',
                      {
                        class: 'text-center',
                        style: {
                          fontSize: '16px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          padding: '14px 16px',
                          backgroundColor: 'var(--bg-elevated)',
                        },
                      },
                      team.total_points,
                    ),
                    // Drop total (conditional)
                    ...(tableProps.teamsDropRoundEnabled
                      ? [
                          h(
                            'td',
                            {
                              class: 'text-center',
                              style: {
                                fontSize: '16px',
                                fontWeight: '600',
                                color: 'var(--cyan)',
                                padding: '14px 16px',
                                backgroundColor: 'var(--bg-elevated)',
                              },
                            },
                            team.drop_total,
                          ),
                        ]
                      : []),
                  ],
                );
              }),
            ),
          ],
        ),
      ]);
  },
});

/**
 * StandingsTable - Internal component for rendering the standings table
 */
const StandingsTable = defineComponent({
  name: 'StandingsTable',
  props: {
    drivers: {
      type: Array as () => readonly SeasonStandingDriver[],
      required: true,
    },
    rounds: {
      type: Array as () => readonly number[],
      required: true,
    },
    dropRoundEnabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(tableProps) {
    /**
     * Get round data for a driver
     */
    function getRoundData(driver: SeasonStandingDriver, roundNumber: number): RoundPoints | null {
      return driver.rounds.find((r) => r.round_number === roundNumber) ?? null;
    }

    return () =>
      h('div', { class: 'overflow-x-auto' }, [
        h(
          'table',
          {
            class: 'w-full border-collapse',
            style: {
              fontFamily: 'var(--font-mono)',
            },
          },
          [
            // Header
            h('thead', {}, [
              // Main header row with round group headers
              h(
                'tr',
                {
                  style: {
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                  },
                },
                [
                  h(
                    'th',
                    {
                      class: 'w-12 text-center uppercase',
                      rowspan: 2,
                      style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        color: 'var(--text-muted)',
                        padding: '12px 16px',
                      },
                    },
                    '#',
                  ),
                  h(
                    'th',
                    {
                      class: 'text-left uppercase min-w-[160px]',
                      rowspan: 2,
                      style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        color: 'var(--text-muted)',
                        padding: '12px 16px',
                      },
                    },
                    'Driver',
                  ),
                  h(
                    'th',
                    {
                      class: 'w-16 text-center uppercase',
                      rowspan: 2,
                      title: 'Podium finishes (1st, 2nd, or 3rd place)',
                      style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        color: 'var(--text-muted)',
                        padding: '12px 16px',
                        borderLeft: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                      },
                    },
                    'Podiums',
                  ),
                  ...tableProps.rounds.map((roundNum) =>
                    h(
                      'th',
                      {
                        class: 'text-center uppercase',
                        colspan: 3,
                        style: {
                          fontSize: '10px',
                          fontWeight: '600',
                          letterSpacing: '1px',
                          color: 'var(--text-muted)',
                          padding: '8px 4px',
                          borderRight: '1px solid var(--border)',
                        },
                      },
                      `R${roundNum}`,
                    ),
                  ),
                  h(
                    'th',
                    {
                      class: 'w-16 text-center uppercase',
                      rowspan: 2,
                      style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        color: 'var(--text-muted)',
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-elevated)',
                      },
                    },
                    'Total',
                  ),
                  ...(tableProps.dropRoundEnabled
                    ? [
                        h(
                          'th',
                          {
                            class: 'w-16 text-center uppercase',
                            rowspan: 2,
                            style: {
                              fontSize: '10px',
                              fontWeight: '600',
                              letterSpacing: '1px',
                              color: 'var(--text-muted)',
                              padding: '12px 16px',
                              backgroundColor: 'var(--bg-elevated)',
                            },
                          },
                          'Drop',
                        ),
                      ]
                    : []),
                ],
              ),
              // Sub-header row for P, FL, Pts
              h(
                'tr',
                {
                  style: {
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                  },
                },
                [
                  ...tableProps.rounds.flatMap((roundNum) => [
                    h(
                      'th',
                      {
                        key: `${roundNum}-p`,
                        class: 'w-8 text-center uppercase',
                        title: 'Pole Position',
                        style: {
                          fontSize: '10px',
                          fontWeight: '500',
                          color: 'var(--text-muted)',
                          padding: '8px 4px',
                        },
                      },
                      'P',
                    ),
                    h(
                      'th',
                      {
                        key: `${roundNum}-fl`,
                        class: 'w-8 text-center uppercase',
                        title: 'Fastest Lap',
                        style: {
                          fontSize: '10px',
                          fontWeight: '500',
                          color: 'var(--text-muted)',
                          padding: '8px 4px',
                        },
                      },
                      'FL',
                    ),
                    h(
                      'th',
                      {
                        key: `${roundNum}-pts`,
                        class: 'w-10 text-center uppercase',
                        title: 'Points',
                        style: {
                          fontSize: '10px',
                          fontWeight: '500',
                          color: 'var(--text-muted)',
                          padding: '8px 4px',
                          borderRight: '1px solid var(--border)',
                        },
                      },
                      'Pts',
                    ),
                  ]),
                ],
              ),
            ]),
            // Body
            h(
              'tbody',
              {},
              tableProps.drivers.map((driver) => {
                const podiumClass = getPodiumRowClass(driver.position);
                const podiumBg =
                  driver.position === 1
                    ? 'rgba(210, 153, 34, 0.08)'
                    : driver.position === 2
                      ? 'rgba(110, 118, 129, 0.08)'
                      : driver.position === 3
                        ? 'rgba(240, 136, 62, 0.08)'
                        : 'transparent';
                const positionColor =
                  driver.position === 1
                    ? '#d29922'
                    : driver.position === 2
                      ? '#6e7681'
                      : driver.position === 3
                        ? '#f0883e'
                        : 'var(--text-primary)';

                return h(
                  'tr',
                  {
                    key: driver.driver_id,
                    class: podiumClass,
                    style: {
                      backgroundColor: podiumBg,
                      borderBottom: '1px solid var(--border-muted)',
                    },
                  },
                  [
                    // Position
                    h(
                      'td',
                      {
                        class: 'text-center',
                        style: {
                          fontSize: '14px',
                          fontWeight: '600',
                          color: positionColor,
                          padding: '14px 16px',
                        },
                      },
                      driver.position,
                    ),
                    // Driver name
                    h(
                      'td',
                      {
                        style: {
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          padding: '14px 16px',
                        },
                      },
                      driver.driver_name,
                    ),
                    // Podiums count
                    h(
                      'td',
                      {
                        class: 'text-center',
                        style: {
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          padding: '14px 16px',
                          borderLeft: '1px solid var(--border)',
                          borderRight: '1px solid var(--border)',
                        },
                      },
                      driver.podiums,
                    ),
                    // Round columns (P, FL, Pts for each round)
                    ...tableProps.rounds.flatMap((roundNum) => {
                      const roundData = getRoundData(driver, roundNum);
                      return [
                        // Pole Position
                        h(
                          'td',
                          {
                            key: `${driver.driver_id}-${roundNum}-p`,
                            class: 'text-center',
                            style: {
                              padding: '14px 4px',
                            },
                          },
                          roundData?.has_pole
                            ? h(PhCheck, {
                                size: 14,
                                weight: 'bold',
                                style: { color: 'var(--purple)' },
                              })
                            : h('span', { style: { color: 'var(--text-muted)' } }, '-'),
                        ),
                        // Fastest Lap
                        h(
                          'td',
                          {
                            key: `${driver.driver_id}-${roundNum}-fl`,
                            class: 'text-center',
                            style: {
                              padding: '14px 4px',
                            },
                          },
                          roundData?.has_fastest_lap
                            ? h(PhCheck, {
                                size: 14,
                                weight: 'bold',
                                style: { color: 'var(--purple)' },
                              })
                            : h('span', { style: { color: 'var(--text-muted)' } }, '-'),
                        ),
                        // Points
                        h(
                          'td',
                          {
                            key: `${driver.driver_id}-${roundNum}-pts`,
                            class: 'text-center',
                            style: {
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                              padding: '14px 4px',
                              borderRight: '1px solid var(--border)',
                            },
                          },
                          roundData?.points ?? 0,
                        ),
                      ];
                    }),
                    // Total points
                    h(
                      'td',
                      {
                        class: 'text-center',
                        style: {
                          fontSize: '16px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          padding: '14px 16px',
                          backgroundColor: 'var(--bg-elevated)',
                        },
                      },
                      driver.total_points,
                    ),
                    // Drop total (conditional)
                    ...(tableProps.dropRoundEnabled
                      ? [
                          h(
                            'td',
                            {
                              class: 'text-center',
                              style: {
                                fontSize: '16px',
                                fontWeight: '600',
                                color: 'var(--cyan)',
                                padding: '14px 16px',
                                backgroundColor: 'var(--bg-elevated)',
                              },
                            },
                            driver.drop_total,
                          ),
                        ]
                      : []),
                  ],
                );
              }),
            ),
          ],
        ),
      ]);
  },
});
</script>
