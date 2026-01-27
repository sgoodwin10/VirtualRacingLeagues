# Frontend Test Coverage Analysis - resources/public/

**Generated:** 2026-01-26

This document outlines all missing tests for the public frontend application. Components and files are organized by priority and category.

## Summary

### Coverage Statistics
- **Total Vue Components:** 119
- **Tested Components:** 91
- **Missing Tests:** 28
- **Total Composables:** 8
- **Tested Composables:** 8
- **Missing Composable Tests:** 0
- **Total Utility Files:** 1
- **Tested Utilities:** 0
- **Missing Utility Tests:** 1

---

## Priority Levels

- **HIGH**: Core functionality, user-facing features, authentication, critical UI components
- **MEDIUM**: Supporting components, layout elements, non-critical features
- **LOW**: Simple presentational components, minor UI elements

---

## Missing Tests by Category

### 1. Views (HIGH Priority)

#### 1.1 Authentication Views

##### `/var/www/resources/public/js/views/auth/LoginView.vue`
**Priority:** HIGH
**Why Test:** Critical authentication flow, user entry point

**Test Coverage Needed:**
- **Rendering:**
  - Should render login form with email and password fields
  - Should display logo and branding
  - Should show "Forgot Password" link
  - Should show "Register" link
  - Should render submit button

- **User Interactions:**
  - Should handle email input changes
  - Should handle password input changes
  - Should show/hide password when toggle clicked
  - Should submit form on button click
  - Should submit form on Enter key press
  - Should navigate to forgot password page on link click
  - Should navigate to register page on link click

- **Validation:**
  - Should show validation errors for empty email
  - Should show validation errors for invalid email format
  - Should show validation errors for empty password
  - Should show validation errors for short password

- **API Integration:**
  - Should call authService.login with correct credentials
  - Should redirect to app subdomain on successful login
  - Should display error message on failed login
  - Should show loading state during API call
  - Should disable submit button during loading

- **Edge Cases:**
  - Should handle network errors gracefully
  - Should handle 401 (unauthorized) responses
  - Should handle 422 (validation) responses
  - Should prevent multiple simultaneous submissions
  - Should clear errors when user starts typing

---

##### `/var/www/resources/public/js/views/auth/RegisterView.vue`
**Priority:** HIGH
**Why Test:** Critical user registration flow, data validation

**Test Coverage Needed:**
- **Rendering:**
  - Should render registration form with all required fields
  - Should display password strength indicator
  - Should show terms and conditions checkbox
  - Should render submit button
  - Should display "Already have an account?" login link

- **User Interactions:**
  - Should handle all form field inputs (name, email, password, confirmPassword)
  - Should toggle password visibility
  - Should enable/disable submit based on form validity
  - Should navigate to login page on link click

- **Validation:**
  - Should validate email format
  - Should validate password strength (min length, complexity)
  - Should validate password confirmation matches
  - Should require terms acceptance
  - Should show inline validation errors
  - Should validate on blur and on submit

- **API Integration:**
  - Should call authService.register with form data
  - Should redirect to success page on successful registration
  - Should display error message on failed registration
  - Should handle duplicate email errors (422)
  - Should show loading state during API call

- **Edge Cases:**
  - Should handle network errors
  - Should prevent multiple submissions
  - Should clear password fields on error
  - Should sanitize input data

---

##### `/var/www/resources/public/js/views/auth/ForgotPasswordView.vue`
**Priority:** HIGH
**Why Test:** Password recovery flow, security-critical

**Test Coverage Needed:**
- **Rendering:**
  - Should render email input field
  - Should display instructions text
  - Should show submit button
  - Should show "Back to Login" link

- **User Interactions:**
  - Should handle email input changes
  - Should submit form on button click
  - Should navigate back to login on link click

- **Validation:**
  - Should validate email format
  - Should show error for empty email
  - Should clear errors when user types

- **API Integration:**
  - Should call password reset API with email
  - Should show success message on request sent
  - Should show error message on failure
  - Should handle rate limiting (429) responses
  - Should show loading state during API call

- **Edge Cases:**
  - Should handle non-existent email gracefully
  - Should prevent spam submissions
  - Should handle network errors

---

##### `/var/www/resources/public/js/views/auth/ResetPasswordView.vue`
**Priority:** HIGH
**Why Test:** Password reset completion, security-critical

**Test Coverage Needed:**
- **Rendering:**
  - Should render password and confirm password fields
  - Should display password strength indicator
  - Should show submit button
  - Should extract token from URL query params

- **User Interactions:**
  - Should handle password input changes
  - Should toggle password visibility
  - Should validate password strength in real-time

- **Validation:**
  - Should validate password meets requirements
  - Should validate passwords match
  - Should show inline validation errors
  - Should require valid reset token

- **API Integration:**
  - Should call password reset API with token and new password
  - Should redirect to login on success
  - Should show success message
  - Should handle invalid/expired token errors
  - Should show loading state during API call

- **Edge Cases:**
  - Should handle missing token gracefully
  - Should handle malformed token
  - Should prevent multiple submissions
  - Should handle network errors

---

#### 1.2 Main Views

##### `/var/www/resources/public/js/views/HomeView.vue`
**Priority:** HIGH
**Why Test:** Landing page, first user impression, marketing content

**Test Coverage Needed:**
- **Rendering:**
  - Should render all landing page sections (Hero, Features, Platforms, Pricing, CTA, etc.)
  - Should render navigation header
  - Should render footer
  - Should display correct page title

- **Component Integration:**
  - Should render HeroSection component
  - Should render FeaturesSection component
  - Should render PlatformsSection component
  - Should render HowItWorksSection component
  - Should render PricingSection component
  - Should render ComingSoonSection component
  - Should render CtaSection component

- **Navigation:**
  - Should scroll to sections on anchor link click
  - Should highlight active section in navigation
  - Should handle smooth scrolling behavior

- **Responsive Behavior:**
  - Should adapt layout for mobile/tablet/desktop
  - Should show mobile menu when appropriate

- **SEO/Meta:**
  - Should set correct page title
  - Should set meta description
  - Should set OG tags for social sharing

- **Edge Cases:**
  - Should handle missing section gracefully
  - Should load all images lazily
  - Should handle slow network connections

---

### 2. Layout Components (MEDIUM Priority)

##### `/var/www/resources/public/js/components/layout/PublicHeader.vue` ✅ HAS TEST
**Status:** Already tested

---

##### `/var/www/resources/public/js/components/layout/PublicFooter.vue` ✅ HAS TEST
**Status:** Already tested

---

### 3. Common Components (Accordion System)

##### `/var/www/resources/public/js/components/common/accordions/VrlAccordionContent.vue`
**Priority:** MEDIUM
**Why Test:** Part of accordion pattern, content container

**Test Coverage Needed:**
- **Rendering:**
  - Should render slot content when expanded
  - Should not render when collapsed
  - Should apply correct CSS classes
  - Should have proper ARIA attributes

- **Animation:**
  - Should animate expand/collapse transitions
  - Should have correct height calculations

- **Props:**
  - Should accept and apply custom classes
  - Should handle `isExpanded` prop correctly

- **Accessibility:**
  - Should have correct ARIA role
  - Should have aria-hidden when collapsed
  - Should be keyboard navigable

---

##### `/var/www/resources/public/js/components/common/accordions/VrlAccordionHeader.vue`
**Priority:** MEDIUM
**Why Test:** Part of accordion pattern, clickable header

**Test Coverage Needed:**
- **Rendering:**
  - Should render header text or slot content
  - Should display expand/collapse icon
  - Should show expanded/collapsed state visually
  - Should apply hover styles

- **User Interactions:**
  - Should emit toggle event on click
  - Should emit toggle event on Enter/Space key press
  - Should change icon when expanded/collapsed

- **Props:**
  - Should accept title prop
  - Should accept isExpanded prop
  - Should accept custom icon components

- **Accessibility:**
  - Should have button role
  - Should have aria-expanded attribute
  - Should have aria-controls attribute
  - Should be keyboard accessible (Enter, Space)
  - Should have focus indicators

---

### 4. Common Components (Navigation)

##### `/var/www/resources/public/js/components/common/navigation/VrlBreadcrumbItem.vue`
**Priority:** LOW
**Why Test:** Simple presentational component, part of breadcrumb system

**Test Coverage Needed:**
- **Rendering:**
  - Should render breadcrumb text
  - Should render separator when not last item
  - Should render as link when `to` prop provided
  - Should render as span when no `to` prop (current page)

- **Props:**
  - Should accept label prop
  - Should accept to prop (route)
  - Should accept isLast prop
  - Should accept custom separator

- **Styling:**
  - Should apply active/current styles when isLast
  - Should apply link styles when clickable
  - Should show hover state for links

- **Accessibility:**
  - Should have aria-current="page" when isLast
  - Should be keyboard navigable when link

---

##### `/var/www/resources/public/js/components/common/navigation/VrlTab.vue`
**Priority:** MEDIUM
**Why Test:** Part of tabs component, individual tab button

**Test Coverage Needed:**
- **Rendering:**
  - Should render tab label
  - Should render icon if provided
  - Should show active state when selected
  - Should apply disabled state styles

- **User Interactions:**
  - Should emit click event when clicked
  - Should not emit event when disabled
  - Should handle keyboard navigation (Arrow keys, Home, End)

- **Props:**
  - Should accept label prop
  - Should accept value prop (unique identifier)
  - Should accept isActive prop
  - Should accept isDisabled prop
  - Should accept icon prop

- **Styling:**
  - Should apply active styles when selected
  - Should apply hover styles when not disabled
  - Should show focus indicator

- **Accessibility:**
  - Should have role="tab"
  - Should have aria-selected attribute
  - Should have aria-disabled when disabled
  - Should be keyboard navigable

---

### 5. Common Components (Panels)

##### `/var/www/resources/public/js/components/common/panels/VrlPanelContent.vue`
**Priority:** LOW
**Why Test:** Simple container component

**Test Coverage Needed:**
- **Rendering:**
  - Should render slot content
  - Should apply base panel content styles
  - Should apply padding and spacing

- **Props:**
  - Should accept custom CSS classes
  - Should accept padding size prop (sm, md, lg)

- **Slots:**
  - Should render default slot content
  - Should handle empty slot gracefully

---

##### `/var/www/resources/public/js/components/common/panels/VrlPanelHeader.vue`
**Priority:** LOW
**Why Test:** Simple header component

**Test Coverage Needed:**
- **Rendering:**
  - Should render title text
  - Should render actions slot if provided
  - Should apply header styles

- **Props:**
  - Should accept title prop
  - Should accept custom CSS classes

- **Slots:**
  - Should render default slot (title content)
  - Should render actions slot (buttons/controls)

---

### 6. Common Components (Forms)

##### `/var/www/resources/public/js/components/common/forms/VrlPasswordInput.vue`
**Priority:** HIGH
**Why Test:** Used in authentication flows, security component

**Test Coverage Needed:**
- **Rendering:**
  - Should render password input field
  - Should render show/hide toggle button
  - Should display as password type by default
  - Should show strength indicator if enabled

- **User Interactions:**
  - Should toggle between password and text type on button click
  - Should emit input events
  - Should emit focus/blur events
  - Should change toggle icon when visibility changes

- **Props:**
  - Should accept modelValue prop (v-model)
  - Should accept label prop
  - Should accept placeholder prop
  - Should accept disabled prop
  - Should accept error prop
  - Should accept showStrength prop

- **Validation:**
  - Should integrate with password strength validator
  - Should show strength indicator (weak, medium, strong)
  - Should update strength in real-time

- **Accessibility:**
  - Should have proper label association
  - Should have descriptive toggle button text
  - Should announce password visibility changes to screen readers
  - Should have proper error announcements

- **Edge Cases:**
  - Should handle empty value
  - Should handle very long passwords
  - Should prevent copy/paste if specified
  - Should clear on form reset

---

### 7. Landing Page Components

##### `/var/www/resources/public/js/components/landing/LandingNav.vue`
**Priority:** HIGH
**Why Test:** Main navigation for landing page, critical UX

**Test Coverage Needed:**
- **Rendering:**
  - Should render logo/brand
  - Should render navigation links
  - Should render CTA buttons (Login, Register)
  - Should render mobile menu toggle button
  - Should show/hide mobile menu based on state

- **User Interactions:**
  - Should navigate to sections on link click (smooth scroll)
  - Should highlight active section as user scrolls
  - Should toggle mobile menu on button click
  - Should close mobile menu when link clicked
  - Should navigate to login page on login button click
  - Should navigate to register page on register button click

- **Responsive Behavior:**
  - Should show full nav on desktop
  - Should show hamburger menu on mobile
  - Should collapse on scroll (optional sticky behavior)

- **Styling:**
  - Should apply transparent/solid background based on scroll position
  - Should highlight active navigation item
  - Should show hover states

- **Accessibility:**
  - Should have proper ARIA labels for mobile menu
  - Should trap focus in mobile menu when open
  - Should close mobile menu on Escape key
  - Should be keyboard navigable

- **Edge Cases:**
  - Should handle missing sections gracefully
  - Should handle rapid scroll events
  - Should handle window resize

---

### 8. League Components

##### `/var/www/resources/public/js/components/leagues/rounds/CrossDivisionResultsTable.vue`
**Priority:** MEDIUM
**Why Test:** Displays race results across divisions

**Test Coverage Needed:**
- **Rendering:**
  - Should render table with results data
  - Should display driver names and positions
  - Should show division information
  - Should display points earned
  - Should show gap/time information
  - Should handle empty results state

- **Props:**
  - Should accept results prop (array)
  - Should accept loading prop
  - Should accept divisions prop

- **Data Display:**
  - Should sort results correctly (by position)
  - Should format time gaps correctly
  - Should display team colors/badges
  - Should highlight different divisions

- **Responsive:**
  - Should adapt for mobile/tablet views
  - Should horizontally scroll on small screens if needed

- **Edge Cases:**
  - Should handle missing driver data
  - Should handle missing team data
  - Should show "No results" message when empty
  - Should handle DNF/DNS/DSQ statuses

---

##### `/var/www/resources/public/js/components/leagues/rounds/RaceEventAccordion.vue`
**Priority:** MEDIUM
**Why Test:** Displays expandable race event details

**Test Coverage Needed:**
- **Rendering:**
  - Should render race event header
  - Should display event name and date
  - Should show expand/collapse icon
  - Should render results table when expanded
  - Should show loading state when fetching data

- **User Interactions:**
  - Should expand/collapse on header click
  - Should lazy load results when expanded
  - Should emit events on expand/collapse

- **Props:**
  - Should accept raceEvent prop
  - Should accept seasonId and roundId props
  - Should accept isExpanded prop

- **API Integration:**
  - Should fetch race results when expanded
  - Should cache results after first load
  - Should show loading spinner during fetch
  - Should handle API errors gracefully

- **Edge Cases:**
  - Should handle missing event data
  - Should handle empty results
  - Should prevent multiple simultaneous API calls

---

##### `/var/www/resources/public/js/components/leagues/rounds/RoundAccordion.vue`
**Priority:** MEDIUM
**Why Test:** Displays expandable round details

**Test Coverage Needed:**
- **Rendering:**
  - Should render round header with round number and name
  - Should display round date and track information
  - Should show race events within round
  - Should render standings table when expanded
  - Should show expand/collapse state

- **User Interactions:**
  - Should expand/collapse on header click
  - Should toggle all child race events
  - Should emit expand/collapse events

- **Props:**
  - Should accept round prop
  - Should accept seasonId prop
  - Should accept isExpanded prop

- **Component Integration:**
  - Should render multiple RaceEventAccordion components
  - Should render RoundStandingsTable
  - Should coordinate expand/collapse of children

- **Edge Cases:**
  - Should handle rounds with no events
  - Should handle missing round data
  - Should handle deeply nested structures

---

##### `/var/www/resources/public/js/components/leagues/rounds/RoundStandingsTable.vue`
**Priority:** MEDIUM
**Why Test:** Displays standings after a round

**Test Coverage Needed:**
- **Rendering:**
  - Should render standings table
  - Should display driver positions, names, points
  - Should show position changes (up/down arrows)
  - Should display team information
  - Should show gap to leader

- **Props:**
  - Should accept standings prop (array)
  - Should accept loading prop
  - Should accept showPositionChange prop

- **Data Display:**
  - Should sort by position
  - Should calculate position changes correctly
  - Should format points correctly
  - Should display team colors/badges

- **Styling:**
  - Should highlight podium positions (1-3)
  - Should show position change indicators with colors

- **Edge Cases:**
  - Should handle ties in points
  - Should handle missing driver data
  - Should show "No standings" message when empty

---

### 9. Root Component

##### `/var/www/resources/public/js/components/App.vue`
**Priority:** HIGH
**Why Test:** Root application component, bootstraps entire app

**Test Coverage Needed:**
- **Rendering:**
  - Should render router-view
  - Should render global toast/notification container
  - Should initialize app-level providers
  - Should apply base app styles

- **Lifecycle:**
  - Should initialize authentication on mount
  - Should check for stored session
  - Should initialize analytics/GTM
  - Should set up error handlers

- **Route Integration:**
  - Should render correct view based on route
  - Should handle route changes
  - Should show loading state during route transitions

- **Global Features:**
  - Should provide toast/notification service
  - Should handle global errors
  - Should provide theme context (if applicable)

- **Edge Cases:**
  - Should handle missing routes (404)
  - Should handle unauthorized access
  - Should recover from crashes gracefully

---

### 10. Utility Files

##### `/var/www/resources/public/js/utils/subdomain.ts`
**Priority:** MEDIUM
**Why Test:** Handles subdomain detection and URL generation

**Test Coverage Needed:**
- **Functions to Test:**
  - `getSubdomain()` - Should extract subdomain from current hostname
  - `isPublicSubdomain()` - Should detect public site
  - `isAppSubdomain()` - Should detect app subdomain
  - `isAdminSubdomain()` - Should detect admin subdomain
  - `buildSubdomainUrl()` - Should construct URLs with correct subdomain
  - `redirectToSubdomain()` - Should redirect to specified subdomain

- **Test Cases:**
  - Should handle localhost domains
  - Should handle production domains
  - Should handle domains with ports
  - Should handle subdomains with multiple levels
  - Should handle edge cases (invalid domains)
  - Should preserve path and query params during redirects

---

## Not Requiring Tests (Already Covered)

The following components already have comprehensive tests:

### Common Components - All Tested ✅
- VrlButton, VrlIconButton, VrlCloseButton
- VrlBadge, VrlTag
- VrlAlert
- VrlCard, VrlCardHeader, VrlCardBody, VrlCardFooter, VrlFeatureCard, VrlInfoBox, VrlMetricCard
- VrlModal, VrlModalHeader, VrlModalBody, VrlModalFooter
- VrlDrawer, VrlDrawerHeader, VrlDrawerBody
- All form components (Input, Select, Textarea, Toggle, Checkbox, etc.)
- VrlStatusIndicator, VrlPositionIndicator
- All list components (VrlListContainer, VrlListRow, etc.)
- VrlDataTable, VrlTablePagination
- All table cells (Driver, Team, Gap, Points, Position)
- All loading components (Spinner, Skeleton, etc.)
- VrlBreadcrumbs, VrlNavLink, VrlTabs
- VrlPanel
- VrlAccordion, VrlAccordionItem

### Landing Components - All Tested ✅
- All landing page sections (Hero, Features, Platforms, Pricing, CTA, etc.)
- All landing page components (StandingsRow, PlatformCard, PricingCard, etc.)

### League Components - Most Tested ✅
- LeagueCard, CompetitionCard, SeasonChip
- LeagueSearchBar, DivisionTabs
- StandingsTable, TeamsStandingsTable
- RaceResultsTable, RoundsSection
- LeagueHeader, LeagueInfoModal

### Composables - All Tested ✅
- useModal, useLoadingState, useContactForm
- useGtm, usePageTitle, usePasswordValidation
- useTimeFormat, useToast

### Services - All Tested ✅
- api, authService, contactService, leagueService

### Stores - All Tested ✅
- authStore

### Views - Partially Tested
- ✅ RegisterSuccessView
- ✅ LeaguesView, LeagueDetailView, SeasonDetailView
- ❌ LoginView, RegisterView, ForgotPasswordView, ResetPasswordView
- ❌ HomeView

---

## Implementation Priority Order

### Phase 1 - Critical (HIGH Priority)
1. **Authentication Views** - Essential for user onboarding
   - LoginView
   - RegisterView
   - ForgotPasswordView
   - ResetPasswordView

2. **Home View** - Landing page, first impression

3. **VrlPasswordInput** - Used in auth flows

4. **App.vue** - Root component

### Phase 2 - Important (MEDIUM Priority)
1. **Accordion Components**
   - VrlAccordionHeader
   - VrlAccordionContent

2. **League Round Components**
   - RoundAccordion
   - RaceEventAccordion
   - RoundStandingsTable
   - CrossDivisionResultsTable

3. **Navigation Components**
   - VrlTab
   - LandingNav

4. **Utility Functions**
   - subdomain.ts

### Phase 3 - Nice to Have (LOW Priority)
1. **Panel Components**
   - VrlPanelHeader
   - VrlPanelContent

2. **VrlBreadcrumbItem**

---

## Testing Standards to Follow

### 1. Test File Location
- Co-locate tests with components: Same directory, named `ComponentName.test.ts`
- For components in `__tests__` subdirectories, continue that pattern

### 2. Test Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import ComponentName from './ComponentName.vue';

describe('ComponentName', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    // Setup
  });

  describe('Rendering', () => {
    it('should render correctly', () => {
      // Test
    });
  });

  describe('User Interactions', () => {
    it('should handle user action', async () => {
      // Test
    });
  });

  describe('Props', () => {
    it('should accept and apply props', () => {
      // Test
    });
  });

  describe('Edge Cases', () => {
    it('should handle edge case', () => {
      // Test
    });
  });
});
```

### 3. Test Coverage Goals
- **Minimum Coverage:** 80% overall
- **Critical Components:** 90%+ coverage
- Test user-facing behavior, not implementation details
- Mock external dependencies (API calls, router, stores)
- Test accessibility (ARIA attributes, keyboard navigation)

### 4. Vue Test Utils Best Practices
- Use `mount()` for full DOM rendering
- Use `shallowMount()` for isolated unit tests
- Use `await nextTick()` after reactive changes
- Use `wrapper.find()` with semantic selectors
- Test emitted events with `wrapper.emitted()`
- Mock router with `createMemoryHistory()`

### 5. TypeScript Integration
- Properly type wrapper: `VueWrapper<InstanceType<typeof Component>>`
- Type props in tests
- Use type-safe matchers
- Import types from component files

---

## Next Steps

1. Review this document with the development team
2. Prioritize which tests to implement first (follow Phase 1-3)
3. Assign tests to developers
4. Set up test coverage monitoring
5. Create CI/CD pipeline that enforces minimum coverage
6. Schedule regular test review sessions

---

## Notes

- This analysis is based on the current state of `/var/www/resources/public/js/` as of 2026-01-26
- Some components may be trivial (pure presentational) and lower priority
- Focus on high-value tests that catch real bugs and regressions
- Consider integration tests for complex user flows (authentication, league browsing)
- Keep tests maintainable - avoid brittle tests that break with minor changes

---

**End of Document**
