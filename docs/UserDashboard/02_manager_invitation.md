# Manager Invitation System Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

The Manager Invitation System allows league administrators to invite other users to help manage their leagues. This enables collaborative league management while maintaining appropriate access controls.

---

## User Roles

### Admin (League Creator)

**Permissions:**
- Full control over league
- Edit league details (name, logo, description, settings)
- Add/remove managers
- All manager permissions (see below)
- Cannot transfer admin role (in v1)
- Cannot be removed (must delete league)

### Manager (Invited User)

**Permissions:**
- Create/edit competitions
- Create/edit seasons
- Add/manage drivers
- Enter race results
- Generate results documents
- View all league data

**Restrictions:**
- **Cannot** edit league details (name, logo, description, social links, visibility)
- **Cannot** add/remove other managers
- **Cannot** delete league
- Can resign/leave league voluntarily

---

## Manager Management Interface

### Location

**League Settings → Managers tab**

### Manager List View

```
═══════════════════════════════════════════════════
LEAGUE MANAGERS
═══════════════════════════════════════════════════

Current Managers (2)

┌─────────────────────────────────────────────────┐
│ 👤 You (Admin)                                  │
│    your.email@example.com                       │
│    Role: League Administrator                   │
│    Joined: Jan 15, 2025                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 👤 John Smith (Manager)                         │
│    john.smith@email.com                         │
│    Role: Manager                                │
│    Joined: Feb 1, 2025                          │
│    [Remove Manager]                             │
└─────────────────────────────────────────────────┘

Pending Invitations (1)

┌─────────────────────────────────────────────────┐
│ 📧 jane.doe@email.com                           │
│    Invited: Feb 10, 2025                        │
│    Status: Pending                              │
│    [Resend Invite] [Cancel Invitation]          │
└─────────────────────────────────────────────────┘

───────────────────────────────────────────────────

[+ Invite New Manager]
```

---

## Invitation Flow

### Step 1: Admin Invites Manager

**Click [+ Invite New Manager]:**

```
┌─────────────────────────────────────────────────┐
│ INVITE MANAGER                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Email Address*                                  │
│ [_________________________________________]     │
│                                                 │
│ Personal Message (optional)                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ Hi! I'd like you to help manage the        │ │
│ │ Sydney Racing League with me...             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│ 0/500 characters                                │
│                                                 │
│ ⓘ The invitation will be sent via email.       │
│   If they don't have an account, they'll be    │
│   prompted to register.                        │
│                                                 │
│ [Cancel]  [Send Invitation]                    │
└─────────────────────────────────────────────────┘
```

### Step 2: System Sends Invitation Email

**Email Template:**

```
Subject: You've been invited to manage Sydney Racing League

─────────────────────────────────────────────────

Hi there!

John Doe has invited you to help manage the Sydney Racing 
League on [Platform Name].

Personal message from John:
"Hi! I'd like you to help manage the Sydney Racing League 
with me..."

As a manager, you'll be able to:
• Create and manage competitions
• Set up seasons and divisions
• Add and organize drivers
• Enter race results
• Generate results documents

─────────────────────────────────────────────────

[Accept Invitation]

This invitation will expire in 7 days.

Already have an account? Click above to accept.
Don't have an account? You'll be able to register after 
clicking the button.

─────────────────────────────────────────────────

Not interested? You can decline this invitation:
[Decline Invitation]

Questions? Contact support@platform.com
```

### Step 3A: Existing User Accepts

**Flow for users with existing accounts:**

1. User clicks **[Accept Invitation]** in email
2. If not logged in → redirected to login page
3. After login → redirected to **My Leagues Dashboard**
4. League appears with acceptance prompt (see below)
5. User clicks **[Accept Invitation]**
6. League added to user's dashboard
7. User gains manager access immediately

### Step 3B: New User Accepts

**Flow for users without accounts:**

1. User clicks **[Accept Invitation]** in email
2. Redirected to registration page with context:
   ```
   ┌──────────────────────────────────────────────┐
   │ You've been invited to manage                │
   │ Sydney Racing League                         │
   │                                              │
   │ Create an account to accept the invitation   │
   └──────────────────────────────────────────────┘
   ```
3. User completes registration
4. After registration → redirected to **My Leagues Dashboard**
5. League appears with acceptance prompt
6. User clicks **[Accept Invitation]**
7. League added to user's dashboard

---

## My Leagues Dashboard - Invitation View

### Pending Invitation Display

```
═══════════════════════════════════════════════════
MY LEAGUES
═══════════════════════════════════════════════════

Pending Invitations (1)

┌─────────────────────────────────────────────────┐
│ 🔔 INVITATION PENDING                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🏁 Sydney Racing League                         │
│                                                 │
│ You've been invited by John Doe to manage      │
│ this league.                                    │
│                                                 │
│ Personal message:                               │
│ "Hi! I'd like you to help manage the Sydney    │
│  Racing League with me..."                      │
│                                                 │
│ [Accept Invitation]  [Decline]                  │
│                                                 │
└─────────────────────────────────────────────────┘

My Leagues (2)

┌──────────────────┬──────────────────┐
│ Melbourne GT     │ Brisbane Enduro  │
│ Admin            │ Manager          │
│ 3 competitions   │ 1 competition    │
│ 85 drivers       │ 45 drivers       │
│ [Manage League]  │ [Manage League]  │
└──────────────────┴──────────────────┘
```

### After Accepting

- Invitation card disappears
- League appears in "My Leagues" section with "Manager" role badge
- User can immediately access league dashboard
- Admin receives notification (email or in-app)

### After Declining

- Invitation card disappears
- Admin receives notification
- Invitation record marked as declined
- User can still be re-invited later

---

## Invitation Management

### Resend Invitation

**When:** Invitation email not received or expired

**Action:**
1. Admin clicks **[Resend Invite]**
2. New invitation email sent
3. Expiry date reset to 7 days from resend
4. Same invitation token (not a new invitation)

### Cancel Invitation

**When:** Admin changes mind before invitation accepted

**Action:**
1. Admin clicks **[Cancel Invitation]**
2. Confirmation dialog:
   ```
   ┌──────────────────────────────────────────────┐
   │ Cancel Invitation?                           │
   │                                              │
   │ Are you sure you want to cancel the         │
   │ invitation to jane.doe@email.com?           │
   │                                              │
   │ They will not be able to accept this        │
   │ invitation, but you can send a new one      │
   │ later if needed.                            │
   │                                              │
   │ [No, Keep Invitation]  [Yes, Cancel]        │
   └──────────────────────────────────────────────┘
   ```
3. Invitation removed from pending list
4. Invitation link becomes invalid
5. User sees message if they try to accept: "This invitation has been cancelled"

---

## Removing Managers

### Remove Manager Action

**Location:** League Settings → Managers tab → [Remove Manager] button

**Confirmation Dialog:**

```
┌─────────────────────────────────────────────────┐
│ REMOVE MANAGER                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Are you sure you want to remove John Smith     │
│ as a manager of this league?                   │
│                                                 │
│ They will immediately lose access to:          │
│ • All league competitions                      │
│ • Season management                            │
│ • Driver data                                  │
│ • Results entry                                │
│                                                 │
│ This action cannot be undone, but you can      │
│ re-invite them later if needed.                │
│                                                 │
│ [Cancel]  [Remove Manager]                     │
└─────────────────────────────────────────────────┘
```

### After Removal

**Admin View:**
- Manager removed from manager list
- Manager's actions in league history preserved (audit trail)

**Removed Manager View:**
- League disappears from their "My Leagues" dashboard
- Loses all access immediately
- Receives notification email (optional)
- Can be re-invited later

---

## Invitation Expiry

### Default Expiry Period

**7 days** from invitation send date

### Expired Invitation Behavior

**User tries to accept expired invitation:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Invitation Expired                          │
│                                                 │
│ This invitation to manage Sydney Racing League │
│ has expired.                                    │
│                                                 │
│ Please contact the league administrator to     │
│ request a new invitation.                      │
│                                                 │
│ [Back to Dashboard]                            │
└─────────────────────────────────────────────────┘
```

**Admin View (Pending Invitations):**
```
┌─────────────────────────────────────────────────┐
│ 📧 jane.doe@email.com                           │
│    Invited: Feb 10, 2025                        │
│    Status: ⚠️ Expired                           │
│    [Resend Invite] [Cancel Invitation]          │
└─────────────────────────────────────────────────┘
```

---

## Edge Cases & Validation

### Duplicate Invitations

**Scenario:** Admin tries to invite someone already invited

**Behavior:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Already Invited                             │
│                                                 │
│ jane.doe@email.com already has a pending       │
│ invitation to this league.                     │
│                                                 │
│ [Resend Invitation]  [Cancel]                  │
└─────────────────────────────────────────────────┘
```

### Already a Manager

**Scenario:** Admin tries to invite someone already managing the league

**Behavior:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Already a Manager                           │
│                                                 │
│ john.smith@email.com is already a manager of   │
│ this league.                                    │
│                                                 │
│ [OK]                                            │
└─────────────────────────────────────────────────┘
```

### Inviting League Admin

**Scenario:** Admin tries to invite themselves

**Behavior:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Invalid Invitation                          │
│                                                 │
│ You cannot invite yourself. You are already    │
│ the administrator of this league.              │
│                                                 │
│ [OK]                                            │
└─────────────────────────────────────────────────┘
```

### Multiple Pending Invitations

**Question:** Can the same email be invited to multiple leagues?

**Answer:** Yes, a user can have multiple pending invitations from different leagues. Each invitation is independent.

**Dashboard Display:**
```
Pending Invitations (3)

┌─────────────────────────────────────────────────┐
│ 🏁 Sydney Racing League                         │
│ Invited by: John Doe                            │
│ [Accept]  [Decline]                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏁 Melbourne GT Series                          │
│ Invited by: Jane Smith                          │
│ [Accept]  [Decline]                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏁 Brisbane Endurance                           │
│ Invited by: Mike Johnson                        │
│ [Accept]  [Decline]                             │
└─────────────────────────────────────────────────┘
```

---

## Database Schema (Conceptual)

### league_managers Table

```sql
league_managers {
  id: integer (primary key)
  league_id: integer (foreign key)
  user_id: integer (foreign key)
  role: enum ('admin', 'manager')
  joined_at: timestamp
  created_at: timestamp
}

-- Unique constraint: user can only have one role per league
-- Index on: league_id, user_id
```

### league_invitations Table

```sql
league_invitations {
  id: integer (primary key)
  league_id: integer (foreign key)
  invited_by_user_id: integer (foreign key)
  email: string
  personal_message: text (nullable)
  token: string (unique, random)
  status: enum ('pending', 'accepted', 'declined', 'cancelled', 'expired')
  expires_at: timestamp
  accepted_at: timestamp (nullable)
  created_at: timestamp
  updated_at: timestamp
}

-- Index on: token, email, status
```

---

## Email Templates

### Invitation Email (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>League Manager Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  
  <div style="background: #f4f4f4; padding: 20px; text-align: center;">
    <img src="[LEAGUE_LOGO]" alt="League Logo" style="max-width: 120px;">
    <h1 style="color: #333; margin: 10px 0;">You've Been Invited!</h1>
  </div>
  
  <div style="background: white; padding: 30px;">
    <p>Hi there!</p>
    
    <p><strong>[ADMIN_NAME]</strong> has invited you to help manage the <strong>[LEAGUE_NAME]</strong> on [Platform Name].</p>
    
    <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
      <p style="margin: 0; font-style: italic;">"[PERSONAL_MESSAGE]"</p>
    </div>
    
    <p>As a manager, you'll be able to:</p>
    <ul>
      <li>Create and manage competitions</li>
      <li>Set up seasons and divisions</li>
      <li>Add and organize drivers</li>
      <li>Enter race results</li>
      <li>Generate results documents</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="[ACCEPT_URL]" style="background: #0066cc; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 12px; color: #666;">This invitation will expire in 7 days.</p>
    
    <p style="font-size: 12px; color: #666;">
      Already have an account? Click above to accept.<br>
      Don't have an account? You'll be able to register after clicking the button.
    </p>
  </div>
  
  <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p>Not interested? <a href="[DECLINE_URL]" style="color: #666;">Decline this invitation</a></p>
    <p>Questions? Contact <a href="mailto:support@platform.com">support@platform.com</a></p>
  </div>
  
</body>
</html>
```

### Invitation Accepted Notification (to Admin)

```
Subject: [MANAGER_NAME] accepted your invitation

Hi [ADMIN_NAME],

Great news! [MANAGER_NAME] has accepted your invitation to 
help manage [LEAGUE_NAME].

They now have full manager access and can help you with:
• Competition and season management
• Driver organization
• Result entry
• Document generation

You can manage your team in League Settings → Managers.

[View League Dashboard]

Happy racing!
The [Platform Name] Team
```

### Invitation Declined Notification (to Admin)

```
Subject: [MANAGER_NAME] declined your invitation

Hi [ADMIN_NAME],

[MANAGER_NAME] has declined your invitation to manage 
[LEAGUE_NAME].

You can invite them again later if needed, or invite 
someone else to help manage your league.

[Invite Another Manager]

The [Platform Name] Team
```

---

## Future Enhancements (Not in v1)

- Role-based permissions (Steward, Results Manager, etc.)
- Manager activity logs
- Manager statistics (results entered, competitions created)
- Batch invitations (invite multiple people at once)
- Invitation templates (pre-written messages)
- Manager transfer (transfer admin role to another user)
- Manager request system (users request to be managers)

---

## Related Documentation

- `01-League-Creation.md` - Creating leagues
- `04-Dashboard-Layouts.md` - Dashboard navigation and layout
- `User-Roles-Permissions.md` - Detailed permission matrix