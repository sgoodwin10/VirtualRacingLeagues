# Admin State Persistence Implementation

## Overview

Implemented state persistence for the admin authentication store to prevent users from being logged out on page refresh. The implementation uses `pinia-plugin-persistedstate` to persist essential auth data to sessionStorage.

## Implementation Details

### 1. Package Installation

Installed `pinia-plugin-persistedstate` version 4.5.0:

```bash
npm install pinia-plugin-persistedstate
```

### 2. Plugin Configuration

**File:** `/var/www/resources/admin/js/app.ts`

Added the persistence plugin to the Pinia instance:

```typescript
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
```

### 3. Store Configuration

**File:** `/var/www/resources/admin/js/stores/adminStore.ts`

Configured the admin store to persist only essential auth state:

```typescript
export const useAdminStore = defineStore('admin', () => {
  // ... store implementation
}, {
  persist: {
    storage: sessionStorage,
    // Only persist essential auth data
    // Do not persist promises (authCheckPromise) or temporary state (isLoading)
    pick: ['admin', 'isAuthenticated']
  }
});
```

## Security Considerations

### Storage Choice: sessionStorage vs localStorage

**sessionStorage was chosen for security:**

1. **Automatic Cleanup**: Data is cleared when the browser/tab closes
2. **Reduced XSS Risk**: Data doesn't persist across browser sessions
3. **Privacy**: Sensitive auth data is not stored permanently on disk
4. **Tab Isolation**: Each browser tab has independent storage

### Persisted Data

**What IS persisted:**
- `admin`: Admin user object (id, name, email, role, status, timestamps)
- `isAuthenticated`: Boolean flag indicating authentication status

**What is NOT persisted (security/performance):**
- `isLoading`: Temporary UI state
- `authCheckPromise`: Promise objects (not serializable)
- `stats`: Dashboard statistics (refreshed on mount)

## Benefits

1. **Improved UX**: Users remain logged in during page refreshes
2. **Security**: Uses sessionStorage for automatic cleanup
3. **Performance**: Only essential data is persisted
4. **Reliability**: State survives navigation and page reloads within the same session

## Testing

Updated test suite to verify:
- ✅ State is maintained during operations
- ✅ State is properly cleared on logout
- ✅ All existing tests pass (19 tests)

**Test File:** `/var/www/resources/admin/js/stores/__tests__/adminStore.spec.ts`

## How It Works

1. **On Login**: When admin logs in, their data is saved to the store
2. **Automatic Persistence**: Plugin automatically saves `admin` and `isAuthenticated` to sessionStorage
3. **On Refresh**: When page reloads, plugin automatically restores state from sessionStorage
4. **On Logout**: State is cleared and sessionStorage is updated
5. **Session End**: When browser/tab closes, sessionStorage is cleared automatically

## Manual Testing

To verify persistence is working:

1. Login to admin dashboard at `/admin`
2. Open browser DevTools → Application → Session Storage
3. Look for key: `admin`
4. Refresh the page - you should remain logged in
5. Check sessionStorage again - data should persist
6. Logout - sessionStorage entry should be cleared
7. Close browser tab - sessionStorage should be cleared

## Files Modified

1. `/var/www/package.json` - Added pinia-plugin-persistedstate dependency
2. `/var/www/resources/admin/js/app.ts` - Configured plugin
3. `/var/www/resources/admin/js/stores/adminStore.ts` - Added persist configuration
4. `/var/www/resources/admin/js/stores/__tests__/adminStore.spec.ts` - Updated tests

## Future Enhancements

Potential improvements for future consideration:

1. **Encryption**: Encrypt auth data before storing in sessionStorage
2. **TTL**: Add time-to-live for persisted data
3. **Multi-tab Sync**: Synchronize auth state across tabs using BroadcastChannel API
4. **Compression**: Compress data for larger state objects

## References

- [pinia-plugin-persistedstate Documentation](https://prazdevs.github.io/pinia-plugin-persistedstate/)
- [Web Storage API - sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
