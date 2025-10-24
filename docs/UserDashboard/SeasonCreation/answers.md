
Here are the answers to the questions

### 1. Season Lifecycle Management
- **Q:** Can a season be deleted if it has drivers assigned?
- **PAnswer:** Yes, soft delete with cascade to season_drivers pivot (preserves league drivers)

- **Q:** Can an archived season be edited or only restored?
- **Answer:** Cannot be edited while archived. Must restore to `completed` first.

- **Q:** What happens to season-driver assignments when a season is deleted?
- **Answer:** Soft delete cascade removes assignments but preserves league drivers.

### 2. Driver Assignment Rules
- **Q:** Can a driver be removed from a season after results are entered (future)?
- **Answer:** For MVP, yes. Post-MVP with results: maybe restrict or add warnings.

- **Q:** Should there be a maximum number of drivers per season?
- **Answer:** For MVP, no limit. Can add in future if needed.

- **Q:** Can a reserve driver be promoted to active mid-season?
- **Answer:** Yes, status can be changed at any time in MVP.

### 3. UI/UX Decisions
- **Q:** Should season creation be a drawer (slide-out) or modal (overlay)?
- **Answer:** Drawer, consistent with league/competition creation. Edit season will be the same drawer style.

- **Q:** Should the driver assignment UI be inline on the season detail page or in a separate drawer?
- **Answer:** Separate drawer.

- **Q:** Where should the "Create Season" button appear?
- **Answer:** Competition detail page, multiple locations (header, empty state, tabs).

### 4. Image Handling
- **Q:** Should season logo inherit from competition by default?
- **Answer:** Yes, show inherited logo with option to upload custom.

- **Q:** What image sizes/formats are allowed?
- **Answer:** Logo: 500x500px max 2MB (PNG/JPG), Banner: 1920x400px max 5MB (PNG/JPG).

### 5. Validation Rules
- **Q:** Can two seasons in the same competition have the same name?
- **Answer:** Yes, but slugs must be unique (handled by slug generation).

- **Q:** Should season names have profanity filtering?
- **Answer:** No. any name can be used.

### 6. Permissions & Access Control
- **Q:** Who can create seasons? Only league owners/admins?
- **Answer:** League owners and users with league admin permissions.

- **Q:** Can league members view seasons without edit permissions?
- **Answer:** No. You need to be the league manager. this might change in the future.
