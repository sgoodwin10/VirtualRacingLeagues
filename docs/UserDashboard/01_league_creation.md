# League Creation Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

League creation is the foundational step in the Virtual Racing League Management System. A league represents the top-level organization and serves as a public-facing advertisement for a racing community.

### Key Concepts

- **Public Visibility:** Leagues appear in the public section of the website
- **Multi-Platform Support:** Leagues can support multiple sim racing platforms
- **Manager Association:** Managers can be associated with multiple leagues
- **Tiered Access:** Free tier = 1 league, Paid tier = unlimited leagues
- **Branding Focus:** Heavy emphasis on visual identity (logo, header, social links)

---

## Navigation to League Creation

### Entry Points

1. **Dashboard (empty state):** Large "Create Your First League" button
2. **Dashboard header:** "+" icon → "New League"
3. **Leagues page:** "New League" button

---

## League Creation Form

### Single-Page Form Structure

The league creation process uses a single-page form (no wizard, no templates in v1).

```
═══════════════════════════════════════════════════════════
CREATE NEW LEAGUE
═══════════════════════════════════════════════════════════

BASIC INFORMATION
───────────────────────────────────────────────────────────

League Name* (required)
[________________________________________________]
0/100 characters

Tagline (shown in league cards and previews)
[________________________________________________]
Brief one-liner about your league
0/150 characters

Description
┌──────────────────────────────────────────────────────┐
│ B  I  U │ • ○ │ 🔗 Link │ 📷 Image                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Describe your league, racing style, rules,          │
│ skill levels, and what makes your community unique. │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
0/2000 characters


BRANDING
───────────────────────────────────────────────────────────

League Logo* (required)
┌─────────────────────┐
│                     │
│  [Upload Logo]      │
│  or drag & drop     │
│                     │
│  Recommended:       │
│  500x500px          │
│  PNG/JPG, max 2MB   │
└─────────────────────┘

Header Image (optional)
┌──────────────────────────────────────────────────────┐
│                                                      │
│            [Upload Wide Header Image]                │
│                 or drag & drop                       │
│                                                      │
│  Recommended: 1920x400px, PNG/JPG, max 5MB          │
└──────────────────────────────────────────────────────┘


PLATFORMS
───────────────────────────────────────────────────────────

What sim racing platforms does your league use?
(Select all that apply - competitions can specify individual platforms)

☐ Gran Turismo 7 (PlayStation)
☐ iRacing (PC)
☐ Assetto Corsa Competizione (Multi-platform)
☐ rFactor 2 (PC)
☐ Automobilista 2 (PC)
☐ F1 24 (Multi-platform)


SOCIAL & COMMUNITY
───────────────────────────────────────────────────────────

Discord Server
[https://discord.gg/________________]

Website
[https://____________________________]

Twitter/X
[@_________________________________]

Instagram  
[@_________________________________]

YouTube
[https://youtube.com/@_____________]

Twitch
[https://twitch.tv/_________________]


SETTINGS
───────────────────────────────────────────────────────────

League Visibility

○ Public
  • Visible in league directory
  • Anyone can view league info and results
  • Drivers can request to join competitions
  
○ Private
  • Only visible to invited members
  • Requires invitation to view
  
○ Unlisted
  • Accessible via direct link only
  • Hidden from directory and search

Time Zone* (required)
[Australia/Sydney (AEDT) ▼]
Auto-detected based on your location. All race times will 
display in this timezone.


ADMINISTRATION
───────────────────────────────────────────────────────────

Primary Contact Email
[your.email@example.com]
(Pre-filled from your account)

League Administrator Name (public display)
[Your Name_____________________________]
This will be shown as the primary organizer

═══════════════════════════════════════════════════════════

[Cancel]  [Save as Draft]  [Create League]
```

---

## Field Specifications

### Required Fields

1. **League Name** - 3-100 characters
2. **League Logo** - Image file with validation
3. **Time Zone** - Auto-detected, user-editable

### Optional Fields

- Tagline (0-150 characters)
- Description (0-2000 characters, rich text)
- Header Image
- All platform selections (at least one recommended)
- All social media links
- League visibility (defaults to Public)


## Saving and Creating in database
On save, a `slug` will be created for the league and saved in the database and will be used for the public dashboard. it will be unique, and will attempt to create from the League name. Eg if League is called `Race On Oz` it will attempt to make a slug called `race-on-oz`. If this is not unique against all other league slugs, it will add a number at the end eg `race-on-oz-01` and increment until an available slug is found.

---

## Image Upload Validation

### Logo Requirements

```javascript
{
  required: true,
  formats: ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize: 2 * 1024 * 1024, // 2MB
  minDimensions: { width: 200, height: 200 },
  recommendedDimensions: { width: 500, height: 500 },
  aspectRatio: '1:1', // Square preferred
  validation: [
    'Check file size before upload',
    'Check dimensions after upload',
    'Show preview after successful upload'
  ]
}
```

### Header Image Requirements

```javascript
{
  required: false,
  formats: ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize: 5 * 1024 * 1024, // 5MB
  minDimensions: { width: 1200, height: 300 },
  recommendedDimensions: { width: 1920, height: 400 },
  aspectRatio: '16:4', // Wide format
  validation: [
    'Same as logo',
    'More forgiving on aspect ratio'
  ]
}
```

### Error Messages

- "File too large. Maximum size is 2MB"
- "Invalid format. Please upload PNG or JPG"
- "Image too small. Minimum 200x200px required"
- "For best results, use 500x500px for logo"
- "For best results, use 1920x400px for header image"

---

## Post-Creation Flow

### Success Screen

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ✅  League Created Successfully!                       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │  🏁  Sydney Racing League                        │ │
│  │                                                   │ │
│  │  Your league is now live and visible as Public   │ │
│  │                                                   │ │
│  │  League URL:                                      │ │
│  │  yourplatform.com/leagues/sydney-racing-123      │ │
│  │  [📋 Copy Link]  [🔗 View Public Page]           │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ─────────────────────────────────────────────────────│
│                                                         │
│  Next Steps:                                            │
│                                                         │
│  You'll need at least one competition to start          │
│  running races and managing drivers.                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏎️  Create Your First Competition              │   │
│  │                                                  │   │
│  │  Set up a racing series (e.g., Monday Night     │   │
│  │  Racing, GT3 Championship, F1 Series)           │   │
│  │                                                  │   │
│  │      [Create Competition →]                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Other options:                                         │
│  • [Edit League Settings]                               │
│  • [Go to League Dashboard]                             │
│  • [Return to All Leagues]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Recommended Path

Push users toward **[Create Competition →]** as the primary next action, since a league needs at least one competition to be functional.

---

## Platform Selection

### Purpose

The platform selection at league level is for **advertising and filtering purposes only**. Individual competitions will specify their exact platform.

### Use Cases

1. **Public Directory Filtering:** Users can filter leagues by platform
2. **Multi-Platform Leagues:** Leagues running GT7 on Mondays and iRacing on Wednesdays
3. **League Identity:** Shows potential drivers what platforms are used

### Platform List

- Gran Turismo 7 (PlayStation)
- iRacing (PC)
- Assetto Corsa Competizione (Multi-platform)
- rFactor 2 (PC)
- Automobilista 2 (PC)
- F1 24 (Multi-platform)
- Other (text field for custom entry)

---

## League Visibility Options

### Public
- Appears in league directory
- Visible to all website visitors
- Drivers can request to join competitions
- Search engine indexable
- **Use case:** Growing community, recruiting new drivers

### Private
- Only visible to invited members
- Requires manager invitation to view
- Not searchable
- **Use case:** Closed friend groups, exclusive communities

### Unlisted
- Accessible via direct link only
- Hidden from directory and search
- Anyone with link can view
- **Use case:** Semi-private leagues, controlled sharing

---

## Free Tier Limitations

### League Limits

- **Free Tier:** 1 league maximum
- **Paid Tier:** Unlimited leagues

### Handling Limit Reached

When a free-tier user attempts to create a second league:

```
┌─────────────────────────────────────────────────┐
│ ⚠️  League Limit Reached                        │
│                                                 │
│ You've reached the free tier limit of 1 league.│
│                                                 │
│ Upgrade to Premium to create unlimited leagues, │
│ plus additional features:                       │
│                                                 │
│ • Unlimited leagues                             │
│ • Advanced statistics & analytics               │
│ • Custom branding options                       │
│ • Priority support                              │
│                                                 │
│ [View Pricing]  [Upgrade Now]                  │
│                                                 │
│ [Cancel]                                        │
└─────────────────────────────────────────────────┘
```

---

## Database Considerations

### League Table Schema (Conceptual)

```sql
leagues {
  id: integer (primary key)
  name: string (100 chars)
  tagline: string (150 chars)
  description: text (rich text)
  logo_url: string
  header_image_url: string (nullable)
  
  -- Platform selections (JSON array)
  platforms: json
  
  -- Social links
  discord_url: string (nullable)
  website_url: string (nullable)
  twitter_handle: string (nullable)
  instagram_handle: string (nullable)
  youtube_url: string (nullable)
  twitch_url: string (nullable)
  
  -- Settings
  visibility: enum ('public', 'private', 'unlisted')
  timezone: string
  
  -- Admin info
  admin_user_id: integer (foreign key to users)
  contact_email: string
  organizer_name: string
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (soft delete)
}
```

### Relationships

- **One-to-Many:** League → Competitions
- **One-to-Many:** League → Managers (through league_managers pivot)
- **One-to-Many:** League → Drivers (through league_drivers)

---

## Business Rules

1. **Unique League Names:** Not enforced (multiple leagues can have same name)
2. **URL Slugs:** Generated from league name + unique ID
3. **Draft Saving:** Leagues can be saved as drafts (incomplete)
4. **Deletion:** Soft delete (can be restored)
5. **Archiving:** Leagues can be archived (hidden but preserved)

---

## Future Enhancements (Not in v1)

- Template system for quick league setup
- Clone/duplicate league functionality
- Import from CSV/external sources
- League analytics dashboard
- Custom domain mapping for league pages
- Multi-language support
- League tags/categories for better discovery

---

## Related Documentation

- `02-Manager-Invitation-System.md` - How to add managers to leagues
- `03-Competition-Creation.md` - Creating competitions within leagues
- `04-Dashboard-Layouts.md` - League dashboard and navigation