# Round Update Empty Values Investigation Summary

**Date:** 2025-11-06
**Issue:** When clearing a field in RoundFormDrawer.vue and saving, no data is posted to the API for that field.
**Status:** ✅ Backend verified working - Issue is in **Frontend**

---

## Executive Summary

The backend is **fully functional** and correctly handles null/empty values:
- ✅ All backend tests pass (4/4 tests, 27 assertions)
- ✅ Empty strings are converted to null in DTO
- ✅ Application service uses `array_key_exists()` to properly detect field presence
- ✅ Database correctly stores null values when fields are cleared

**Conclusion:** The issue is in the frontend - investigate `RoundFormDrawer.vue` form submission.

---

## Files Investigated

### 1. Routes (`/var/www/routes/subdomain.php`)
- **Route:** `PUT /rounds/{roundId}` (line 240)
- **Controller:** `App\Http\Controllers\User\RoundController::update`
- **Middleware:** `['auth:web', 'user.authenticate']`
- **Status:** ✅ Correctly configured

### 2. Controller (`/var/www/app/Http/Controllers/User/RoundController.php`)
- **Method:** `update(Request $request, UpdateRoundData $data, int $roundId)`
- **Behavior:** Passes raw `$request->all()` to service layer
- **Status:** ✅ Thin controller, follows DDD pattern
- **Debug logs added:** Lines 66-79

### 3. DTO (`/var/www/app/Application/Competition/DTOs/UpdateRoundData.php`)
- **Key method:** `prepareForPipeline(array $payload)`
- **Behavior:** Converts empty strings to null for nullable fields:
  - `name`, `track_layout`, `track_conditions`
  - `technical_notes`, `stream_url`, `internal_notes`
- **Status:** ✅ Correctly transforms empty strings → null
- **Debug logs added:** Lines 57-60, 77-80

### 4. Application Service (`/var/www/app/Application/Competition/Services/RoundApplicationService.php`)
- **Method:** `updateRound(int $roundId, UpdateRoundData $data, array $requestData)`
- **Behavior:** Uses `array_key_exists($field, $requestData)` to detect field presence
- **Logic:**
  - If field exists in request → update to new value (even if null)
  - If field doesn't exist in request → keep existing value
- **Status:** ✅ Correctly handles partial updates
- **Debug logs added:** Lines 87-95

### 5. Tests (`/var/www/tests/Feature/Http/Controllers/User/RoundControllerTest.php`)
- **Test coverage:**
  1. ✅ `test_can_update_round_with_fastest_lap_fields` - Setting values
  2. ✅ `test_can_update_round_setting_fastest_lap_to_null` - Clearing numeric field
  3. ✅ `test_can_update_round_other_fields_without_fastest_lap` - Partial updates
  4. ✅ `test_can_clear_optional_string_fields_by_sending_empty_string` - **KEY TEST**
- **Status:** All 4 tests pass with 27 assertions

---

## Test Results

### Key Test: Clearing Optional String Fields

```php
// Test: Send empty strings to clear fields
$response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
    'name' => '',
    'track_layout' => '',
    'track_conditions' => '',
    'technical_notes' => '',
    'stream_url' => '',
    'internal_notes' => '',
]);

// Result: ✅ All fields set to NULL in database
$this->assertDatabaseHas('rounds', [
    'id' => $round->id,
    'name' => null,
    'track_layout' => null,
    'track_conditions' => null,
    'technical_notes' => null,
    'stream_url' => null,
    'internal_notes' => null,
]);
```

**Outcome:** ✅ PASS - Backend correctly clears fields

---

## Debug Log Analysis

From `/var/www/storage/logs/laravel.log`:

```
[2025-11-06] INFO: UpdateRoundData::prepareForPipeline - Before transformation
  {"payload":{"name":"","track_layout":""}}

[2025-11-06] INFO: UpdateRoundData::prepareForPipeline - After transformation
  {"payload":{"name":null,"track_layout":null}}

[2025-11-06] INFO: RoundController::update - Raw request payload
  {"raw_request":{"name":null,"track_layout":null},"has_name":true,"has_track_layout":true}

[2025-11-06] INFO: RoundApplicationService::updateRound - Received data
  {"request_data":{"name":null,"track_layout":null},"array_key_exists_name":true}
```

**Analysis:**
- ✅ Empty strings converted to null
- ✅ Fields detected as present (`has_name: true`)
- ✅ `array_key_exists` returns true
- ✅ Backend updates fields to null

---

## Backend Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HTTP Request                                             │
│    PUT /api/rounds/1                                        │
│    Body: {"name": "", "track_layout": ""}                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. RoundController::update()                                │
│    - Receives Request + UpdateRoundData                     │
│    - Passes $request->all() to service                      │
│    LOG: "has_name: true"                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. UpdateRoundData::prepareForPipeline()                    │
│    - Converts "" → null for nullable string fields          │
│    LOG: Before: {"name": ""}                                │
│    LOG: After: {"name": null}                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. RoundApplicationService::updateRound()                   │
│    - Uses array_key_exists('name', $requestData)            │
│    - Detects field is present → updates to null             │
│    LOG: "array_key_exists_name: true"                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Database Update                                          │
│    UPDATE rounds SET name = NULL WHERE id = 1               │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Investigation Required

### What to Check

#### 1. RoundFormDrawer.vue - Form Submission

**Location:** `/var/www/resources/app/js/components/round/modals/RoundFormDrawer.vue`

**Check for:**
```typescript
// ❌ BAD - Excludes empty fields
const payload = Object.fromEntries(
  Object.entries(formData).filter(([_, v]) => v !== '')
);

// ✅ GOOD - Includes all fields
const payload = {
  name: formData.name ?? '',
  track_layout: formData.track_layout ?? '',
  // ... all fields explicitly listed
};
```

#### 2. Browser DevTools - Network Tab

**Steps:**
1. Open DevTools → Network tab
2. Submit form in RoundFormDrawer
3. Find `PUT /api/rounds/{id}` request
4. Check **Request Payload**

**Expected (✅):**
```json
{
  "name": "",
  "track_layout": "",
  "fastest_lap": null
}
```

**If fields are missing (❌):**
```json
{
  "round_number": 5
  // name, track_layout are missing!
}
```

#### 3. Axios/HTTP Client Configuration

**Check for interceptors that might strip null/empty values:**
```typescript
// ❌ DON'T DO THIS
axios.interceptors.request.use((config) => {
  config.data = removeEmptyFields(config.data);
  return config;
});
```

---

## Validation Rules Reference

From `UpdateRoundData.php`, these fields accept null:

| Field | Type | Max Length | Nullable |
|-------|------|------------|----------|
| `name` | string | 100 | ✅ Yes |
| `track_layout` | string | 100 | ✅ Yes |
| `track_conditions` | string | 500 | ✅ Yes |
| `technical_notes` | string | 2000 | ✅ Yes |
| `stream_url` | URL | 255 | ✅ Yes |
| `internal_notes` | string | 2000 | ✅ Yes |
| `fastest_lap` | integer | 0-100 | ✅ Yes |
| `scheduled_at` | datetime | - | ✅ Yes |
| `platform_track_id` | integer | - | No (keeps existing) |
| `fastest_lap_top_10` | boolean | - | No (defaults false) |

---

## How to Debug Live

### 1. Watch Laravel Logs
```bash
tail -f /var/www/storage/logs/laravel.log | grep 'RoundController::update'
```

### 2. Test API with curl
```bash
# Login first
curl -X POST http://app.virtualracingleagues.localhost/api/csrf-cookie -c cookies.txt
curl -X POST http://virtualracingleagues.localhost/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -b cookies.txt -c cookies.txt

# Test round update
curl -X PUT http://app.virtualracingleagues.localhost/api/rounds/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "", "track_layout": ""}' \
  -v
```

Or use the provided script:
```bash
./test-round-update.sh <round_id>
```

### 3. Run Backend Tests
```bash
php artisan test --filter=RoundControllerTest
```

Should show: `Tests: 4 passed (27 assertions)`

---

## Next Steps

1. ✅ **Backend verified** - No changes needed
2. 🔍 **Investigate frontend:**
   - Check `RoundFormDrawer.vue` form submission logic
   - Verify all fields are included in payload (even if empty)
   - Check browser Network tab for actual request
   - Look for code filtering/excluding empty values
3. 📝 **Compare working vs broken:**
   - Backend test sends: `{"name": ""}` → Works ✅
   - Frontend sends: `{}` (field missing?) → Doesn't work ❌

---

## Cleanup

Once issue is resolved, remove debug logs from:

1. `/var/www/app/Http/Controllers/User/RoundController.php` (lines 66-79)
2. `/var/www/app/Application/Competition/Services/RoundApplicationService.php` (lines 87-95)
3. `/var/www/app/Application/Competition/DTOs/UpdateRoundData.php` (lines 57-60, 77-80)

---

## Related Documentation

- **Full debugging guide:** `/var/www/docs/debugging/round-update-empty-values.md`
- **Test script:** `/var/www/test-round-update.sh`
- **DDD Backend Guide:** `/var/www/.claude/guides/backend/ddd-development-guide.md`
