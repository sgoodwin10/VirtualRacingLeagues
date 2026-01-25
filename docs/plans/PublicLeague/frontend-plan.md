# Public League Detail Enhancement - Frontend Plan

## Agent: `dev-fe-public`

All frontend changes are in `resources/public/js/` using the `@public` path alias.

---

## Task 1: Update TypeScript Types

### File: `types/public.ts`

**Action**: Verify and update `PublicLeagueInfo` interface

The interface already has most fields. Confirm these fields exist:
- `discord_url: string | null`
- `website_url: string | null`
- `twitter_handle: string | null`
- `instagram_handle: string | null` (may need to add this)
- `youtube_url: string | null`
- `twitch_url: string | null`

**If backend adds contact info**, add:
```typescript
export interface PublicLeagueInfo {
  // ... existing fields
  contact_email?: string | null;  // Optional - only if backend exposes
  organizer_name?: string | null; // Optional - only if backend exposes
}
```

---

## Task 2: Create Social Links Component

### File: `components/leagues/LeagueSocialLinks.vue` (NEW)

**Purpose**: Reusable component to display social media links

**Props**:
```typescript
interface Props {
  discordUrl?: string | null;
  websiteUrl?: string | null;
  twitterHandle?: string | null;
  instagramHandle?: string | null;
  youtubeUrl?: string | null;
  twitchUrl?: string | null;
  showLabels?: boolean;  // true = full links, false = icons only
}
```

**Behavior**:
- Discord and Website: Display as full clickable links with icon + URL text (when `showLabels=true`)
- Twitter, Instagram, YouTube, Twitch: Display as icon-only buttons
- All links open in new tab (`target="_blank" rel="noopener noreferrer"`)
- Only render links that have values (not null/empty)

**Icons** (use Phosphor Icons):
- Discord: `PhDiscordLogo`
- Website: `PhGlobe` or `PhLink`
- Twitter/X: `PhXLogo` or `PhTwitterLogo`
- Instagram: `PhInstagramLogo`
- YouTube: `PhYoutubeLogo`
- Twitch: `PhTwitchLogo`

**Styling**:
- Icons: `text-[var(--text-secondary)]` hover: `text-[var(--cyan)]`
- Links: Same hover effect, with text truncation for long URLs
- Icon size: 20-24px for icons, appropriate for the design

---

## Task 3: Update LeagueHeader Component

### File: `components/leagues/LeagueHeader.vue`

**Changes**:

1. Import `LeagueSocialLinks` component
2. Add social links section below the existing meta information
3. Add an "About" button to open the info modal

**Template Structure** (addition to existing):
```vue
<!-- After league-header-meta div -->
<div class="league-header-actions flex items-center gap-4 mt-4">
  <!-- Social Links (compact, icons only for secondary links) -->
  <LeagueSocialLinks
    :discord-url="league.discord_url"
    :website-url="league.website_url"
    :twitter-handle="league.twitter_handle"
    :instagram-handle="league.instagram_handle"
    :youtube-url="league.youtube_url"
    :twitch-url="league.twitch_url"
    :show-labels="true"
  />

  <!-- About Button -->
  <button
    v-if="hasDetailedInfo"
    @click="$emit('show-info')"
    class="about-btn"
  >
    <PhInfo :size="20" />
    <span>About</span>
  </button>
</div>
```

**New Computed**:
```typescript
const hasDetailedInfo = computed(() => {
  return props.league.description || props.league.tagline;
});
```

**New Emit**:
```typescript
const emit = defineEmits<{
  (e: 'show-info'): void;
}>();
```

---

## Task 4: Create LeagueInfoModal Component

### File: `components/leagues/LeagueInfoModal.vue` (NEW)

**Purpose**: Modal displaying detailed league information

**Props**:
```typescript
interface Props {
  visible: boolean;
  league: PublicLeagueInfo;
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();
```

**Template Structure**:
```vue
<template>
  <VrlModal
    v-model:visible="localVisible"
    :title="league.name"
    width="lg"
  >
    <VrlModalBody padding="md">
      <!-- Tagline -->
      <p v-if="league.tagline" class="tagline">
        {{ league.tagline }}
      </p>

      <!-- Description -->
      <div v-if="league.description" class="description">
        <h3>About</h3>
        <p>{{ league.description }}</p>
      </div>

      <!-- Contact Information (if available) -->
      <div v-if="league.organizer_name || league.contact_email" class="contact-info">
        <h3>Contact</h3>
        <p v-if="league.organizer_name">
          <strong>Organizer:</strong> {{ league.organizer_name }}
        </p>
        <p v-if="league.contact_email">
          <strong>Email:</strong>
          <a :href="`mailto:${league.contact_email}`">{{ league.contact_email }}</a>
        </p>
      </div>

      <!-- Social Links (full display) -->
      <div v-if="hasSocialLinks" class="social-links">
        <h3>Links</h3>
        <LeagueSocialLinks
          :discord-url="league.discord_url"
          :website-url="league.website_url"
          :twitter-handle="league.twitter_handle"
          :instagram-handle="league.instagram_handle"
          :youtube-url="league.youtube_url"
          :twitch-url="league.twitch_url"
          :show-labels="true"
          layout="vertical"
        />
      </div>
    </VrlModalBody>

    <VrlModalFooter align="right">
      <VrlButton variant="secondary" @click="close">
        Close
      </VrlButton>
    </VrlModalFooter>
  </VrlModal>
</template>
```

**Computed**:
```typescript
const hasSocialLinks = computed(() => {
  return league.discord_url || league.website_url ||
         league.twitter_handle || league.instagram_handle ||
         league.youtube_url || league.twitch_url;
});

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});
```

---

## Task 5: Update LeagueDetailView

### File: `views/leagues/LeagueDetailView.vue`

**Changes**:

1. Import `LeagueInfoModal` component
2. Add modal state management
3. Pass event handler to LeagueHeader
4. Add modal to template

**Script additions**:
```typescript
import LeagueInfoModal from '@public/components/leagues/LeagueInfoModal.vue';

// State
const showInfoModal = ref(false);

// Handlers
const openInfoModal = () => {
  showInfoModal.value = true;
};
```

**Template additions**:
```vue
<!-- Update LeagueHeader to include event -->
<LeagueHeader
  :league="leagueData.league"
  :stats="leagueData.stats"
  @show-info="openInfoModal"
/>

<!-- Add modal at end of template -->
<LeagueInfoModal
  v-if="leagueData"
  v-model:visible="showInfoModal"
  :league="leagueData.league"
/>
```

---

## Task 6: Add Tests

### File: `components/leagues/__tests__/LeagueSocialLinks.test.ts` (NEW)

Test cases:
- Renders nothing when no links provided
- Renders only Discord when only discord_url provided
- Renders all links when all provided
- Links open in new tab
- Icons display correctly
- Hover states work
- showLabels prop toggles full text display

### File: `components/leagues/__tests__/LeagueInfoModal.test.ts` (NEW)

Test cases:
- Modal opens/closes with v-model
- Displays league name as title
- Shows tagline when provided
- Shows description when provided
- Hides description section when null
- Shows contact info when provided (if backend supports)
- Social links display correctly
- Close button closes modal

### File: `components/leagues/__tests__/LeagueHeader.test.ts` (UPDATE)

Add test cases:
- Emits 'show-info' when About button clicked
- About button visible when league has description
- About button hidden when no description/tagline
- Social links component rendered with correct props

---

## Implementation Notes

### Icon Installation
Ensure Phosphor Icons for social media are available. Check if the following are exported from `@phosphor-icons/vue`:
- `PhDiscordLogo`
- `PhGlobe`
- `PhXLogo` (or `PhTwitterLogo`)
- `PhInstagramLogo`
- `PhYoutubeLogo`
- `PhTwitchLogo`
- `PhInfo`

### URL Formatting
For Twitter/Instagram handles, construct full URLs:
```typescript
const twitterUrl = computed(() =>
  props.twitterHandle ? `https://twitter.com/${props.twitterHandle}` : null
);
const instagramUrl = computed(() =>
  props.instagramHandle ? `https://instagram.com/${props.instagramHandle}` : null
);
```

### Accessibility
- All links should have `aria-label` describing the link destination
- Modal should trap focus when open
- Escape key closes modal (handled by VrlModal)

### Mobile Responsiveness
- Social links should wrap on small screens
- Modal should be full-width on mobile (handled by VrlModal's responsive design)
- Consider hiding "About" button text on very small screens, showing only icon

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `types/public.ts` | UPDATE | Verify/add instagram_handle, optionally add contact fields |
| `components/leagues/LeagueSocialLinks.vue` | CREATE | Reusable social links component |
| `components/leagues/LeagueInfoModal.vue` | CREATE | League info modal component |
| `components/leagues/LeagueHeader.vue` | UPDATE | Add social links and About button |
| `views/leagues/LeagueDetailView.vue` | UPDATE | Add modal integration |
| `components/leagues/__tests__/LeagueSocialLinks.test.ts` | CREATE | Tests for social links |
| `components/leagues/__tests__/LeagueInfoModal.test.ts` | CREATE | Tests for modal |
| `components/leagues/__tests__/LeagueHeader.test.ts` | UPDATE | Add tests for new functionality |

---

## Skill Usage

Use the `public-design` skill when implementing the visual design of:
1. LeagueSocialLinks component styling
2. LeagueInfoModal layout and styling
3. About button design

This ensures distinctive, production-grade UI that avoids generic AI aesthetics.
