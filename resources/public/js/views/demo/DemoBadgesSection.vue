<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';
import VrlBadge from '@public/components/badges/VrlBadge.vue';
</script>

<template>
  <section id="badges" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Badges</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Status badges, race indicators, and platform tags.
      </p>
    </div>

    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">VrlBadge</VrlHeading>
      <p class="theme-text-muted mb-6">
        Status badges for league states, race results, and metadata. Includes variants for active
        status, DNF/DNS, fastest lap, and more.
      </p>

      <!-- Status Badges -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Status Badges
        </VrlHeading>
        <div class="flex flex-wrap gap-3">
          <VrlBadge variant="active" label="Active" :pulse="true" />
          <VrlBadge variant="featured" label="Featured" icon="star" />
          <VrlBadge variant="upcoming" label="Upcoming" icon="calendar" />
          <VrlBadge variant="completed" label="Completed" icon="check-circle" />
          <VrlBadge variant="private" label="Private" icon="lock" />
        </div>
      </div>

      <!-- Race Result Badges -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Race Result Badges
        </VrlHeading>
        <div class="flex flex-wrap gap-3">
          <VrlBadge variant="fastest-lap" label="Fastest Lap" icon="timer" />
          <VrlBadge variant="pole" label="Pole Position" icon="flag" />
          <VrlBadge variant="dnf" label="DNF" />
          <VrlBadge variant="dns" label="DNS" />
          <VrlBadge variant="penalty" label="+5s Penalty" icon="warning" />
        </div>
      </div>

      <!-- Platform Badges -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Platform Tags
        </VrlHeading>
        <div class="flex flex-wrap gap-3">
          <VrlBadge variant="platform" label="GT7" />
          <VrlBadge variant="platform" label="ACC" />
          <VrlBadge variant="platform" label="iRacing" />
          <VrlBadge variant="platform" label="F1 24" />
        </div>
      </div>
    </div>
  </section>
</template>
