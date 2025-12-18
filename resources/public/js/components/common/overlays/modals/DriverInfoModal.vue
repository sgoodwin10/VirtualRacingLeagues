<script setup lang="ts">
import { watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  PhTrophy,
  PhFlagCheckered,
  PhDiscordLogo,
  PhGameController,
  PhSteeringWheel,
  PhSpinner,
} from '@phosphor-icons/vue';
import VrlModal from './VrlModal.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import { useDriverInfo } from '@public/composables/useDriverInfo';

interface Props {
  modelValue: boolean;
  seasonDriverId: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const router = useRouter();
const { driver, isLoading, error, fetchDriver } = useDriverInfo();

// Fetch driver data when modal opens
watch(
  () => [props.modelValue, props.seasonDriverId] as const,
  async ([isOpen, driverId]) => {
    if (isOpen && driverId) {
      await fetchDriver(driverId);
    }
  },
  { immediate: true },
);

// Close handler
const handleClose = () => {
  emit('update:modelValue', false);
};

// Platform accounts that exist
const platformAccounts = computed(() => {
  if (!driver.value) return [];

  const accounts = [];
  const { platform_accounts } = driver.value;

  if (platform_accounts.discord_id) {
    accounts.push({
      icon: PhDiscordLogo,
      label: 'Discord',
      value: platform_accounts.discord_id,
    });
  }

  if (platform_accounts.psn_id) {
    accounts.push({
      icon: PhGameController,
      label: 'PSN',
      value: platform_accounts.psn_id,
    });
  }

  if (platform_accounts.iracing_id) {
    accounts.push({
      icon: PhSteeringWheel,
      label: 'iRacing',
      value: platform_accounts.iracing_id,
    });
  }

  return accounts;
});

// Navigate to season
const handleSeasonClick = (leagueSlug: string, seasonSlug: string) => {
  router.push({
    name: 'season-view',
    params: { leagueSlug, seasonSlug },
  });
  handleClose();
};

// Status badge variant mapping
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'active';
    case 'reserve':
      return 'upcoming';
    case 'withdrawn':
      return 'completed';
    default:
      return 'completed';
  }
};
</script>

<template>
  <VrlModal
    :model-value="modelValue"
    size="md"
    title="Driver Profile"
    @update:model-value="handleClose"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="driver-info-loading">
      <PhSpinner :size="32" class="animate-spin text-racing-gold" />
      <p class="driver-info-loading-text">Loading driver profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="driver-info-error">
      <p class="driver-info-error-text">{{ error }}</p>
    </div>

    <!-- Driver Profile -->
    <div v-else-if="driver" class="driver-info-content">
      <!-- Header: Driver Name & Number -->
      <div class="driver-info-header">
        <h3 class="driver-info-name">{{ driver.nickname }}</h3>
        <div v-if="driver.driver_number !== null" class="driver-info-number">
          {{ driver.driver_number }}
        </div>
      </div>

      <!-- Career Stats -->
      <div class="driver-info-section">
        <h4 class="driver-info-section-title">Career Statistics</h4>
        <div class="driver-info-stats">
          <!-- Poles -->
          <div class="driver-info-stat-card">
            <div class="driver-info-stat-icon">
              <PhFlagCheckered :size="20" weight="duotone" />
            </div>
            <div class="driver-info-stat-content">
              <div class="driver-info-stat-value">{{ driver.career_stats.total_poles }}</div>
              <div class="driver-info-stat-label">Pole Positions</div>
            </div>
          </div>

          <!-- Podiums -->
          <div class="driver-info-stat-card">
            <div class="driver-info-stat-icon driver-info-stat-icon--podium">
              <PhTrophy :size="20" weight="duotone" />
            </div>
            <div class="driver-info-stat-content">
              <div class="driver-info-stat-value">{{ driver.career_stats.total_podiums }}</div>
              <div class="driver-info-stat-label">Podiums</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Platform Accounts -->
      <div v-if="platformAccounts.length > 0" class="driver-info-section">
        <h4 class="driver-info-section-title">Platform Accounts</h4>
        <div class="driver-info-platforms">
          <div
            v-for="account in platformAccounts"
            :key="account.label"
            class="driver-info-platform"
          >
            <component
              :is="account.icon"
              :size="16"
              weight="duotone"
              class="driver-info-platform-icon"
            />
            <span class="driver-info-platform-label">{{ account.label }}:</span>
            <span class="driver-info-platform-value">{{ account.value }}</span>
          </div>
        </div>
      </div>

      <!-- Competitions -->
      <div v-if="driver.competitions.length > 0" class="driver-info-section">
        <h4 class="driver-info-section-title">Competitions</h4>
        <div class="driver-info-competitions">
          <button
            v-for="(comp, index) in driver.competitions"
            :key="index"
            type="button"
            class="driver-info-competition"
            @click="handleSeasonClick(comp.league_slug, comp.season_slug)"
          >
            <div class="driver-info-competition-info">
              <div class="driver-info-competition-league">{{ comp.league_name }}</div>
              <div class="driver-info-competition-season">{{ comp.season_name }}</div>
            </div>
            <VrlBadge :variant="getStatusVariant(comp.status)" :label="comp.status" />
          </button>
        </div>
      </div>
    </div>
  </VrlModal>
</template>

<style scoped>
/* Loading State */
.driver-info-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.driver-info-loading-text {
  font-family: var(--font-data);
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Error State */
.driver-info-error {
  padding: 2rem 1rem;
  text-align: center;
}

.driver-info-error-text {
  font-family: var(--font-data);
  font-size: 0.875rem;
  color: var(--racing-danger);
}

/* Content */
.driver-info-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.driver-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.driver-info-name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.025em;
}

.driver-info-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  height: 3rem;
  padding: 0 0.75rem;
  background: linear-gradient(135deg, var(--racing-gold) 0%, var(--racing-gold-dark) 100%);
  color: var(--racing-carbon);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  border-radius: 0.375rem;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

/* Section */
.driver-info-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.driver-info-section-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

/* Stats */
.driver-info-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.driver-info-stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--border-primary);
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.driver-info-stat-card:hover {
  border-color: var(--racing-gold);
  transform: translateY(-1px);
}

.driver-info-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--racing-gold);
  color: var(--racing-carbon);
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.driver-info-stat-icon--podium {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.driver-info-stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.driver-info-stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.driver-info-stat-label {
  font-family: var(--font-data);
  font-size: 0.625rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Platforms */
.driver-info-platforms {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.driver-info-platform {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-section);
  border: 1px solid var(--border-primary);
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.driver-info-platform:hover {
  background: var(--surface-card);
  border-color: var(--racing-gold);
}

.driver-info-platform-icon {
  color: var(--racing-gold);
  flex-shrink: 0;
}

.driver-info-platform-label {
  font-family: var(--font-data);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.driver-info-platform-value {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--text-primary);
}

/* Competitions */
.driver-info-competitions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.driver-info-competition {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem;
  background: var(--surface-section);
  border: 1px solid var(--border-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.driver-info-competition:hover {
  background: var(--surface-card);
  border-color: var(--racing-gold);
  transform: translateX(2px);
}

.driver-info-competition:focus {
  outline: 2px solid var(--racing-gold);
  outline-offset: 2px;
}

.driver-info-competition-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.driver-info-competition-league {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.025em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.driver-info-competition-season {
  font-family: var(--font-data);
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
