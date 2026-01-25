# Competition Delete API Endpoint - Usage Examples

## Endpoint Overview

**DELETE** `/api/competitions/{competitionId}`

Permanently deletes a competition and all its related data including seasons, rounds, races, race results, season drivers, and media files.

## Authentication & Authorization

- **Required**: User must be authenticated with `auth:web` guard
- **Authorization**: Only the league owner can delete competitions
- **Middleware**: `['auth:web', 'user.authenticate']`

## Request

### Headers
```
Authorization: Bearer {your-token}
Content-Type: application/json
```

### URL Parameters
- `competitionId` (integer, required): The ID of the competition to delete

### Example Request

```bash
curl -X DELETE \
  http://app.virtualracingleagues.localhost/api/competitions/123 \
  -H "Authorization: Bearer your-api-token-here" \
  -H "Content-Type: application/json"
```

## Response

### Success Response (204 No Content)

```
HTTP/1.1 204 No Content
```

No body is returned on successful deletion.

### Error Responses

#### 401 Unauthorized - User not authenticated
```json
{
  "message": "Unauthenticated."
}
```

#### 403 Forbidden - User doesn't own the league
```json
{
  "success": false,
  "message": "Only league owner can manage competitions",
  "data": null
}
```

#### 404 Not Found - Competition doesn't exist
```json
{
  "success": false,
  "message": "Competition not found",
  "data": null
}
```

## What Gets Deleted

When you delete a competition, the following data is permanently removed:

1. **The competition record itself**
2. **All seasons** belonging to the competition
3. **All rounds** in those seasons
4. **All races** in those rounds
5. **All race results** for those races
6. **All season drivers** assigned to those seasons
7. **All tiebreaker rules** for those seasons
8. **All media files** (logos) uploaded for the competition

### What DOESN'T Get Deleted

- **League drivers** (they can be used in other competitions/seasons)
- **Teams** (they belong to the league, not the competition)
- **The league itself**
- **Platform data** (tracks, cars, etc.)

## Frontend Integration Examples

### Vue 3 Composition API

```typescript
import { ref } from 'vue';
import axios from 'axios';

const deleteCompetition = async (competitionId: number) => {
  const isConfirmed = confirm(
    'Are you sure you want to delete this competition? This will permanently delete all seasons, rounds, races, and results.'
  );

  if (!isConfirmed) return;

  try {
    await axios.delete(`/api/competitions/${competitionId}`);

    // Show success message
    console.log('Competition deleted successfully');

    // Redirect or refresh list
    router.push('/leagues/123/competitions');
  } catch (error) {
    if (error.response?.status === 403) {
      console.error('You do not have permission to delete this competition');
    } else if (error.response?.status === 404) {
      console.error('Competition not found');
    } else {
      console.error('Failed to delete competition');
    }
  }
};
```

### Using PrimeVue ConfirmDialog

```vue
<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

const confirm = useConfirm();
const toast = useToast();

const deleteCompetition = (competitionId: number, competitionName: string) => {
  confirm.require({
    message: `Are you sure you want to delete "${competitionName}"? This will permanently delete all seasons, rounds, races, and results associated with this competition.`,
    header: 'Delete Competition',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await axios.delete(`/api/competitions/${competitionId}`);

        toast.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Competition deleted successfully',
          life: 3000
        });

        // Refresh the competitions list or redirect
        await fetchCompetitions();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to delete competition',
          life: 5000
        });
      }
    }
  });
};
</script>
```

## JavaScript/Fetch API

```javascript
async function deleteCompetition(competitionId) {
  // Show confirmation dialog
  if (!confirm('Are you sure you want to delete this competition and all related data?')) {
    return;
  }

  try {
    const response = await fetch(`/api/competitions/${competitionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      },
      credentials: 'include'
    });

    if (response.status === 204) {
      alert('Competition deleted successfully');
      // Redirect or refresh
      window.location.href = '/leagues/123/competitions';
    } else if (response.status === 403) {
      alert('You do not have permission to delete this competition');
    } else if (response.status === 404) {
      alert('Competition not found');
    } else {
      throw new Error('Failed to delete competition');
    }
  } catch (error) {
    console.error('Error deleting competition:', error);
    alert('An error occurred while deleting the competition');
  }
}
```

## Best Practices

1. **Always confirm before deletion**
   - Show a clear confirmation dialog
   - Explain what will be deleted (seasons, rounds, races, results)
   - Use descriptive messages with the competition name

2. **Handle errors gracefully**
   - Show user-friendly error messages
   - Distinguish between different error types (403, 404, 500)
   - Log errors for debugging

3. **Provide feedback**
   - Show loading state during deletion
   - Display success message after deletion
   - Redirect to appropriate page after deletion

4. **Consider the impact**
   - Deletion is permanent and cannot be undone
   - All related data is lost
   - Consider archiving instead of deleting for important competitions

## Alternative: Archive Instead of Delete

If you want to preserve data but hide the competition, consider using the archive endpoint instead:

```bash
POST /api/competitions/{id}/archive
```

This will:
- Set the competition status to "archived"
- Set the `archived_at` timestamp
- Keep all data intact
- Allow restoration later if needed

## Testing

You can test the endpoint using the following test data:

```bash
# Create test competition
POST /api/leagues/1/competitions
{
  "name": "Test Competition",
  "platform_id": 1,
  "description": "This is a test competition"
}

# Delete test competition (replace 123 with actual ID)
DELETE /api/competitions/123
```

## Activity Logging

All competition deletions are logged in the activity log with:
- Event name: `competition_deleted`
- Properties: competition name, league_id, slug
- Caused by: authenticated user ID
- Performed on: competition model

You can view deletion logs via the league activity log endpoint:
```
GET /api/leagues/{leagueId}/activities
```
