<template>
  <div class="standings-container">
    <table class="standings-table">
      <thead>
        <tr>
          <th class="col-pos">Pos</th>
          <th class="col-driver">Driver</th>
          <th class="col-points">Points</th>
          <th v-for="round in rounds" :key="round.round_id" class="col-round" :title="round.name">
            R{{ round.round_number }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="driver in drivers"
          :key="driver.driver_id"
          class="driver-row"
          :class="{ 'is-leader': driver.position === 1 }"
        >
          <td class="col-pos">
            <span class="position" :class="`position-${driver.position}`">
              {{ driver.position }}
            </span>
          </td>
          <td class="col-driver">
            <span class="driver-name">{{ driver.driver_name }}</span>
          </td>
          <td class="col-points">
            <span class="points">{{ driver.total_points }}</span>
          </td>
          <td v-for="round in rounds" :key="round.round_id" class="col-round">
            <div class="round-result">
              <span class="round-points">
                {{ getRoundPoints(driver, round.round_id) }}
              </span>
              <div class="round-badges">
                <span
                  v-if="hasPole(driver, round.round_id)"
                  class="badge badge-pole"
                  title="Pole Position"
                >
                  P
                </span>
                <span
                  v-if="hasFastestLap(driver, round.round_id)"
                  class="badge badge-fl"
                  title="Fastest Lap"
                >
                  FL
                </span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { SeasonStandingDriver } from '@public/types/public';

interface Round {
  round_id: number;
  round_number: number;
  name: string;
}

interface Props {
  drivers: SeasonStandingDriver[];
  rounds: Round[];
}

const { drivers, rounds } = defineProps<Props>();

const getRoundPoints = (driver: SeasonStandingDriver, roundId: number): string => {
  const roundData = driver.rounds.find((r) => r.round_id === roundId);
  return roundData ? roundData.points.toString() : '-';
};

const hasPole = (driver: SeasonStandingDriver, roundId: number): boolean => {
  const roundData = driver.rounds.find((r) => r.round_id === roundId);
  return roundData?.has_pole ?? false;
};

const hasFastestLap = (driver: SeasonStandingDriver, roundId: number): boolean => {
  const roundData = driver.rounds.find((r) => r.round_id === roundId);
  return roundData?.has_fastest_lap ?? false;
};
</script>

<style scoped>
.standings-container {
  overflow-x: auto;
  background: var(--color-asphalt);
  border: 1px solid var(--color-tarmac);
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.standings-table th {
  font-family: var(--font-display);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-barrier);
  padding: var(--space-md) var(--space-sm);
  text-align: left;
  border-bottom: 1px solid var(--color-tarmac);
  background: var(--color-carbon);
  position: sticky;
  top: 0;
  z-index: 5;
}

.standings-table td {
  padding: var(--space-md) var(--space-sm);
  border-bottom: 1px solid rgba(45, 45, 45, 0.5);
  vertical-align: middle;
}

.col-pos {
  width: 60px;
  text-align: center;
}

.col-driver {
  min-width: 150px;
}

.col-points {
  width: 80px;
  text-align: center;
}

.col-round {
  width: 70px;
  text-align: center;
}

/* Position styling */
.position {
  font-family: var(--font-display);
  font-size: 1.25rem;
  display: inline-block;
  width: 40px;
  text-align: center;
}

.position-1 {
  color: var(--color-pole);
}

.position-2 {
  color: var(--color-podium-2);
}

.position-3 {
  color: var(--color-podium-3);
}

/* Driver */
.driver-name {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-pit-white);
}

/* Points */
.points {
  font-family: var(--font-data);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-pit-white);
}

/* Round Results */
.round-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.round-points {
  font-family: var(--font-data);
  font-size: 0.875rem;
  color: var(--color-barrier);
}

.round-badges {
  display: flex;
  gap: 2px;
}

.badge {
  font-family: var(--font-display);
  font-size: 0.5rem;
  padding: 1px 4px;
  border-radius: 2px;
}

.badge-pole {
  background: rgba(212, 168, 83, 0.3);
  color: var(--color-gold);
}

.badge-fl {
  background: rgba(168, 85, 247, 0.3);
  color: var(--color-fastest-lap);
}

/* Row States */
.driver-row {
  transition: background var(--duration-fast);
}

.driver-row:hover {
  background: rgba(212, 168, 83, 0.05);
}

.driver-row.is-leader {
  background: rgba(212, 168, 83, 0.08);
}

.driver-row.is-leader .driver-name {
  color: var(--color-gold);
}

.driver-row.is-leader .points {
  color: var(--color-gold);
}
</style>
