# Debugging Summary: Empty Field Values Not Sent to API

## Problem
When editing a round in RoundFormDrawer and clearing input/textarea fields, the empty values are not being sent to the API.

## Solution: Comprehensive Debugging Added

I've added extensive console.log debugging at **4 critical points** in the data flow to trace exactly where empty values might be filtered out.

## Files Modified

### 1. `/var/www/resources/app/js/components/round/modals/RoundFormDrawer.vue`
- **Function**: `handleSubmit()` (lines 513-702)
- **Added**: Detailed logging showing:
  - Original vs current form data
  - Field-by-field comparison
  - What values will be sent (including null values)
  - Final request payload structure

### 2. `/var/www/resources/app/js/stores/roundStore.ts`
- **Function**: `updateExistingRound()` (lines 78-106)
- **Added**: Logging showing:
  - Data received by store from component
  - Data being passed to service
  - Response received from API

### 3. `/var/www/resources/app/js/services/roundService.ts`
- **Function**: `updateRound()` (lines 35-51)
- **Added**: Logging showing:
  - Data being sent to Axios
  - API endpoint details
  - HTTP response status and data

### 4. `/var/www/resources/app/js/services/api.ts`
- **Function**: `setupInterceptors()` (lines 19-41)
- **Added**: Axios request interceptor logging showing:
  - Final HTTP request body before it leaves the browser
  - This is the absolute last point to see what's being sent

## How to Use This Debugging

1. **Start the dev server**: `npm run dev`

2. **Open your browser's Developer Console** (F12)

3. **Navigate to a season and open the rounds panel**

4. **Edit a round that has existing values**

5. **Clear a field completely** (e.g., remove all text from "Round Name")

6. **Click "Update Round"**

7. **Check the console output** - you'll see 4 sets of logs:

```
=== EDIT MODE DEBUG - START ===
[Shows original vs current data]
✓ name changed: "Some Name" -> ""
  → Will send: null
=== FINAL REQUEST PAYLOAD ===
{ "name": null }

=== ROUND STORE: updateExistingRound ===
[Shows data received by store]

=== ROUND SERVICE: updateRound ===
[Shows data being sent to API]

=== AXIOS REQUEST INTERCEPTOR ===
[Shows actual HTTP request body]
```

8. **Also check the Network tab**:
   - Filter for "rounds"
   - Find the PUT request
   - Check the Request Payload section
   - Compare with what the console logs show

## What to Look For

The debugging will help identify:

1. **Is the value being detected as changed?**
   - Look for the "✓ name changed" message

2. **Is null being set in the payload?**
   - Look at "Will send: null"
   - Look at "FINAL REQUEST PAYLOAD"

3. **Does the store receive the null value?**
   - Check "ROUND STORE" logs

4. **Does the service send the null value?**
   - Check "ROUND SERVICE" logs

5. **Does Axios send the null value in HTTP?**
   - Check "AXIOS REQUEST INTERCEPTOR" logs
   - This is the final confirmation

6. **Does the browser actually send it?**
   - Check Network tab → Request Payload

## Expected Behavior

When you clear a field, you should see:
- Change detected ✓
- Value set to `null` in payload ✓
- Null passed through store ✓
- Null passed through service ✓
- Null in Axios interceptor ✓
- Null in Network tab request ✓

**If null disappears at any point, that's where the bug is.**

## Current Code Logic Analysis

The edit mode uses "dirty checking" - only sends changed fields:

```typescript
const formNameTrimmed = (form.value.name || '').trim();
const originalName = props.round.name || '';
if (formNameTrimmed !== originalName) {
  requestData.name = formNameTrimmed || null;  // Empty string becomes null
}
```

This logic **should work correctly**:
- If field was "Some Name" and is now ""
- `formNameTrimmed` = ""
- `originalName` = "Some Name"
- They're different, so field IS included
- `"" || null` evaluates to `null`
- Result: `requestData.name = null` ✓

## Potential Root Causes

If null values are being filtered, it could be:

1. **JSON.stringify behavior** - No, JSON.stringify preserves null
2. **Axios transformation** - No custom transformRequest found
3. **TypeScript type issue** - No, UpdateRoundRequest allows `string | null`
4. **Backend rejecting null** - Need to check Laravel validation
5. **Content-Type issue** - Should be application/json
6. **PHP Input parsing** - Laravel should handle null in JSON

## Next Steps

1. **Run the test** with debugging enabled
2. **Check where null disappears** in the console logs
3. **Check browser Network tab** to see actual HTTP request
4. **Check Laravel logs** to see what backend receives:
   ```bash
   tail -f storage/logs/laravel.log
   ```
5. **Add backend logging** if needed in RoundController

## Cleanup After Fix

Once you identify and fix the issue:

1. Remove all `console.log()` statements from:
   - RoundFormDrawer.vue
   - roundStore.ts
   - roundService.ts
   - api.ts

2. Run linter:
   ```bash
   npm run lint:fix
   ```

3. Delete these files:
   - /var/www/DEBUG_EMPTY_FIELDS.md
   - /var/www/DEBUGGING_SUMMARY.md

## Additional Notes

- The debugging code is production-safe (only logs, doesn't change behavior)
- TypeScript types are correct and allow null values
- No custom Axios transformers found that would filter nulls
- The logic for detecting changes and setting null is correct

**The issue is most likely:**
- Backend validation rejecting null values
- Or backend not receiving the fields at all

Check the backend next!
