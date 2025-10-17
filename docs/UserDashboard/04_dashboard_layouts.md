# Dashboard Layouts Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

This document describes all dashboard views and navigation patterns in the Virtual Racing League Management System. The system uses a hierarchical navigation structure with breadcrumbs and contextual tabs.

---

## Navigation Hierarchy

```
My Leagues Dashboard (Account Level)
  └─ League Dashboard
      └─ Competition Dashboard
          └─ Season Dashboard
              └─ Round Management
```

---

## 1. My Leagues Dashboard (Account Level)

**URL:** `/dashboard` or `/leagues`  
**Access:** All authenticated users

### Empty State (New User)

```
═══════════════════════════════════════════════════
MY LEAGUES
═══════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│                                                 │
│              Welcome to [Platform]              │
│                                                 │
│         Manage your sim racing leagues          │
│              with ease and speed                │
│                                                 │
│                   wizard                        │
│                                                 │
│                                                 │
│          [Create Your First League]             │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘

Quick Links
───────────────────────────────────────────────────
📖 Getting Started Guide
🎥 Video Tutorials
💬 Community Forum
```

### With Leagues (Active State)

```
═══════════════════════════════════════════════════
MY LEAGUES
═══════════════════════════════════════════════════

[+ Create New League]  [Filter ▼]  [Sort: Recent ▼]

Pending Invitations (1)
───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ 🔔 INVITATION PENDING                           │
├─────────────────────────────────────────────────┤
│ 🏁 Sydney Racing League                         │
│ You've been invited by John Doe                 │
│ [Accept Invitation]  [Decline]                  │
└─────────────────────────────────────────────────┘

My Leagues (3)
───────────────────────────────────────────────────

┌──────────────────┬──────────────────┬──────────────────┐
│ [League Logo]    │ [League Logo]    │ [League Logo]    │
│                  │                  │                  │
│ Sydney Racing    │ Melbourne GT     │ Brisbane Enduro  │
│ League           │ Series           │ Championship     │
│                  │                  │                  │
│ Role: Admin      │ Role: Manager    │ Role: Admin      │
│ 3 competitions   │ 2 competitions   │ 1 competition    │
│ 150 drivers      │ 85 drivers       │ 45 drivers       │
│ 5 active seasons │ 2 active seasons │ 1 active season  │
│                  │                  │                  │
│ 🌐 Public        │ 🔒 Private       │ 🔗 Unlisted      │
│                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

### League Card Specifications

```
┌──────────────────────────────────────────┐
│ [Square Logo - 120x120]                  │
│                                          │
│ League Name (truncate at 40 chars)      │
│ Tagline (truncate at 60 chars)          │
│                                          │
│ 👤 Role: Admin | Manager                 │
│ 🏁 X competitions                        │
│ 👥 X drivers                             │
│ 📅 X active seasons                      │
│                                          │
│ Visibility Badge                         │
│                                          │
│ Hover: Subtle elevation effect           │
│ Click anywhere: Navigate to league       │
└──────────────────────────────────────────┘
```

### Filter Options

```
[Filter ▼]
  • All Leagues
  • Admin Only
  • Manager Only
  • Active Seasons
  • Archived
  ───────────
  • Public
  • Private
  • Unlisted
```

### Sort Options

```
[Sort ▼]
  • Recent Activity (default)
  • League Name (A-Z)
  • League Name (Z-A)
  • Newest First
  • Oldest First
  • Most Drivers
  • Most Competitions
```

### Free Tier Limit Reached

```
[+ Create New League] (disabled, grayed out)

┌─────────────────────────────────────────────────┐
│ ⚠️  League Limit Reached                        │
│                                                 │
│ You've reached the free tier limit of 1 league.│
│                                                 │
│ Upgrade to Premium for:                         │
│ • Unlimited leagues                             │
│ • Advanced analytics                            │
│ • Priority support                              │
│                                                 │
│ [Upgrade to Premium]  [Learn More]             │
└─────────────────────────────────────────────────┘
```

---

## 2. League Dashboard (Individual League)

**URL:** `/leagues/[league-slug]`  
**Breadcrumb:** `My Leagues > Sydney Racing League`

### Header

```
═══════════════════════════════════════════════════
[Logo] SYDNEY RACING LEAGUE
       Your premier GT racing community
                                          [⚙️ Settings ▼]
                                            • Edit League
                                            • Manage Managers
                                            • Archive League
                                            • Delete League
═══════════════════════════════════════════════════
```

### Tab Navigation

```
[Overview] [Competitions] [Drivers] [Calendar] [Settings]
  ^active
```

---

### Overview Tab

```
═══════════════════════════════════════════════════
OVERVIEW
═══════════════════════════════════════════════════

Quick Stats
┌─────────────┬─────────────┬─────────────┬────────┐
│ Competitions│   Seasons   │   Drivers   │ Active │
│      3      │      5      │     150     │ Races  │
│             │  (2 active) │             │   2    │
└─────────────┴─────────────┴─────────────┴────────┘

Upcoming Races (Next 7 Days)
───────────────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│ Sunday, Feb 18 @ 7:00 PM                        │
│ 🏎️ Sunday Night Racing - Round 5               │
│ Track: Brands Hatch GP                          │
│ 45 drivers registered                           │
│ [View Details] [Enter Results]                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Monday, Feb 19 @ 8:00 PM                        │
│ 🏁 GT3 Championship - Round 3                   │
│ Track: Spa-Francorchamps                        │
│ 38 drivers registered                           │
│ [View Details] [Enter Results]                  │
└─────────────────────────────────────────────────┘

Competitions (3)                    [+ New Competition]
───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ 🏎️ Sunday Night Racing          Gran Turismo 7  │
│    2 seasons • 1 active • 45 drivers            │
│    Next race: Sunday, Feb 18 @ 7:00 PM         │
│    [View] [Manage]                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏁 Monday GT3 Championship       GT7            │
│    2 seasons • 1 active • 38 drivers            │
│    Next race: Monday, Feb 19 @ 8:00 PM         │
│    [View] [Manage]                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏆 F1 Series                     Gran Turismo 7 │
│    1 season • 0 active • 32 drivers             │
│    No upcoming races                            │
│    [View] [Manage]                              │
└─────────────────────────────────────────────────┘

Recent Activity
───────────────────────────────────────────────────
• 2 hours ago - Results entered: Round 5 - Sunday Night
• 1 day ago - New driver added: John Smith
• 2 days ago - Season created: GT3 Championship S2
• 3 days ago - Competition created: F1 Series
```

---

### Competitions Tab

```
═══════════════════════════════════════════════════
COMPETITIONS (3)                    [+ New Competition]
═══════════════════════════════════════════════════

[Filter: All Platforms ▼]  [Sort: Recent ▼]  [View: Cards 🔲 List]

┌─────────────────────────────────────────────────┐
│ 🏎️ Sunday Night Racing                          │
│ Platform: Gran Turismo 7                        │
├─────────────────────────────────────────────────┤
│ Weekly GT3 racing every Sunday evening         │
│                                                 │
│ 📊 Statistics:                                  │
│   • 2 seasons (1 active)                        │
│   • 45 active drivers                           │
│   • 24 completed races                          │
│   • Next race: Feb 18, 7:00 PM                  │
│                                                 │
│ [View Public Page] [Manage] [Edit]             │
└─────────────────────────────────────────────────┘

[Similar cards for other competitions...]
```

---

### Drivers Tab

```
═══════════════════════════════════════════════════
DRIVERS (150)                           [+ Add Driver]
                                        [Import CSV]
═══════════════════════════════════════════════════

[Search drivers...] [Filter ▼] [Sort: Name A-Z ▼]

┌────┬──────────────────┬────────────────┬──────────┐
│ #  │ Name             │ Competitions   │ Status   │
├────┼──────────────────┼────────────────┼──────────┤
│ 5  │ John Smith       │ SNR, GT3, F1   │ Active   │
│ 7  │ Jane Doe         │ SNR, GT3       │ Active   │
│ 3  │ Mike Ross        │ SNR            │ Active   │
│ 23 │ Sarah Williams   │ GT3            │ Inactive │
└────┴──────────────────┴────────────────┴──────────┘

[Showing 1-50 of 150] [← Previous] [Next →]
```

---

### Calendar Tab

```
═══════════════════════════════════════════════════
CALENDAR
═══════════════════════════════════════════════════

[Month View] [Week View] [List View]

February 2025                      [← Previous] [Next →]

┌─────┬─────┬─────┬─────┬─────┬─────┬─────────────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun         │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────┤
│     │     │     │     │     │  1  │  2          │
│  3  │  4  │  5  │  6  │  7  │  8  │  9          │
│ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │ 16 🏎️      │
│ 17  │ 18🏎│ 19🏁│ 20  │ 21  │ 22  │ 23 🏎️      │
│ 24  │ 25  │ 26🏁│ 27  │ 28  │     │             │
└─────┴─────┴─────┴─────┴─────┴─────┴─────────────┘

🏎️ = Race event
🏁 = Multiple races

Upcoming Events (Next 30 Days)
───────────────────────────────────────────────────
Feb 18 @ 7:00 PM  - Sunday Night Racing Rd 5
Feb 19 @ 8:00 PM  - GT3 Championship Rd 3
Feb 23 @ 7:00 PM  - Sunday Night Racing Rd 6
Feb 26 @ 8:00 PM  - GT3 Championship Rd 4
```

---

### Settings Tab

```
═══════════════════════════════════════════════════
LEAGUE SETTINGS
═══════════════════════════════════════════════════

[General] [Managers] [Branding] [Social] [Advanced]
  ^active

General Settings
───────────────────────────────────────────────────

League Name
[Sydney Racing League_____________________________]

Tagline
[Your premier GT racing community________________]

Description
┌──────────────────────────────────────────────────┐
│ [Rich text editor content]                      │
└──────────────────────────────────────────────────┘

Visibility
○ Public  ● Private  ○ Unlisted

Time Zone
[Australia/Sydney (AEDT) ▼]

[Save Changes]  [Cancel]
```

---

## 3. Competition Dashboard

**URL:** `/leagues/[league-slug]/competitions/[competition-slug]`  
**Breadcrumb:** `My Leagues > Sydney Racing > Sunday Night Racing`

### Header

```
═══════════════════════════════════════════════════
[Logo] SUNDAY NIGHT RACING
       Gran Turismo 7 • GT3 Championship
                                          [⚙️ Settings ▼]
                                            • Edit Competition
                                            • Create Season
                                            • Archive
═══════════════════════════════════════════════════
```

### Tab Navigation

```
[Overview] [Seasons] [Drivers] [Statistics] [Settings]
  ^active
```

---

### Overview Tab

```
═══════════════════════════════════════════════════
OVERVIEW
═══════════════════════════════════════════════════

Quick Stats
┌─────────────┬─────────────┬─────────────┬────────┐
│   Seasons   │   Drivers   │    Races    │ Active │
│      2      │      45     │      24     │ Rounds │
│  (1 active) │             │             │   3    │
└─────────────┴─────────────┴─────────────┴────────┘

Current Season: Spring 2025
───────────────────────────────────────────────────
Next Race: Round 5 - Brands Hatch GP
Date: Sunday, Feb 18, 2025 @ 7:00 PM
45 drivers registered across 3 divisions

[View Season] [Enter Results] [View Standings]

Division Leaders
┌─────────────────────────────────────────────────┐
│ Div 1: John Smith (118 pts)                    │
│ Div 2: Alice Wong (95 pts)                     │
│ Div 3: Bob Lee (87 pts)                        │
└─────────────────────────────────────────────────┘

Seasons (2)                         [+ Create New Season]
───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ 🏆 Spring 2025 Season               ⚡ ACTIVE   │
│ Jan 15 - Apr 30, 2025 • 10 rounds              │
│ 45 drivers • 3 divisions                        │
│ Round 4 of 10 completed                         │
│ [Manage Season] [View Standings]                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏁 Fall 2024 Season                 ✓ COMPLETE  │
│ Sep 1 - Dec 15, 2024 • 12 rounds               │
│ 42 drivers • 3 divisions                        │
│ Champion: John Smith (Div 1)                    │
│ [View Archive] [View Final Results]             │
└─────────────────────────────────────────────────┘

Recent Results
───────────────────────────────────────────────────
• Round 4 - Spa (Feb 11): John Smith wins Div 1
• Round 4 - Spa (Feb 11): Alice Wong wins Div 2
• Round 3 - Monza (Feb 4): Jane Doe wins Div 1
```

---

### Seasons Tab

```
═══════════════════════════════════════════════════
SEASONS (2)                         [+ Create New Season]
═══════════════════════════════════════════════════

[Filter: All ▼] [Sort: Newest First ▼]

Active Seasons (1)
───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ 🏆 Spring 2025 Season                           │
│ Status: ⚡ Active (Round 4/10)                  │
├─────────────────────────────────────────────────┤
│ Duration: Jan 15 - Apr 30, 2025                 │
│ Format: 10 rounds • 3 divisions • 45 drivers    │
│                                                 │
│ Next Event: Round 5 - Feb 18 @ 7:00 PM         │
│                                                 │
│ Division Leaders:                               │
│   • Div 1: John Smith (118 pts)                │
│   • Div 2: Alice Wong (95 pts)                 │
│   • Div 3: Bob Lee (87 pts)                    │
│                                                 │
│ [Manage Season] [View Calendar] [Standings]    │
└─────────────────────────────────────────────────┘

Completed Seasons (1)
───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ 🏁 Fall 2024 Season                             │
│ Status: ✓ Completed                             │
├─────────────────────────────────────────────────┤
│ Duration: Sep 1 - Dec 15, 2024                  │
│ Format: 12 rounds • 3 divisions • 42 drivers    │
│                                                 │
│ Champions:                                      │
│   • Div 1: John Smith (285 pts)                │
│   • Div 2: Mike Ross (268 pts)                 │
│   • Div 3: Emma Davis (245 pts)                │
│                                                 │
│ [View Archive] [View Final Results] [Clone]    │
└─────────────────────────────────────────────────┘
```

---

### Drivers Tab (Competition Level)

```
═══════════════════════════════════════════════════
DRIVERS (45)                             [+ Add Driver]
═══════════════════════════════════════════════════

Showing drivers who have competed in any season of 
this competition.

[Search...] [Filter by Season ▼] [Sort: Name A-Z ▼]

┌────┬──────────────────┬──────────┬──────┬────┬────┐
│ #  │ Name             │ Seasons  │ Races│ Wins│Pods│
├────┼──────────────────┼──────────┼──────┼────┼────┤
│ 5  │ John Smith       │ 2        │  28  │  8 │ 15 │
│ 7  │ Jane Doe         │ 2        │  27  │  6 │ 14 │
│ 3  │ Mike Ross        │ 1        │  12  │  3 │  8 │
│ 23 │ Sarah Williams   │ 2        │  24  │  2 │  7 │
└────┴──────────────────┴──────────┴──────┴────┴────┘

[Showing 1-20 of 45] [← Previous] [Next →]
```

---

### Statistics Tab

```
═══════════════════════════════════════════════════
COMPETITION STATISTICS
═══════════════════════════════════════════════════

All-Time Records (Across All Seasons)
───────────────────────────────────────────────────

Most Wins:              John Smith (8)
Most Poles:             Jane Doe (7)
Most Fastest Laps:      John Smith (12)
Most Podiums:           John Smith (15)
Most Races:             John Smith (28)

Track Records
───────────────────────────────────────────────────
Brands Hatch GP:    1:23.456 - John Smith (R5, Spring '25)
Spa-Francorchamps:  2:15.789 - Jane Doe (R4, Spring '25)
Monza:              1:45.234 - Mike Ross (R3, Spring '25)

Season Comparison
───────────────────────────────────────────────────
                Spring '25    Fall '24
Drivers:            45           42
Rounds:             10           12
Avg. Finish Time:  35:24        36:12
DNF Rate:           8%           12%
```

---

## 4. Season Dashboard

**URL:** `/leagues/[league-slug]/competitions/[comp-slug]/seasons/[season-slug]`  
**Breadcrumb:** `My Leagues > Sydney Racing > Sunday Night > Spring 2025`

### Header

```
═══════════════════════════════════════════════════
[Logo] SPRING 2025 SEASON
       Sunday Night Racing • Gran Turismo 7
       Round 4 of 10 • Jan 15 - Apr 30, 2025
                                          [⚙️ Settings ▼]
                                            • Edit Season
                                            • Manage Drivers
                                            • Export Data
                                            • Archive Season
═══════════════════════════════════════════════════
```

### Tab Navigation

```
[Overview] [Calendar] [Standings] [Drivers] [Settings]
  ^active
```

---

### Overview Tab

```
═══════════════════════════════════════════════════
OVERVIEW
═══════════════════════════════════════════════════

Season Progress
┌─────────────────────────────────────────────────┐
│ ████████░░░░░░░░░░░  40% Complete (4/10 rounds) │
└─────────────────────────────────────────────────┘

Next Race
───────────────────────────────────────────────────
Round 5 - Brands Hatch GP Circuit
Sunday, February 18, 2025 @ 7:00 PM AEDT

45 drivers registered • 3 divisions
[View Entry Lists] [Race Control] [Enter Results]

Championship Leaders (All Divisions)
───────────────────────────────────────────────────

Division 1 (16 drivers)
┌────┬─────┬──────────────────┬─────┬───┬───┬───┐
│ Pos│  Δ  │ Driver           │ Pts │ W │ P │FL │
├────┼─────┼──────────────────┼─────┼───┼───┼───┤
│  1 │ ↑1  │ John Smith       │ 118 │ 3 │ 4 │ 2 │
│  2 │ ↓1  │ Jane Doe         │ 115 │ 2 │ 5 │ 3 │
│  3 │ ↔   │ Mike Ross        │  98 │ 1 │ 3 │ 1 │
└────┴─────┴──────────────────┴─────┴───┴───┴───┘
[View Full Standings]

Division 2 (15 drivers)
┌────┬─────┬──────────────────┬─────┬───┬───┬───┐
│ Pos│  Δ  │ Driver           │ Pts │ W │ P │FL │
├────┼─────┼──────────────────┼─────┼───┼───┼───┤
│  1 │ ↔   │ Alice Wong       │  95 │ 2 │ 3 │ 1 │
│  2 │ ↑2  │ Bob Lee          │  88 │ 1 │ 2 │ 2 │
│  3 │ ↓1  │ Chris Brown      │  84 │ 1 │ 3 │ 0 │
└────┴─────┴──────────────────┴─────┴───┴───┴───┘
[View Full Standings]

Division 3 (14 drivers)
[Similar table...]
[View Full Standings]

Recent Results
───────────────────────────────────────────────────
• Round 4 - Spa-Francorchamps (Feb 11, 2025)
  Div 1: John Smith | Div 2: Alice Wong | Div 3: Tom Wilson
  [View Full Results]

• Round 3 - Monza (Feb 4, 2025)
  Div 1: Jane Doe | Div 2: Bob Lee | Div 3: Sam Taylor
  [View Full Results]
```

---

### Calendar Tab

```
═══════════════════════════════════════════════════
SEASON CALENDAR
═══════════════════════════════════════════════════

[Calendar View] [List View]
               ^active

Round 1 - Brands Hatch GP              ✓ COMPLETED
───────────────────────────────────────────────────
Date: January 15, 2025 @ 7:00 PM
Status: Results finalized
Winners: John Smith (D1), Alice Wong (D2), Tom Wilson (D3)
[View Results] [View Standings After]

Round 2 - Nürburgring GP              ✓ COMPLETED
───────────────────────────────────────────────────
Date: January 22, 2025 @ 7:00 PM
Status: Results finalized
Winners: Jane Doe (D1), Bob Lee (D2), Sam Taylor (D3)
[View Results] [View Standings After]

Round 3 - Monza                       ✓ COMPLETED
───────────────────────────────────────────────────
Date: February 4, 2025 @ 7:00 PM
Status: Results finalized
Winners: Jane Doe (D1), Bob Lee (D2), Sam Taylor (D3)
[View Results] [View Standings After]

Round 4 - Spa-Francorchamps          ✓ COMPLETED
───────────────────────────────────────────────────
Date: February 11, 2025 @ 7:00 PM
Status: Results finalized
Winners: John Smith (D1), Alice Wong (D2), Tom Wilson (D3)
[View Results] [View Standings After]

Round 5 - Brands Hatch GP            ⏭️ UPCOMING
───────────────────────────────────────────────────
Date: February 18, 2025 @ 7:00 PM
Status: Pre-race
45 drivers registered
[View Entry Lists] [Race Control] [Enter Results]

Round 6 - Suzuka Circuit             📅 SCHEDULED
───────────────────────────────────────────────────
Date: February 25, 2025 @ 7:00 PM
Status: Scheduled
[Edit Round] [Preview Entry List]

[Rounds 7-10 listed similarly...]
```

---

### Standings Tab

```
═══════════════════════════════════════════════════
CHAMPIONSHIP STANDINGS
After Round 4 of 10
═══════════════════════════════════════════════════

[Division 1 ▼] [View: Detailed ▼] [Export CSV]

Division 1 Standings
───────────────────────────────────────────────────

┌────┬───┬──────────────┬──────┬─────┬────────────────────┬─┬─┬──┐
│Pos │ Δ │ Driver       │ Team │ Pts │  R1  R2  R3  R4    │W│P│FL│
├────┼───┼──────────────┼──────┼─────┼────────────────────┼─┼─┼──┤
│ 1  │↑1 │John Smith    │Red   │ 118 │ 25  15  25  28+FL  │3│4│2 │
│ 2  │↓1 │Jane Doe      │Solo  │ 115 │ 18  25  18  30x2   │2│5│3 │
│ 3  │↔  │Mike Ross     │Red   │  98 │ 15  18  15  32x2+FL│1│3│1 │
│ 4  │↑2 │Sarah Will.   │Green │  87 │ 12  12  10  20     │0│2│0 │
│ 5  │↓1 │Chris Brown   │Blue  │  84 │ 10  10  12  22     │1│1│1 │
│ 6  │↑3 │Emma Davis    │Green │  76 │  8  DNS  25  18+FL │1│2│1 │
│... │   │              │      │     │                    │ │ │  │
└────┴───┴──────────────┴──────┴─────┴────────────────────┴─┴─┴──┘

Δ = Change from last round
Numbers = Finishing position
+FL = Fastest lap bonus
x2 = Double points round
DNS = Did not start
DNF = Did not finish
W = Wins, P = Podiums, FL = Fastest Laps

Team Championship (Division 1)
───────────────────────────────────────────────────
 1. Red Racing           216 pts (Smith 118, Ross 98)
 2. Green Machines       163 pts (Williams 87, Davis 76)
 3. Blue Thunder         148 pts (Brown 84, Lee 64)

[Download Standings PDF] [Share Link] [Copy Embed Code]
```

---

### Drivers Tab (Season Level)

```
═══════════════════════════════════════════════════
SEASON DRIVERS (45)                      [+ Add Driver]
                                         [Import CSV]
                                    [Manage Assignments]
═══════════════════════════════════════════════════

[Search...] [Filter: All Divisions ▼] [Sort: Name ▼]

┌────┬─────────────────┬──────┬──────┬──────┬────────┐
│ #  │ Name            │ Div  │ Team │Status│Actions │
├────┼─────────────────┼──────┼──────┼──────┼────────┤
│ 5  │ John Smith      │ Div 1│ Red  │Active│[Edit]  │
│ 7  │ Jane Doe        │ Div 1│ Solo │Active│[Edit]  │
│ 3  │ Mike Ross       │ Div 1│ Red  │Active│[Edit]  │
│ 23 │ Sarah Williams  │ Div 1│ Green│Active│[Edit]  │
│ 12 │ Alice Wong      │ Div 2│ Solo │Active│[Edit]  │
│... │                 │      │      │      │        │
└────┴─────────────────┴──────┴──────┴──────┴────────┘

Quick Actions
───────────────────────────────────────────────────
[Auto-Assign Divisions] [Balance Divisions] 
[Export Driver List] [Send Email to All]
```

---

## 5. Round Management View

**URL:** `/leagues/[league]/competitions/[comp]/seasons/[season]/rounds/[round-id]`  
**Breadcrumb:** `... > Spring 2025 > Round 5`

### Pre-Race View

```
═══════════════════════════════════════════════════
ROUND 5 - BRANDS HATCH GP CIRCUIT
Sunday, February 18, 2025 @ 7:00 PM AEDT
Status: ⏸️ Pre-Race
═══════════════════════════════════════════════════

[Race Control] [Entry Lists] [Results Entry] [Settings]
  ^active

Race Control Dashboard
───────────────────────────────────────────────────

Pre-Race Checklist
☑ Track configuration confirmed
☑ Entry lists finalized (45 drivers)
☐ Discord notification sent
☐ Race procedures reviewed

Quick Actions
───────────────────────────────────────────────────
[Send Race Reminder] [View Track Info] [Mark DNS]
[Enter Results] [Cancel Round]

Entry Summary
───────────────────────────────────────────────────
Division 1: 16/16 drivers confirmed
Division 2: 15/16 drivers confirmed (1 TBD)
Division 3: 14/16 drivers confirmed

[View Full Entry Lists]

Track Information
───────────────────────────────────────────────────
Track: Brands Hatch GP Circuit
Layout: Grand Prix
Length: 3.908 km (2.428 mi)
Corners: 9
Race Laps: 15 laps
Estimated Duration: 36 minutes

[Edit Track Details]
```

### Post-Race View (Results Entered)

```
═══════════════════════════════════════════════════
ROUND 5 - BRANDS HATCH GP CIRCUIT
Sunday, February 18, 2025 @ 7:00 PM AEDT
Status: ✅ Results Finalized
═══════════════════════════════════════════════════

[Results] [Standings] [Documents] [Incidents]
  ^active

Race Results - Division 1
───────────────────────────────────────────────────

Pos│Driver          │Laps│Time       │FL      │Pts
───┼────────────────┼────┼───────────┼────────┼────
 1 │John Smith #5   │ 15 │36:24.582  │1:23.982│ 26
 2 │Jane Doe #7     │ 15 │  +2.341   │1:24.123│ 18
 3 │Mike Ross #3    │ 15 │  +5.782   │1:24.456│ 15
 4 │Sarah Will. #23 │ 15 │  +8.234   │1:24.789│ 12

Fastest Lap: John Smith (#5) - 1:23.982

[View All Divisions] [Edit Results] [Generate Document]

Championship Impact
───────────────────────────────────────────────────
• John Smith extends lead to 3 points
• Jane Doe drops to P2 (-1 position)
• Mike Ross maintains P3

[View Updated Standings]

Generated Documents
───────────────────────────────────────────────────
📄 Round 5 Results (PDF) - Generated Feb 18, 9:45 PM
   [Download] [Share] [Email]

📊 Updated Standings (PDF) - Generated Feb 18, 9:46 PM
   [Download] [Share] [Email]
```

---

## Navigation Patterns

### Breadcrumb Navigation

Always visible at top of page:
```
My Leagues > Sydney Racing > Sunday Night > Spring 2025 > Round 5
   [link]       [link]          [link]         [link]      [current]
```

### Back Button Behavior

- Browser back button: Navigate to previous page in history
- Breadcrumb links: Jump to any level in hierarchy
- "Cancel" buttons: Return to parent view

### Mobile Navigation

On mobile devices, breadcrumbs collapse:
```
[≡] Spring 2025 > Round 5
     [Shows full path when expanded]
```

---

## Empty States

### No Competitions Yet

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               🏁 No Competitions Yet            │
│                                                 │
│  Create your first competition to start        │
│  organizing races and managing drivers.        │
│                                                 │
│        [Create Your First Competition]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### No Seasons Yet

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                🏆 No Seasons Yet                │
│                                                 │
│  Create your first season to start racing!     │
│                                                 │
│          [Create Your First Season]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### No Drivers Yet

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               👥 No Drivers Yet                 │
│                                                 │
│  Add drivers to start building your community. │
│                                                 │
│  [Add Single Driver] [Import from CSV]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Related Documentation

- `01-League-Creation.md` - Creating leagues
- `02-Manager-Invitation-System.md` - Manager roles and invitations
- `03-Competition-Creation.md` - Creating competitions
- `05-Season-Creation.md` - Creating seasons (to be documented)
- `06-Driver-Management.md` - Managing drivers (to be documented)
- `07-Result-Entry.md` - Entering race results (to be documented)