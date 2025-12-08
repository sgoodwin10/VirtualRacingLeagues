<script setup lang="ts">
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import VrlCard from '@public/components/common/cards/VrlCard.vue';
import VrlLeagueCard from '@public/components/common/cards/VrlLeagueCard.vue';
import VrlStatsCard from '@public/components/common/cards/VrlStatsCard.vue';
import { PhFlagCheckered, PhCalendarDots, PhUsers, PhGameController } from '@phosphor-icons/vue';
</script>

<template>
  <section id="cards" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Cards</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Card components for leagues, stats, and content display.
      </p>
    </div>

    <!-- VrlCard Variants -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-muted"
        >VrlCard - Base Card Component</VrlHeading
      >

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Default Variant -->
        <VrlCard variant="default" class="p-4">
          <template #header>
            <div class="p-3 border-b border-[var(--border-primary)]">
              <span class="font-display text-xs uppercase tracking-wider text-racing-gold"
                >Default</span
              >
            </div>
          </template>
          <p class="text-sm theme-text-muted">Basic card with hover effect and slots.</p>
          <template #footer>
            <div class="p-3 border-t border-[var(--border-primary)]">
              <span class="font-data text-xs theme-text-dim">Footer content</span>
            </div>
          </template>
        </VrlCard>

        <!-- League Variant -->
        <VrlCard variant="league" class="p-4">
          <p class="text-sm theme-text-muted">League variant - same base styling as default.</p>
        </VrlCard>

        <!-- Stats Variant -->
        <VrlCard variant="stats" class="p-4">
          <p class="text-sm theme-text-muted">Stats variant with gradient border effect.</p>
        </VrlCard>

        <!-- Feature Variant -->
        <VrlCard variant="feature" class="p-4">
          <p class="text-sm theme-text-muted">Feature variant with animated top border on hover.</p>
        </VrlCard>
      </div>
    </div>

    <!-- VrlLeagueCard -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-muted"
        >VrlLeagueCard - League Preview</VrlHeading
      >

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <VrlLeagueCard
          name="GT Masters Cup"
          tagline="Elite GT racing series"
          :competitions="6"
          :drivers="78"
        />

        <VrlLeagueCard
          name="Formula Open"
          tagline="Open-wheel championship"
          :competitions="4"
          :drivers="42"
        />

        <VrlLeagueCard
          name="Endurance League"
          tagline="Long-distance racing"
          :competitions="3"
          :drivers="120"
        />
      </div>
    </div>

    <!-- VrlStatsCard -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-muted"
        >VrlStatsCard - Statistics Display</VrlHeading
      >

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <VrlStatsCard label="Competitions" :value="6">
          <template #icon>
            <PhFlagCheckered :size="20" weight="fill" class="text-racing-gold" />
          </template>
        </VrlStatsCard>

        <VrlStatsCard label="Active Seasons" :value="4">
          <template #icon>
            <PhCalendarDots :size="20" weight="fill" class="text-racing-gold" />
          </template>
        </VrlStatsCard>

        <VrlStatsCard label="Drivers" :value="78" :highlighted="true">
          <template #icon>
            <PhUsers :size="20" weight="fill" class="text-racing-gold" />
          </template>
        </VrlStatsCard>

        <VrlStatsCard label="Platform" value="GT7">
          <template #icon>
            <PhGameController :size="20" weight="fill" class="text-racing-gold" />
          </template>
        </VrlStatsCard>
      </div>
    </div>

    <!-- Feature Card Example -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-muted"
        >Feature Cards - With Animated Border</VrlHeading
      >

      <div class="grid md:grid-cols-3 gap-6">
        <VrlCard variant="feature" class="p-4 sm:p-6">
          <template #icon>
            <span class="text-xl sm:text-2xl text-racing-gold">🏁</span>
          </template>
          <VrlHeading :level="3" as="h3" class="text-xs sm:text-sm uppercase tracking-wide mb-2">
            Leagues & Competitions
          </VrlHeading>
          <p class="text-xs sm:text-sm leading-relaxed" style="color: var(--text-muted)">
            Organize multiple competitions and seasons under a single league.
          </p>
        </VrlCard>

        <VrlCard variant="feature" class="p-4 sm:p-6">
          <template #icon>
            <span class="text-xl sm:text-2xl text-racing-gold">⏱️</span>
          </template>
          <VrlHeading :level="3" as="h3" class="text-xs sm:text-sm uppercase tracking-wide mb-2">
            Qualifying & Race Times
          </VrlHeading>
          <p class="text-xs sm:text-sm leading-relaxed" style="color: var(--text-muted)">
            Track qualifying poles, race times, gaps, and fastest laps.
          </p>
        </VrlCard>

        <VrlCard variant="feature" class="p-4 sm:p-6">
          <template #icon>
            <span class="text-xl sm:text-2xl text-racing-gold">🔗</span>
          </template>
          <VrlHeading :level="3" as="h3" class="text-xs sm:text-sm uppercase tracking-wide mb-2">
            Public Sharing
          </VrlHeading>
          <p class="text-xs sm:text-sm leading-relaxed" style="color: var(--text-muted)">
            Generate shareable links for your community.
          </p>
        </VrlCard>
      </div>
    </div>
  </section>
</template>
