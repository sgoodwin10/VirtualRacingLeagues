<script setup lang="ts">
interface Props {
  /** Driver name */
  name: string;
  /** Driver subtitle (e.g., "#1 | NED" or team name) */
  nickname?: string;
  /** Avatar URL or initials */
  avatar?: string;
  /** Team color for avatar border */
  teamColor?: string;
  /** Show avatar */
  showAvatar?: boolean;
}

withDefaults(defineProps<Props>(), {
  nickname: undefined,
  avatar: undefined,
  teamColor: undefined,
  showAvatar: true,
});
</script>

<template>
  <div class="driver-cell">
    <!-- Info -->
    <div class="driver-info">
      <span class="driver-name">{{ name }}</span>
      <span v-if="nickname" class="driver-subtitle">{{ nickname }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Styles already in global CSS, but can be scoped if needed */
.driver-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.driver-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  background-color: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  flex-shrink: 0;
  overflow: hidden;
}

.driver-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.driver-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.driver-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans);
}

.driver-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-sans);
}
</style>
