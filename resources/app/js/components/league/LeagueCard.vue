<script setup lang="ts">
import { computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { IconButton } from '@app/components/common/buttons';
import ResponsiveImage from '@app/components/common/ResponsiveImage.vue';
import { useLeagueStore } from '@app/stores/leagueStore';
import { useUserStore } from '@app/stores/userStore';
import type { League } from '@app/types/league';
import { PhClock, PhPencil, PhTrash, PhArrowRight } from '@phosphor-icons/vue';

interface Props {
  league: League;
}

interface Emits {
  (e: 'view', leagueId: number): void;
  (e: 'edit', leagueId: number): void;
  (e: 'delete', leagueId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const confirm = useConfirm();
const leagueStore = useLeagueStore();
const userStore = useUserStore();

const isOwner = computed(() => {
  return userStore.user?.id === props.league.owner_user_id;
});

const visibilityBadgeClass = computed(() => {
  const baseClass = 'visibility-badge';
  return `${baseClass} ${baseClass}--${props.league.visibility}`;
});

const leagueInitials = computed(() => {
  const words = props.league.name.split(' ');
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (props.league.name.substring(0, 2) || 'L').toUpperCase();
});

function handleView(): void {
  emit('view', props.league.id);
}

function handleEdit(): void {
  emit('edit', props.league.id);
}

function confirmDelete(): void {
  confirm.require({
    message: `Are you sure you want to delete "${props.league.name}"? This action cannot be undone.`,
    header: 'Delete League',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteLeague(),
  });
}

async function deleteLeague(): Promise<void> {
  try {
    await leagueStore.removeLeague(props.league.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'League deleted successfully',
      life: 3000,
    });
    emit('delete', props.league.id);
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete league',
      life: 5000,
    });
  }
}
</script>

<template>
  <article class="league-card">
    <!-- Card Header -->
    <div class="card-header">
      <!-- Header Image -->
      <ResponsiveImage
        v-if="league.header_image || league.header_image_url"
        :media="league.header_image"
        :fallback-url="league.header_image_url ?? undefined"
        :alt="league.name"
        sizes="(max-width: 640px) 100vw, 340px"
        img-class="card-header-image"
      />
      <div v-else class="card-header-placeholder" />

      <!-- Gradient Overlay -->
      <div class="card-header-gradient" />

      <!-- Cyan Hover Overlay -->
      <div class="card-header-overlay" />

      <!-- Visibility Badge (Top-Left) -->
      <span :class="visibilityBadgeClass">
        <span class="visibility-dot" />
        {{ league.visibility }}
      </span>

      <!-- Quick Actions (Top-Right, shown on hover) -->
      <div v-if="isOwner" class="quick-actions">
        <IconButton
          :icon="PhPencil"
          variant="ghost"
          size="sm"
          class="action-btn action-btn--edit"
          aria-label="Edit league"
          @click="handleEdit"
        />
        <IconButton
          :icon="PhTrash"
          variant="ghost"
          size="sm"
          class="action-btn action-btn--delete"
          aria-label="Delete league"
          @click="confirmDelete"
        />
      </div>
    </div>

    <!-- League Logo (overlapping header/body boundary) -->
    <div class="league-logo">
      <div v-if="league.logo || league.logo_url" class="logo-image-wrapper">
        <ResponsiveImage
          :media="league.logo"
          :fallback-url="league.logo_url ?? undefined"
          :alt="`${league.name} logo`"
          sizes="56px"
          conversion="small"
          img-class="w-full h-full object-contain"
        />
      </div>
      <span v-else class="league-logo-initials">{{ leagueInitials }}</span>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <!-- League Name -->
      <h3 class="league-name">{{ league.name }}</h3>

      <!-- Tagline -->
      <p v-if="league.tagline" class="league-tagline">{{ league.tagline }}</p>

      <!-- Stats Grid (2x2) -->
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Competitions</span>
          <span class="stat-value stat-value--highlight">{{ league.competitions_count }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Drivers</span>
          <span class="stat-value">{{ league.drivers_count }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Active Seasons</span>
          <span class="stat-value">{{ league.active_seasons_count }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Races</span>
          <span class="stat-value">{{ league.total_races_count }}</span>
        </div>
      </div>

      <!-- Platform Tags -->
      <div v-if="league.platforms && league.platforms.length > 0" class="platform-tags">
        <span
          v-for="platform in league.platforms.slice(0, 3)"
          :key="platform.id"
          class="platform-tag"
        >
          {{ platform.name }}
        </span>
        <span v-if="league.platforms.length > 3" class="platform-tag">
          +{{ league.platforms.length - 3 }} more
        </span>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="card-footer">
      <!-- Timezone Info (Left) -->
      <div class="timezone-info">
        <PhClock :size="14" class="timezone-icon" />
        <span>{{ league.timezone }}</span>
      </div>

      <!-- View Button (Right) -->
      <button class="view-btn" @click="handleView">
        View League
        <PhArrowRight :size="12" />
      </button>
    </div>
  </article>
</template>

<style scoped>
/* ============================================
   League Card - Technical Blueprint Design
   ============================================ */

.league-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease forwards;
}

.league-card:hover {
  border-color: var(--cyan);
  transform: translateY(-4px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(88, 166, 255, 0.1);
}

.league-card:hover .card-header-overlay {
  opacity: 1;
}

.league-card:hover .quick-actions {
  opacity: 1;
  transform: translateY(0);
}

.league-card:hover :deep(.card-header-image) {
  transform: scale(1.05);
}

/* ============================================
   Card Header (140px height)
   ============================================ */

.card-header {
  position: relative;
  height: 140px;
  overflow: hidden;
}

:deep(.card-header-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.card-header-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%);
}

.card-header-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(13, 17, 23, 0.9) 100%);
  pointer-events: none;
}

.card-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(88, 166, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

/* ============================================
   Visibility Badge (Top-Left)
   ============================================ */

.visibility-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}

.visibility-badge--public {
  background: var(--green-dim);
  color: var(--green);
}

.visibility-badge--private {
  background: var(--orange-dim);
  color: var(--orange);
}

.visibility-badge--unlisted {
  background: var(--purple-dim);
  color: var(--purple);
}

.visibility-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

/* ============================================
   Quick Actions (Top-Right, hover reveal)
   ============================================ */

.quick-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-8px);
  transition: all 0.3s ease;
  z-index: 10;
}

.action-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  padding: 0 !important;
  border-radius: 6px !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  background: rgba(22, 27, 34, 0.9) !important;
  color: var(--text-secondary) !important;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-elevated) !important;
  color: var(--text-primary) !important;
  border-color: var(--border) !important;
}

.action-btn--edit:hover {
  color: var(--cyan) !important;
  border-color: var(--cyan) !important;
}

.action-btn--delete:hover {
  color: var(--red) !important;
  border-color: var(--red) !important;
}

/* ============================================
   League Logo (Bottom-Left, overlapping)
   ============================================ */

.league-logo {
  position: absolute;
  top: 108px; /* 140px header - 56px logo + 24px overlap */
  left: 20px;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  border: 3px solid var(--bg-card);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.logo-image-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.league-logo-initials {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--cyan);
}

/* ============================================
   Card Body (padding: 32px 20px 20px)
   ============================================ */

.card-body {
  padding: 32px 20px 20px;
}

.league-name {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.league-tagline {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ============================================
   Stats Grid (2x2)
   ============================================ */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--border-muted);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
}

.stat-item {
  background: var(--bg-elevated);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value--highlight {
  color: var(--cyan);
}

/* ============================================
   Platform Tags
   ============================================ */

.platform-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.platform-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  padding: 4px 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
}

/* ============================================
   Card Footer (border-top, padding: 16px 20px)
   ============================================ */

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-muted);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timezone-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.timezone-icon {
  opacity: 0.6;
}

.view-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--cyan);
  border-radius: 6px;
  color: var(--cyan);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: var(--cyan);
  color: var(--bg-dark);
}

.view-btn:hover svg {
  transform: translateX(2px);
}

.view-btn svg {
  transition: transform 0.2s ease;
}

/* ============================================
   Animations
   ============================================ */

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
