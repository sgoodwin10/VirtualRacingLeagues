# Frontend Test Plans

This directory contains comprehensive test plans for all frontend applications in the VRL project.

## Available Plans

### Public Site Test Plan
**File**: `public-site-test-plan.md`
**Status**: Complete
**Target Coverage**: 60-70% (from current ~10-15%)

A detailed plan to achieve comprehensive test coverage for the public site frontend, including:
- 85%+ coverage for services and stores (critical business logic)
- 70%+ coverage for leagues components and views (core functionality)
- 75%+ coverage for composables (reusable utilities)
- 40-50% coverage for landing/layout components (presentational)

**Quick Links**:
- [View Full Plan](./public-site-test-plan.md)
- [Phase 1: Services & Stores](./public-site-test-plan.md#phase-1-services--stores-high-priority)
- [Phase 2: Leagues Views & Components](./public-site-test-plan.md#phase-2-leagues-views--components-high-priority)
- [Implementation Timeline](./public-site-test-plan.md#implementation-order--timeline)

## How to Use These Plans

1. **Read the Executive Summary** - Understand current state and goals
2. **Review Priorities** - Each plan is organized by priority phases
3. **Follow Implementation Order** - Sprints are ordered by impact
4. **Use Test Cases** - Detailed test cases provided for each file
5. **Apply Patterns** - Follow established testing patterns and best practices

## Testing Standards

All test plans follow these standards:
- **Coverage Targets**: Based on file criticality (40-85%)
- **Testing Patterns**: Consistent patterns for components, services, stores, composables
- **Mock Strategy**: Proper isolation with shared mock utilities
- **Quality Metrics**: Fast execution, no flaky tests, clear descriptions

## Running Tests

```bash
# Run all tests
npm test

# Run public site tests
npm run test:public

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run specific test file
npm test -- path/to/test.spec.ts
```

## Coverage Goals by Application

| Application | Current | Target | Priority |
|-------------|---------|--------|----------|
| Public Site | ~15% | 60-70% | HIGH |
| User App | TBD | 60-70% | MEDIUM |
| Admin App | TBD | 60-70% | LOW |

## Next Steps

1. **Public Site**: Implement Sprint 1 (Services & Stores) - See [public-site-test-plan.md](./public-site-test-plan.md#sprint-1-foundation-services--stores)
2. **User App**: Create test plan (future work)
3. **Admin App**: Create test plan (future work)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Best Practices](https://vuejs.org/guide/scaling-up/testing.html)
- Project Vitest Config: `/var/www/vitest.config.ts`
