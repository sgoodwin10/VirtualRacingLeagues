<template>
  <div
    class="standings-section bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] overflow-hidden"
  >
    <table class="teams-standings-table w-full border-collapse">
      <thead>
        <tr>
          <th class="text-center">#</th>
          <th class="text-left">Team</th>
          <th v-for="roundNum in rounds" :key="roundNum" class="text-center">R{{ roundNum }}</th>
          <th class="text-center bg-[var(--bg-elevated)]">Total</th>
          <th v-if="teamsDropRoundEnabled" class="text-center bg-[var(--bg-elevated)]">Drop</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="team in teams" :key="team.team_id" :class="getPodiumClass(team.position)">
          <!-- Position -->
          <td :class="['position-cell text-center', getPositionClass(team.position)]">
            {{ team.position }}
          </td>

          <!-- Team Name -->
          <td>
            <div class="team-name font-medium">{{ team.team_name }}</div>
          </td>

          <!-- Round Points -->
          <td
            v-for="roundNum in rounds"
            :key="`${team.team_id}-${roundNum}`"
            class="round-cell text-center text-sm text-[var(--text-secondary)]"
          >
            {{ getRoundPoints(team, roundNum) }}
          </td>

          <!-- Total Points -->
          <td
            class="points-cell font-[var(--font-display)] font-bold text-center bg-[var(--bg-elevated)]"
          >
            {{ team.total_points }}
          </td>

          <!-- Drop Total (conditional) -->
          <td
            v-if="teamsDropRoundEnabled"
            class="drop-cell font-[var(--font-display)] font-semibold text-center text-[var(--cyan)] bg-[var(--bg-elevated)]"
          >
            {{ team.drop_total ?? team.total_points }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { TeamChampionshipStanding } from '@public/types/public';

interface Props {
  teams: TeamChampionshipStanding[];
  rounds: number[];
  teamsDropRoundEnabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  teamsDropRoundEnabled: false,
});

/**
 * Get podium row class
 */
const getPodiumClass = (position: number): string => {
  if (position === 1) return 'podium-1 bg-[rgba(210,153,34,0.08)]';
  if (position === 2) return 'podium-2 bg-[rgba(110,118,129,0.08)]';
  if (position === 3) return 'podium-3 bg-[rgba(240,136,62,0.08)]';
  return '';
};

/**
 * Get position cell class for text color
 */
const getPositionClass = (position: number): string => {
  if (position === 1) return 'p1 text-[var(--yellow)]';
  if (position === 2) return 'p2 text-[var(--text-muted)]';
  if (position === 3) return 'p3 text-[var(--orange)]';
  return '';
};

/**
 * Get points for a specific round
 */
const getRoundPoints = (team: TeamChampionshipStanding, roundNum: number): string => {
  const roundData = team.rounds?.find((r) => r.round_number === roundNum);
  return roundData?.points !== undefined ? String(roundData.points) : '0';
};
</script>

<style scoped>
.teams-standings-table th {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.teams-standings-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-muted);
  font-size: 0.9rem;
  color: var(--text-secondary) !important;
}

.teams-standings-table tr:last-child td {
  border-bottom: none;
}

.teams-standings-table tbody tr:hover {
  background: var(--bg-elevated);
}

.position-cell {
  font-family: var(--font-display);
  font-weight: 700;
  width: 50px;
}

.round-cell {
  min-width: 60px;
}

.points-cell,
.drop-cell {
  min-width: 80px;
}
</style>
