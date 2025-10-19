# League Edit Functionality - Implementation Plan

## Overview

This plan outlines the development of league edit functionality for the User Dashboard, restricted to league owners. The implementation will follow DDD architecture on the backend and Vue 3 Composition API patterns on the frontend.

## Current State Analysis

### Existing Implementation
- ✅ League creation (wizard-based, 3 steps)
- ✅ League viewing (list and detail views)
- ✅ League deletion (owner-only, soft delete)
- ✅ Authorization check on delete (`owner_user_id` validation)
- ✅ Domain entity with `updateDetails()` and `changeVisibility()` methods
- ✅ File upload handling (logo, header image)
- ✅ Platform and timezone management

### Missing Components
- ❌ Update endpoint in backend API
- ❌ Update DTO (`UpdateLeagueData`)
- ❌ Update Form Request validation
- ❌ Update method in Application Service
- ❌ Update repository method
- ❌ Frontend edit view/dialog
- ❌ Frontend update service method
- ❌ Frontend store update action
- ❌ Edit button in LeagueCard (owner-only visibility)

## Architecture Overview

### Backend Flow (DDD Layers)
```
┌─────────────────────────────────────────────────────────────────┐
│  Interface Layer                                                │
│  LeagueController::update()                                     │
│  - Validate ownership (auth check)                              │
│  - Delegate to Application Service                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  Application Layer                                              │
│  LeagueApplicationService::updateLeague()                       │
│  - Orchestrate update flow                                      │
│  - Handle file uploads (logo, header)                           │
│  - Update entity via domain methods                             │
│  - Dispatch domain events                                       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  Domain Layer                                                   │
│  League::updateDetails(), changeVisibility(), etc.              │
│  - Business logic and invariants                                │
│  - Record LeagueUpdated event                                   │
└─────────────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                           │
│  LeagueRepository::update()                                     │
│  - Persist changes to database                                  │
│  - Update platform relationships                                │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  Component Layer                                                │
│  LeagueCard.vue                                                 │
│  - Show "Edit" button if user is owner                          │
│  - Emit 'edit' event → navigate to edit route                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  View Layer                                                     │
│  LeagueEdit.vue (new)                                           │
│  - Reuse wizard steps from LeagueWizard                         │
│  - Pre-populate form with existing league data                  │
│  - Handle file upload (optional replacement)                    │
│  - Submit via store action                                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  State Management                                               │
│  leagueStore.updateLeague()                                     │
│  - Call leagueService.updateLeague()                            │
│  - Update local state on success                                │
│  - Handle optimistic updates                                    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  Service Layer                                                  │
│  leagueService.updateLeague()                                   │
│  - Build FormData with league updates                           │
│  - PUT /api/leagues/{id}                                        │
│  - Return updated LeagueData                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Backend Development (use `dev-be` agent)

#### Step 1.1: Create UpdateLeagueData DTO
**File**: `app/Application/League/DTOs/UpdateLeagueData.php`

**Requirements**:
- Use `spatie/laravel-data` package
- All fields optional except required business rules
- Support partial updates
- File upload handling for logo and header_image

**Fields**:
```php
public function __construct(
    public ?string $name,
    public ?UploadedFile $logo,
    public ?array $platform_ids,
    public ?string $timezone,
    public ?string $visibility,
    public ?string $tagline,
    public ?string $description,
    public ?UploadedFile $header_image,
    public ?string $contact_email,
    public ?string $organizer_name,
    public ?string $discord_url,
    public ?string $website_url,
    public ?string $twitter_handle,
    public ?string $instagram_handle,
    public ?string $youtube_url,
    public ?string $twitch_url,
) {}
```

**Location**: `app/Application/League/DTOs/UpdateLeagueData.php`

---

#### Step 1.2: Create UpdateLeagueRequest
**File**: `app/Http/Requests/User/UpdateLeagueRequest.php`

**Requirements**:
- Extend `FormRequest`
- All validation rules optional (allow partial updates)
- Reuse validation patterns from `CreateLeagueRequest`
- Validate file types and sizes (logo: 5MB max, header: 10MB max)
- Validate URLs, email format
- Authorize: Check if authenticated user is league owner

**Validation Rules**:
```php
return [
    'name' => ['sometimes', 'string', 'max:100'],
    'logo' => ['sometimes', 'file', 'image', 'max:5120'],
    'platform_ids' => ['sometimes', 'array', 'min:1'],
    'platform_ids.*' => ['integer', 'exists:platforms,id'],
    'timezone' => ['sometimes', 'string', 'timezone'],
    'visibility' => ['sometimes', 'string', 'in:public,private,unlisted'],
    'tagline' => ['nullable', 'string', 'max:200'],
    'description' => ['nullable', 'string', 'max:5000'],
    'header_image' => ['nullable', 'file', 'image', 'max:10240'],
    'contact_email' => ['sometimes', 'email'],
    'organizer_name' => ['sometimes', 'string', 'max:100'],
    'discord_url' => ['nullable', 'url'],
    'website_url' => ['nullable', 'url'],
    'twitter_handle' => ['nullable', 'string', 'max:50'],
    'instagram_handle' => ['nullable', 'string', 'max:50'],
    'youtube_url' => ['nullable', 'url'],
    'twitch_url' => ['nullable', 'url'],
];
```

**Authorization**:
```php
public function authorize(): bool
{
    $league = League::findOrFail($this->route('id'));
    return $league->owner_user_id === Auth::id();
}
```

**Location**: `app/Http/Requests/User/UpdateLeagueRequest.php`

---

#### Step 1.3: Add Domain Entity Update Methods
**File**: `app/Domain/League/Entities/League.php`

**Note**: The entity already has some update methods (`updateDetails()`, `changeVisibility()`). We need to extend it with additional update methods.

**New Methods to Add**:

```php
/**
 * Update contact information.
 */
public function updateContactInfo(
    EmailAddress $contactEmail,
    string $organizerName
): void {
    $this->contactEmail = $contactEmail;
    $this->organizerName = $organizerName;
    $this->recordEvent(new LeagueUpdated($this));
}

/**
 * Update social media links.
 */
public function updateSocialMedia(
    ?string $discordUrl,
    ?string $websiteUrl,
    ?string $twitterHandle,
    ?string $instagramHandle,
    ?string $youtubeUrl,
    ?string $twitchUrl
): void {
    $this->discordUrl = $discordUrl;
    $this->websiteUrl = $websiteUrl;
    $this->twitterHandle = $twitterHandle;
    $this->instagramHandle = $instagramHandle;
    $this->youtubeUrl = $youtubeUrl;
    $this->twitchUrl = $twitchUrl;
    $this->recordEvent(new LeagueUpdated($this));
}

/**
 * Update platform associations.
 */
public function updatePlatforms(array $platformIds): void
{
    $this->platformIds = $platformIds;
    $this->recordEvent(new LeagueUpdated($this));
}

/**
 * Update timezone.
 */
public function updateTimezone(string $timezone): void
{
    $this->timezone = $timezone;
    $this->recordEvent(new LeagueUpdated($this));
}

/**
 * Update logo path.
 */
public function updateLogo(string $logoPath): void
{
    $this->logoPath = $logoPath;
    $this->recordEvent(new LeagueUpdated($this));
}

/**
 * Update header image path.
 */
public function updateHeaderImage(?string $headerImagePath): void
{
    $this->headerImagePath = $headerImagePath;
    $this->recordEvent(new LeagueUpdated($this));
}
```

**Location**: `app/Domain/League/Entities/League.php`

---

#### Step 1.4: Add Repository Update Method
**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php`

**New Method**:
```php
public function update(League $league): void
{
    $eloquent = \App\Infrastructure\Persistence\Eloquent\Models\League::findOrFail($league->id());

    $eloquent->name = $league->name()->value();
    $eloquent->slug = $league->slug()->value();
    $eloquent->logo_path = $league->logoPath();
    $eloquent->timezone = $league->timezone();
    $eloquent->tagline = $league->tagline()?->value();
    $eloquent->description = $league->description();
    $eloquent->header_image_path = $league->headerImagePath();
    $eloquent->discord_url = $league->discordUrl();
    $eloquent->website_url = $league->websiteUrl();
    $eloquent->twitter_handle = $league->twitterHandle();
    $eloquent->instagram_handle = $league->instagramHandle();
    $eloquent->youtube_url = $league->youtubeUrl();
    $eloquent->twitch_url = $league->twitchUrl();
    $eloquent->visibility = $league->visibility()->value();
    $eloquent->status = $league->status();
    $eloquent->contact_email = $league->contactEmail()->value();
    $eloquent->organizer_name = $league->organizerName();

    $eloquent->save();

    // Sync platform relationships
    $eloquent->platforms()->sync($league->platformIds());
}
```

**Also add to interface**:
```php
// app/Domain/League/Repositories/LeagueRepositoryInterface.php
public function update(League $league): void;
```

**Locations**:
- `app/Domain/League/Repositories/LeagueRepositoryInterface.php`
- `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php`

---

#### Step 1.5: Add Application Service Update Method
**File**: `app/Application/League/Services/LeagueApplicationService.php`

**New Method**:
```php
/**
 * Update an existing league.
 *
 * @throws LeagueNotFoundException
 * @throws InvalidPlatformException
 */
public function updateLeague(int $leagueId, UpdateLeagueData $data, int $userId): LeagueData
{
    return DB::transaction(function () use ($leagueId, $data, $userId) {
        // Fetch existing league
        $league = $this->leagueRepository->findById($leagueId);

        // Authorization check
        if ($league->ownerUserId() !== $userId) {
            throw new \RuntimeException('Unauthorized to update this league');
        }

        // Validate platform IDs if provided
        if ($data->platform_ids !== null) {
            $this->validatePlatformIds($data->platform_ids);
            $league->updatePlatforms($data->platform_ids);
        }

        // Update basic details if provided
        if ($data->name !== null || $data->tagline !== null || $data->description !== null) {
            $league->updateDetails(
                $data->name !== null ? LeagueName::from($data->name) : $league->name(),
                $data->tagline !== null ? Tagline::fromNullable($data->tagline) : $league->tagline(),
                $data->description !== null ? $data->description : $league->description()
            );
        }

        // Update visibility if provided
        if ($data->visibility !== null) {
            $league->changeVisibility(LeagueVisibility::fromString($data->visibility));
        }

        // Update contact info if provided
        if ($data->contact_email !== null || $data->organizer_name !== null) {
            $league->updateContactInfo(
                $data->contact_email !== null ? EmailAddress::from($data->contact_email) : $league->contactEmail(),
                $data->organizer_name ?? $league->organizerName()
            );
        }

        // Update social media if any provided
        if ($this->hasSocialMediaUpdates($data)) {
            $league->updateSocialMedia(
                $data->discord_url ?? $league->discordUrl(),
                $data->website_url ?? $league->websiteUrl(),
                $data->twitter_handle ?? $league->twitterHandle(),
                $data->instagram_handle ?? $league->instagramHandle(),
                $data->youtube_url ?? $league->youtubeUrl(),
                $data->twitch_url ?? $league->twitchUrl()
            );
        }

        // Update timezone if provided
        if ($data->timezone !== null) {
            $league->updateTimezone($data->timezone);
        }

        // Handle logo upload
        if ($data->logo !== null) {
            // Delete old logo
            if (Storage::disk('public')->exists($league->logoPath())) {
                Storage::disk('public')->delete($league->logoPath());
            }

            $logoPath = $data->logo->store('leagues/logos', 'public');
            if (!$logoPath) {
                throw new \RuntimeException('Failed to store league logo');
            }
            $league->updateLogo($logoPath);
        }

        // Handle header image upload
        if ($data->header_image !== null) {
            // Delete old header image if exists
            if ($league->headerImagePath() && Storage::disk('public')->exists($league->headerImagePath())) {
                Storage::disk('public')->delete($league->headerImagePath());
            }

            $headerImagePath = $data->header_image->store('leagues/headers', 'public');
            if (!$headerImagePath) {
                throw new \RuntimeException('Failed to store league header image');
            }
            $league->updateHeaderImage($headerImagePath);
        }

        // Persist updates
        $this->leagueRepository->update($league);

        // Dispatch domain events
        $this->dispatchEvents($league);

        // Fetch platform data for response
        $platforms = $this->fetchPlatformData($league->platformIds());

        return LeagueData::fromEntity($league, $platforms);
    });
}

/**
 * Check if any social media fields are being updated.
 */
private function hasSocialMediaUpdates(UpdateLeagueData $data): bool
{
    return $data->discord_url !== null
        || $data->website_url !== null
        || $data->twitter_handle !== null
        || $data->instagram_handle !== null
        || $data->youtube_url !== null
        || $data->twitch_url !== null;
}
```

**Location**: `app/Application/League/Services/LeagueApplicationService.php`

---

#### Step 1.6: Add Controller Update Method
**File**: `app/Http/Controllers/User/LeagueController.php`

**New Method**:
```php
/**
 * Update a league.
 */
public function update(UpdateLeagueRequest $request, int $id): JsonResponse
{
    /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent $user */
    $user = Auth::guard('web')->user();
    assert($user instanceof \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent);

    $data = UpdateLeagueData::from($request->validated());
    $league = $this->leagueService->updateLeague($id, $data, $user->id);
    return ApiResponse::success($league->toArray(), 'League updated successfully');
}
```

**Location**: `app/Http/Controllers/User/LeagueController.php`

---

#### Step 1.7: Add Route
**File**: `routes/subdomain.php`

**Add to User API routes**:
```php
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // ... existing routes ...
        Route::put('/leagues/{id}', [LeagueController::class, 'update']);
    });
    Route::get('/{any?}', fn() => view('app'));
});
```

**Location**: `routes/subdomain.php`

---

#### Step 1.8: Backend Testing

**Feature Test**: `tests/Feature/Http/Controllers/User/LeagueControllerUpdateTest.php`

Test cases:
- ✅ Owner can update their league
- ✅ Non-owner cannot update league (403)
- ✅ Unauthenticated user cannot update (401)
- ✅ Partial updates work (only name, only visibility, etc.)
- ✅ File uploads work (logo, header_image)
- ✅ Invalid data returns 422
- ✅ Platform validation works
- ✅ LeagueUpdated event is dispatched

**Unit Test**: `tests/Unit/Domain/League/LeagueUpdateTest.php`

Test entity update methods:
- ✅ `updateDetails()` updates name, tagline, description
- ✅ `changeVisibility()` updates visibility
- ✅ `updateContactInfo()` updates contact fields
- ✅ `updateSocialMedia()` updates social media links
- ✅ `updatePlatforms()` updates platform associations
- ✅ `updateTimezone()` updates timezone
- ✅ `updateLogo()` updates logo path
- ✅ `updateHeaderImage()` updates header image path
- ✅ Each update method records LeagueUpdated event

---

### Phase 2: Frontend Development (use `dev-fe-user` agent)

#### Step 2.1: Update TypeScript Types
**File**: `resources/user/js/types/league.ts`

**Add**:
```typescript
/**
 * Update league form data (all fields optional for partial updates)
 */
export interface UpdateLeagueForm {
  // Essentials
  name?: string;
  logo?: File | null;
  platform_ids?: number[];
  timezone?: string;
  visibility?: LeagueVisibility;

  // Branding
  tagline?: string;
  description?: string;
  header_image?: File | null;

  // Contact & Community
  contact_email?: string;
  organizer_name?: string;
  discord_url?: string;
  website_url?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  youtube_url?: string;
  twitch_url?: string;
}
```

**Location**: `resources/user/js/types/league.ts`

---

#### Step 2.2: Add Service Method
**File**: `resources/user/js/services/leagueService.ts`

**New Methods**:
```typescript
/**
 * Update an existing league
 * @param id - League ID
 * @param formData - FormData containing league updates
 */
export async function updateLeague(id: number, formData: FormData): Promise<League> {
  const response: AxiosResponse<ApiResponse<League>> = await apiClient.put(
    `/leagues/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

/**
 * Build FormData from UpdateLeagueForm (only include changed fields)
 * @param form - League update form data
 * @param originalLeague - Original league data for comparison
 */
export function buildUpdateLeagueFormData(
  form: UpdateLeagueForm,
  originalLeague: League
): FormData {
  const formData = new FormData();

  // Only append fields that have changed
  if (form.name !== undefined && form.name !== originalLeague.name) {
    formData.append('name', form.name);
  }

  if (form.timezone !== undefined && form.timezone !== originalLeague.timezone) {
    formData.append('timezone', form.timezone);
  }

  if (form.visibility !== undefined && form.visibility !== originalLeague.visibility) {
    formData.append('visibility', form.visibility);
  }

  if (form.contact_email !== undefined && form.contact_email !== originalLeague.contact_email) {
    formData.append('contact_email', form.contact_email);
  }

  if (form.organizer_name !== undefined && form.organizer_name !== originalLeague.organizer_name) {
    formData.append('organizer_name', form.organizer_name);
  }

  // File uploads (only if new file provided)
  if (form.logo && form.logo !== null) {
    formData.append('logo', form.logo);
  }

  if (form.header_image && form.header_image !== null) {
    formData.append('header_image', form.header_image);
  }

  // Platform IDs
  if (form.platform_ids !== undefined) {
    const platformsChanged =
      JSON.stringify(form.platform_ids.sort()) !==
      JSON.stringify(originalLeague.platform_ids.sort());

    if (platformsChanged) {
      form.platform_ids.forEach((id) => {
        formData.append('platform_ids[]', id.toString());
      });
    }
  }

  // Optional text fields (check if changed)
  if (form.tagline !== undefined && form.tagline !== originalLeague.tagline) {
    formData.append('tagline', form.tagline || '');
  }

  if (form.description !== undefined && form.description !== originalLeague.description) {
    formData.append('description', form.description || '');
  }

  // Social media fields
  const socialFields: Array<keyof UpdateLeagueForm> = [
    'discord_url',
    'website_url',
    'twitter_handle',
    'instagram_handle',
    'youtube_url',
    'twitch_url',
  ];

  socialFields.forEach((field) => {
    if (form[field] !== undefined && form[field] !== originalLeague[field]) {
      formData.append(field, form[field] as string || '');
    }
  });

  return formData;
}
```

**Location**: `resources/user/js/services/leagueService.ts`

---

#### Step 2.3: Add Store Action
**File**: `resources/user/js/stores/leagueStore.ts`

**New Action**:
```typescript
/**
 * Update an existing league
 * @param leagueId - League ID
 * @param form - Update form data
 */
async function updateExistingLeague(leagueId: number, form: UpdateLeagueForm): Promise<League> {
  loading.value = true;
  error.value = null;

  try {
    // Get original league for comparison
    const originalLeague = leagues.value.find((l) => l.id === leagueId);
    if (!originalLeague) {
      throw new Error('League not found');
    }

    const formData = buildUpdateLeagueFormData(form, originalLeague);
    const updatedLeague = await updateLeague(leagueId, formData);

    // Update in local state
    const index = leagues.value.findIndex((l) => l.id === leagueId);
    if (index !== -1) {
      leagues.value[index] = updatedLeague;
    }

    // Update current league if it's the one being edited
    if (currentLeague.value?.id === leagueId) {
      currentLeague.value = updatedLeague;
    }

    return updatedLeague;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update league';
    error.value = errorMessage;
    throw err;
  } finally {
    loading.value = false;
  }
}
```

**Add to return statement**:
```typescript
return {
  // ... existing exports ...
  updateExistingLeague,
};
```

**Location**: `resources/user/js/stores/leagueStore.ts`

---

#### Step 2.4: Update LeagueCard Component
**File**: `resources/user/js/components/league/LeagueCard.vue`

**Changes**:

1. **Add `isOwner` prop/computed**:
```typescript
import { useAuthStore } from '@user/stores/authStore';

const authStore = useAuthStore();

const isOwner = computed(() => {
  return authStore.user?.id === props.league.owner_user_id;
});
```

2. **Add edit emit**:
```typescript
interface Emits {
  (e: 'view', leagueId: number): void;
  (e: 'edit', leagueId: number): void;
  (e: 'delete', leagueId: number): void;
}
```

3. **Add edit handler**:
```typescript
function handleEdit(): void {
  emit('edit', props.league.id);
  router.push(`/leagues/${props.league.id}/edit`);
}
```

4. **Update footer template**:
```vue
<template #footer>
  <div class="flex gap-2">
    <Button
      label="View"
      icon="pi pi-eye"
      text
      class="flex-1"
      @click="handleView"
    />
    <Button
      v-if="isOwner"
      label="Edit"
      icon="pi pi-pencil"
      severity="secondary"
      text
      @click="handleEdit"
    />
    <Button
      v-if="isOwner"
      label="Delete"
      icon="pi pi-trash"
      severity="danger"
      text
      @click="confirmDelete"
    />
  </div>
</template>
```

**Location**: `resources/user/js/components/league/LeagueCard.vue`

---

#### Step 2.5: Create LeagueEdit View
**File**: `resources/user/js/views/LeagueEdit.vue`

**Requirements**:
- Reuse wizard step components from league creation
- Pre-populate form with existing league data
- Support partial updates (only send changed fields)
- Handle file uploads (optional - show existing images)
- Navigate back to league list on success
- Show loading state during update
- Handle errors gracefully

**Structure**:
```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLeagueStore } from '@user/stores/leagueStore';
import { useToast } from 'primevue/usetoast';
import type { UpdateLeagueForm } from '@user/types/league';

// Components
import Card from 'primevue/card';
import Button from 'primevue/button';
import Steps from 'primevue/steps';
import ProgressSpinner from 'primevue/progressspinner';

// Wizard steps (reuse from create)
import LeagueEssentials from '@user/components/league/steps/LeagueEssentials.vue';
import LeagueBranding from '@user/components/league/steps/LeagueBranding.vue';
import LeagueCommunity from '@user/components/league/steps/LeagueCommunity.vue';

const route = useRoute();
const router = useRouter();
const leagueStore = useLeagueStore();
const toast = useToast();

const leagueId = computed(() => Number(route.params.id));
const loading = ref(false);
const currentStep = ref(0);

const formData = ref<UpdateLeagueForm>({});

const steps = [
  { label: 'Essentials' },
  { label: 'Branding' },
  { label: 'Community' },
];

onMounted(async () => {
  await loadLeague();
});

async function loadLeague() {
  loading.value = true;
  try {
    const league = await leagueStore.fetchLeague(leagueId.value);

    // Pre-populate form
    formData.value = {
      name: league.name,
      platform_ids: league.platform_ids,
      timezone: league.timezone,
      visibility: league.visibility,
      tagline: league.tagline || '',
      description: league.description || '',
      contact_email: league.contact_email,
      organizer_name: league.organizer_name,
      discord_url: league.discord_url || '',
      website_url: league.website_url || '',
      twitter_handle: league.twitter_handle || '',
      instagram_handle: league.instagram_handle || '',
      youtube_url: league.youtube_url || '',
      twitch_url: league.twitch_url || '',
    };
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load league',
      life: 5000,
    });
    router.push('/leagues');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  loading.value = true;
  try {
    await leagueStore.updateExistingLeague(leagueId.value, formData.value);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'League updated successfully',
      life: 3000,
    });

    router.push('/leagues');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update league',
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div v-if="loading && !formData.name" class="flex justify-center items-center h-64">
      <ProgressSpinner />
    </div>

    <template v-else>
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Edit League</h1>
        <p class="text-gray-600">Update your league information</p>
      </div>

      <Card>
        <template #content>
          <Steps :model="steps" :activeStep="currentStep" class="mb-8" />

          <LeagueEssentials
            v-if="currentStep === 0"
            v-model="formData"
            :is-edit="true"
          />

          <LeagueBranding
            v-if="currentStep === 1"
            v-model="formData"
            :is-edit="true"
          />

          <LeagueCommunity
            v-if="currentStep === 2"
            v-model="formData"
            :is-edit="true"
          />

          <div class="flex justify-between mt-8">
            <Button
              label="Previous"
              icon="pi pi-arrow-left"
              severity="secondary"
              :disabled="currentStep === 0"
              @click="previousStep"
            />

            <div class="flex gap-2">
              <Button
                label="Cancel"
                severity="secondary"
                outlined
                @click="router.push('/leagues')"
              />

              <Button
                v-if="currentStep < steps.length - 1"
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                @click="nextStep"
              />

              <Button
                v-else
                label="Save Changes"
                icon="pi pi-check"
                :loading="loading"
                @click="handleSubmit"
              />
            </div>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
```

**Location**: `resources/user/js/views/LeagueEdit.vue`

---

#### Step 2.6: Update Wizard Step Components

The existing wizard step components need minor modifications to support edit mode:

**Files to update**:
- `resources/user/js/components/league/steps/LeagueEssentials.vue`
- `resources/user/js/components/league/steps/LeagueBranding.vue`
- `resources/user/js/components/league/steps/LeagueCommunity.vue`

**Changes needed**:

1. **Add `isEdit` prop**:
```typescript
interface Props {
  modelValue: CreateLeagueForm | UpdateLeagueForm;
  isEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
});
```

2. **Adjust validation behavior**:
- In create mode: All fields required
- In edit mode: Fields optional (allow partial updates)

3. **Show existing images** (for LeagueBranding):
```vue
<!-- Show current logo if exists and no new file selected -->
<div v-if="isEdit && !form.logo && currentLeague?.logo_url" class="mb-4">
  <p class="text-sm text-gray-600 mb-2">Current logo:</p>
  <img :src="currentLeague.logo_url" alt="Current logo" class="w-24 h-24 rounded" />
</div>
```

**Locations**:
- `resources/user/js/components/league/steps/LeagueEssentials.vue`
- `resources/user/js/components/league/steps/LeagueBranding.vue`
- `resources/user/js/components/league/steps/LeagueCommunity.vue`

---

#### Step 2.7: Add Router Route
**File**: `resources/user/js/router/index.ts`

**Add route**:
```typescript
{
  path: '/leagues/:id/edit',
  name: 'league-edit',
  component: () => import('@user/views/LeagueEdit.vue'),
  meta: { requiresAuth: true },
},
```

**Location**: `resources/user/js/router/index.ts`

---

#### Step 2.8: Frontend Testing

**Component Test**: `resources/user/js/components/league/LeagueCard.test.ts`

Test cases:
- ✅ Edit button shown for owner
- ✅ Edit button hidden for non-owner
- ✅ Edit button emits 'edit' event with league ID
- ✅ Edit button navigates to edit route

**View Test**: `resources/user/js/views/LeagueEdit.test.ts`

Test cases:
- ✅ Loads league data on mount
- ✅ Pre-populates form with league data
- ✅ Shows all wizard steps
- ✅ Next/Previous navigation works
- ✅ Submit calls store.updateExistingLeague
- ✅ Success navigates to /leagues
- ✅ Error shows toast message
- ✅ Loading state displayed during update

**Service Test**: `resources/user/js/services/leagueService.test.ts`

Test cases:
- ✅ updateLeague calls PUT /api/leagues/{id}
- ✅ buildUpdateLeagueFormData only includes changed fields
- ✅ File uploads included in FormData
- ✅ Platform IDs formatted correctly

**Store Test**: `resources/user/js/stores/leagueStore.test.ts`

Test cases:
- ✅ updateExistingLeague calls service method
- ✅ Updates league in local state
- ✅ Updates currentLeague if editing current
- ✅ Handles errors appropriately

---

## Authorization & Security

### Backend Authorization
- ✅ `UpdateLeagueRequest::authorize()` checks `owner_user_id === Auth::id()`
- ✅ `LeagueApplicationService::updateLeague()` validates ownership
- ✅ 403 Forbidden if non-owner attempts update
- ✅ 401 Unauthorized if unauthenticated

### Frontend Authorization
- ✅ Edit button only shown if `league.owner_user_id === authStore.user.id`
- ✅ Route guard ensures authentication
- ✅ API errors handled gracefully (403 → "Unauthorized")

---

## File Upload Handling

### Backend
- Old files deleted when new ones uploaded
- Files stored in `storage/app/public/leagues/logos` and `storage/app/public/leagues/headers`
- Max sizes: logo 5MB, header 10MB
- Validation: image types only (jpg, png, gif, webp)

### Frontend
- Optional file upload (can update without changing images)
- Preview existing images before replacement
- File size validation before upload
- Progress indicator during upload

---

## Edge Cases & Validation

### Backend Validation
- ✅ Partial updates (any field can be omitted)
- ✅ Platform validation (must exist and be active)
- ✅ Timezone validation (must be valid PHP timezone)
- ✅ URL validation for social media links
- ✅ Email validation for contact_email
- ✅ File type and size validation

### Frontend Validation
- ✅ Required fields in edit mode (name, contact_email, organizer_name)
- ✅ File size limits enforced client-side
- ✅ URL format validation
- ✅ Email format validation
- ✅ Platform selection (at least 1 required)

---

## Testing Checklist

### Backend Tests
- [ ] Feature test: Owner can update league
- [ ] Feature test: Non-owner gets 403
- [ ] Feature test: Partial updates work
- [ ] Feature test: File uploads work
- [ ] Feature test: LeagueUpdated event dispatched
- [ ] Unit test: Entity update methods work
- [ ] Unit test: Entity update methods record events
- [ ] PHPStan level 8 passes
- [ ] Code style (PSR-12) passes

### Frontend Tests
- [ ] Component test: LeagueCard shows edit button for owner
- [ ] Component test: LeagueCard hides edit button for non-owner
- [ ] View test: LeagueEdit loads and pre-populates data
- [ ] View test: LeagueEdit submits updates
- [ ] Service test: updateLeague calls correct endpoint
- [ ] Service test: buildUpdateLeagueFormData includes only changed fields
- [ ] Store test: updateExistingLeague updates local state
- [ ] E2E test: Full edit flow works
- [ ] TypeScript type checking passes
- [ ] ESLint passes

---

## Success Criteria

✅ **Backend**:
- PUT `/api/leagues/{id}` endpoint functional
- Owner-only authorization enforced
- Partial updates supported
- File uploads work (optional replacement)
- Domain events dispatched
- All tests passing

✅ **Frontend**:
- Edit button visible to owners only
- Edit view pre-populates form data
- Wizard navigation works
- Update API call successful
- Local state updated
- Success/error feedback shown
- All tests passing

✅ **Integration**:
- Full flow: Edit button → Edit view → Update → Success
- Authorization works end-to-end
- File uploads work end-to-end
- Error handling works throughout

---

## Files to Create

### Backend
- [ ] `app/Application/League/DTOs/UpdateLeagueData.php`
- [ ] `app/Http/Requests/User/UpdateLeagueRequest.php`
- [ ] `tests/Feature/Http/Controllers/User/LeagueControllerUpdateTest.php`
- [ ] `tests/Unit/Domain/League/LeagueUpdateTest.php`

### Frontend
- [ ] `resources/user/js/views/LeagueEdit.vue`
- [ ] `resources/user/js/views/LeagueEdit.test.ts`

## Files to Modify

### Backend
- [ ] `app/Domain/League/Entities/League.php`
- [ ] `app/Domain/League/Repositories/LeagueRepositoryInterface.php`
- [ ] `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php`
- [ ] `app/Application/League/Services/LeagueApplicationService.php`
- [ ] `app/Http/Controllers/User/LeagueController.php`
- [ ] `routes/subdomain.php`

### Frontend
- [ ] `resources/user/js/types/league.ts`
- [ ] `resources/user/js/services/leagueService.ts`
- [ ] `resources/user/js/services/leagueService.test.ts`
- [ ] `resources/user/js/stores/leagueStore.ts`
- [ ] `resources/user/js/stores/leagueStore.test.ts`
- [ ] `resources/user/js/components/league/LeagueCard.vue`
- [ ] `resources/user/js/components/league/LeagueCard.test.ts`
- [ ] `resources/user/js/components/league/steps/LeagueEssentials.vue`
- [ ] `resources/user/js/components/league/steps/LeagueBranding.vue`
- [ ] `resources/user/js/components/league/steps/LeagueCommunity.vue`
- [ ] `resources/user/js/router/index.ts`

---

## Estimated Development Time

- **Backend**: 4-6 hours
  - DTOs and requests: 1 hour
  - Domain entity updates: 1 hour
  - Application service: 1.5 hours
  - Controller and routes: 0.5 hours
  - Testing: 2 hours

- **Frontend**: 6-8 hours
  - Types and services: 1 hour
  - Store updates: 1 hour
  - LeagueCard updates: 0.5 hours
  - LeagueEdit view: 2 hours
  - Wizard step updates: 1 hour
  - Router updates: 0.5 hours
  - Testing: 2-3 hours

**Total**: 10-14 hours

---

## Implementation Order

1. **Backend First** (use `dev-be`):
   - Create DTOs and requests
   - Update domain entity
   - Update repository
   - Update application service
   - Add controller method
   - Add route
   - Write tests

2. **Frontend Second** (use `dev-fe-user`):
   - Update types
   - Add service methods
   - Update store
   - Update LeagueCard
   - Create LeagueEdit view
   - Update wizard steps
   - Add route
   - Write tests

3. **Integration Testing**:
   - Manual end-to-end testing
   - Fix any integration issues

---

## Notes

- **Reuse existing wizard components** to maintain consistency
- **Authorization is critical** - double-check ownership validation
- **File uploads are optional** - don't force image re-upload on every edit
- **Partial updates** - only send changed fields to reduce payload size
- **Domain events** - ensure LeagueUpdated is dispatched for all changes
- **Testing is mandatory** - all new code must have tests
