# Debug: Empty Fields Not Sent to API

## Issue Description
When editing a round in RoundFormDrawer.vue and clearing an input/textarea field (removing all content), the empty value is not being posted to the API.

## Debugging Added

I've added comprehensive console.log debugging at three critical points in the data flow:

### 1. RoundFormDrawer.vue (Component Level)
**File**: `/var/www/resources/app/js/components/round/modals/RoundFormDrawer.vue`

**Location**: `handleSubmit()` function (lines 513-702)

**What it logs**:
- Original round data from props
- Current form data
- Each field comparison showing what changed
- The final request payload being sent to the store

**Example output**:
```
=== EDIT MODE DEBUG - START ===
Original round data: { ... }
Current form data: { ... }
✓ name changed: "Round 1" -> ""
  → Will send: null
✓ track_layout changed: "Forward" -> ""
  → Will send: null
=== FINAL REQUEST PAYLOAD ===
{
  "name": null,
  "track_layout": null
}
Payload keys: ["name", "track_layout"]
=== END DEBUG ===
```

### 2. Round Store (State Management Level)
**File**: `/var/www/resources/app/js/stores/roundStore.ts`

**Location**: `updateExistingRound()` function (lines 78-106)

**What it logs**:
- Round ID being updated
- Data received by the store
- Keys present in the data object
- Response received from the API

**Example output**:
```
=== ROUND STORE: updateExistingRound ===
Round ID: 123
Data received by store: {
  "name": null,
  "track_layout": null
}
Data keys: ["name", "track_layout"]
Response from API: { ... }
```

### 3. Round Service (API Call Level)
**File**: `/var/www/resources/app/js/services/roundService.ts`

**Location**: `updateRound()` function (lines 35-51)

**What it logs**:
- Round ID being updated
- Data to be sent to API
- Keys in the data object
- API endpoint URL
- HTTP response status
- API response data

**Example output**:
```
=== ROUND SERVICE: updateRound ===
Round ID: 123
Data to be sent to API: {
  "name": null,
  "track_layout": null
}
Data keys: ["name", "track_layout"]
URL: /rounds/123
API Response status: 200
API Response data: { ... }
```

### 4. Axios Request Interceptor (HTTP Level)
**File**: `/var/www/resources/app/js/services/api.ts`

**Location**: `setupInterceptors()` method (lines 19-41)

**What it logs**:
- HTTP method (PUT/PATCH)
- Request URL
- Request data (the actual body being sent over HTTP)
- Data type
- Keys in the request data

**Example output**:
```
=== AXIOS REQUEST INTERCEPTOR ===
Method: PUT
URL: /rounds/123
Request data: {
  "name": null,
  "track_layout": null
}
Request data type: object
Request data keys: ["name", "track_layout"]
```

**This is the final check** - this logs exactly what Axios is sending in the HTTP request body before it leaves the browser.

## How to Test

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to a season and open the rounds panel

3. Edit an existing round that has values in some fields

4. Clear a field completely (e.g., clear the "Round Name" field)

5. Click "Update Round"

6. Open the browser's Developer Console (F12)

7. Look for the debug output showing:
   - What values are being compared
   - What's being included in the payload
   - What's being sent to the API

## Expected Behavior

When you clear a field:
- The component SHOULD detect the change and include the field with `null` value
- The store SHOULD receive the field with `null` value
- The service SHOULD send the field with `null` value to the API
- The API SHOULD receive the field and update it to NULL in the database

## Current Code Logic

The edit mode uses "dirty checking" - it only sends fields that have changed:

```typescript
const formNameTrimmed = (form.value.name || '').trim();
const originalName = props.round.name || '';
if (formNameTrimmed !== originalName) {
  requestData.name = formNameTrimmed || null;
}
```

This logic:
1. Gets the current form value, trims it
2. Gets the original value
3. If they're different, includes the field in the payload
4. If the form value is empty string after trim, sends `null`

**This should work correctly**. If it doesn't, the debug logs will show where the data is being lost.

## Potential Issues to Check

1. **Axios Request Transformation**: Check if Axios is transforming the request body before sending (filter out nulls)
   - Currently no custom transformRequest found in api.ts
   - Default Axios behavior should preserve null values

2. **JSON Serialization**: Check if null values are being stripped during JSON.stringify
   - Should not happen with standard JSON.stringify

3. **Backend Validation**: Check if the Laravel backend is rejecting null values
   - Check the UpdateRoundData DTO validation rules
   - Check the RoundController validation

4. **TypeScript Type Issues**: Check if UpdateRoundRequest type allows null
   - Should check /var/www/resources/app/js/types/round.ts

## Next Steps

1. Test the edit functionality with the debug logs enabled
2. Check the browser Network tab to see the actual HTTP request body
3. Check the Laravel logs to see what the backend receives
4. Compare what's sent vs what's received
5. Identify the exact point where empty values are filtered out

## Cleanup

Once the issue is fixed, remove all the console.log statements:
- Search for `console.log` in the three files mentioned above
- Remove all debug logging
- Run `npm run lint:fix` to ensure code quality
