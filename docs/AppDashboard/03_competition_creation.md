# Competition Creation Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

A **Competition** represents a specific racing series within a league (e.g., "Sunday Night Racing", "GT3 Championship", "Monday F1 Series"). Competitions are platform-specific and contain seasons, which in turn contain races and results.

### Key Concepts

- **Simple Setup:** Minimal fields required (v1 approach)
- **Platform-Specific:** Each competition is tied to one sim racing platform
- **Season Container:** Competitions contain multiple seasons
- **Flexible Configuration:** Detailed settings (car restrictions, race types) configured at season level

---

## Hierarchical Structure

```
League
  └─ Competition (Platform-specific)
      └─ Season (Car restrictions, race format, etc.)
          └─ Division (Driver groupings)
              └─ Round (Race weekend)
                  └─ Race (Individual race)
```

---

## Navigation to Competition Creation

### Entry Points

1. **Post-League Creation:** "Create Your First Competition" button in success screen
2. **League Dashboard:** [+ New Competition] button
3. **League Dashboard → Competitions tab:** [+ Create Competition] button
4. **Empty Competition State:** Large CTA when no competitions exist

---

## Competition Creation Form

### Simple Single-Page Form

```
═══════════════════════════════════════════════════
CREATE COMPETITION
═══════════════════════════════════════════════════

BASIC DETAILS
───────────────────────────────────────────────────

Competition Name* (required)
[________________________________________________]
Examples: "Sunday Night Racing", "GT3 Championship", 
"Monday F1 Series"
0/100 characters

Description (optional)
┌──────────────────────────────────────────────────┐
│ Describe this competition, typical race format, │
│ skill level, and any important information...   │
│                                                  │
└──────────────────────────────────────────────────┘
0/1000 characters

Platform* (required)
[Select Platform ▼]
  • Gran Turismo 7 (PlayStation)
  • iRacing (PC)
  • Assetto Corsa Competizione
  • rFactor 2
  • Automobilista 2
  • F1 24
  • Other

Competition Logo (optional)
┌─────────────────────┐
│                     │
│  [Upload Logo]      │
│  or drag & drop     │
│                     │
│  If not uploaded,   │
│  league logo will   │
│  be used            │
└─────────────────────┘
PNG/JPG, max 2MB, recommended 500x500px

═══════════════════════════════════════════════════

ℹ️  Car restrictions, race types, and other details 
   will be configured when you create seasons.

[Cancel]  [Create Competition]
```

---

## Field Specifications

### Required Fields

1. **Competition Name** - 3-100 characters
2. **Platform** - Must select one platform

### Optional Fields

- **Description** - 0-1000 characters (plain text or basic formatting)
- **Competition Logo** - Image file (inherits league logo if not provided)

---

## Platform Selection

### Platform Options

The platform dropdown shows all available platforms:

- Gran Turismo 7 (PlayStation)
- iRacing (PC)
- Assetto Corsa Competizione (Multi-platform)
- rFactor 2 (PC)
- Automobilista 2 (PC)
- F1 24 (Multi-platform)

### Platform Enforcement

**Once a competition is created with a platform:**
- Platform cannot be changed (would affect season configurations)
- All seasons within this competition use the same platform
- Platform-specific features may be enabled/disabled at season level

---

## Logo Upload

### Competition Logo Specifications

```javascript
{
  required: false,
  formats: ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize: 2 * 1024 * 1024, // 2MB
  minDimensions: { width: 200, height: 200 },
  recommendedDimensions: { width: 500, height: 500 },
  aspectRatio: '1:1', // Square preferred
  fallback: 'Uses league logo if not provided'
}
```

### Logo Hierarchy

1. **Competition Logo** (if uploaded)
2. **League Logo** (fallback if no competition logo)
3. **Default Platform Icon** (system default if neither available)

---

## Validation Rules

### Name Validation

- **Minimum:** 3 characters
- **Maximum:** 100 characters
- **Allowed:** Letters, numbers, spaces, hyphens, apostrophes
- **Unique:** Not required (multiple competitions can have similar names)

### Description Validation

- **Maximum:** 1000 characters
- **Format:** Plain text or basic markdown
- **Optional:** Can be empty

### Platform Validation

- **Required:** Must select a platform
- **Custom Platform:** If "Other" selected, custom name required (max 50 chars)

---

## Saving and Creating in database
On save, a `slug` will be created for the competition and saved in the database and will be used for the public dashboard. it will be unique, and will attempt to create from the Competition name. Eg if Season is `Sunday nights` it will attempt to make a slug called `sunday-nights`. If this is not unique for the League and Combintation of slugs, it will add a number at the end eg `sunday-nights-01` and increment until an available slug is found.

## Post-Creation Flow

### Success Screen

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ✅  Competition Created!                       │
│                                                 │
│  🏎️  Sunday Night Racing                        │
│  Platform: Gran Turismo 7                      │
│                                                 │
│  Your competition is ready. Now create your    │
│  first season to start racing!                 │
│                                                 │
│  [Create First Season →]                       │
│                                                 │
│  Other options:                                │
│  • [Edit Competition Details]                  │
│  • [Back to League Dashboard]                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Recommended Flow

**Primary CTA:** Push users toward **[Create First Season →]** since a competition needs at least one season to be functional.

---

## Competition Dashboard (Empty State)

After creation, when viewing the competition before any seasons exist:

```
═══════════════════════════════════════════════════
🏎️ SUNDAY NIGHT RACING
Platform: Gran Turismo 7                    [⚙️ Edit]
═══════════════════════════════════════════════════

[Tabs: Overview | Seasons | Drivers | Settings]

OVERVIEW TAB (Empty State)
───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│                                                 │
│            🏁 Ready to Race?                    │
│                                                 │
│  Create your first season to start organizing  │
│  races, managing drivers, and tracking results.│
│                                                 │
│                                                 │
│         [Create Your First Season]              │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘

Competition Details
───────────────────────────────────────────────────
Platform:      Gran Turismo 7
Created:       Feb 15, 2025
Total Seasons: 0
Total Drivers: 0
Total Races:   0
```

---

## Competition List View (League Level)

**Location:** League Dashboard → Competitions tab

```
═══════════════════════════════════════════════════
COMPETITIONS (3)                    [+ New Competition]
═══════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│ 🏎️ Sunday Night Racing          Gran Turismo 7  │
│    2 seasons • 1 active • 45 drivers            │
│    Next race: Sunday, Feb 18 @ 7:00 PM         │
│    [View] [Manage] [Edit]                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏁 Monday GT3 Championship       GT7            │
│    2 seasons • 1 active • 38 drivers            │
│    Next race: Monday, Feb 19 @ 8:00 PM         │
│    [View] [Manage] [Edit]                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏆 F1 Series                     Gran Turismo 7 │
│    1 season • 0 active • 32 drivers             │
│    No upcoming races                            │
│    [View] [Manage] [Edit]                       │
└─────────────────────────────────────────────────┘
```

### Competition Card Actions

- **[View]** → Public-facing competition page (results, standings)
- **[Manage]** → Competition dashboard (management interface)
- **[Edit]** → Edit competition details (name, description, logo)

---

## Edit Competition

### Edit Form (Same as Creation)

**Location:** Competition Dashboard → [⚙️ Edit] button

```
═══════════════════════════════════════════════════
EDIT COMPETITION
═══════════════════════════════════════════════════

BASIC DETAILS
───────────────────────────────────────────────────

Competition Name* (required)
[Sunday Night Racing___________________________]

Description (optional)
┌──────────────────────────────────────────────────┐
│ Weekly GT3 racing every Sunday at 7 PM.        │
│ All skill levels welcome!                       │
└──────────────────────────────────────────────────┘

Platform* (Cannot be changed)
[Gran Turismo 7] 🔒
ℹ️ Platform cannot be changed after creation

Current Logo
┌─────────────────────┐
│  [Current Logo]     │
│  500x500px          │
└─────────────────────┘

[Replace Logo]
  → Opens file upload dialog

═══════════════════════════════════════════════════

⚠️ Warning: Changing the competition name will affect:
   • Public URLs
   • Discord notifications
   • Bookmarked links

[Cancel]  [Save Changes]
```

### Edit Restrictions

- **Platform:** Cannot be changed (locked after creation)
- **Name:** Can be changed (with warning about URL changes)
- **Description:** Can be changed freely
- **Logo:** Can be replaced or removed (reverts to league logo)

---

## Delete/Archive Competition

### Archive Competition

**Location:** Competition Settings → Danger Zone

```
┌─────────────────────────────────────────────────┐
│ 🗄️ ARCHIVE COMPETITION                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Archiving will:                                 │
│ • Hide competition from active lists            │
│ • Preserve all historical data                  │
│ • Make competition read-only                    │
│ • Allow restoration later                       │
│                                                 │
│ [Archive Competition]                           │
└─────────────────────────────────────────────────┘
```

### Delete Competition

```
┌─────────────────────────────────────────────────┐
│ 🗑️ DELETE COMPETITION                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ ⚠️  DANGER ZONE                                 │
│                                                 │
│ Deleting will permanently remove:              │
│ • All seasons in this competition              │
│ • All race results and standings               │
│ • All driver associations                      │
│ • All historical data                          │
│                                                 │
│ This action CANNOT be undone!                  │
│                                                 │
│ Type "DELETE" to confirm:                      │
│ [________________]                             │
│                                                 │
│ [Cancel]  [Delete Competition]                 │
└─────────────────────────────────────────────────┘
```

---

## Business Rules

### Competition Limits

- **Per League:** No hard limit on competitions
- **Active Competitions:** No limit on how many can be active simultaneously
- **Naming:** Competition names do not need to be unique (scoped to league)

### Platform Implications

Different platforms may enable different features at the season level:

**Gran Turismo 7:**
- DR/SR ratings available
- Livery tracking
- GT7-specific car lists

**iRacing:**
- iRating/Safety Rating
- Official iRacing tracks
- Session-based race formats

**Assetto Corsa Competizione:**
- BOP restrictions
- GT3/GT4 specific features
- Weather simulation options

**Other Platforms:**
- Generic feature set
- Manual configuration

---

## Database Schema (Conceptual)

### competitions Table

```sql
competitions {
  id: integer (primary key)
  league_id: integer (foreign key)
  name: string (100 chars)
  description: text (nullable)
  platform: string (50 chars)
  logo_url: string (nullable)
  
  -- Metadata
  is_archived: boolean (default false)
  archived_at: timestamp (nullable)
  created_by_user_id: integer (foreign key)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (soft delete)
}

-- Indexes
-- Index on: league_id, is_archived
-- Index on: platform (for filtering)
```

### Relationships

- **Many-to-One:** Competition → League
- **One-to-Many:** Competition → Seasons
- **Many-to-Many:** Competition → Drivers (through season_drivers)

---

## Competition URL Structure

### URL Format

```
yourplatform.com/leagues/[league-slug]/competitions/[competition-slug]
```

**Example:**
```
yourplatform.com/leagues/sydney-racing-123/competitions/sunday-night-racing-456
```

### Slug Generation

- Generated from competition name
- Includes unique ID to prevent conflicts
- Remains stable even if name changes (redirects from old slug)

---

## Future Enhancements (Not in v1)

- Competition templates (quick setup for common formats)
- Competition cloning (duplicate structure to new competition)
- Competition merging (combine two competitions)
- Multi-platform competitions (same series across multiple platforms)
- Competition categories/tags (Sprint, Endurance, Casual, Competitive)
- Competition statistics dashboard
- Competition-level points systems (override season defaults)
- Competition banners/graphics for promotion

---

## Related Documentation

- `01-League-Creation.md` - Creating parent leagues
- `04-Dashboard-Layouts.md` - Competition dashboard layout
- `05-Season-Creation.md` - Creating seasons within competitions
- `Platform-Specific-Features.md` - Platform feature matrix