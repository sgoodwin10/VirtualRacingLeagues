# Debugging Round Update Empty/Null Values

## Issue
When clearing a field in `RoundFormDrawer.vue` and saving, no data is posted to the API for that field.

## Investigation Results

### Backend Status: ✅ WORKING CORRECTLY

The backend **properly handles** empty strings and null values:

1. **Form Request/DTO Processing** (`UpdateRoundData.php`):
   - `prepareForPipeline()` method converts empty strings (`""`) to `null`
   - All nullable string fields are properly transformed

2. **Application Service** (`RoundApplicationService.php`):
   - Uses `array_key_exists()` to check if fields are present in request
   - Properly distinguishes between "field not sent" vs "field sent with null value"
   - Updates fields to null when they are present with null values

3. **Test Results**:
   - All tests in `RoundControllerTest` pass ✅
   - `test_can_clear_optional_string_fields_by_sending_empty_string()` confirms backend works

### Debugging Logs Added

Three debug points have been added to trace data flow:

1. **RoundController::update** (Interface Layer)
   - Logs raw request payload
   - Logs DTO data after transformation

2. **UpdateRoundData::prepareForPipeline** (DTO)
   - Logs before transformation (empty strings)
   - Logs after transformation (converted to null)

3. **RoundApplicationService::updateRound** (Application Layer)
   - Logs request data and array_key_exists checks
   - Shows which fields are present in the request

### How to Debug Frontend Issues

#### 1. Check Browser Network Tab

Open browser DevTools → Network tab → Find the PUT request to `/api/rounds/{id}`:

**Check Request Payload:**
```json
// ✅ CORRECT - Field is present with empty value
{
  "name": "",
  "track_layout": "",
  "fastest_lap": null
}

// ❌ INCORRECT - Fields are missing entirely
{
  "round_number": 5
  // name, track_layout, fastest_lap are missing
}
```

**What to look for:**
- Are cleared fields included in the request body?
- Are they sent as empty strings (`""`) or not sent at all?
- What is the request Content-Type? (should be `application/json`)

#### 2. Check Laravel Logs

Watch logs in real-time:
```bash
tail -f /var/www/storage/logs/laravel.log | grep 'RoundController::update'
```

**Expected log output when frontend sends empty string:**
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

**Key indicators:**
- `has_name: true` means the field was present in the request
- `array_key_exists_name: true` means backend will update the field
- If both are `false`, the field was **not sent** by the frontend

#### 3. Test API Directly with curl

Use the provided test script:
```bash
# First, login and save session cookies
curl -X POST http://app.virtualracingleagues.localhost/api/csrf-cookie -c cookies.txt
curl -X POST http://virtualracingleagues.localhost/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -b cookies.txt -c cookies.txt

# Then test round update
./test-round-update.sh <round_id>
```

Or test manually:
```bash
curl -X PUT http://app.virtualracingleagues.localhost/api/rounds/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -b cookies.txt \
  -d '{"name": "", "track_layout": "", "technical_notes": ""}' \
  -v
```

#### 4. Run Backend Tests

Verify backend behavior:
```bash
php artisan test --filter=RoundControllerTest::test_can_clear_optional_string_fields_by_sending_empty_string
```

Should show: ✅ `Tests: 1 passed (14 assertions)`

### Common Frontend Issues

#### Issue 1: Frontend Not Sending Cleared Fields

**Symptom:** Fields with empty values are excluded from the request payload.

**Cause:** Frontend form data builder may be stripping empty/null values.

**Solution:** Ensure `RoundFormDrawer.vue` includes ALL fields in the payload, even if empty:
```typescript
// ✅ CORRECT
const payload = {
  name: formData.name ?? '',  // Include empty string
  track_layout: formData.track_layout ?? '',
  // ... all fields
}

// ❌ INCORRECT
const payload = {
  ...(formData.name && { name: formData.name }),  // Excludes if empty
}
```

#### Issue 2: Axios/HTTP Client Stripping Null Values

**Symptom:** Request payload looks correct in code, but missing in Network tab.

**Cause:** Axios or HTTP client configured to strip null/empty values.

**Solution:** Check axios transformers or interceptors:
```typescript
// Make sure there's no transformer removing null values
axios.interceptors.request.use((config) => {
  // Don't do this:
  // config.data = removeNullValues(config.data);
  return config;
});
```

#### Issue 3: Vue Reactive Form Not Including Cleared Fields

**Symptom:** When clearing a field, it's not included in `formData`.

**Cause:** Vue reactivity issues or form model not updated.

**Solution:** Use explicit field assignment:
```vue
<script setup lang="ts">
const formData = reactive({
  name: '',
  track_layout: '',
  // ... explicitly list all fields with defaults
})

// When clearing:
const clearField = (field: string) => {
  formData[field] = '';  // Explicitly set to empty string
}
</script>
```

### Validation Rules Reference

From `UpdateRoundData.php`, these fields accept null/empty values:

**Nullable String Fields:**
- `name` - Max 100 chars, nullable
- `track_layout` - Max 100 chars, nullable
- `track_conditions` - Max 500 chars, nullable
- `technical_notes` - Max 2000 chars, nullable
- `stream_url` - URL format, max 255 chars, nullable
- `internal_notes` - Max 2000 chars, nullable

**Nullable Integer Fields:**
- `fastest_lap` - Integer 0-100, nullable

**Other Fields:**
- `scheduled_at` - DateTime or null
- `platform_track_id` - Integer or existing value
- `fastest_lap_top_10` - Boolean (defaults to false if not sent)

### Expected Behavior

1. **Clearing a field (setting to empty string):**
   - Frontend sends: `{"name": ""}`
   - Backend receives: `{"name": null}`
   - Database stores: `NULL`

2. **Not changing a field (not sending it):**
   - Frontend sends: `{}`
   - Backend receives: `{}`
   - Database keeps: existing value unchanged

3. **Setting a field to a value:**
   - Frontend sends: `{"name": "Round 1"}`
   - Backend receives: `{"name": "Round 1"}`
   - Database stores: `"Round 1"`

### Next Steps

1. ✅ Backend is working correctly
2. 🔍 Focus investigation on **frontend data flow**:
   - Check `RoundFormDrawer.vue` form submission
   - Check if `formData` includes cleared fields
   - Check Network tab for actual request payload
   - Check browser console for any errors

3. 📝 Look for code like:
   - Conditional field inclusion (`...(value && { field: value })`)
   - Object spreading that might skip empty values
   - Axios transformers stripping null/undefined
   - Form validation removing empty fields

### Removing Debug Logs

Once the issue is resolved, remove debug logs from:

1. `/var/www/app/Http/Controllers/User/RoundController.php` (lines 66-79)
2. `/var/www/app/Application/Competition/Services/RoundApplicationService.php` (lines 87-95)
3. `/var/www/app/Application/Competition/DTOs/UpdateRoundData.php` (lines 57-60, 77-80)

Simply remove the `\Log::info()` calls but keep the surrounding logic intact.
