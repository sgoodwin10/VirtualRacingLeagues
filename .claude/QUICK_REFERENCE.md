# Competition Deletion API - Quick Reference

## Endpoint
```
DELETE /api/competitions/{id}
```

## Response
- **Success**: `204 No Content`
- **Unauthorized**: `401` - User not authenticated
- **Forbidden**: `403` - User doesn't own league
- **Not Found**: `404` - Competition doesn't exist

## What Gets Deleted
- Competition
- All seasons
- All rounds
- All races
- All race results
- All season drivers
- All tiebreaker rules
- All logo files

## What's Preserved
- League drivers (can be reused)
- Teams (belong to league)
- League itself
- Platform data

## Quick Test
```bash
# Run cascade delete tests
php artisan test --filter=test_deleting_competition

# Run all competition tests
php artisan test tests/Feature/Http/Controllers/User/CompetitionControllerTest.php
```

## Files Changed
1. `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCompetitionRepository.php`
2. `app/Application/Competition/Services/CompetitionApplicationService.php`
3. `tests/Feature/Http/Controllers/User/CompetitionControllerTest.php`

## Test Results
✅ 47 tests, 257 assertions, 0 failures

## Code Quality
✅ PHPStan Level 8
✅ PSR-12 Compliant
✅ DDD Architecture

## Documentation
- Technical: `.claude/competition-cascade-delete-summary.md`
- Examples: `.claude/competition-delete-example.md`
- Complete: `.claude/IMPLEMENTATION_COMPLETE.md`
