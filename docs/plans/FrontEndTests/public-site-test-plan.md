# Public Site Frontend Test Plan

## Executive Summary

### Current State
Based on analysis of the public site codebase (`resources/public/js/`), the current test coverage is critically low:

**Coverage Breakdown (Current)**
- **Components**: 9.18% statements, 17.22% branches, 11.88% functions
- **Composables**: 53.26% statements, 30% branches, 59.18% functions
- **Services**: 12.69% statements, 0% branches, 12.50% functions
- **Stores**: 14.58% statements, 0% branches, 9.09% functions
- **Views (auth)**: 89.52% statements (good coverage)
- **Views (leagues)**: 0% statements (no coverage)

**Test File Statistics**
- Total source files: 155 files
- Total test files: 71 files
- Test coverage: ~46% of files have tests
- **However**: Most tests are for common components (VrlButton, VrlCard, etc.) which are reusable across all apps
- **Critical gap**: Business-specific components (leagues, landing, layout) have minimal to no tests

### Goals
Increase overall coverage from ~10-15% to **60-70%** by:
1. Achieving 80%+ coverage on all services and stores (high business value)
2. Achieving 70%+ coverage on composables (reusable utilities)
3. Achieving 60%+ coverage on leagues components and views (core functionality)
4. Achieving 40-50% coverage on landing/layout components (mostly presentational)

### Strategy
Focus on **high-impact, high-value** code first:
1. **Phase 1**: Services and stores (business logic, API calls, state management)
2. **Phase 2**: Leagues views and components (core user functionality)
3. **Phase 3**: Composables (utilities used across the app)
4. **Phase 4**: Landing page components (marketing, lower priority)

---

## Phase 1: Services & Stores (HIGH PRIORITY)
**Impact**: Critical - these contain core business logic and API interactions
**Current Coverage**: 12-15%
**Target Coverage**: 80-85%
**Estimated Coverage Gain**: +15-20% overall

### 1.1 Services Testing

#### `/services/leagueService.ts` (CRITICAL - 0% coverage)
**Priority**: HIGHEST
**Complexity**: Medium
**Lines**: ~107 lines
**Estimated Impact**: +3-4% coverage

**Test Cases Needed**:
```typescript
describe('leagueService', () => {
  describe('getLeagues', () => {
    ✓ should fetch leagues with no params (default)
    ✓ should fetch leagues with search query
    ✓ should fetch leagues with platform filter
    ✓ should fetch leagues with sort parameter
    ✓ should fetch leagues with pagination params
    ✓ should handle API errors gracefully
    ✓ should unwrap ApiResponse wrapper correctly
    ✓ should pass all params to API correctly
  });

  describe('getLeagueDetail', () => {
    ✓ should fetch league detail by slug
    ✓ should handle 404 not found errors
    ✓ should handle API errors
    ✓ should unwrap ApiResponse wrapper
  });

  describe('getSeasonDetail', () => {
    ✓ should fetch season detail by league and season slug
    ✓ should handle API errors
    ✓ should unwrap ApiResponse wrapper
    ✓ should validate required parameters
  });

  describe('getPlatforms', () => {
    ✓ should fetch available platforms
    ✓ should handle API errors
    ✓ should return empty array on error (non-critical)
  });

  describe('getRoundResults', () => {
    ✓ should fetch round results by roundId
    ✓ should handle API errors
    ✓ should unwrap ApiResponse wrapper
  });
});
```

**Testing Approach**:
- Mock axios/apiClient using vi.mock()
- Test successful responses with various params
- Test error handling (network errors, 404, 500, etc.)
- Verify ApiResponse wrapper is correctly unwrapped
- Test parameter passing to API endpoints

---

#### `/services/authService.ts` (CRITICAL - 0% coverage)
**Priority**: HIGHEST
**Complexity**: High (CSRF, auth flows)
**Lines**: ~170 lines
**Estimated Impact**: +4-5% coverage

**Test Cases Needed**:
```typescript
describe('authService', () => {
  describe('login', () => {
    ✓ should fetch CSRF token before login
    ✓ should call login endpoint with credentials
    ✓ should return user data on success
    ✓ should handle invalid credentials (422)
    ✓ should handle network errors
    ✓ should support AbortSignal for cancellation
  });

  describe('logout', () => {
    ✓ should call logout endpoint
    ✓ should not throw on API errors (logs and continues)
    ✓ should support AbortSignal
  });

  describe('checkAuth', () => {
    ✓ should return current user if authenticated
    ✓ should handle unauthenticated state (401)
    ✓ should support AbortSignal
  });

  describe('register', () => {
    ✓ should fetch CSRF token before register
    ✓ should call register endpoint with data
    ✓ should return user data
    ✓ should handle validation errors (422)
    ✓ should handle duplicate email errors
  });

  describe('resendVerificationEmail', () => {
    ✓ should call resend verification endpoint
    ✓ should handle errors
  });

  describe('updateProfile', () => {
    ✓ should update profile with all fields
    ✓ should update profile without password
    ✓ should handle validation errors
    ✓ should return updated user data
  });

  describe('impersonate', () => {
    ✓ should fetch CSRF token before impersonation
    ✓ should call impersonate endpoint with token
    ✓ should return impersonated user data
    ✓ should handle invalid token errors
  });

  describe('requestPasswordReset', () => {
    ✓ should call forgot password endpoint
    ✓ should handle invalid email errors
    ✓ should handle rate limiting (429)
  });

  describe('resetPassword', () => {
    ✓ should call reset password endpoint
    ✓ should handle invalid token errors
    ✓ should handle validation errors
  });
});
```

**Testing Approach**:
- Mock apiClient and apiService.fetchCSRFToken()
- Test CSRF token fetch is called before state-changing operations
- Test all error scenarios (401, 422, 429, 500)
- Test AbortSignal cancellation
- Verify response data extraction

---

#### `/services/contactService.ts` (CRITICAL - 0% coverage)
**Priority**: HIGH
**Complexity**: Low
**Lines**: ~34 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('contactService', () => {
  describe('submit', () => {
    ✓ should submit contact form data
    ✓ should include all required fields
    ✓ should return response with id and message
    ✓ should handle validation errors (422)
    ✓ should handle network errors
    ✓ should transform data correctly before sending
  });
});
```

**Testing Approach**:
- Mock apiClient.post()
- Verify data transformation
- Test success and error scenarios

---

#### `/services/api.ts` (HIGH - 0% coverage)
**Priority**: HIGH
**Complexity**: High (interceptors, CSRF, error handling)
**Lines**: ~77 lines
**Estimated Impact**: +2% coverage

**Test Cases Needed**:
```typescript
describe('ApiService', () => {
  describe('initialization', () => {
    ✓ should create axios instance with correct config
    ✓ should set withCredentials to true
    ✓ should set correct headers
    ✓ should setup interceptors
  });

  describe('CSRF token handling', () => {
    ✓ should get CSRF token from cookies
    ✓ should add CSRF token to POST requests
    ✓ should add CSRF token to PUT requests
    ✓ should add CSRF token to PATCH requests
    ✓ should add CSRF token to DELETE requests
    ✓ should NOT add CSRF token to GET requests
    ✓ should fetch CSRF token from /csrf-cookie endpoint
  });

  describe('error handling', () => {
    ✓ should retry on 419 CSRF mismatch (once)
    ✓ should NOT retry on 419 if already retried
    ✓ should NOT redirect on 401 (public site behavior)
    ✓ should propagate other errors
  });

  describe('getClient', () => {
    ✓ should return axios instance
  });
});
```

**Testing Approach**:
- Test ApiService class instantiation
- Mock document.cookie for CSRF token tests
- Test request/response interceptors
- Test 419 retry logic (important!)
- Verify 401 handling (should NOT redirect on public site)

---

### 1.2 Stores Testing

#### `/stores/authStore.ts` (CRITICAL - 14.58% coverage)
**Priority**: HIGHEST
**Complexity**: High (Pinia, persistence, auth flows)
**Lines**: ~135 lines
**Estimated Impact**: +4-5% coverage

**Test Cases Needed**:
```typescript
describe('authStore', () => {
  describe('state initialization', () => {
    ✓ should initialize with null user
    ✓ should initialize isAuthenticated as false
    ✓ should initialize isLoading as false
  });

  describe('getters', () => {
    describe('userName', () => {
      ✓ should return "Guest" when user is null
      ✓ should return full name when user is set
      ✓ should handle missing first_name
      ✓ should handle missing last_name
      ✓ should trim whitespace
    });
  });

  describe('register', () => {
    ✓ should call authService.register with data
    ✓ should set isLoading to true during registration
    ✓ should set isLoading to false after completion
    ✓ should return user email on success
    ✓ should handle registration errors
    ✓ should set isLoading to false on error
  });

  describe('login', () => {
    ✓ should call authService.login with credentials
    ✓ should set user data on success
    ✓ should set isAuthenticated to true
    ✓ should redirect to app subdomain (window.location.href)
    ✓ should handle login errors
    ✓ should set isLoading correctly
  });

  describe('logout', () => {
    ✓ should call authService.logout
    ✓ should clear user data
    ✓ should set isAuthenticated to false
    ✓ should redirect to /login
    ✓ should clear auth even if API call fails
  });

  describe('checkAuth', () => {
    ✓ should call authService.checkAuth
    ✓ should set user data if authenticated
    ✓ should return true if authenticated
    ✓ should clear auth if not authenticated
    ✓ should return false if not authenticated
    ✓ should handle errors and clear auth
    ✓ should prevent concurrent auth checks (promise reuse)
    ✓ should allow subsequent checks after completion
  });

  describe('resendVerificationEmail', () => {
    ✓ should call authService.resendVerificationEmail
    ✓ should handle errors
  });

  describe('setUser', () => {
    ✓ should set user data
    ✓ should set isAuthenticated to true
  });

  describe('clearAuth', () => {
    ✓ should clear user data
    ✓ should set isAuthenticated to false
  });

  describe('persistence', () => {
    ✓ should persist user and isAuthenticated to localStorage
    ✓ should restore state from localStorage on initialization
    ✓ should call checkAuth after hydration (afterHydrate hook)
  });
});
```

**Testing Approach**:
- Use setActivePinia(createPinia()) in beforeEach
- Mock authService methods
- Mock window.location.href for redirect tests
- Test persistence with localStorage mocks
- Test concurrent checkAuth calls (promise reuse)
- Verify loading states are set correctly

---

## Phase 2: Leagues Views & Components (HIGH PRIORITY)
**Impact**: High - core user-facing functionality
**Current Coverage**: 0-10%
**Target Coverage**: 60-70%
**Estimated Coverage Gain**: +20-25% overall

### 2.1 Leagues Views

#### `/views/leagues/LeaguesView.vue` (CRITICAL - 0% coverage)
**Priority**: HIGHEST
**Complexity**: High (search, filters, pagination, API)
**Lines**: ~232 lines
**Estimated Impact**: +5-6% coverage

**Test Cases Needed**:
```typescript
describe('LeaguesView', () => {
  describe('component rendering', () => {
    ✓ should render background effects (BackgroundGrid, SpeedLines)
    ✓ should render page header with breadcrumbs
    ✓ should render LeagueSearchBar
  });

  describe('loading state', () => {
    ✓ should show skeleton cards when loading
    ✓ should show 6 skeleton cards
  });

  describe('error state', () => {
    ✓ should show error alert when API fails
    ✓ should display error message
    ✓ should show toast notification on error
  });

  describe('empty state', () => {
    ✓ should show empty state when no leagues found
    ✓ should display "No leagues found" message
  });

  describe('leagues grid', () => {
    ✓ should render LeagueCard for each league
    ✓ should pass correct league data to cards
  });

  describe('pagination', () => {
    ✓ should render pagination component when leagues exist
    ✓ should handle page change
    ✓ should scroll to top on page change
    ✓ should fetch leagues with correct page number
  });

  describe('search functionality', () => {
    ✓ should debounce search input (300ms)
    ✓ should reset to page 1 on search
    ✓ should fetch leagues with search query
    ✓ should clear search debounce timer on unmount
  });

  describe('filter functionality', () => {
    ✓ should fetch leagues when platform filter changes
    ✓ should fetch leagues when sort changes
    ✓ should reset to page 1 on filter change
  });

  describe('data fetching', () => {
    ✓ should fetch leagues and platforms on mount
    ✓ should parse query params on mount (page, search, platform, sort)
    ✓ should handle missing query params gracefully
    ✓ should validate sort param against allowed values
  });

  describe('integration', () => {
    ✓ should update leagues when search changes
    ✓ should update leagues when filters change
    ✓ should maintain state across operations
  });
});
```

**Testing Approach**:
- Mock leagueService.getLeagues and getPlatforms
- Mock useRoute() to test query param parsing
- Mock useToast() for toast notifications
- Test debouncing with vi.useFakeTimers()
- Test window.scrollTo for pagination
- Use data-testid for finding elements

---

#### `/views/leagues/LeagueDetailView.vue` (CRITICAL - 0% coverage)
**Priority**: HIGH
**Complexity**: Medium
**Lines**: ~138 lines
**Estimated Impact**: +3-4% coverage

**Test Cases Needed**:
```typescript
describe('LeagueDetailView', () => {
  describe('component rendering', () => {
    ✓ should render background effects
    ✓ should render back button to /leagues
  });

  describe('loading state', () => {
    ✓ should show skeleton placeholders when loading
    ✓ should show 3 skeleton elements
  });

  describe('error state', () => {
    ✓ should show error alert when API fails
    ✓ should display error message
    ✓ should show toast notification on error
  });

  describe('league data rendering', () => {
    ✓ should render LeagueHeader with league and stats
    ✓ should render competitions section
    ✓ should render CompetitionCard for each competition
    ✓ should pass correct league slug to CompetitionCard
  });

  describe('empty competitions state', () => {
    ✓ should show empty state when no competitions
    ✓ should display "No competitions available" message
  });

  describe('about modal', () => {
    ✓ should open LeagueInfoModal when header emits open-about
    ✓ should pass league data to modal
    ✓ should close modal when v-model:visible changes
  });

  describe('data fetching', () => {
    ✓ should fetch league detail on mount
    ✓ should use leagueSlug from route params
    ✓ should handle invalid leagueSlug
  });
});
```

**Testing Approach**:
- Mock leagueService.getLeagueDetail
- Mock useRoute() for route params
- Mock useToast()
- Test modal visibility toggle
- Test competitions rendering with v-for

---

#### `/views/leagues/SeasonDetailView.vue` (CRITICAL - 0% coverage)
**Priority**: HIGH
**Complexity**: High (standings, rounds, breadcrumbs, logos)
**Lines**: ~261 lines
**Estimated Impact**: +5-6% coverage

**Test Cases Needed**:
```typescript
describe('SeasonDetailView', () => {
  describe('component rendering', () => {
    ✓ should render background effects
    ✓ should render breadcrumbs when data loaded
  });

  describe('loading state', () => {
    ✓ should show skeleton placeholders when loading
  });

  describe('error state', () => {
    ✓ should show error alert when API fails
    ✓ should show toast notification on error
    ✓ should handle invalid slugs
  });

  describe('page header', () => {
    ✓ should render league logo if available (new media object)
    ✓ should render league logo fallback (old URL)
    ✓ should render league initials if no logo
    ✓ should generate correct initials from league name
    ✓ should render league name
  });

  describe('standings section', () => {
    ✓ should render standings header
    ✓ should render competition and season name
    ✓ should render season logo if available (new media object)
    ✓ should render season logo fallback (old URL)
    ✓ should render StandingsTable with correct props
    ✓ should pass seasonId, leagueSlug, seasonSlug to table
  });

  describe('rounds section', () => {
    ✓ should render RoundsSection with correct props
    ✓ should pass rounds data
    ✓ should pass has_divisions flag
    ✓ should pass race_times_required flag
  });

  describe('breadcrumbs computation', () => {
    ✓ should generate correct breadcrumb items
    ✓ should include Leagues -> League -> Season
    ✓ should use correct routes and labels
    ✓ should return empty array when no data
  });

  describe('logo URL computation', () => {
    ✓ should prefer new media object for league logo
    ✓ should fallback to logo_url for league logo
    ✓ should return null if no logo available
    ✓ should prefer new media object for season logo
    ✓ should fallback to logo_url for season logo
  });

  describe('data fetching', () => {
    ✓ should fetch season detail on mount
    ✓ should use leagueSlug and seasonSlug from route params
  });
});
```

**Testing Approach**:
- Mock leagueService.getSeasonDetail
- Mock useRoute() for route params
- Test computed properties (breadcrumbs, logos, initials)
- Test logo fallback logic (media object vs. old URL)
- Test data passing to child components

---

### 2.2 Leagues Components

#### `/components/leagues/LeagueCard.vue` (MEDIUM - 0% coverage)
**Priority**: HIGH
**Complexity**: Medium
**Lines**: ~150 lines
**Estimated Impact**: +2% coverage

**Test Cases Needed**:
```typescript
describe('LeagueCard', () => {
  describe('rendering', () => {
    ✓ should render as router-link to league detail
    ✓ should render league banner with style
    ✓ should render league logo if logoUrl exists
    ✓ should render league initials if no logo
    ✓ should render league name
    ✓ should render platform badge if primary platform exists
    ✓ should render drivers count stat
    ✓ should render competitions count stat
  });

  describe('computed properties', () => {
    describe('initials', () => {
      ✓ should generate 2-letter initials from league name
      ✓ should uppercase initials
      ✓ should handle single-word names
      ✓ should handle multi-word names (take first 2)
    });

    describe('primaryPlatform', () => {
      ✓ should return first platform if available
      ✓ should return null if no platforms
    });

    describe('platformIcon', () => {
      ✓ should return correct emoji for iRacing
      ✓ should return correct emoji for Gran Turismo
      ✓ should return correct emoji for Assetto Corsa
      ✓ should return default emoji for unknown platform
    });

    describe('logoUrl', () => {
      ✓ should prefer new media object original URL
      ✓ should fallback to logo_url if no media object
      ✓ should return null if no logo
    });

    describe('bannerStyle', () => {
      ✓ should set background-image if banner URL exists
      ✓ should use default gradient if no banner
    });
  });

  describe('hover effects', () => {
    ✓ should have hover classes applied
  });
});
```

**Testing Approach**:
- Test with various league data shapes
- Test computed properties independently
- Verify router-link navigation
- Test CSS classes and styles

---

#### `/components/leagues/LeagueSearchBar.vue` (MEDIUM - 0% coverage)
**Priority**: MEDIUM
**Complexity**: Low
**Lines**: ~80 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('LeagueSearchBar', () => {
  describe('rendering', () => {
    ✓ should render search input
    ✓ should render platform dropdown
    ✓ should render sort dropdown
    ✓ should render "All Platforms" option
    ✓ should render platform options for each platform
    ✓ should render sort options (popular, recent, name)
  });

  describe('search input', () => {
    ✓ should display modelValue in input
    ✓ should emit update:modelValue on input change
    ✓ should have correct placeholder text
  });

  describe('platform filter', () => {
    ✓ should display platform prop in select
    ✓ should emit update:platform on change
    ✓ should convert "null" string to null
    ✓ should convert value to number for platform IDs
  });

  describe('sort filter', () => {
    ✓ should display sortBy prop in select
    ✓ should emit update:sortBy on change
    ✓ should pass correct sort value
  });
});
```

**Testing Approach**:
- Test v-model bindings
- Test emit events
- Test type conversions (string -> number, "null" -> null)
- Verify all options are rendered

---

#### `/components/leagues/CompetitionCard.vue` (MEDIUM - 0% coverage)
**Priority**: MEDIUM
**Complexity**: Low
**Lines**: ~100 lines
**Estimated Impact**: +1-2% coverage

**Test Cases Needed**:
```typescript
describe('CompetitionCard', () => {
  describe('rendering', () => {
    ✓ should render competition name
    ✓ should render seasons list
    ✓ should render SeasonChip for each season
    ✓ should pass correct season data to chips
    ✓ should generate correct route for each season
  });

  describe('season routing', () => {
    ✓ should create correct route to season detail
    ✓ should use leagueSlug prop
    ✓ should use season slug from data
  });
});
```

---

#### `/components/leagues/StandingsTable.vue` (HIGH - 0% coverage)
**Priority**: HIGH
**Complexity**: VERY HIGH (tabs, divisions, teams, API)
**Lines**: ~850+ lines (very large component)
**Estimated Impact**: +8-10% coverage

**Test Cases Needed**:
```typescript
describe('StandingsTable', () => {
  describe('loading state', () => {
    ✓ should show loading spinner when fetching data
  });

  describe('error state', () => {
    ✓ should show error message when API fails
  });

  describe('empty state', () => {
    ✓ should show empty message when no standings data
  });

  describe('divisions rendering', () => {
    ✓ should render tabs when has_divisions is true
    ✓ should render tab for each division
    ✓ should set active tab to first division on load
    ✓ should switch tabs on click
    ✓ should show correct division table when tab active
  });

  describe('teams championship tab', () => {
    ✓ should show teams championship tab when available
    ✓ should show drivers tab when both drivers and teams exist
    ✓ should switch between drivers and teams tabs
    ✓ should render TeamsStandingsTable when teams tab active
  });

  describe('standings table rendering', () => {
    ✓ should render table headers correctly
    ✓ should render position column
    ✓ should render driver column
    ✓ should render podiums column
    ✓ should render round columns (R1, R2, etc.)
    ✓ should render total points column
    ✓ should render drop column if drop_round_enabled
    ✓ should NOT render drop column if drop_round_enabled is false
  });

  describe('sub-header rendering', () => {
    ✓ should render P (Pole), FL (Fastest Lap), Pts (Points) sub-headers
    ✓ should render correct number of sub-headers for rounds
  });

  describe('driver rows rendering', () => {
    ✓ should render row for each driver
    ✓ should render driver position
    ✓ should render driver name
    ✓ should render team logo if available
    ✓ should render team name if no logo
    ✓ should render podiums count
    ✓ should render total points
    ✓ should render drop points if enabled
  });

  describe('round data rendering', () => {
    ✓ should show pole position icon (PhCheck) if has_pole
    ✓ should show fastest lap icon (PhCheck) if has_fastest_lap
    ✓ should show points for each round
    ✓ should apply penalty class if total_penalties > 0
    ✓ should show empty cell if round data missing
  });

  describe('position styling', () => {
    ✓ should apply pole class to position 1
    ✓ should apply podium class to positions 2-3
    ✓ should apply points class to positions 4-10
    ✓ should apply no special class to positions 11+
  });

  describe('row styling', () => {
    ✓ should apply pole-row class to position 1
    ✓ should apply podium-row class to positions 2-3
  });

  describe('data fetching', () => {
    ✓ should fetch standings on mount
    ✓ should use seasonId prop
    ✓ should handle API errors
  });

  describe('helper methods', () => {
    describe('getRoundNumbers', () => {
      ✓ should extract unique round numbers from driver data
      ✓ should sort round numbers ascending
      ✓ should handle drivers with different round counts
    });

    describe('getRoundData', () => {
      ✓ should return round data for driver and round number
      ✓ should return undefined if round not found
    });

    describe('getPositionClass', () => {
      ✓ should return correct class for each position
    });

    describe('getRowClass', () => {
      ✓ should return correct row class for each position
    });
  });
});
```

**Testing Approach**:
- Mock leagueService.getSeasonDetail (since it fetches standings)
- Test tab switching logic
- Test conditional rendering (divisions, teams, drop rounds)
- Test data transformation (getRoundNumbers, getRoundData)
- Test CSS class application
- Test empty/error states
- Consider breaking into smaller sub-components in future

---

#### `/components/leagues/LeagueHeader.vue` (PARTIAL - ~40% coverage based on test file)
**Priority**: MEDIUM
**Complexity**: Medium
**Lines**: ~250 lines
**Estimated Impact**: +2% coverage (complete existing tests)

**Additional Test Cases Needed**:
```typescript
describe('LeagueHeader - Additional Tests', () => {
  describe('social links', () => {
    ✓ should render social links if available
    ✓ should hide social links section if none available
    ✓ should render correct icons for each platform
    ✓ should open links in new tab
  });

  describe('responsive behavior', () => {
    ✓ should apply responsive classes
  });

  describe('edge cases', () => {
    ✓ should handle missing stats gracefully
    ✓ should handle zero values in stats
  });
});
```

---

#### `/components/leagues/LeagueInfoModal.vue` (PARTIAL - ~50% coverage based on test file)
**Priority**: MEDIUM
**Complexity**: Medium
**Lines**: ~230 lines
**Estimated Impact**: +2% coverage

**Additional Test Cases Needed**:
```typescript
describe('LeagueInfoModal - Additional Tests', () => {
  describe('content sections', () => {
    ✓ should render all content sections
    ✓ should handle missing sections gracefully
  });

  describe('modal interactions', () => {
    ✓ should close on overlay click
    ✓ should emit update:visible on close
  });
});
```

---

#### Rounds Components (0% coverage)
**Priority**: MEDIUM-LOW
**Complexity**: Medium-High
**Estimated Impact**: +3-4% coverage total

These components need basic rendering and data passing tests:
- `RoundsSection.vue` - container component
- `RoundAccordion.vue` - accordion with race events
- `RaceEventAccordion.vue` - individual race event
- `RaceResultsTable.vue` - results table
- `RoundStandingsTable.vue` - standings after round
- `CrossDivisionResultsTable.vue` - cross-division results

**Test Focus**: Rendering, prop passing, conditional display, accordion expand/collapse

---

#### Minor Leagues Components (0% coverage)
**Priority**: LOW
**Complexity**: Low
**Estimated Impact**: +1% coverage total

- `DivisionTabs.vue` - simple tabs component
- `SeasonChip.vue` - simple chip/badge component
- `TeamsStandingsTable.vue` - teams standings table

**Test Focus**: Basic rendering, prop validation, styling

---

## Phase 3: Composables (MEDIUM PRIORITY)
**Impact**: Medium - reusable utilities
**Current Coverage**: 53% (but only 2/9 composables tested)
**Target Coverage**: 80%+
**Estimated Coverage Gain**: +5-7% overall

### 3.1 Untested Composables

#### `/composables/useGtm.ts` (0% coverage)
**Priority**: MEDIUM
**Complexity**: Low
**Lines**: ~73 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('useGtm', () => {
  describe('trackEvent', () => {
    ✓ should push event to window.dataLayer
    ✓ should include event name
    ✓ should merge additional data
    ✓ should handle missing window (SSR)
    ✓ should initialize dataLayer if undefined
  });

  describe('trackFormSubmit', () => {
    ✓ should push form_submit event
    ✓ should include form_name and form_action
    ✓ should merge additional data
  });

  describe('trackPageView', () => {
    ✓ should push page_view event
    ✓ should include page_name
    ✓ should merge additional data
  });
});
```

**Testing Approach**:
- Mock window.dataLayer
- Verify data layer push calls
- Test SSR safety (typeof window !== 'undefined')

---

#### `/composables/usePageTitle.ts` (0% coverage)
**Priority**: MEDIUM
**Complexity**: Low
**Lines**: ~75 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('usePageTitle', () => {
  describe('formatTitle', () => {
    ✓ should return app name when title is null
    ✓ should return app name when title is empty string
    ✓ should format single title with app name
    ✓ should format array of titles with separator
    ✓ should filter out empty strings from array
    ✓ should handle mixed empty and filled values
  });

  describe('setTitle', () => {
    ✓ should update document.title
    ✓ should format title correctly
  });

  describe('reactive title watching', () => {
    ✓ should watch reactive title ref
    ✓ should update document.title when ref changes
    ✓ should update immediately (immediate: true)
  });

  describe('without reactive title', () => {
    ✓ should not throw when no title ref provided
    ✓ should only expose setTitle method
  });
});
```

**Testing Approach**:
- Mock document.title
- Test computed title formatting
- Test watcher with reactive refs
- Test immediate update

---

#### `/composables/useTimeFormat.ts` (0% coverage)
**Priority**: MEDIUM
**Complexity**: Medium (regex parsing)
**Lines**: ~78 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('useTimeFormat', () => {
  describe('formatRaceTime', () => {
    ✓ should return "-" for null
    ✓ should return "-" for undefined
    ✓ should return "-" for empty string
    ✓ should format hours:minutes:seconds.ms (01:02:03.456)
    ✓ should remove leading hour zeros (00:02:23.342 -> "2:23.342")
    ✓ should remove leading minute zeros (00:00:45.123 -> "45.123")
    ✓ should keep second padding (00:00:05.123 -> "05.123")
    ✓ should handle +prefix (+00:00:14.160 -> "+14.160")
    ✓ should handle +prefix with minutes (+00:01:23.456 -> "+1:23.456")
    ✓ should return as-is for non-matching patterns
    ✓ should handle invalid formats gracefully
  });
});
```

**Testing Approach**:
- Test all edge cases from JSDoc examples
- Test regex matching
- Test prefix handling (+/-)
- Test invalid input handling

---

#### `/composables/useToast.ts` (0% coverage)
**Priority**: HIGH
**Complexity**: Low (wrapper around PrimeVue)
**Lines**: ~70 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('useToast', () => {
  describe('success', () => {
    ✓ should call toast.add with success severity
    ✓ should use default "Success" summary
    ✓ should use custom summary if provided
    ✓ should use message as detail
    ✓ should set life to 5000ms
  });

  describe('info', () => {
    ✓ should call toast.add with info severity
    ✓ should use default "Info" summary
  });

  describe('warn', () => {
    ✓ should call toast.add with warn severity
    ✓ should use default "Warning" summary
  });

  describe('error', () => {
    ✓ should call toast.add with error severity
    ✓ should use default "Error" summary
  });

  describe('show', () => {
    ✓ should call toast.add with custom options
    ✓ should use default severity "info"
    ✓ should use default life 5000ms
    ✓ should override defaults with provided options
  });
});
```

**Testing Approach**:
- Mock usePrimeToast() from primevue
- Verify toast.add calls with correct params
- Test default values

---

#### `/composables/usePasswordValidation.ts` (0% coverage)
**Priority**: MEDIUM
**Complexity**: Medium (validation logic)
**Lines**: ~105 lines
**Estimated Impact**: +2% coverage

**Test Cases Needed**:
```typescript
describe('usePasswordValidation', () => {
  describe('passwordErrors', () => {
    ✓ should return empty array for empty password
    ✓ should return error for password < 8 characters
    ✓ should return error for missing lowercase letter
    ✓ should return error for missing uppercase letter
    ✓ should return error for missing number
    ✓ should return multiple errors for invalid password
    ✓ should return empty array for valid password
  });

  describe('isPasswordValid', () => {
    ✓ should return false for empty password
    ✓ should return false when errors exist
    ✓ should return true when password is valid
  });

  describe('passwordStrength', () => {
    ✓ should return score 0 and empty label for empty password
    ✓ should calculate score based on criteria
    ✓ should return "Very Weak" for score 0
    ✓ should return "Weak" for score 1
    ✓ should return "Fair" for score 2
    ✓ should return "Good" for score 3
    ✓ should return "Strong" for score 4
    ✓ should give bonus for special characters
    ✓ should give bonus for length >= 12
    ✓ should normalize score to 0-4 range
    ✓ should apply correct colors for each score
  });

  describe('reactivity', () => {
    ✓ should update when password ref changes
    ✓ should recompute errors when password changes
    ✓ should recompute strength when password changes
  });
});
```

**Testing Approach**:
- Test password ref reactivity
- Test all validation rules
- Test score calculation
- Test strength labels and colors

---

### 3.2 Existing Composables (Expand Coverage)

#### `/composables/useContactForm.ts` (GOOD - has tests)
**Priority**: LOW
**Current Coverage**: ~70-80% (has test file)
**Action**: Review and expand existing tests if needed

#### `/composables/useModal.ts` (GOOD - has tests)
**Priority**: LOW
**Current Coverage**: ~70-80% (has test file)
**Action**: Review and expand existing tests if needed

#### `/composables/useLoadingState.ts` (GOOD - has tests)
**Priority**: LOW
**Current Coverage**: ~70-80% (has test file)
**Action**: Review and expand existing tests if needed

---

## Phase 4: Landing & Layout Components (LOWER PRIORITY)
**Impact**: Medium-Low - mostly presentational
**Current Coverage**: 0%
**Target Coverage**: 40-50%
**Estimated Coverage Gain**: +5-8% overall

### 4.1 Layout Components (0% coverage)

#### `/components/layout/PublicHeader.vue` (0% coverage)
**Priority**: MEDIUM
**Complexity**: Low
**Lines**: ~60 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('PublicHeader', () => {
  describe('rendering', () => {
    ✓ should render logo/brand
    ✓ should render navigation links
    ✓ should render login button
    ✓ should render register button
  });

  describe('navigation', () => {
    ✓ should link to home page
    ✓ should link to leagues page
    ✓ should link to login page
    ✓ should link to register page
  });

  describe('responsive behavior', () => {
    ✓ should have mobile menu toggle
    ✓ should show/hide mobile menu
  });
});
```

---

#### `/components/layout/PublicFooter.vue` (0% coverage)
**Priority**: LOW
**Complexity**: Low
**Lines**: ~130 lines
**Estimated Impact**: +1% coverage

**Test Cases Needed**:
```typescript
describe('PublicFooter', () => {
  describe('rendering', () => {
    ✓ should render footer sections
    ✓ should render copyright text
    ✓ should render social links if configured
    ✓ should render footer navigation links
  });

  describe('links', () => {
    ✓ should have correct href for each link
    ✓ should open external links in new tab
  });
});
```

---

### 4.2 Landing Page Components (0% coverage)

**Priority**: LOW-MEDIUM
**Complexity**: Low (mostly presentational)
**Total Estimated Impact**: +3-5% coverage

These components are mostly presentational and have low business logic:

#### High-Value Landing Components
- `LandingNav.vue` - navigation with auth buttons (test routing)
- `HeroSection.vue` - hero with stats (test data display)

#### Medium-Value Landing Components
- `FeaturesSection.vue` - features grid (test rendering)
- `HowItWorksSection.vue` - steps (test rendering)
- `PricingSection.vue` - pricing cards (test rendering)

#### Low-Value Landing Components (Presentational)
- `BackgroundGrid.vue` - CSS grid effect (minimal testing)
- `SpeedLines.vue` - animation effect (minimal testing)
- `SectionHeader.vue` - reusable header (basic rendering)
- `StatItem.vue` - stat display (basic rendering)
- `StepCard.vue` - step card (basic rendering)
- `PricingCard.vue` - pricing card (basic rendering)
- `PlatformCard.vue` - platform card (basic rendering)
- `HeroStandingsCard.vue` - standings preview (basic rendering)
- `StandingsRow.vue` - standings row (basic rendering)
- `ComingSoonItem.vue` - feature item (basic rendering)
- `PlatformsSection.vue` - platforms grid (basic rendering)
- `ComingSoonSection.vue` - features grid (basic rendering)
- `CtaSection.vue` - call to action (basic rendering)

**Testing Approach for Landing Components**:
- Focus on snapshot tests for presentational components
- Test prop rendering
- Test conditional rendering (if applicable)
- Test click handlers for interactive components
- Low priority - defer to Phase 4

---

## Phase 5: Contact & Miscellaneous (LOW PRIORITY)
**Impact**: Low
**Current Coverage**: Partial (PublicContactModal has tests)
**Target Coverage**: 60%
**Estimated Impact**: +1-2% overall

### `/components/contact/PublicContactModal.vue` (PARTIAL - has tests)
**Priority**: LOW
**Action**: Review and expand existing tests

---

## Testing Patterns & Best Practices

### General Testing Approach

#### 1. Component Testing Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ComponentName from './ComponentName.vue';

describe('ComponentName', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    wrapper = mount(ComponentName, {
      props: {
        // props here
      },
      global: {
        stubs: {
          // stub child components if needed
        },
      },
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  // Tests here
});
```

#### 2. Service Testing Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@public/services/api';
import { serviceName } from './serviceName';

vi.mock('@public/services/api');

describe('serviceName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call API with correct params', async () => {
    const mockData = { data: { data: { /* ... */ } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockData);

    const result = await serviceName.method();

    expect(apiClient.get).toHaveBeenCalledWith('/endpoint', { params: {} });
    expect(result).toEqual(mockData.data.data);
  });
});
```

#### 3. Store Testing Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useStoreName } from './storeName';

vi.mock('@public/services/serviceName');

describe('useStoreName', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should perform action', async () => {
    const store = useStoreName();

    await store.someAction();

    expect(store.someState).toBe(expectedValue);
  });
});
```

#### 4. Composable Testing Pattern
```typescript
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useComposableName } from './useComposableName';

describe('useComposableName', () => {
  it('should provide expected functionality', () => {
    const input = ref('test');
    const { output } = useComposableName(input);

    expect(output.value).toBe('expected');
  });
});
```

### Mock Utilities

#### Common Mocks Needed
```typescript
// Mock Vue Router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { id: '1' },
    query: {},
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

// Mock PrimeVue Toast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

// Mock window.location
delete window.location;
window.location = { href: '' } as Location;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;
```

### Coverage Goals by File Type

| File Type | Target Coverage | Priority |
|-----------|----------------|----------|
| Services | 85%+ | CRITICAL |
| Stores | 80%+ | CRITICAL |
| Views | 65%+ | HIGH |
| Business Components (leagues) | 70%+ | HIGH |
| Composables (logic) | 80%+ | MEDIUM |
| Composables (wrappers) | 60%+ | MEDIUM |
| Layout Components | 50%+ | MEDIUM |
| Presentational Components | 40%+ | LOW |

---

## Implementation Order & Timeline

### Sprint 1: Foundation (Services & Stores)
**Duration**: 3-5 days
**Expected Coverage Gain**: +15-20%

1. ✓ `services/api.ts` (1 day)
2. ✓ `services/authService.ts` (1 day)
3. ✓ `stores/authStore.ts` (1 day)
4. ✓ `services/leagueService.ts` (0.5 days)
5. ✓ `services/contactService.ts` (0.5 days)

**Deliverable**: All critical services and stores have 80%+ coverage

---

### Sprint 2: Core Views (Leagues)
**Duration**: 4-6 days
**Expected Coverage Gain**: +15-20%

1. ✓ `views/leagues/LeaguesView.vue` (1.5 days)
2. ✓ `views/leagues/LeagueDetailView.vue` (1 day)
3. ✓ `views/leagues/SeasonDetailView.vue` (1.5 days)
4. ✓ `components/leagues/StandingsTable.vue` (2 days - large component)

**Deliverable**: All leagues views have 60%+ coverage

---

### Sprint 3: Business Components
**Duration**: 3-4 days
**Expected Coverage Gain**: +8-12%

1. ✓ `components/leagues/LeagueCard.vue` (0.5 days)
2. ✓ `components/leagues/LeagueSearchBar.vue` (0.5 days)
3. ✓ `components/leagues/CompetitionCard.vue` (0.5 days)
4. ✓ Complete `LeagueHeader.vue` tests (0.5 days)
5. ✓ Complete `LeagueInfoModal.vue` tests (0.5 days)
6. ✓ Rounds components (1.5 days)

**Deliverable**: Core leagues components have 60%+ coverage

---

### Sprint 4: Composables
**Duration**: 2-3 days
**Expected Coverage Gain**: +5-7%

1. ✓ `useGtm.ts` (0.5 days)
2. ✓ `usePageTitle.ts` (0.5 days)
3. ✓ `useTimeFormat.ts` (0.5 days)
4. ✓ `useToast.ts` (0.5 days)
5. ✓ `usePasswordValidation.ts` (0.5 days)

**Deliverable**: All composables have 75%+ coverage

---

### Sprint 5: Layout & Landing (Optional)
**Duration**: 2-3 days
**Expected Coverage Gain**: +5-8%

1. ✓ `PublicHeader.vue` (0.5 days)
2. ✓ `PublicFooter.vue` (0.5 days)
3. ✓ High-value landing components (1 day)
4. ✓ Medium-value landing components (1 day)

**Deliverable**: Layout and key landing components have 50%+ coverage

---

## Success Metrics

### Coverage Targets
- **Overall**: 60-70% (from current ~10-15%)
- **Services**: 85%+ (CRITICAL)
- **Stores**: 80%+ (CRITICAL)
- **Views**: 65%+ (HIGH)
- **Business Components**: 70%+ (HIGH)
- **Composables**: 75%+ (MEDIUM)

### Quality Metrics
- All tests pass consistently
- No flaky tests
- Fast test execution (< 30s for full suite)
- Clear, descriptive test names
- Proper mocking and isolation
- No warnings or errors in test output

### Maintenance Metrics
- New features include tests (enforce 70%+ coverage on new code)
- Test updates when features change
- Documentation for complex test scenarios
- Shared test utilities for common patterns

---

## Risks & Mitigations

### Risk 1: Large Component Complexity
**Risk**: `StandingsTable.vue` is 850+ lines - difficult to test
**Mitigation**:
- Break down into smaller tests by feature area
- Consider refactoring into smaller components (future work)
- Focus on critical paths first (rendering, data display, tab switching)

### Risk 2: Testing Third-Party Dependencies
**Risk**: Heavy reliance on PrimeVue, Vue Router, Pinia
**Mitigation**:
- Use proper mocking strategies
- Test integration points, not library internals
- Focus on our business logic, not library behavior

### Risk 3: API Mocking Consistency
**Risk**: Inconsistent mocking across tests
**Mitigation**:
- Create shared mock factories in `tests/mocks/`
- Document mocking patterns
- Use MSW for complex API mocking if needed

### Risk 4: Test Maintenance Burden
**Risk**: Too many tests become maintenance burden
**Mitigation**:
- Focus on behavior, not implementation
- Use data-testid for stable selectors
- Avoid over-testing presentational components
- Keep tests simple and readable

---

## Appendix A: File Inventory

### Services (4 files, 0-15% coverage)
- ✓ `/services/api.ts` - 77 lines, 0% coverage
- ✓ `/services/authService.ts` - 170 lines, 0% coverage
- ✓ `/services/leagueService.ts` - 107 lines, 0% coverage
- ✓ `/services/contactService.ts` - 34 lines, 0% coverage

### Stores (1 file, 14.58% coverage)
- ✓ `/stores/authStore.ts` - 135 lines, 14.58% coverage

### Composables (9 files, 53% avg but only 3 tested)
**Tested:**
- ✓ `/composables/useContactForm.ts` - 60 lines, ~70% coverage
- ✓ `/composables/useModal.ts` - 80 lines, ~70% coverage
- ✓ `/composables/useLoadingState.ts` - 50 lines, ~70% coverage

**Untested:**
- `/composables/useGtm.ts` - 73 lines, 0% coverage
- `/composables/usePageTitle.ts` - 75 lines, 0% coverage
- `/composables/useTimeFormat.ts` - 78 lines, 0% coverage
- `/composables/useToast.ts` - 70 lines, 0% coverage
- `/composables/usePasswordValidation.ts` - 105 lines, 0% coverage

### Views (4 files)
**Well-tested (auth views):**
- ✓ `/views/auth/LoginView.vue` - ~89% coverage
- ✓ `/views/auth/RegisterView.vue` - ~89% coverage
- ✓ `/views/auth/ForgotPasswordView.vue` - ~89% coverage
- ✓ `/views/auth/ResetPasswordView.vue` - ~89% coverage
- ✓ `/views/auth/RegisterSuccessView.vue` - ~89% coverage

**Untested (leagues views):**
- `/views/leagues/LeaguesView.vue` - 232 lines, 0% coverage
- `/views/leagues/LeagueDetailView.vue` - 138 lines, 0% coverage
- `/views/leagues/SeasonDetailView.vue` - 261 lines, 0% coverage
- `/views/HomeView.vue` - 45 lines, 0% coverage

### Components - Leagues (15 files, ~10% coverage)
**Partially Tested:**
- `/components/leagues/LeagueHeader.vue` - 250 lines, ~40% coverage (has tests)
- `/components/leagues/LeagueInfoModal.vue` - 230 lines, ~50% coverage (has tests)

**Untested:**
- `/components/leagues/StandingsTable.vue` - 850 lines, 0% coverage (CRITICAL)
- `/components/leagues/LeagueCard.vue` - 150 lines, 0% coverage
- `/components/leagues/LeagueSearchBar.vue` - 80 lines, 0% coverage
- `/components/leagues/CompetitionCard.vue` - 100 lines, 0% coverage
- `/components/leagues/TeamsStandingsTable.vue` - 120 lines, 0% coverage
- `/components/leagues/DivisionTabs.vue` - 40 lines, 0% coverage
- `/components/leagues/SeasonChip.vue` - 30 lines, 0% coverage
- `/components/leagues/rounds/RoundsSection.vue` - 60 lines, 0% coverage
- `/components/leagues/rounds/RoundAccordion.vue` - 350 lines, 0% coverage
- `/components/leagues/rounds/RaceEventAccordion.vue` - 410 lines, 0% coverage
- `/components/leagues/rounds/RaceResultsTable.vue` - 60 lines, 0% coverage
- `/components/leagues/rounds/RoundStandingsTable.vue` - 170 lines, 0% coverage
- `/components/leagues/rounds/CrossDivisionResultsTable.vue` - 195 lines, 0% coverage

### Components - Layout (2 files, 0% coverage)
- `/components/layout/PublicHeader.vue` - 60 lines, 0% coverage
- `/components/layout/PublicFooter.vue` - 130 lines, 0% coverage

### Components - Landing (18 files, 0% coverage)
- `/components/landing/LandingNav.vue` - 115 lines, 0% coverage
- `/components/landing/sections/HeroSection.vue` - 200 lines, 0% coverage
- `/components/landing/sections/FeaturesSection.vue` - 150 lines, 0% coverage
- `/components/landing/sections/HowItWorksSection.vue` - 130 lines, 0% coverage
- `/components/landing/sections/PricingSection.vue` - 140 lines, 0% coverage
- `/components/landing/sections/PlatformsSection.vue` - 100 lines, 0% coverage
- `/components/landing/sections/ComingSoonSection.vue` - 120 lines, 0% coverage
- `/components/landing/sections/CtaSection.vue` - 80 lines, 0% coverage
- `/components/landing/BackgroundGrid.vue` - 20 lines, 0% coverage
- `/components/landing/SpeedLines.vue` - 40 lines, 0% coverage
- `/components/landing/SectionHeader.vue` - 35 lines, 0% coverage
- `/components/landing/StatItem.vue` - 25 lines, 0% coverage
- `/components/landing/StepCard.vue` - 40 lines, 0% coverage
- `/components/landing/PricingCard.vue` - 60 lines, 0% coverage
- `/components/landing/PlatformCard.vue` - 25 lines, 0% coverage
- `/components/landing/HeroStandingsCard.vue` - 50 lines, 0% coverage
- `/components/landing/StandingsRow.vue` - 35 lines, 0% coverage
- `/components/landing/ComingSoonItem.vue` - 25 lines, 0% coverage

### Components - Contact (1 file, partial coverage)
- `/components/contact/PublicContactModal.vue` - 200 lines, ~60% coverage (has tests)

---

## Appendix B: Testing Tools & Setup

### Current Testing Stack
- **Test Runner**: Vitest 4.x
- **Test Environment**: happy-dom
- **Component Testing**: @vue/test-utils 2.x
- **Coverage**: @vitest/coverage-v8
- **Mocking**: Vitest built-in (vi.mock)

### Test Configuration
See `/var/www/vitest.config.ts`:
- Coverage provider: v8
- Coverage reporters: text, json, html, lcov
- Coverage thresholds: 70% (lines, functions, branches, statements)
- Test timeout: 10s
- Hook timeout: 10s

### Running Tests
```bash
# Run all tests
npm test

# Run public site tests only
npm run test:public

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run specific test file
npm test -- path/to/test.spec.ts

# Run in watch mode
npm test -- --watch
```

### Test File Location
Tests should be co-located with source files:
```
components/
  MyComponent.vue
  MyComponent.test.ts  ← Test next to component
```

Or in `__tests__/` directory:
```
components/
  __tests__/
    MyComponent.test.ts
  MyComponent.vue
```

---

## Appendix C: Example Test Files

### Example: Service Test
```typescript
// services/leagueService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@public/services/api';
import { leagueService } from './leagueService';

vi.mock('@public/services/api');

describe('leagueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeagues', () => {
    it('should fetch leagues with default params', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [{ id: 1, name: 'Test League' }],
            meta: { total: 1, per_page: 12, current_page: 1, last_page: 1 },
          },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeagues();

      expect(apiClient.get).toHaveBeenCalledWith('/public/leagues', { params: {} });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should handle API errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      await expect(leagueService.getLeagues()).rejects.toThrow('Network error');
    });
  });
});
```

### Example: Component Test
```typescript
// components/leagues/LeagueCard.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueCard from './LeagueCard.vue';

describe('LeagueCard', () => {
  const mockLeague = {
    id: 1,
    name: 'Test Racing League',
    slug: 'test-racing-league',
    drivers_count: 42,
    competitions_count: 3,
    platforms: [{ id: 1, name: 'iRacing' }],
  };

  it('should render league name', () => {
    const wrapper = mount(LeagueCard, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('Test Racing League');
  });

  it('should generate correct initials', () => {
    const wrapper = mount(LeagueCard, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('TR'); // Test Racing
  });

  it('should render driver and competition counts', () => {
    const wrapper = mount(LeagueCard, {
      props: { league: mockLeague },
    });

    expect(wrapper.text()).toContain('42');
    expect(wrapper.text()).toContain('3');
  });
});
```

### Example: Store Test
```typescript
// stores/authStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './authStore';
import * as authService from '@public/services/authService';

vi.mock('@public/services/authService');

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with null user', () => {
    const store = useAuthStore();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should set user on successful login', async () => {
    const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' };
    vi.mocked(authService.login).mockResolvedValue(mockUser);

    // Mock window.location.href
    delete window.location;
    window.location = { href: '' } as Location;

    const store = useAuthStore();
    await store.login({ email: 'john@example.com', password: 'password' });

    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
  });
});
```

---

## Conclusion

This test plan provides a comprehensive roadmap to increase the public site frontend test coverage from ~10-15% to 60-70%. By following the phased approach and prioritizing high-impact areas (services, stores, views), we can achieve significant coverage gains while maintaining test quality and maintainability.

**Key Success Factors**:
1. Follow the priority order (Phases 1-5)
2. Maintain consistent testing patterns
3. Focus on behavior over implementation
4. Keep tests simple and readable
5. Regularly review coverage reports
6. Iterate and improve based on findings

**Next Steps**:
1. Review and approve this test plan
2. Begin Sprint 1 (Services & Stores)
3. Set up CI/CD coverage reporting
4. Establish coverage gates for new code (70%+)
5. Schedule regular test review sessions
