<template>
  <div class="whitelabel-season-view">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Loading season data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠</div>
      <h2 class="error-title">Error Loading Season</h2>
      <p class="error-message">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!seasonData" class="empty-container">
      <p class="empty-message">No season data available.</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Page Header -->
      <div class="page-header">
        <!-- League Logo -->
        <div v-if="leagueLogoUrl" class="league-logo">
          <img :src="leagueLogoUrl" :alt="`${seasonData.league.name} logo`" />
        </div>

        <!-- Season Info -->
        <div class="season-info">
          <h1 class="league-name">{{ seasonData.league.name }}</h1>
          <h2 class="season-name">
            {{ seasonData.competition.name }} - {{ seasonData.season.name }}
          </h2>
        </div>

        <!-- Season Logo -->
        <div v-if="seasonLogoUrl" class="season-logo">
          <img :src="seasonLogoUrl" :alt="`${seasonData.season.name} logo`" />
        </div>
      </div>

      <!-- Standings Section -->
      <section class="standings-section container mx-auto max-w-7xl">
        <div class="standings-header">
          <h3 class="section-title">Championship Standings</h3>
          <button class="export-button" @click="exportStandingsToCSV">
            <PhDownloadSimple :size="16" />
            <span class="hidden md:inline">Export Standings</span>
            <span class="inline md:hidden">Export</span>
          </button>
        </div>

        <!-- Tabs (if divisions or teams) -->
        <div
          v-if="
            (seasonData.has_divisions && divisionsWithStandings.length > 0) || showTeamsChampionship
          "
          class="tabs-container"
        >
          <button
            v-for="tab in standingsTabs"
            :key="tab.id"
            :class="['tab ', { active: activeStandingsTab === tab.id }]"
            @click="activeStandingsTab = tab.id"
          >
            <span class="hidden md:block">
              {{ tab.label }}
            </span>
            <span class="block md:hidden">
              {{
                tab.label
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
              }}
            </span>
          </button>
        </div>

        <!-- Division Tables -->
        <div
          v-for="division in divisionsWithStandings"
          v-show="activeStandingsTab === `division-${division.division_id}`"
          :key="`division-${division.division_id}`"
          class="standings-table-wrapper"
        >
        <div class="flex items-center gap-2 border-b border-gray-300">
          <div>
            <img src="/images/platforms/gran-turismo-7-logo.svg" alt="Gran Turismo 7" class="platform-logo" />
          </div>
          <div class="flex-1 text-center flex items-center justify-center text-3xl font-bold text-[var(--wl-text-primary)]">
            
              {{ seasonData.season.name }} - 
              {{ division.division_name }}
          </div>
          <div class="w-48">
            <div v-if="seasonLogoUrl" class="season-logo">
          <img :src="seasonLogoUrl" :alt="`${seasonData.season.name} logo`" />
        </div>
          </div>
        </div>
          
          <table class="standings-table">
            <thead>
              <tr>
                <th rowspan="2" class="th-position">#</th>
                <th v-if="showTeamsColumn" rowspan="2" class="th-team">Team</th>
                <th rowspan="2" class="th-driver">Driver</th>
                <th rowspan="2" class="th-podiums">Podiums</th>

                <th
                  v-for="roundNum in getRoundNumbers(division.drivers)"
                  :key="`header-${roundNum}`"
                  colspan="3"
                  class="th-round-group"
                >
                  R{{ roundNum }}
                </th>
                <th rowspan="2" class="th-total">Total</th>
                <th v-if="seasonData.drop_round_enabled" rowspan="2" class="th-drop">Drop</th>
              </tr>
              <tr class="sub-header-row">
                <template
                  v-for="roundNum in getRoundNumbers(division.drivers)"
                  :key="`subheader-${roundNum}`"
                >
                  <th class="th-sub th-fl">FL</th>
                  <th class="th-sub th-pole">P</th>
                  <th class="th-sub th-pts">Pts</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="driver in division.drivers"
                :key="driver.driver_id"
                :class="getPodiumClass(driver.position)"
              >
                <td :class="['td-position', getPodiumClass(driver.position)]">
                  {{ driver.position }}
                </td>
                <td v-if="showTeamsColumn" class="td-team">
                  <img
                    v-if="driver.team_logo"
                    :src="driver.team_logo"
                    :alt="driver.team_name || 'Team'"
                    class="team-logo-standalone"
                  />
                </td>
                <td class="td-driver">
                  {{ driver.driver_name }}
                </td>
                <td class="td-podiums">{{ driver.podiums }}</td>
                <template
                  v-for="roundNum in getRoundNumbers(division.drivers)"
                  :key="`round-${driver.driver_id}-${roundNum}`"
                >
                  <td class="td-fl">
                    <span
                      v-if="getRoundData(driver, roundNum)?.has_fastest_lap"
                      class="badge badge-fl"
                      title="Fastest Lap"
                      >✓</span
                    >
                    <span v-else>-</span>
                  </td>
                  <td class="td-pole">
                    <span
                      v-if="getRoundData(driver, roundNum)?.has_pole"
                      class="badge badge-pole"
                      title="Pole Position"
                      >✓</span
                    >
                    <span v-else>-</span>
                  </td>
                  <td class="td-pts">
                    {{ getRoundData(driver, roundNum)?.points ?? '-' }}
                  </td>
                </template>
                <td class="td-total">{{ driver.total_points }}</td>
                <td v-if="seasonData.drop_round_enabled" class="td-drop">
                  {{ driver.drop_total }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Points Progression Chart -->
          <div class="chart-container">
            <h5 class="chart-title">Points Progression</h5>
            <Chart type="line" :data="getDivisionChartData(division)" :options="chartOptions" />
          </div>
        </div>

        <!-- Flat Drivers Table (no divisions) -->
        <div
          v-if="!seasonData.has_divisions && !showTeamsChampionship"
          class="standings-table-wrapper"
        >
          <h4 class="division-title">
            <img src="/images/platforms/gran-turismo-7-logo.svg" alt="Gran Turismo 7" class="platform-logo" />
            Championship Standings
          </h4>
          <table class="standings-table">
            <thead>
              <tr>
                <th rowspan="2" class="th-position">#</th>
                <th v-if="showTeamsColumn" rowspan="2" class="th-team">Team</th>
                <th rowspan="2" class="th-driver">Driver</th>
                <th rowspan="2" class="th-podiums">Podiums</th>

                <th
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`header-${roundNum}`"
                  colspan="3"
                  class="th-round-group"
                >
                  R{{ roundNum }}
                </th>
                <th rowspan="2" class="th-total">Total</th>
                <th v-if="seasonData.drop_round_enabled" rowspan="2" class="th-drop">Drop</th>
              </tr>
              <tr class="sub-header-row">
                <template
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`subheader-${roundNum}`"
                >
                  <th class="th-sub th-fl">FL</th>
                  <th class="th-sub th-pole">P</th>
                  <th class="th-sub th-pts">Pts</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="driver in flatDriverStandings"
                :key="driver.driver_id"
                :class="getPodiumClass(driver.position)"
              >
                <td :class="['td-position', getPodiumClass(driver.position)]">
                  {{ driver.position }}
                </td>
                <td v-if="showTeamsColumn" class="td-team">
                  <img
                    v-if="driver.team_logo"
                    :src="driver.team_logo"
                    :alt="driver.team_name || 'Team'"
                    class="team-logo-standalone"
                  />
                </td>
                <td class="td-driver">
                  {{ driver.driver_name }}
                </td>
                <td class="td-podiums">{{ driver.podiums }}</td>
                <template
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`round-${driver.driver_id}-${roundNum}`"
                >
                  <td class="td-fl">
                    <span
                      v-if="getRoundData(driver, roundNum)?.has_fastest_lap"
                      class="badge badge-fl"
                      title="Fastest Lap"
                      >✓</span
                    >
                    <span v-else>-</span>
                  </td>
                  <td class="td-pole">
                    <span
                      v-if="getRoundData(driver, roundNum)?.has_pole"
                      class="badge badge-pole"
                      title="Pole Position"
                      >✓</span
                    >
                    <span v-else>-</span>
                  </td>
                  <td class="td-pts">
                    {{ getRoundData(driver, roundNum)?.points ?? '-' }}
                  </td>
                </template>
                <td class="td-total">{{ driver.total_points }}</td>
                <td v-if="seasonData.drop_round_enabled" class="td-drop">
                  {{ driver.drop_total }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Points Progression Chart -->
          <div class="chart-container">
            <h5 class="chart-title">Points Progression</h5>
            <Chart type="line" :data="getFlatDriverChartData()" :options="chartOptions" />
          </div>
        </div>

        <!-- Drivers Tab (when teams championship exists) -->
        <div
          v-if="!seasonData.has_divisions && showTeamsChampionship"
          v-show="activeStandingsTab === 'drivers'"
          class="standings-table-wrapper"
        >
          <h4 class="division-title">
            <img src="/images/platforms/gran-turismo-7-logo.svg" alt="Gran Turismo 7" class="platform-logo" />
            Drivers Championship
          </h4>
          <table class="standings-table">
            <thead>
              <tr>
                <th rowspan="2" class="th-position">#</th>
                <th v-if="showTeamsColumn" rowspan="2" class="th-team">Team</th>
                <th rowspan="2" class="th-driver">Driver</th>
                <th rowspan="2" class="th-podiums">Podiums</th>
                <th
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`header-${roundNum}`"
                  colspan="3"
                  class="th-round-group"
                >
                  R{{ roundNum }}
                </th>
                <th rowspan="2" class="th-total">Total</th>
                <th v-if="seasonData.drop_round_enabled" rowspan="2" class="th-drop">Drop</th>
              </tr>
              <tr class="sub-header-row">
                <template
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`subheader-${roundNum}`"
                >
                  <th class="th-sub th-fl">FL</th>
                  <th class="th-sub th-pole">P</th>
                  <th class="th-sub th-pts">Pts</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="driver in flatDriverStandings"
                :key="driver.driver_id"
                :class="getPodiumClass(driver.position)"
              >
                <td :class="['td-position', getPodiumClass(driver.position)]">
                  {{ driver.position }}
                </td>
                <td v-if="showTeamsColumn" class="td-team">
                  <img
                    v-if="driver.team_logo"
                    :src="driver.team_logo"
                    :alt="driver.team_name || 'Team'"
                    class="team-logo-standalone"
                  />
                </td>
                <td class="td-driver">
                  {{ driver.driver_name }}
                </td>
                <td class="td-podiums">{{ driver.podiums }}</td>
                <template
                  v-for="roundNum in getRoundNumbers(flatDriverStandings)"
                  :key="`round-${driver.driver_id}-${roundNum}`"
                >
                  <td class="td-fl">
                    <span
                      v-if="getRoundData(driver, roundNum)?.has_fastest_lap"
                      class="badge badge-fl"
                      title="Fastest Lap"
                      >✓</span
                    >
                    <span v-else>-</span>
                  </td>
                  <td class="td-pole">
                    <span
                      v-if="getRoundData(driver, roundNum)?.has_pole"
                      class="badge badge-pole"
                      title="Pole Position"
                      >✓</span
                    >
                    <span v-else>-</span>
                  </td>
                  <td class="td-pts">
                    {{ getRoundData(driver, roundNum)?.points ?? '-' }}
                  </td>
                </template>
                <td class="td-total">{{ driver.total_points }}</td>
                <td v-if="seasonData.drop_round_enabled" class="td-drop">
                  {{ driver.drop_total }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Points Progression Chart -->
          <div class="chart-container">
            <h5 class="chart-title">Points Progression</h5>
            <Chart type="line" :data="getFlatDriverChartData()" :options="chartOptions" />
          </div>
        </div>

        <!-- Teams Table -->
        <div
          v-if="showTeamsChampionship"
          v-show="activeStandingsTab === 'teams'"
          class="standings-table-wrapper"
        >
          <h4 class="division-title">
            <img src="/images/platforms/gran-turismo-7-logo.svg" alt="Gran Turismo 7" class="platform-logo" />
            Team Championship
          </h4>
          <table class="standings-table teams-table">
            <thead>
              <tr>
                <th class="th-position">#</th>
                <th class="th-driver">Team</th>
                <th
                  v-for="roundNum in getTeamRoundNumbers(teamChampionshipResults)"
                  :key="`team-header-${roundNum}`"
                  class="th-round"
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
                :class="getPodiumClass(team.position)"
              >
                <td :class="['td-position', getPodiumClass(team.position)]">
                  {{ team.position }}
                </td>
                <td class="td-driver">
                  <div class="team-cell">
                    <img
                      v-if="team.team_logo"
                      :src="team.team_logo"
                      :alt="team.team_name"
                      class="team-logo-img"
                    />
                    <span>{{ team.team_name }}</span>
                  </div>
                </td>
                <td
                  v-for="roundNum in getTeamRoundNumbers(teamChampionshipResults)"
                  :key="`team-round-${team.team_id}-${roundNum}`"
                  class="td-round"
                >
                  {{ getTeamRoundData(team, roundNum)?.points ?? '0' }}
                </td>
                <td class="td-total">{{ team.total_points }}</td>
                <td v-if="teamsDropRoundEnabled" class="td-drop">{{ team.drop_total }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Points Progression Chart -->
          <div class="chart-container w-full">
            <h5 class="chart-title">Team Progression</h5>
            <Chart type="line" :data="getTeamChartData()" :options="chartOptions" class="w-full" />
          </div>
        </div>
      </section>

      <!-- Rounds Section -->
      <section
        v-if="seasonData.rounds.length > 0"
        class="rounds-section container mx-auto max-w-5xl"
      >
        <h3 class="section-title">Race Rounds</h3>

        <div class="rounds-list">
          <div v-for="round in seasonData.rounds" :key="round.id" class="round-accordion">
            <!-- Round Header (clickable) -->
            <button class="round-header" @click="toggleRound(round.id)">
              <div class="round-header-content">
                <div class="round-badge">R{{ round.round_number }}</div>
                <div class="round-details">
                  <div class="round-title">{{ roundTitle(round) }}</div>
                  <div class="round-circuit">{{ circuitInfo(round) }}</div>
                </div>
              </div>
              <div :class="['chevron', { expanded: isRoundOpen(round.id) }]">▼</div>
            </button>

            <!-- Round Content (expandable) -->
            <div v-show="isRoundOpen(round.id)" class="round-content">
              <!-- Loading State -->
              <div v-if="isRoundLoading(round.id)" class="round-loading">
                <div class="spinner-small"></div>
                <span>Loading results...</span>
              </div>

              <!-- Results Content -->
              <template v-else-if="getRoundResultsData(round.id)">
                <!-- Main Tabs (if race times required) -->
                <div v-if="raceTimesRequired" class="main-tabs-container">
                  <div class="tabs-container">
                    <button
                      v-for="tab in getMainTabs()"
                      :key="tab.key"
                      :class="['tab', { active: getActiveMainTab(round.id) === tab.key }]"
                      @click="setActiveMainTab(round.id, tab.key)"
                    >
                      {{ tab.label }}
                    </button>
                  </div>
                </div>

                <!-- Round Results Tab -->
                <div
                  v-show="!raceTimesRequired || getActiveMainTab(round.id) === 'round-results'"
                  class="tab-content"
                >
                  <!-- Division Tabs (if has divisions) -->
                  <div
                    v-if="seasonData.has_divisions && getDivisionTabs(round.id).length > 0"
                    class="tabs-container division-tabs"
                  >
                    <button
                      v-for="tab in getDivisionTabs(round.id)"
                      :key="tab.key"
                      :class="[
                        'tab tab-minimal',
                        { active: getActiveDivisionTab(round.id) === tab.key },
                      ]"
                      @click="setActiveDivisionTab(round.id, tab.key)"
                    >
                      <span class="hidden md:block">
                        {{ tab.label }}
                      </span>
                      <span class="block md:hidden">
                        {{
                          tab.label
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                        }}
                      </span>
                    </button>
                  </div>

                  <!-- Round Standings -->
                  <div
                    v-if="getFilteredRoundStandings(round.id).length > 0"
                    class="round-standings"
                  >
                    <h4 class="subsection-title">Round Standings</h4>
                    <table class="results-table">
                      <thead>
                        <tr>
                          <th class="th-pos">#</th>
                          <th class="th-driver">Driver</th>
                          <th class="th-pts">Points</th>
                          <th class="th-race-pts">Race</th>
                          <th class="th-fl-pts">FL</th>
                          <th class="th-pole-pts">Pole</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="standing in getFilteredRoundStandings(round.id)"
                          :key="standing.driver_id"
                          :class="getPodiumClass(standing.position)"
                        >
                          <td :class="['td-pos', getPodiumClass(standing.position)]">
                            {{ standing.position }}
                          </td>
                          <td class="td-driver">{{ standing.driver_name }}</td>
                          <td class="td-pts">{{ standing.total_points }}</td>
                          <td class="td-race-pts">{{ standing.race_points }}</td>
                          <td class="td-fl-pts">{{ standing.fastest_lap_points }}</td>
                          <td class="td-pole-pts">{{ standing.pole_position_points }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Race Events -->
                  <div
                    v-if="getFilteredRaceEvents(round.id).length > 0"
                    class="race-events overflow-x-auto"
                  >
                    <div
                      v-for="raceEvent in getFilteredRaceEvents(round.id)"
                      :key="raceEvent.id"
                      class="race-event"
                    >
                      <div class="race-event-header">
                        <h4 class="race-event-title">
                          <span v-if="raceEvent.is_qualifier" class="race-type-badge qualifier"
                            >Qualifying</span
                          >
                          <span v-else class="race-type-badge race">{{
                            raceEvent.name || `Race ${raceEvent.race_number}`
                          }}</span>
                        </h4>
                        <button
                          class="export-button-sm"
                          @click="exportRaceEventToCSV(raceEvent, round.id)"
                        >
                          <PhDownloadSimple :size="14" />
                          Export
                        </button>
                      </div>

                      <table
                        v-if="
                          getProcessedRaceResults(
                            raceEvent,
                            seasonData.has_divisions && getActiveDivisionTab(round.id)
                              ? parseInt(getActiveDivisionTab(round.id), 10)
                              : undefined,
                          ).length > 0
                        "
                        class="results-table"
                      >
                        <thead>
                          <tr>
                            <th class="th-pos">#</th>
                            <th class="th-driver">Driver</th>
                            <!-- Race with times required: Time, Gap, Fastest Lap, Penalties -->
                            <template v-if="!raceEvent.is_qualifier && raceTimesRequired">
                              <th class="th-time">Time</th>
                              <th class="th-gap">Gap</th>
                              <th class="th-fl-time">Fastest Lap</th>
                              <th class="th-penalties">Penalties</th>
                            </template>
                            <!-- Qualifying with times required: Lap Time -->
                            <template v-else-if="raceEvent.is_qualifier && raceTimesRequired">
                              <th class="th-fl-time">Lap Time</th>
                            </template>
                            <!-- Basic time display (no times required) -->
                            <template v-else>
                              <th class="th-time">Time</th>
                              <!-- Fastest Lap time column for races (not qualifiers) -->
                              <th v-if="!raceEvent.is_qualifier" class="th-fl-time">Fastest Lap</th>
                            </template>
                            <!-- Positions gained (races only) -->
                            <th v-if="!raceEvent.is_qualifier" class="th-plusminus">+/-</th>
                            <!-- Points (if enabled) -->
                            <th v-if="raceEvent.race_points" class="th-pts">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="result in getProcessedRaceResults(
                              raceEvent,
                              seasonData.has_divisions && getActiveDivisionTab(round.id)
                                ? parseInt(getActiveDivisionTab(round.id), 10)
                                : undefined,
                            )"
                            :key="result.id"
                            :class="[
                              getPodiumClass(result.position ?? 0),
                              { 'dnf-row': result.dnf },
                            ]"
                          >
                            <td :class="['td-pos', getPodiumClass(result.position ?? 0)]">
                              {{ result.dnf ? 'DNF' : result.position }}
                            </td>
                            <td class="td-driver">
                              {{ result.driver.name }}
                              <span
                                v-if="result.has_pole && raceEvent.is_qualifier"
                                class="badge badge-pole ml-1"
                                >P</span
                              >
                              <span
                                v-if="
                                  result.has_fastest_lap &&
                                  !raceEvent.is_qualifier &&
                                  raceTimesRequired
                                "
                                class="badge badge-fl ml-1"
                                >FL</span
                              >
                              <span
                                v-if="result.dnf && !raceTimesRequired"
                                class="badge badge-dnf ml-1"
                                >DNF</span
                              >
                            </td>
                            <!-- Race with times required -->
                            <template v-if="!raceEvent.is_qualifier && raceTimesRequired">
                              <td class="td-time">
                                <span v-if="result.dnf" class="badge badge-dnf">DNF</span>
                                <span v-else>{{ formatRaceTime(result.final_race_time) }}</span>
                              </td>
                              <td class="td-gap">
                                <span v-if="result.calculated_time_diff">
                                  +{{ formatRaceTime(result.calculated_time_diff) }}
                                </span>
                              </td>
                              <td
                                class="td-fl-time"
                                :class="{
                                  'has-fastest': result.has_fastest_lap,
                                }"
                              >
                                {{ formatRaceTime(result.fastest_lap) }}
                              </td>
                              <td class="td-penalties" :class="{ 'has-penalty': result.penalties }">
                                {{ formatRaceTime(result.penalties) }}
                              </td>
                            </template>
                            <!-- Qualifying with times required -->
                            <template v-else-if="raceEvent.is_qualifier && raceTimesRequired">
                              <td class="td-fl-time" :class="{ 'has-pole': result.has_pole }">
                                {{ formatRaceTime(result.fastest_lap) }}
                              </td>
                            </template>
                            <!-- Basic time display -->
                            <template v-else>
                              <td class="td-time">
                                {{
                                  result.position === 1
                                    ? result.final_race_time
                                    : result.final_race_time_difference || '-'
                                }}
                              </td>
                              <!-- Fastest Lap time for races (not qualifiers) -->
                              <td
                                v-if="!raceEvent.is_qualifier"
                                class="td-fl-time"
                                :class="{ 'has-fastest': result.has_fastest_lap }"
                              >
                                {{ formatRaceTime(result.fastest_lap) || '-' }}
                              </td>
                            </template>
                            <!-- Positions gained -->
                            <td v-if="!raceEvent.is_qualifier" class="td-plusminus">
                              <span :class="getPositionsGainedClass(result.positions_gained)">
                                {{ formatPositionsGained(result.positions_gained) }}
                              </span>
                            </td>
                            <!-- Points -->
                            <td v-if="raceEvent.race_points" class="td-pts">
                              {{ result.race_points }}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div v-else class="no-results">No results available</div>
                    </div>
                  </div>

                  <!-- Empty Results -->
                  <div
                    v-if="
                      getFilteredRoundStandings(round.id).length === 0 &&
                      getFilteredRaceEvents(round.id).length === 0
                    "
                    class="empty-races"
                  >
                    No results available for this round
                  </div>
                </div>

                <!-- All Times Tab -->
                <div
                  v-if="raceTimesRequired && getActiveMainTab(round.id) === 'all-times'"
                  class="tab-content"
                >
                  <div
                    v-if="getSortedCombinedTimes(round.id).length > 0"
                    class="cross-division-table-wrapper"
                  >
                    <table class="cross-division-table all-times-table">
                      <thead>
                        <tr>
                          <th rowspan="2" class="th-pos">#</th>
                          <th rowspan="2" class="th-driver">Driver</th>
                          <th v-if="seasonData.has_divisions" rowspan="2" class="th-division">
                            <span class="hidden md:block">Division</span>
                            <span class="block md:hidden">Div</span>
                          </th>
                          <th
                            colspan="2"
                            class="th-time-group sortable"
                            :class="{ 'is-sorted': isColumnSorted(round.id, 'qualifying') }"
                            @click="handleAllTimesSort(round.id, 'qualifying')"
                          >
                            <span class="hidden md:block">Qualifying Time</span>
                            <span class="block md:hidden">Quali</span>
                            <span v-if="isColumnSorted(round.id, 'qualifying')" class="sort-arrow"
                              >▲</span
                            >
                          </th>
                          <th
                            colspan="2"
                            class="th-time-group sortable"
                            :class="{ 'is-sorted': isColumnSorted(round.id, 'race') }"
                            @click="handleAllTimesSort(round.id, 'race')"
                          >
                            <span class="hidden md:block">Race Time</span>
                            <span class="block md:hidden">Race</span>
                            <span v-if="isColumnSorted(round.id, 'race')" class="sort-arrow"
                              >▲</span
                            >
                          </th>
                          <th
                            colspan="2"
                            class="th-time-group sortable"
                            :class="{ 'is-sorted': isColumnSorted(round.id, 'fastest') }"
                            @click="handleAllTimesSort(round.id, 'fastest')"
                          >
                            <span class="hidden md:block">Fastest Lap</span>
                            <span class="block md:hidden">FL</span>
                            <span v-if="isColumnSorted(round.id, 'fastest')" class="sort-arrow"
                              >▲</span
                            >
                          </th>
                        </tr>
                        <tr class="sub-header-row">
                          <th class="th-sub th-time">Time</th>
                          <th class="th-sub th-gap">Gap</th>
                          <th class="th-sub th-time">Time</th>
                          <th class="th-sub th-gap">Gap</th>
                          <th class="th-sub th-time">Time</th>
                          <th class="th-sub th-gap">Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(entry, index) in getSortedCombinedTimes(round.id)"
                          :key="`${entry.driverName}-${entry.divisionId}`"
                          :class="getPodiumClass(index + 1)"
                        >
                          <td :class="['td-pos', getPodiumClass(index + 1)]">
                            {{ index + 1 }}
                          </td>
                          <td class="td-driver">{{ entry.driverName }}</td>
                          <td v-if="seasonData.has_divisions" class="td-division">
                            <span
                              v-if="entry.divisionName"
                              :class="['division-badge', getDivisionBadgeClass(entry.divisionId)]"
                            >
                              {{ entry.divisionName }}
                            </span>
                            <span v-else>&nbsp;</span>
                          </td>
                          <!-- Qualifying Time & Gap -->
                          <td
                            :class="[
                              'td-time',
                              { 'column-sorted': isColumnSorted(round.id, 'qualifying') },
                            ]"
                          >
                            {{ entry.qualifyingFormatted }}
                          </td>
                          <td
                            :class="[
                              'td-gap',
                              { 'column-sorted': isColumnSorted(round.id, 'qualifying') },
                            ]"
                          >
                            {{ entry.qualifyingGap || '-' }}
                          </td>
                          <!-- Race Time & Gap -->
                          <td
                            :class="[
                              'td-time',
                              { 'column-sorted': isColumnSorted(round.id, 'race') },
                            ]"
                          >
                            {{ entry.raceFormatted }}
                          </td>
                          <td
                            :class="[
                              'td-gap',
                              { 'column-sorted': isColumnSorted(round.id, 'race') },
                            ]"
                          >
                            {{ entry.raceGap || '-' }}
                          </td>
                          <!-- Fastest Lap Time & Gap -->
                          <td
                            :class="[
                              'td-time',
                              { 'column-sorted': isColumnSorted(round.id, 'fastest') },
                            ]"
                          >
                            {{ entry.fastestLapFormatted }}
                          </td>
                          <td
                            :class="[
                              'td-gap',
                              { 'column-sorted': isColumnSorted(round.id, 'fastest') },
                            ]"
                          >
                            {{ entry.fastestLapGap || '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="empty-races">No times available</div>
                </div>
              </template>

              <!-- No data loaded yet and not loading -->
              <div v-else class="empty-races">No results available</div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTitle } from '@vueuse/core';
import * as Sentry from '@sentry/vue';
import { PhDownloadSimple } from '@phosphor-icons/vue';
import { leagueService } from '@public/services/leagueService';
import { useGtm } from '@public/composables/useGtm';
import { getSiteConfig } from '@public/types/site-config';
import Chart from 'primevue/chart';
import type {
  PublicSeasonDetailResponse,
  SeasonStandingDriver,
  SeasonStandingDivision,
  RoundPoints,
  TeamChampionshipStanding,
  PublicRound,
  RoundResultsResponse,
  RaceEventResults,
  RaceResultWithDriver,
  RoundStandingDriver,
  RoundStandingDivision,
} from '@public/types/public';
import type { ChartData, ChartOptions } from 'chart.js';

const route = useRoute();
const { trackEvent } = useGtm();

// Route params
const leagueSlug = route.params.leagueSlug as string;
const seasonSlug = route.params.seasonSlug as string;

// State
const seasonData = ref<PublicSeasonDetailResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const activeStandingsTab = ref<string>('drivers');
const openRounds = ref<number[]>([]);
const roundResults = ref<Record<number, RoundResultsResponse>>({});
const loadingRounds = ref<number[]>([]);
const activeMainTabs = ref<Record<number, string>>({});
const activeDivisionTabs = ref<Record<number, string>>({});
const allTimesSortColumn = ref<Record<number, 'qualifying' | 'race' | 'fastest'>>({});
const allTimesSortDirection = ref<Record<number, 'asc'>>({});

/**
 * Page title for browser tab
 */
const pageTitle = computed(() => {
  if (!seasonData.value) return 'Loading...';
  const siteConfig = getSiteConfig();
  const siteName = siteConfig?.name || import.meta.env.VITE_APP_NAME || 'Virtual Racing Leagues';
  return `${seasonData.value.season.name} - WL - ${seasonData.value.competition.name} - ${seasonData.value.league.name} - ${siteName}`;
});

useTitle(pageTitle);

/**
 * League logo URL
 */
const leagueLogoUrl = computed((): string | null => {
  if (!seasonData.value) return null;
  return seasonData.value.league.logo?.original || seasonData.value.league.logo_url || null;
});

/**
 * Season logo URL
 */
const seasonLogoUrl = computed((): string | null => {
  if (!seasonData.value) return null;
  return seasonData.value.season.logo?.original || seasonData.value.season.logo_url || null;
});

/**
 * Divisions with standings (sorted by order)
 */
const divisionsWithStandings = computed<SeasonStandingDivision[]>(() => {
  if (!seasonData.value) return [];
  if (seasonData.value.has_divisions && Array.isArray(seasonData.value.standings)) {
    const firstItem = seasonData.value.standings[0];
    if (firstItem && 'division_id' in firstItem) {
      const divisions = seasonData.value.standings as SeasonStandingDivision[];
      return [...divisions].sort((a, b) => a.order - b.order);
    }
  }
  return [];
});

/**
 * Flat driver standings (when no divisions)
 */
const flatDriverStandings = computed<SeasonStandingDriver[]>(() => {
  if (!seasonData.value) return [];
  if (!seasonData.value.has_divisions && Array.isArray(seasonData.value.standings)) {
    const firstItem = seasonData.value.standings[0];
    if (firstItem && !('division_id' in firstItem)) {
      return seasonData.value.standings as SeasonStandingDriver[];
    }
  }
  return [];
});

/**
 * Show teams championship tab
 */
const showTeamsChampionship = computed<boolean>(() => {
  return seasonData.value?.team_championship_enabled === true;
});

/**
 * Show teams column in driver standings
 */
const showTeamsColumn = showTeamsChampionship;

/**
 * Teams drop round enabled
 */
const teamsDropRoundEnabled = computed<boolean>(() => {
  return seasonData.value?.teams_drop_rounds_enabled === true;
});

/**
 * Team championship results (sorted)
 */
const teamChampionshipResults = computed<TeamChampionshipStanding[]>(() => {
  if (!seasonData.value || !showTeamsChampionship.value) return [];
  const results = seasonData.value.team_championship_results ?? [];
  return [...results].sort((a, b) => a.position - b.position);
});

/**
 * Check if division has teams
 * @note Reserved for future use
 */
// @ts-expect-error - Reserved for future use
function _hasTeamsInDivision(division: SeasonStandingDivision): boolean {
  return division.drivers.some((d) => d.team_name || d.team_logo);
}

/**
 * Check if flat standings have teams
 * @note Reserved for future use
 */
// @ts-expect-error - Reserved for future use
const _hasTeamsInFlat = computed<boolean>(() => {
  return flatDriverStandings.value.some((d) => d.team_name || d.team_logo);
});

/**
 * Standings tabs
 */
const standingsTabs = computed(() => {
  const tabs: Array<{ id: string; label: string }> = [];

  if (seasonData.value?.has_divisions) {
    divisionsWithStandings.value.forEach((div) => {
      tabs.push({
        id: `division-${div.division_id}`,
        label: div.division_name,
      });
    });
  } else if (showTeamsChampionship.value) {
    tabs.push({ id: 'drivers', label: 'Drivers' });
  }

  if (showTeamsChampionship.value) {
    tabs.push({ id: 'teams', label: 'Team Championship' });
  }

  return tabs;
});

/**
 * Get round numbers from drivers
 */
function getRoundNumbers(drivers: SeasonStandingDriver[]): number[] {
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

/**
 * Get team round numbers
 */
function getTeamRoundNumbers(teams: TeamChampionshipStanding[]): number[] {
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

/**
 * Get round data for a driver
 */
function getRoundData(driver: SeasonStandingDriver, roundNumber: number): RoundPoints | undefined {
  return driver.rounds?.find((r) => r.round_number === roundNumber);
}

/**
 * Get team round data
 */
function getTeamRoundData(team: TeamChampionshipStanding, roundNumber: number) {
  return team.rounds.find((r) => r.round_number === roundNumber);
}

/**
 * Get podium CSS class
 */
function getPodiumClass(position: number): string {
  if (position === 1) return 'podium-1';
  if (position === 2) return 'podium-2';
  if (position === 3) return 'podium-3';
  return '';
}

/**
 * Load round results from API
 */
async function loadRoundResults(roundId: number): Promise<void> {
  if (roundResults.value[roundId] || loadingRounds.value.includes(roundId)) {
    return;
  }

  loadingRounds.value = [...loadingRounds.value, roundId];

  try {
    const response = await leagueService.getRoundResults(roundId);
    roundResults.value = { ...roundResults.value, [roundId]: response };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'load_round_results_whitelabel' },
    });
  } finally {
    loadingRounds.value = loadingRounds.value.filter((id) => id !== roundId);
  }
}

/**
 * Toggle round accordion
 */
async function toggleRound(roundId: number): Promise<void> {
  if (openRounds.value.includes(roundId)) {
    openRounds.value = openRounds.value.filter((id) => id !== roundId);
  } else {
    openRounds.value = [...openRounds.value, roundId];
    // Load results when opening
    await loadRoundResults(roundId);
  }
}

/**
 * Check if round is open
 */
function isRoundOpen(roundId: number): boolean {
  return openRounds.value.includes(roundId);
}

/**
 * Get round title
 */
function roundTitle(round: PublicRound): string {
  return round.name || `Round ${round.round_number}`;
}

/**
 * Get circuit info
 */
function circuitInfo(round: PublicRound): string {
  const parts: string[] = [];

  if (round.circuit_name) {
    parts.push(round.circuit_name);
  }

  if (round.track_layout) {
    parts.push(`(${round.track_layout})`);
  }

  if (round.circuit_country) {
    parts.push(`- ${round.circuit_country}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Circuit information not available';
}

/**
 * Get round results data
 */
function getRoundResultsData(roundId: number): RoundResultsResponse | undefined {
  return roundResults.value[roundId];
}

/**
 * Check if round is loading
 */
function isRoundLoading(roundId: number): boolean {
  return loadingRounds.value.includes(roundId);
}

/**
 * Get race events for a specific round
 */
function getRaceEvents(roundId: number): RaceEventResults[] {
  const data = roundResults.value[roundId];
  return data?.race_events ?? [];
}

/**
 * Check if race times are required
 */
const raceTimesRequired = computed<boolean>(() => {
  return seasonData.value?.season.race_times_required ?? false;
});

/**
 * Get active main tab for a round
 */
function getActiveMainTab(roundId: number): string {
  return activeMainTabs.value[roundId] ?? 'round-results';
}

/**
 * Set active main tab for a round
 */
function setActiveMainTab(roundId: number, tab: string): void {
  activeMainTabs.value = { ...activeMainTabs.value, [roundId]: tab };
}

/**
 * Get main tabs for a round
 */
function getMainTabs(): Array<{ key: string; label: string }> {
  const tabs = [{ key: 'round-results', label: 'Round Results' }];

  if (raceTimesRequired.value) {
    tabs.push({ key: 'all-times', label: 'All Times' });
  }

  return tabs;
}

/**
 * Get division tabs for a round
 */
function getDivisionTabs(roundId: number): Array<{ key: string; label: string }> {
  if (!seasonData.value?.has_divisions) return [];

  const data = roundResults.value[roundId];
  if (!data?.round?.round_results?.standings) return [];

  const standings = data.round.round_results.standings;
  const firstStanding = standings[0];

  if (standings.length > 0 && firstStanding && 'division_id' in firstStanding) {
    const divisionStandings = standings as RoundStandingDivision[];

    // Create a map of division ID to order index from the divisions array
    const divisionOrderMap = new Map(data.divisions.map((div, index) => [div.id, index]));

    // Sort standings by the division order
    const sortedStandings = [...divisionStandings].sort((a, b) => {
      const orderA = divisionOrderMap.get(a.division_id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = divisionOrderMap.get(b.division_id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    return sortedStandings.map((div) => ({
      key: String(div.division_id),
      label: div.division_name,
    }));
  }

  return [];
}

/**
 * Get active division tab for a round
 */
function getActiveDivisionTab(roundId: number): string {
  if (!activeDivisionTabs.value[roundId]) {
    // Set default to first division
    const tabs = getDivisionTabs(roundId);
    if (tabs.length > 0 && tabs[0]) {
      activeDivisionTabs.value = { ...activeDivisionTabs.value, [roundId]: tabs[0].key };
    }
  }
  return activeDivisionTabs.value[roundId] ?? '';
}

/**
 * Set active division tab for a round
 */
function setActiveDivisionTab(roundId: number, tab: string): void {
  activeDivisionTabs.value = { ...activeDivisionTabs.value, [roundId]: tab };
}

/**
 * Get round standings filtered by division
 */
function getFilteredRoundStandings(roundId: number): RoundStandingDriver[] {
  const data = roundResults.value[roundId];
  if (!data?.round?.round_results?.standings) return [];

  const standings = data.round.round_results.standings;

  if (!seasonData.value?.has_divisions) {
    return standings as RoundStandingDriver[];
  }

  const divisionKey = getActiveDivisionTab(roundId);
  const divisions = standings as RoundStandingDivision[];
  const activeDivision = divisions.find((div) => String(div.division_id) === divisionKey);

  return activeDivision ? activeDivision.results : [];
}

/**
 * Get race events filtered by division
 */
function getFilteredRaceEvents(roundId: number): RaceEventResults[] {
  const events = getRaceEvents(roundId);
  if (!seasonData.value?.has_divisions) {
    return events;
  }

  return events;
}

/**
 * Filter race event results by division
 */
function filterRaceResultsByDivision(
  results: RaceResultWithDriver[],
  divisionId: number | undefined,
): RaceResultWithDriver[] {
  if (divisionId === undefined) {
    return results;
  }
  return results.filter((result) => result.division_id === divisionId);
}

/**
 * Extended result with calculated time difference
 */
interface ProcessedRaceResult extends RaceResultWithDriver {
  calculated_time_diff?: string | null;
}

/**
 * Parse time string to milliseconds
 */
function parseTimeToMs(timeString: string | null): number | null {
  if (!timeString || timeString.trim() === '') {
    return null;
  }

  const timePattern = /^([+]?)(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/;
  const match = timeString.match(timePattern);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[2] ?? '0', 10);
  const minutes = parseInt(match[3] ?? '0', 10);
  const seconds = parseInt(match[4] ?? '0', 10);
  const milliseconds = parseInt(match[5] ?? '0', 10);

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

/**
 * Calculate effective time including penalties
 */
function calculateEffectiveTime(
  raceTimeMs: number | null,
  penaltiesMs: number | null,
): number | null {
  if (raceTimeMs === null) {
    return null;
  }
  if (penaltiesMs === null || penaltiesMs === 0) {
    return raceTimeMs;
  }
  return raceTimeMs + penaltiesMs;
}

/**
 * Format milliseconds to time string
 */
function formatMsToTime(timeMs: number): string {
  const hours = Math.floor(timeMs / 3600000);
  const minutes = Math.floor((timeMs % 3600000) / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);
  const milliseconds = timeMs % 1000;

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
}

/**
 * Get processed race results with calculated time differences
 */
function getProcessedRaceResults(
  raceEvent: RaceEventResults,
  divisionId: number | undefined,
): ProcessedRaceResult[] {
  let results = filterRaceResultsByDivision(raceEvent.results, divisionId);

  // For races with times required, calculate time differences
  if (!raceEvent.is_qualifier && raceTimesRequired.value && results.length > 0) {
    const nonDnfResults = results.filter(
      (r) => !r.dnf && r.original_race_time !== null && r.original_race_time !== '',
    );

    const sortedNonDnf = [...nonDnfResults].sort((a, b) => {
      const effectiveA = calculateEffectiveTime(
        parseTimeToMs(a.original_race_time ?? null),
        parseTimeToMs(a.penalties ?? null),
      );
      const effectiveB = calculateEffectiveTime(
        parseTimeToMs(b.original_race_time ?? null),
        parseTimeToMs(b.penalties ?? null),
      );
      if (effectiveA === null && effectiveB === null) return 0;
      if (effectiveA === null) return 1;
      if (effectiveB === null) return -1;
      return effectiveA - effectiveB;
    });

    const position1Driver = sortedNonDnf[0];

    if (position1Driver) {
      const position1RaceTimeMs = parseTimeToMs(position1Driver.original_race_time ?? null);
      const position1PenaltiesMs = parseTimeToMs(position1Driver.penalties ?? null);
      const position1EffectiveTimeMs = calculateEffectiveTime(
        position1RaceTimeMs,
        position1PenaltiesMs,
      );

      return results.map((result): ProcessedRaceResult => {
        if (result.dnf) {
          return { ...result, calculated_time_diff: null };
        }

        if (result.original_race_time === null || result.original_race_time === '') {
          return { ...result, calculated_time_diff: null };
        }

        if (result.id === position1Driver.id) {
          return { ...result, calculated_time_diff: null };
        }

        const driverRaceTimeMs = parseTimeToMs(result.original_race_time ?? null);
        const driverPenaltiesMs = parseTimeToMs(result.penalties ?? null);
        const driverEffectiveTimeMs = calculateEffectiveTime(driverRaceTimeMs, driverPenaltiesMs);

        let calculatedTimeDiff: string | null = null;
        if (position1EffectiveTimeMs !== null && driverEffectiveTimeMs !== null) {
          const timeDiffMs = driverEffectiveTimeMs - position1EffectiveTimeMs;
          calculatedTimeDiff = formatMsToTime(timeDiffMs);
        }

        return { ...result, calculated_time_diff: calculatedTimeDiff };
      });
    }
  }

  return results.map((result) => ({ ...result, calculated_time_diff: null }));
}

/**
 * Format race time for display
 */
function formatRaceTime(time: string | null | undefined): string {
  if (!time || time.trim() === '') {
    return '-';
  }
  return time;
}

/**
 * Format positions gained for display
 */
function formatPositionsGained(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (value === 0) {
    return '0';
  }
  if (value > 0) {
    return `+${value}`;
  }
  return value.toString();
}

/**
 * Get CSS class for positions gained
 */
function getPositionsGainedClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return 'neutral';
  }
  if (value > 0) {
    return 'positive';
  }
  return 'negative';
}

/**
 * Format time in MM:SS.mmm
 */
function formatTime(timeMs: number): string {
  if (timeMs == null) return '-';

  const MS_PER_SECOND = 1000;
  const SECONDS_PER_MINUTE = 60;

  const totalSeconds = Math.floor(timeMs / MS_PER_SECOND);
  const milliseconds = timeMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
}

/**
 * Format time difference as +SS.mmm or +MM:SS.mmm
 */
function formatTimeDifference(differenceMs: number): string {
  if (differenceMs == null) return '-';

  const MS_PER_SECOND = 1000;
  const SECONDS_PER_MINUTE = 60;

  const totalSeconds = Math.floor(differenceMs / MS_PER_SECOND);
  const milliseconds = differenceMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  if (minutes > 0) {
    return `+${minutes}:${formattedSeconds}.${formattedMs}`;
  } else {
    return `+${formattedSeconds}.${formattedMs}`;
  }
}

/**
 * Get division badge class for styling
 */
function getDivisionBadgeClass(divisionId: number | null): string {
  if (!divisionId || divisionId < 1) {
    return 'badge-default';
  }

  const variants = ['badge-cyan', 'badge-green', 'badge-purple', 'badge-orange', 'badge-red'];
  const variantIndex = (divisionId - 1) % variants.length;
  return variants[variantIndex] ?? variants[0] ?? '';
}

/**
 * Combined time entry for all times table
 */
interface CombinedTimeEntry {
  driverName: string;
  divisionId: number | null;
  divisionName: string | null;
  qualifyingTimeMs: number | null;
  raceTimeMs: number | null;
  fastestLapMs: number | null;
  qualifyingFormatted: string;
  qualifyingGap: string | null;
  raceFormatted: string;
  raceGap: string | null;
  fastestLapFormatted: string;
  fastestLapGap: string | null;
}

/**
 * Get combined times data merging qualifying, race, and fastest lap results
 */
function getCombinedTimesData(roundId: number): CombinedTimeEntry[] {
  const data = roundResults.value[roundId];
  if (!data) return [];

  const qualifyingResults = data.round?.qualifying_results ?? [];
  const raceTimeResults = data.round?.race_time_results ?? [];
  const fastestLapResults = data.round?.fastest_lap_results ?? [];

  // Build race results map
  const raceResultsMap = new Map();
  data.race_events.forEach((event) => {
    event.results.forEach((result) => raceResultsMap.set(result.id, result));
  });

  // Build divisions map
  const divisionsMap = new Map();
  data.divisions.forEach((division) => divisionsMap.set(division.id, division.name));

  // Build driver map with all times
  const driverMap = new Map<string, CombinedTimeEntry>();

  // Process qualifying results
  qualifyingResults.forEach((result) => {
    const raceResult = raceResultsMap.get(result.race_result_id);
    if (!raceResult) return;

    const driverName = raceResult.driver?.name || 'Unknown Driver';
    const divisionId = raceResult.division_id ?? null;
    const divisionName = divisionId ? divisionsMap.get(divisionId) || null : null;

    const key = `${driverName}-${divisionId || 'nodiv'}`;
    driverMap.set(key, {
      driverName,
      divisionId,
      divisionName,
      qualifyingTimeMs: result.time_ms,
      raceTimeMs: null,
      fastestLapMs: null,
      qualifyingFormatted: '', // Will be set later
      qualifyingGap: null,
      raceFormatted: '-',
      raceGap: null,
      fastestLapFormatted: '-',
      fastestLapGap: null,
    });
  });

  // Process race time results
  raceTimeResults.forEach((result) => {
    const raceResult = raceResultsMap.get(result.race_result_id);
    if (!raceResult) return;

    const driverName = raceResult.driver?.name || 'Unknown Driver';
    const divisionId = raceResult.division_id ?? null;
    const divisionName = divisionId ? divisionsMap.get(divisionId) || null : null;

    const key = `${driverName}-${divisionId || 'nodiv'}`;
    const existing = driverMap.get(key);

    if (existing) {
      existing.raceTimeMs = result.time_ms;
    } else {
      driverMap.set(key, {
        driverName,
        divisionId,
        divisionName,
        qualifyingTimeMs: null,
        raceTimeMs: result.time_ms,
        fastestLapMs: null,
        qualifyingFormatted: '-',
        qualifyingGap: null,
        raceFormatted: '', // Will be set later
        raceGap: null,
        fastestLapFormatted: '-',
        fastestLapGap: null,
      });
    }
  });

  // Process fastest lap results
  fastestLapResults.forEach((result) => {
    const raceResult = raceResultsMap.get(result.race_result_id);
    if (!raceResult) return;

    const driverName = raceResult.driver?.name || 'Unknown Driver';
    const divisionId = raceResult.division_id ?? null;
    const divisionName = divisionId ? divisionsMap.get(divisionId) || null : null;

    const key = `${driverName}-${divisionId || 'nodiv'}`;
    const existing = driverMap.get(key);

    if (existing) {
      existing.fastestLapMs = result.time_ms;
    } else {
      driverMap.set(key, {
        driverName,
        divisionId,
        divisionName,
        qualifyingTimeMs: null,
        raceTimeMs: null,
        fastestLapMs: result.time_ms,
        qualifyingFormatted: '-',
        qualifyingGap: null,
        raceFormatted: '-',
        raceGap: null,
        fastestLapFormatted: '', // Will be set later
        fastestLapGap: null,
      });
    }
  });

  const entries = Array.from(driverMap.values());

  // Find the fastest time in each category (minimum time)
  let fastestQualifyingMs: number | null = null;
  let fastestRaceMs: number | null = null;
  let fastestLapMs: number | null = null;

  entries.forEach((entry) => {
    if (
      entry.qualifyingTimeMs !== null &&
      (fastestQualifyingMs === null || entry.qualifyingTimeMs < fastestQualifyingMs)
    ) {
      fastestQualifyingMs = entry.qualifyingTimeMs;
    }
    if (entry.raceTimeMs !== null && (fastestRaceMs === null || entry.raceTimeMs < fastestRaceMs)) {
      fastestRaceMs = entry.raceTimeMs;
    }
    if (
      entry.fastestLapMs !== null &&
      (fastestLapMs === null || entry.fastestLapMs < fastestLapMs)
    ) {
      fastestLapMs = entry.fastestLapMs;
    }
  });

  // Format each entry's times (absolute for fastest, diff for others)
  entries.forEach((entry) => {
    // Qualifying
    if (entry.qualifyingTimeMs !== null) {
      entry.qualifyingFormatted = formatTime(entry.qualifyingTimeMs);
      if (entry.qualifyingTimeMs !== fastestQualifyingMs && fastestQualifyingMs !== null) {
        const diff = entry.qualifyingTimeMs - fastestQualifyingMs;
        entry.qualifyingGap = formatTimeDifference(diff);
      }
    } else {
      entry.qualifyingFormatted = '-';
    }

    // Race Time
    if (entry.raceTimeMs !== null) {
      entry.raceFormatted = formatTime(entry.raceTimeMs);
      if (entry.raceTimeMs !== fastestRaceMs && fastestRaceMs !== null) {
        const diff = entry.raceTimeMs - fastestRaceMs;
        entry.raceGap = formatTimeDifference(diff);
      }
    } else {
      entry.raceFormatted = '-';
    }

    // Fastest Lap
    if (entry.fastestLapMs !== null) {
      entry.fastestLapFormatted = formatTime(entry.fastestLapMs);
      if (entry.fastestLapMs !== fastestLapMs && fastestLapMs !== null) {
        const diff = entry.fastestLapMs - fastestLapMs;
        entry.fastestLapGap = formatTimeDifference(diff);
      }
    } else {
      entry.fastestLapFormatted = '-';
    }
  });

  return entries;
}

/**
 * Get sorted combined times data
 */
function getSortedCombinedTimes(roundId: number): CombinedTimeEntry[] {
  const data = getCombinedTimesData(roundId);
  if (data.length === 0) return [];

  // Initialize sort if not set
  if (!allTimesSortColumn.value[roundId]) {
    allTimesSortColumn.value = { ...allTimesSortColumn.value, [roundId]: 'qualifying' };
    allTimesSortDirection.value = { ...allTimesSortDirection.value, [roundId]: 'asc' };
  }

  const sortColumn = allTimesSortColumn.value[roundId] ?? 'qualifying';

  // Sort by the selected column (fastest times first)
  const sorted = [...data].sort((a, b) => {
    let aTime: number | null = null;
    let bTime: number | null = null;

    if (sortColumn === 'qualifying') {
      aTime = a.qualifyingTimeMs;
      bTime = b.qualifyingTimeMs;
    } else if (sortColumn === 'race') {
      aTime = a.raceTimeMs;
      bTime = b.raceTimeMs;
    } else if (sortColumn === 'fastest') {
      aTime = a.fastestLapMs;
      bTime = b.fastestLapMs;
    }

    // Null times go to the bottom
    if (aTime === null && bTime === null) return 0;
    if (aTime === null) return 1;
    if (bTime === null) return -1;

    // Ascending (fastest first)
    return aTime - bTime;
  });

  return sorted;
}

/**
 * Handle column sort click
 */
function handleAllTimesSort(roundId: number, column: 'qualifying' | 'race' | 'fastest'): void {
  allTimesSortColumn.value = { ...allTimesSortColumn.value, [roundId]: column };
  // We only support ascending (fastest first)
  allTimesSortDirection.value = { ...allTimesSortDirection.value, [roundId]: 'asc' };
}

/**
 * Check if column is currently sorted
 */
function isColumnSorted(roundId: number, column: 'qualifying' | 'race' | 'fastest'): boolean {
  return allTimesSortColumn.value[roundId] === column;
}

/**
 * Generate distinct colors for chart lines
 */
function generateDistinctColors(count: number): string[] {
  const colors = [
    '#2563eb', // blue
    '#dc2626', // red
    '#16a34a', // green
    '#ea580c', // orange
    '#9333ea', // purple
    '#0891b2', // cyan
    '#ca8a04', // yellow
    '#e11d48', // pink
    '#7c3aed', // violet
    '#059669', // emerald
    '#0284c7', // sky
    '#c026d3', // fuchsia
    '#65a30d', // lime
    '#d97706', // amber
    '#db2777', // rose
  ];

  // If we need more colors than predefined, generate them
  if (count > colors.length) {
    for (let i = colors.length; i < count; i++) {
      const hue = (i * 360) / count;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
  }

  return colors.slice(0, count);
}

/**
 * Calculate cumulative points for each driver over rounds
 * Handles missing rounds by carrying forward the previous cumulative total
 */
function calculateCumulativePoints(
  drivers: SeasonStandingDriver[],
  allRoundNumbers: number[],
): Map<string, number[]> {
  const cumulativeMap = new Map<string, number[]>();

  drivers.forEach((driver) => {
    const cumulative: number[] = [];
    let total = 0;

    // Create a map of round number to points for this driver
    const roundPointsMap = new Map<number, number>();
    if (driver.rounds && driver.rounds.length > 0) {
      driver.rounds.forEach((round) => {
        roundPointsMap.set(round.round_number, round.points ?? 0);
      });
    }

    // Iterate through all round numbers (not just the driver's rounds)
    allRoundNumbers.forEach((roundNumber) => {
      // If driver has data for this round, add the points
      if (roundPointsMap.has(roundNumber)) {
        total += roundPointsMap.get(roundNumber)!;
      }
      // Otherwise, carry forward the previous total (no change)
      cumulative.push(total);
    });

    cumulativeMap.set(driver.driver_name, cumulative);
  });

  return cumulativeMap;
}

/**
 * Calculate cumulative points for each team over rounds
 * Handles missing rounds by carrying forward the previous cumulative total
 */
function calculateTeamCumulativePoints(
  teams: TeamChampionshipStanding[],
  allRoundNumbers: number[],
): Map<string, number[]> {
  const cumulativeMap = new Map<string, number[]>();

  teams.forEach((team) => {
    const cumulative: number[] = [];
    let total = 0;

    // Create a map of round number to points for this team
    const roundPointsMap = new Map<number, number>();
    if (team.rounds && team.rounds.length > 0) {
      team.rounds.forEach((round) => {
        roundPointsMap.set(round.round_number, round.points ?? 0);
      });
    }

    // Iterate through all round numbers (not just the team's rounds)
    allRoundNumbers.forEach((roundNumber) => {
      // If team has data for this round, add the points
      if (roundPointsMap.has(roundNumber)) {
        total += roundPointsMap.get(roundNumber)!;
      }
      // Otherwise, carry forward the previous total (no change)
      cumulative.push(total);
    });

    cumulativeMap.set(team.team_name, cumulative);
  });

  return cumulativeMap;
}

/**
 * Get chart data for division drivers
 */
function getDivisionChartData(division: SeasonStandingDivision): ChartData {
  const roundNumbers = getRoundNumbers(division.drivers);
  const labels = roundNumbers.map((num) => `R${num}`);
  const cumulativePoints = calculateCumulativePoints(division.drivers, roundNumbers);
  const colors = generateDistinctColors(division.drivers.length);

  const datasets = division.drivers.map((driver, index) => ({
    label: driver.driver_name,
    data: cumulativePoints.get(driver.driver_name) || [],
    borderColor: colors[index] || '#000000',
    backgroundColor: colors[index] || '#000000',
    tension: 0.3,
    pointRadius: 4,
    pointHoverRadius: 6,
  }));

  return { labels, datasets };
}

/**
 * Get chart data for flat driver standings
 */
function getFlatDriverChartData(): ChartData {
  const roundNumbers = getRoundNumbers(flatDriverStandings.value);
  const labels = roundNumbers.map((num) => `R${num}`);
  const cumulativePoints = calculateCumulativePoints(flatDriverStandings.value, roundNumbers);
  const colors = generateDistinctColors(flatDriverStandings.value.length);

  const datasets = flatDriverStandings.value.map((driver, index) => ({
    label: driver.driver_name,
    data: cumulativePoints.get(driver.driver_name) || [],
    borderColor: colors[index] || '#000000',
    backgroundColor: colors[index] || '#000000',
    tension: 0.3,
    pointRadius: 4,
    pointHoverRadius: 6,
  }));

  return { labels, datasets };
}

/**
 * Get chart data for team championship
 */
function getTeamChartData(): ChartData {
  const roundNumbers = getTeamRoundNumbers(teamChampionshipResults.value);
  const labels = roundNumbers.map((num) => `R${num}`);
  const cumulativePoints = calculateTeamCumulativePoints(
    teamChampionshipResults.value,
    roundNumbers,
  );
  const colors = generateDistinctColors(teamChampionshipResults.value.length);

  const datasets = teamChampionshipResults.value.map((team, index) => ({
    label: team.team_name,
    data: cumulativePoints.get(team.team_name) || [],
    borderColor: colors[index] || '#000000',
    backgroundColor: colors[index] || '#000000',
    tension: 0.3,
    pointRadius: 4,
    pointHoverRadius: 6,
  }));

  return { labels, datasets };
}

/**
 * Chart options for all charts
 */
const chartOptions = computed<ChartOptions>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          return `${context.dataset.label}: ${context.parsed.y} pts`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: 'Rounds',
        font: {
          size: 12,
          weight: 'bold',
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      title: {
        display: true,
        text: 'Cumulative Points',
        font: {
          size: 12,
          weight: 'bold',
        },
      },
      ticks: {
        precision: 0,
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
}));

// ============================================
// CSV Export Functions
// ============================================

/**
 * Sanitize string for filename
 */
function sanitizeFilename(str: string): string {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Download CSV content as a file
 */
function downloadCSV(csvContent: string, filename: string): void {
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

  // Track CSV download event
  trackEvent('csv_download_click', {
    csv_filename: filename,
    league_name: leagueSlug,
    season_name: seasonSlug,
  });
}

/**
 * Generate CSV for driver standings
 */
function generateDriverStandingsCSV(drivers: SeasonStandingDriver[]): string {
  if (!drivers || drivers.length === 0) return '';

  const roundNumbers = getRoundNumbers(drivers);
  const hasDropRounds = seasonData.value?.drop_round_enabled ?? false;

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

/**
 * Generate CSV for team championship
 */
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

/**
 * Export standings to CSV based on active tab
 */
function exportStandingsToCSV(): void {
  if (!seasonData.value) return;

  let csvContent = '';
  let filename = '';

  if (activeStandingsTab.value === 'teams') {
    // Export team championship data
    csvContent = generateTeamChampionshipCSV();
    filename = `${sanitizeFilename(leagueSlug)}_${sanitizeFilename(seasonSlug)}_team_championship_standings.csv`;
  } else if (activeStandingsTab.value.startsWith('division-')) {
    // Export division standings
    const divisionId = parseInt(activeStandingsTab.value.replace('division-', ''));
    const division = divisionsWithStandings.value.find((d) => d.division_id === divisionId);
    if (division) {
      csvContent = generateDriverStandingsCSV(division.drivers);
      filename = `${sanitizeFilename(leagueSlug)}_${sanitizeFilename(seasonSlug)}_${sanitizeFilename(division.division_name)}_standings.csv`;
    }
  } else {
    // Export flat driver standings
    csvContent = generateDriverStandingsCSV(flatDriverStandings.value);
    const tabName = activeStandingsTab.value === 'drivers' ? 'drivers' : 'standings';
    filename = `${sanitizeFilename(leagueSlug)}_${sanitizeFilename(seasonSlug)}_${tabName}.csv`;
  }

  if (!csvContent) return;

  downloadCSV(csvContent, filename);
}

/**
 * Export race event results to CSV
 */
function exportRaceEventToCSV(raceEvent: RaceEventResults, roundId: number): void {
  if (!seasonData.value) return;

  const isQualifier = raceEvent.is_qualifier;
  const hasRaceTimes = raceTimesRequired.value;

  // Get filtered results based on active division
  const divisionId =
    seasonData.value.has_divisions && getActiveDivisionTab(roundId)
      ? parseInt(getActiveDivisionTab(roundId), 10)
      : undefined;
  const results = getProcessedRaceResults(raceEvent, divisionId);

  if (results.length === 0) return;

  // Build CSV headers based on visible columns
  const headers: string[] = ['Position', 'Driver Name'];

  if (!isQualifier && hasRaceTimes) {
    headers.push('Time', 'Gap');
  }

  if (hasRaceTimes) {
    headers.push(isQualifier ? 'Lap Time' : 'Fastest Lap');
  } else if (!isQualifier) {
    // Add Fastest Lap column even when race times not required
    headers.push('Fastest Lap');
  }

  if (!isQualifier && hasRaceTimes) {
    headers.push('Penalties');
  }

  if (!isQualifier) {
    headers.push('Positions Gained');
  }

  if (raceEvent.race_points) {
    headers.push('Points');
  }

  headers.push('DNF');

  if (isQualifier) {
    headers.push('Pole Position');
  }

  if (!isQualifier) {
    headers.push('Has Fastest Lap');
  }

  // Build CSV rows from filtered results
  const rows = results.map((result) => {
    const row: (string | number)[] = [result.position ?? '', result.driver?.name || 'Unknown'];

    if (!isQualifier && hasRaceTimes) {
      row.push(result.dnf ? 'DNF' : formatRaceTime(result.final_race_time) || '');
      row.push(
        result.calculated_time_diff ? `+${formatRaceTime(result.calculated_time_diff)}` : '',
      );
    }

    if (hasRaceTimes) {
      row.push(formatRaceTime(result.fastest_lap) || '');
    } else if (!isQualifier) {
      // Add Fastest Lap time even when race times not required
      row.push(formatRaceTime(result.fastest_lap) || '');
    }

    if (!isQualifier && hasRaceTimes) {
      row.push(formatRaceTime(result.penalties) || '');
    }

    if (!isQualifier) {
      row.push(formatPositionsGained(result.positions_gained));
    }

    if (raceEvent.race_points) {
      row.push(result.race_points ?? 0);
    }

    row.push(result.dnf ? 'Yes' : 'No');

    if (isQualifier) {
      row.push(result.has_pole ? 'Yes' : 'No');
    }

    if (!isQualifier) {
      row.push(result.has_fastest_lap ? 'Yes' : 'No');
    }

    return row;
  });

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape cells containing commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(','),
    ),
  ].join('\n');

  // Get round info for filename
  const round = seasonData.value.rounds.find((r) => r.id === roundId);
  const roundNumber = round?.round_number ?? 0;
  const raceName = raceEvent.is_qualifier
    ? 'qualifying'
    : raceEvent.name || `race_${raceEvent.race_number}`;

  const filename = `${sanitizeFilename(leagueSlug)}_${sanitizeFilename(seasonSlug)}_r${roundNumber}_${sanitizeFilename(raceName)}_results.csv`;

  downloadCSV(csvContent, filename);
}

/**
 * Fetch season detail
 */
const fetchSeasonDetail = async () => {
  if (!leagueSlug || !seasonSlug) {
    error.value = 'Invalid season';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    seasonData.value = await leagueService.getSeasonDetail(leagueSlug, seasonSlug);

    // Set default active tab
    if (seasonData.value.has_divisions && divisionsWithStandings.value.length > 0) {
      const firstDivision = divisionsWithStandings.value[0];
      if (firstDivision) {
        activeStandingsTab.value = `division-${firstDivision.division_id}`;
      }
    } else if (seasonData.value.team_championship_enabled) {
      activeStandingsTab.value = 'drivers';
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'fetch_season_detail_whitelabel' },
    });
    error.value = 'Failed to load season details. Please try again.';
  } finally {
    loading.value = false;
  }
};

/**
 * Initialize on mount
 */
onMounted(() => {
  fetchSeasonDetail();
});
</script>

<style scoped>
/* ============================================
   CSS Variables
   ============================================ */

.whitelabel-season-view {
  /* Text colors */
  --wl-text-primary: #111827;
  --wl-text-secondary: #6b7280;
  --wl-text-muted: #9ca3af;

  /* Backgrounds */
  --wl-bg-primary: #ffffff;
  --wl-bg-secondary: #f9fafb;
  --wl-bg-tertiary: #f3f4f6;

  /* Borders */
  --wl-border: #e5e7eb;

  /* Accent */
  --wl-accent-primary: #2563eb;

  /* Podium colors */
  --wl-gold: #d4af37;
  --wl-silver: #94a3b8;
  --wl-bronze: #cd7f32;
}

/* ============================================
   Base Layout
   ============================================ */

.whitelabel-season-view {
  min-height: 100vh;
  background-color: var(--wl-bg-primary);
  color: var(--wl-text-primary);
  padding: 2rem;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
}

/* ============================================
   Loading & Error States
   ============================================ */

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--wl-border);
  border-top-color: var(--wl-accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 1rem;
  color: var(--wl-text-secondary);
  font-size: 0.95rem;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--wl-text-primary);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--wl-text-secondary);
  font-size: 0.95rem;
}

.empty-message {
  color: var(--wl-text-secondary);
  font-size: 0.95rem;
}

/* ============================================
   Page Header
   ============================================ */

.page-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--wl-border);
}

.league-logo {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wl-bg-secondary);
  border: 1px solid var(--wl-border);
  border-radius: 4px;
}

.league-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.season-info {
  flex: 1;
}

.league-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--wl-text-primary);
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.season-name {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--wl-text-secondary);
  margin: 0;
  line-height: 1.3;
}

.season-logo {
  flex-shrink: 0;
  width: 140px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.season-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* ============================================
   Sections
   ============================================ */

.standings-section,
.rounds-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--wl-text-primary);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--wl-border);
}

/* Standings Header with Export */
.standings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.standings-header .section-title {
  margin: 0;
  flex: 1;
}

/* Export Buttons */
.export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--wl-text-secondary);
  background-color: var(--wl-bg-secondary);
  border: 1px solid var(--wl-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.export-button:hover {
  color: var(--wl-accent-primary);
  border-color: var(--wl-accent-primary);
  background-color: var(--wl-bg-primary);
}

.export-button-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--wl-text-secondary);
  background-color: var(--wl-bg-primary);
  border: 1px solid var(--wl-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.export-button-sm:hover {
  color: var(--wl-accent-primary);
  border-color: var(--wl-accent-primary);
}

/* Race Event Header */
.race-event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.race-event-header .race-event-title {
  margin: 0;
}

/* ============================================
   Tabs
   ============================================ */

.tabs-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--wl-border);
}

.tab {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--wl-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.tab:hover {
  color: var(--wl-text-primary);
  background: var(--wl-bg-secondary);
}

.tab.active {
  color: var(--wl-accent-primary);
  border-bottom-color: var(--wl-accent-primary);
}

/* Main Tabs Container (for round results) */
.main-tabs-container {
  margin-bottom: 1.5rem;
}

/* Division Tabs (minimal style) */
.division-tabs {
  margin-top: 1rem;
  border-bottom: 1px solid var(--wl-border);
}

.tab-minimal {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-bottom-width: 2px;
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ============================================
   Standings Table
   ============================================ */

.standings-table-wrapper {
  margin-bottom: 2rem;
  overflow-x: auto;
  border: 1px solid var(--wl-border);
  border-radius: 4px;
}

.division-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--wl-text-primary);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* font-family: var(--font-body); */
  /* text-transform: uppercase; */
}

.platform-logo {
  height: 70px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
  margin: 10px;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: var(--wl-bg-primary);
}

.standings-table thead {
  background: var(--wl-bg-secondary);
  border-bottom: 2px solid var(--wl-border);
}

.standings-table th {
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 700;
  color: var(--wl-text-primary);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
  border-right: 1px solid var(--wl-border);
}

.standings-table th:last-child {
  border-right: none;
}

.th-position {
  width: 50px;
}

.th-driver {
  text-align: left !important;
  min-width: 170px;
  max-width: 250px;
}

.th-team {
  text-align: left !important;
  min-width: 120px;
}

.th-round {
  width: 100px;
}

.th-total {
  width: 80px;
  background: var(--wl-bg-tertiary);
  font-weight: 800;
}

.th-drop {
  width: 80px;
  background: var(--wl-bg-tertiary);
  font-weight: 800;
}

.standings-table tbody tr {
  border-bottom: 1px solid var(--wl-border);
  transition: background-color 0.15s ease;
}

.standings-table tbody tr:hover {
  background: var(--wl-bg-secondary);
}

.standings-table tbody tr:last-child {
  border-bottom: none;
}

.standings-table td {
  padding: 0.75rem 0.5rem;
  text-align: center;
  color: var(--wl-text-primary);
  border-right: 1px solid var(--wl-border);
}

.standings-table td:last-child {
  border-right: none;
}

.td-position {
  font-weight: 700;
  font-size: 1rem;
}

.td-driver {
  text-align: left !important;
  font-weight: 600;
}

.td-team {
  text-align: left !important;
  font-size: 0.85rem;
  color: var(--wl-text-secondary);
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-logo-img {
  height: 20px;
  width: auto;
  max-width: 60px;
  object-fit: contain;
}

.th-team,
.td-team {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  text-align: center !important;
  padding: 0 !important;
}

.team-logo-standalone {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin: 0 auto;
}

.th-podiums,
.td-podiums {
  text-align: center;
  white-space: nowrap;
  width: 50px;
}

.td-round {
  font-size: 0.85rem;
}

.round-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
  justify-content: center;
}

.round-points {
  font-weight: 600;
}

.round-badges {
  display: flex;
  gap: 0.25rem;
}

.badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 3px;
  text-transform: uppercase;
}

.badge-pole {
  background: #dbeafe;
  color: #1e40af;
}

.badge-fl {
  background: #fce7f3;
  color: #be185d;
}

.td-total {
  font-weight: 800;
  font-size: 1rem;
  background: var(--wl-bg-tertiary);
}

.td-drop {
  font-weight: 700;
  font-size: 1rem;
  background: var(--wl-bg-tertiary);
  color: var(--wl-accent-primary);
}

/* Podium Classes */
.podium-1 {
  background: rgba(212, 175, 55, 0.1) !important;
}

.podium-1.td-position {
  color: var(--wl-gold);
  border-left: 4px solid var(--wl-gold);
}

.podium-2 {
  background: rgba(148, 163, 184, 0.1) !important;
}

.podium-2.td-position {
  color: var(--wl-silver);
  border-left: 4px solid var(--wl-silver);
}

.podium-3 {
  background: rgba(205, 127, 50, 0.1) !important;
}

.podium-3.td-position {
  color: var(--wl-bronze);
  border-left: 4px solid var(--wl-bronze);
}

/* Teams Table Specific */
.teams-table .td-driver {
  font-weight: 600;
}

/* ============================================
   Rounds Section
   ============================================ */

.rounds-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.round-accordion {
  border: 1px solid var(--wl-border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--wl-bg-primary);
}

.round-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--wl-bg-secondary);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
}

.round-header:hover {
  background: var(--wl-bg-tertiary);
}

.round-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.round-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--wl-accent-primary);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.round-details {
  flex: 1;
}

.round-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--wl-text-primary);
  /* margin-bottom: 0.25rem; */
}

.round-circuit {
  font-size: 0.875rem;
  color: var(--wl-text-secondary);
}

.chevron {
  font-size: 1rem;
  color: var(--wl-text-secondary);
  transition: transform 0.3s ease;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.round-content {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--wl-border);
  background: var(--wl-bg-primary);
}
@media (max-width: 768px) {
  .round-content {
    padding: 0.25rem 0.5rem;
  }
}

.races-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.race-item {
  padding: 0.75rem;
  background: var(--wl-bg-secondary);
  border: 1px solid var(--wl-border);
  border-radius: 4px;
}

.race-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.race-name {
  font-weight: 600;
  color: var(--wl-text-primary);
}

.race-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 3px;
  text-transform: uppercase;
}

.race-badge.qualifier {
  background: #dbeafe;
  color: #1e40af;
}

.race-badge.points {
  background: #d1fae5;
  color: #065f46;
}

.empty-races {
  padding: 2rem;
  text-align: center;
  color: var(--wl-text-secondary);
  font-size: 0.95rem;
}

/* ============================================
   Round Loading
   ============================================ */

.round-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--wl-text-secondary);
}

.spinner-small {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--wl-border);
  border-top-color: var(--wl-accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ============================================
   Round Standings & Race Events
   ============================================ */

.round-standings,
.race-events {
  margin-bottom: 1.5rem;
}

.round-standings:last-child,
.race-events:last-child {
  margin-bottom: 0;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--wl-text-primary);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--wl-border);
}

.race-event {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--wl-bg-secondary);
  border: 1px solid var(--wl-border);
  border-radius: 4px;
}

.race-event:last-child {
  margin-bottom: 0;
}

.race-event-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wl-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.race-type-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  text-transform: uppercase;
}

.race-type-badge.qualifier {
  background: #dbeafe;
  color: #1e40af;
}

/* ============================================
   Results Table
   ============================================ */

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  background: var(--wl-bg-primary);
  border: 1px solid var(--wl-border);
  border-radius: 4px;
  overflow: hidden;
}

.results-table thead {
  background: var(--wl-bg-tertiary);
}

.results-table th {
  padding: 0.5rem;
  text-align: center;
  font-weight: 700;
  color: var(--wl-text-primary);
  font-size: 0.75rem;
  text-transform: uppercase;
  border-bottom: 1px solid var(--wl-border);
}

.results-table th.th-driver {
  text-align: left;
}

.results-table td {
  padding: 0.5rem;
  text-align: center;
  color: var(--wl-text-primary);
  border-bottom: 1px solid var(--wl-border);
}

.results-table td.td-driver {
  text-align: left;
  font-weight: 600;
}

.results-table tbody tr:last-child td {
  border-bottom: none;
}

.results-table tbody tr:hover {
  background: var(--wl-bg-secondary);
}

.th-pos,
.td-pos {
  width: 50px;
}

.th-pts,
.td-pts,
.th-race-pts,
.td-race-pts,
.th-fl-pts,
.td-fl-pts,
.th-pole-pts,
.td-pole-pts {
  width: 60px;
  font-weight: 700;
}

.th-time,
.td-time {
  width: 150px;
  font-family: monospace;
}

.th-gap,
.td-gap {
  width: 100px;
  font-family: monospace;
  color: var(--wl-text-secondary);
}

.th-fl-time,
.td-fl-time {
  width: 130px;
  font-family: monospace;
}

.td-fl-time.has-fastest,
.td-fl-time.has-pole {
  color: #a855f7;
  font-weight: 700;
}

.th-penalties,
.td-penalties {
  width: 100px;
  font-family: monospace;
}

.td-penalties.has-penalty {
  color: #ef4444;
  font-weight: 600;
}

.th-plusminus,
.td-plusminus {
  width: 60px;
  font-family: monospace;
  font-weight: 600;
  text-align: center;
}

.td-plusminus .positive {
  color: #22c55e;
}

.td-plusminus .negative {
  color: #ef4444;
}

.td-plusminus .neutral {
  color: var(--wl-text-secondary);
}

.th-fl,
.td-fl {
  width: 50px;
}

.dnf-row {
  opacity: 0.6;
}

.badge-dnf {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid #ef4444;
}

.ml-1 {
  margin-left: 0.25rem;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: var(--wl-text-muted);
  font-size: 0.9rem;
}

/* ============================================
   Print Styles
   ============================================ */

@media print {
  .whitelabel-season-view {
    padding: 0;
  }

  .round-accordion {
    page-break-inside: avoid;
  }

  .round-content {
    display: block !important;
  }

  .chevron {
    display: none;
  }

  .tabs-container {
    display: none;
  }

  /* Show all tab content when printing */
  .standings-table-wrapper {
    display: block !important;
  }
}

/* ============================================
   Cross-Division Results Tables
   ============================================ */

.cross-division-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--wl-border);
  border-radius: 4px;
}

.cross-division-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  background: var(--wl-bg-primary);
}

.cross-division-table thead {
  background: var(--wl-bg-tertiary);
}

.cross-division-table th {
  padding: 0.5rem;
  text-align: center;
  font-weight: 700;
  color: var(--wl-text-primary);
  font-size: 0.75rem;
  text-transform: uppercase;
  border-bottom: 1px solid var(--wl-border);
}

.cross-division-table th.th-driver {
  text-align: left;
}

.cross-division-table td {
  padding: 0.5rem;
  text-align: center;
  color: var(--wl-text-primary);
  border-bottom: 1px solid var(--wl-border);
}

.cross-division-table td.td-driver {
  text-align: left;
  font-weight: 600;
}

.cross-division-table td.td-time {
  font-family: inherit;
  font-weight: 700;
  font-size: 0.825rem;
}

.time-gap {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 0.125rem;
}

.cross-division-table tbody tr:last-child td {
  border-bottom: none;
}

.cross-division-table tbody tr:hover {
  background: var(--wl-bg-secondary);
}

.th-division,
.td-division {
  width: 180px;
}

/* All Times Table - Group Headers */
.all-times-table .th-time-group {
  text-align: center;
  border-bottom: 1px solid var(--wl-border);
}

.all-times-table .th-time-group.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  position: relative;
  padding-right: 1.5rem;
}

.all-times-table .th-time-group.sortable:hover {
  background: var(--wl-bg-secondary);
}

.all-times-table .th-time-group.sortable.is-sorted {
  background: var(--wl-accent-primary);
  color: white;
}

.all-times-table .sort-arrow {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.65rem;
}

/* Sub-headers */
.all-times-table .sub-header-row .th-sub {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.25rem 0.5rem;
  background: var(--wl-bg-secondary);
  color: var(--wl-text-secondary);
  width: 4.5rem;
}

/* Equal width for all time/gap columns */
.all-times-table .td-time,
.all-times-table .td-gap {
  width: 5rem;
  min-width: 4.5rem;
  text-align: center;
}

.all-times-table .th-sub.th-time {
  border-right: 1px solid var(--wl-border);
}

/* Gap column styling */
.all-times-table .td-gap {
  font-size: 0.75rem;
  color: var(--wl-text-secondary);
  text-align: center;
  padding: 0.5rem 0.25rem;
}

/* Keep existing column-sorted highlight for both time and gap columns */
.all-times-table .td-time.column-sorted,
.all-times-table .td-gap.column-sorted {
  background: rgba(37, 99, 235, 0.08);
}

/* Division Badges */
.division-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-default {
  background: var(--wl-bg-elevated);
  color: var(--wl-text-secondary);
  border: 1px solid var(--wl-border);
}

.badge-cyan {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border: 1px solid #06b6d4;
}

.badge-green {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid #22c55e;
}

.badge-purple {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
  border: 1px solid #a855f7;
}

.badge-orange {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
  border: 1px solid #f97316;
}

.badge-red {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid #ef4444;
}

/* ============================================
   Chart Container
   ============================================ */

.chart-container {
  padding: 1.5rem;
  background: var(--wl-bg-secondary);
  border-top: 1px solid var(--wl-border);
}

.chart-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--wl-text-primary);
  margin: 0 0 1rem 0;
  text-align: center;
}

.chart-container :deep(canvas) {
  height: 400px !important;
}

/* ============================================
   Responsive Design
   ============================================ */

@media (max-width: 768px) {
  .whitelabel-season-view {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .league-logo {
    width: 60px;
    height: 60px;
  }

  .league-name {
    font-size: 1.5rem;
  }

  .season-name {
    font-size: 1.125rem;
  }

  .season-logo {
    width: 60px;
    height: 60px;
    margin-left: 0;
    align-self: flex-end;
  }

  .standings-table {
    font-size: 0.8rem;
  }

  .standings-table th,
  .standings-table td {
    padding: 0.5rem 0.25rem;
  }

  .th-round {
    width: 50px;
  }

  .round-header-content {
    gap: 0.75rem;
  }

  .round-badge {
    width: 40px;
    height: 40px;
    font-size: 0.75rem;
  }

  .round-title {
    font-size: 0.95rem;
  }

  .round-circuit {
    font-size: 0.8rem;
  }

  .chart-container :deep(canvas) {
    height: 300px !important;
  }
}

/* ============================================
   Round Sub-Columns (FL, P, Pts)
   ============================================ */

.th-round-group {
  text-align: center;
  border-bottom: 1px solid var(--wl-border);
  padding: 0.25rem !important;
}

.sub-header-row th {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--wl-text-secondary);
  padding: 0.25rem;
}

.th-sub {
  font-size: 0.65rem;
  font-weight: 500;
  text-align: center;
  padding: 0.15rem 0.25rem;
}

.th-fl,
.th-pole,
.th-pts,
.td-fl,
.td-pole,
.td-pts {
  text-align: center;
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  padding: 0.25rem;
}

.td-fl .badge-fl,
.td-pole .badge-pole {
  font-size: 0.65rem;
}
</style>
