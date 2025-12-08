<script setup lang="ts">
import { ref } from 'vue';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import VrlStandingsTable, {
  type StandingsEntry,
} from '@public/components/common/data-display/VrlStandingsTable.vue';
import VrlPagination from '@public/components/common/data-display/VrlPagination.vue';

// Championship standings data
const championshipStandings = ref<StandingsEntry[]>([
  {
    position: 1,
    driver: 'Alex Chen',
    team: 'Red Bull Racing',
    points: 156,
    gap: undefined,
    fastestLap: true,
  },
  {
    position: 2,
    driver: 'Marcus Weber',
    team: 'Ferrari',
    points: 142,
    gap: '+14',
  },
  {
    position: 3,
    driver: 'James Wilson',
    team: 'McLaren',
    points: 128,
    gap: '+28',
  },
  {
    position: 4,
    driver: 'Sofia Martinez',
    team: 'Mercedes',
    points: 115,
    gap: '+41',
  },
  {
    position: 5,
    driver: 'Kai Tanaka',
    team: 'Aston Martin',
    points: 98,
    gap: '+58',
    dnf: true,
  },
  {
    position: 6,
    driver: 'Emma Rodriguez',
    team: 'Alpine',
    points: 87,
    gap: '+69',
  },
  {
    position: 7,
    driver: 'Lucas Schmidt',
    team: 'Williams',
    points: 72,
    gap: '+84',
  },
  {
    position: 8,
    driver: 'Yuki Nakamura',
    team: 'AlphaTauri',
    points: 58,
    gap: '+98',
    dns: true,
  },
]);

// Pagination states
const standardPage = ref(1);
const compactPage = ref(3);
const racingPage = ref(2);
const infoPage = ref(3);
const perPagePage = ref(1);
const perPageValue = ref(25);
</script>

<template>
  <section id="data" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Data Display</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Components for displaying tables, standings, and paginated data.
      </p>
    </div>

    <!-- VrlStandingsTable Demo -->
    <div class="space-y-4">
      <div>
        <VrlHeading :level="3" variant="card" class="mb-2">VrlStandingsTable</VrlHeading>
        <p class="theme-text-muted text-sm">
          Specialized table for championship standings with position colors, badges (FL, DNF, DNS),
          and gap formatting.
        </p>
      </div>

      <div class="theme-card rounded-sm p-6">
        <div class="mb-4">
          <h4 class="font-display text-xs uppercase tracking-wider theme-text-dim mb-2">
            2024 Championship Standings
          </h4>
        </div>
        <VrlStandingsTable :standings="championshipStandings" />
      </div>

      <div class="theme-card rounded-sm p-4 bg-[var(--bg-tertiary)] space-y-3">
        <div>
          <p class="text-xs font-data theme-text-muted">
            <strong class="theme-text-primary">Features:</strong> 1st (gold), 2nd (silver), 3rd
            (bronze) position colors. Gap shows "-" for leader, "+X" for others. Sortable columns
            for driver, team, and points.
          </p>
        </div>
        <div>
          <p class="text-xs font-display uppercase tracking-wider theme-accent-gold mb-2">
            Badge Legend
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-data theme-text-muted">
            <div class="flex items-center gap-2">
              <span class="text-racing-fastest-lap">FL</span>
              <span>= Fastest Lap</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-racing-dnf">DNF</span>
              <span>= Did Not Finish</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-racing-dns">DNS</span>
              <span>= Did Not Start</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VrlPagination Demos -->
    <div class="space-y-8">
      <div>
        <VrlHeading :level="3" variant="card" class="mb-2">VrlPagination</VrlHeading>
        <p class="theme-text-muted text-sm">
          Pagination controls with three variants: standard, compact, and racing (angled).
        </p>
      </div>

      <!-- Standard Pagination -->
      <div class="space-y-4">
        <h4 class="font-display text-xs uppercase tracking-wider theme-text-dim">
          Standard Pagination
        </h4>
        <div class="theme-card rounded-sm p-6">
          <VrlPagination v-model="standardPage" :total-pages="12" variant="standard" />
        </div>
        <div class="theme-card rounded-sm p-4 bg-[var(--bg-tertiary)]">
          <p class="text-xs font-data theme-text-muted">
            <strong class="theme-text-primary">Current page:</strong> {{ standardPage }}
          </p>
        </div>
      </div>

      <!-- Compact Pagination -->
      <div class="space-y-4">
        <h4 class="font-display text-xs uppercase tracking-wider theme-text-dim">
          Compact Pagination
        </h4>
        <div class="theme-card rounded-sm p-6">
          <VrlPagination v-model="compactPage" :total-pages="12" variant="compact" />
        </div>
        <div class="theme-card rounded-sm p-4 bg-[var(--bg-tertiary)]">
          <p class="text-xs font-data theme-text-muted">
            <strong class="theme-text-primary">Current page:</strong> {{ compactPage }}
          </p>
        </div>
      </div>

      <!-- Racing Pagination -->
      <div class="space-y-4">
        <h4 class="font-display text-xs uppercase tracking-wider theme-text-dim">
          Racing Pagination (Angled)
        </h4>
        <div class="theme-card rounded-sm p-6">
          <VrlPagination v-model="racingPage" :total-pages="12" variant="racing" />
        </div>
        <div class="theme-card rounded-sm p-4 bg-[var(--bg-tertiary)]">
          <p class="text-xs font-data theme-text-muted">
            <strong class="theme-text-primary">Current page:</strong> {{ racingPage }}
          </p>
        </div>
      </div>

      <!-- Pagination with Info -->
      <div class="space-y-4">
        <h4 class="font-display text-xs uppercase tracking-wider theme-text-dim">
          With Result Info
        </h4>
        <div class="theme-card rounded-sm p-6">
          <VrlPagination
            v-model="infoPage"
            :total-pages="16"
            variant="standard"
            show-info
            :total-records="156"
            :per-page="10"
          />
        </div>
        <div class="theme-card rounded-sm p-4 bg-[var(--bg-tertiary)]">
          <p class="text-xs font-data theme-text-muted">
            <strong class="theme-text-primary">Features:</strong> Shows "Showing X-Y of Z results"
            text. Includes first/last page buttons (double arrows). Current page: {{ infoPage }}
          </p>
        </div>
      </div>

      <!-- Pagination with Per-Page Selector -->
      <div class="space-y-4">
        <h4 class="font-display text-xs uppercase tracking-wider theme-text-dim">
          With Per-Page Selector
        </h4>
        <div class="theme-card rounded-sm p-6">
          <VrlPagination
            v-model="perPagePage"
            :total-pages="7"
            variant="standard"
            show-per-page
            :per-page="perPageValue"
            @update:per-page="perPageValue = $event"
          />
        </div>
        <div class="theme-card rounded-sm p-4 bg-[var(--bg-tertiary)]">
          <p class="text-xs font-data theme-text-muted">
            <strong class="theme-text-primary">Current page:</strong> {{ perPagePage }} |
            <strong class="theme-text-primary">Per page:</strong> {{ perPageValue }}
          </p>
        </div>
      </div>

      <!-- Keyboard Navigation Info -->
      <div class="theme-card rounded-sm p-4 bg-[var(--bg-tertiary)]">
        <p class="text-xs font-data theme-text-muted">
          <strong class="theme-text-primary">Keyboard navigation:</strong> Arrow keys (←/→) to
          navigate pages. Home/End for first/last page. Enter/Space to select page button. All
          variants support full keyboard accessibility.
        </p>
      </div>
    </div>
  </section>
</template>
