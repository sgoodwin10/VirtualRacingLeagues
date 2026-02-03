# Facebook Handle Feature - Frontend Implementation Plan

## Overview

This document details the frontend implementation for adding the `facebook_handle` field to the League entity across both the App Dashboard and Public Site.

---

## Part A: App Dashboard (`resources/app/`)

### Step 1: Update TypeScript Types

**File**: `resources/app/js/types/league.ts`

#### Changes:

1. **Update `League` interface** (after `twitch_url`):
```typescript
facebook_handle: string | null;
```

2. **Update `CreateLeagueForm` interface** (after `twitch_url`):
```typescript
facebook_handle: string;
```

3. **Update `UpdateLeagueForm` interface** (after `twitch_url`):
```typescript
facebook_handle?: string;
```

4. **Update `FormErrors` interface** (after `twitch_url`):
```typescript
facebook_handle?: string;
```

---

### Step 2: Update SocialMediaFields Component

**File**: `resources/app/js/components/league/partials/SocialMediaFields.vue`

#### Changes:

1. **Add import for Facebook icon**:
```typescript
import {
  PhDiscordLogo,
  PhGlobe,
  PhTwitterLogo,
  PhInstagramLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhFacebookLogo,  // Add this
} from '@phosphor-icons/vue';
```

2. **Update Props interface** - add after `twitchUrl`:
```typescript
facebookHandle: string;
```

3. **Update errors type** - add:
```typescript
facebook_handle?: string;
```

4. **Add emit** - add to emit array:
```typescript
'update:facebookHandle',
```

5. **Add Facebook input field** (after Twitch, within the grid):
```vue
<!-- Facebook -->
<FormInputGroup>
  <FormLabel for="facebook-handle" text="Facebook" />
  <InputGroup>
    <InputGroupAddon class="p-0">
      <PhFacebookLogo size="20" class="text-[#1877F2]/70" />
    </InputGroupAddon>
    <InputText
      id="facebook-handle"
      :model-value="facebookHandle"
      placeholder="yourleague"
      size="small"
      :class="{ 'p-invalid': !!errors?.facebook_handle }"
      class="w-full"
      @update:model-value="emit('update:facebookHandle', $event)"
    />
  </InputGroup>
  <FormError :error="errors?.facebook_handle" />
</FormInputGroup>
```

---

### Step 3: Update SocialSection Component

**File**: `resources/app/js/components/league/modals/partials/sections/SocialSection.vue`

#### Changes:

1. **Update emit types** - add:
```typescript
'update:facebookHandle': [value: string];
```

2. **Update SocialMediaFields usage** - add props and event:
```vue
:facebook-handle="form.facebook_handle"
@update:facebook-handle="emit('update:facebookHandle', $event)"
```

3. **Update errors binding** - add:
```typescript
facebook_handle: errors.facebook_handle,
```

---

### Step 4: Update LeagueTerminalConfig Component

**File**: `resources/app/js/components/league/partials/LeagueTerminalConfig.vue`

#### Changes:

Add Facebook display section (after Twitch, before closing `</div>`):
```vue
<!-- Facebook -->
<div v-if="league.facebook_handle" class="flex mb-2 last:mb-0">
  <span class="text-[var(--cyan)] min-w-[100px]">facebook:</span>
  <a
    :href="`https://facebook.com/${league.facebook_handle}`"
    target="_blank"
    rel="noopener noreferrer"
    class="text-[var(--green)] no-underline hover:underline"
  >
    @{{ league.facebook_handle }}
  </a>
</div>
```

---

### Step 5: Update LeagueSocialMediaPanel Component

**File**: `resources/app/js/components/league/partials/LeagueSocialMediaPanel.vue`

#### Changes:

1. **Update v-if condition on BasePanel** - add `league.facebook_handle` to the condition

2. **Add Facebook link section** (after Twitch):
```vue
<!-- Facebook -->
<a
  v-if="league.facebook_handle"
  :href="`https://facebook.com/${league.facebook_handle.replace('@', '')}`"
  target="_blank"
  rel="noopener noreferrer"
  class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
>
  <div
    class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors"
  >
    <i class="pi pi-facebook text-[#1877F2]"></i>
  </div>
  <div class="flex-1 min-w-0">
    <div class="font-medium text-gray-900">Facebook</div>
    <div class="text-md text-gray-500 truncate">
      @{{ league.facebook_handle.replace('@', '') }}
    </div>
  </div>
</a>
```

---

### Step 6: Update Parent Components Using SocialSection

**Files to check and update**:
- `resources/app/js/components/league/modals/EditLeagueModal.vue`
- `resources/app/js/components/league/modals/LeagueWizardDrawer.vue`

Ensure they pass and handle `facebook_handle` in form state and emit handlers.

---

## Part B: Public Site (`resources/public/`)

### Step 1: Update TypeScript Types

**File**: `resources/public/js/types/public.ts`

#### Changes:

1. **Update `PublicLeague` interface** (after `twitch_url`):
```typescript
facebook_handle: string | null;
```

2. **Update `PublicLeagueInfo` interface** (after `twitch_url`):
```typescript
facebook_handle: string | null;
```

---

### Step 2: Update LeagueHeader Component

**File**: `resources/public/js/components/leagues/LeagueHeader.vue`

#### Changes:

1. **Add import for Facebook icon**:
```typescript
import {
  PhDiscordLogo,
  PhGlobe,
  PhXLogo,
  PhInstagramLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhFacebookLogo,  // Add this
  PhInfo,
} from '@phosphor-icons/vue';
```

2. **Update `hasSocialLinks` computed** - add `props.league.facebook_handle` to the condition

3. **Add Facebook link section** (after Twitch, around line 146):
```vue
<!-- Facebook -->
<a
  v-if="league.facebook_handle"
  :href="`https://facebook.com/${league.facebook_handle}`"
  target="_blank"
  rel="noopener noreferrer"
  class="social-link flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[#1877F2] text-[0.85rem] hover:bg-[#1877F2] hover:text-white transition-colors"
>
  <PhFacebookLogo :size="18" weight="fill" />
  <span>Facebook</span>
</a>
```

---

## Testing

### App Dashboard Tests

**Files to update/create**:
- `resources/app/js/components/league/partials/SocialMediaFields.test.ts`
- `resources/app/js/components/league/partials/LeagueTerminalConfig.test.ts`

#### Test cases:
1. SocialMediaFields renders Facebook input
2. SocialMediaFields emits update:facebookHandle on input
3. LeagueTerminalConfig displays Facebook link when present
4. LeagueTerminalConfig hides Facebook when not present

### Public Site Tests

**Files to update/create**:
- `resources/public/js/components/leagues/LeagueHeader.test.ts` (if exists)

#### Test cases:
1. LeagueHeader displays Facebook link when facebook_handle is present
2. LeagueHeader hides Facebook link when facebook_handle is null
3. hasSocialLinks computed returns true when only facebook_handle is set

---

## Verification Commands

```bash
# Type check
npm run type-check

# Lint
npm run lint:app
npm run lint:public

# Format
npm run format

# Run tests
npm run test:app

# Build to verify no errors
npm run build
```

---

## Checklist

### App Dashboard
- [ ] Update `league.ts` types
- [ ] Update `SocialMediaFields.vue` - add Facebook input
- [ ] Update `SocialSection.vue` - wire up Facebook field
- [ ] Update `LeagueTerminalConfig.vue` - display Facebook
- [ ] Update `LeagueSocialMediaPanel.vue` - display Facebook
- [ ] Update `EditLeagueModal.vue` - handle facebook_handle
- [ ] Update `LeagueWizardDrawer.vue` - handle facebook_handle
- [ ] Run linting
- [ ] Run type-check
- [ ] Update/add tests

### Public Site
- [ ] Update `public.ts` types
- [ ] Update `LeagueHeader.vue` - display Facebook link
- [ ] Run linting
- [ ] Run type-check
- [ ] Update/add tests

---

## Design Specifications

### Facebook Brand Colors
- Primary: `#1877F2`
- Hover background: `#1877F2`
- Icon: `PhFacebookLogo` from Phosphor Icons

### URL Format
- Facebook URL: `https://facebook.com/{facebook_handle}`
- Handle stored without `@` prefix (same pattern as twitter/instagram)

### Icon Classes (PrimeVue)
- PrimeIcons class: `pi pi-facebook`
- Phosphor Icons: `PhFacebookLogo`

---

## Notes

1. The Facebook field follows the exact same pattern as Twitter and Instagram handles
2. Users should enter just the handle/username, not the full URL
3. The display URL strips any accidental `@` prefix (defensive coding)
4. Facebook blue (#1877F2) is used consistently across all components
