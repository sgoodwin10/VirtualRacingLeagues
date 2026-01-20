# Notifications System - Overview Plan

## Table of Contents
- [Feature Summary](#feature-summary)
- [Architecture Overview](#architecture-overview)
- [Notification Channels](#notification-channels)
- [User-Facing Features](#user-facing-features)
- [Admin Features](#admin-features)
- [Technical Stack](#technical-stack)
- [Implementation Order](#implementation-order)
- [Related Documents](#related-documents)

---

## Feature Summary

Add a comprehensive multi-channel notification system to the application supporting:
- **Email notifications** with customizable templates
- **Discord webhook notifications** to dedicated channels
- **Contact forms** for users to reach administrators
- **Admin dashboard** for viewing notification history

### Key Goals
1. Enable users to contact site administrators easily
2. Notify admins of important events (registrations, contact requests)
3. Send transactional emails (verification, password reset)
4. Track all outgoing notifications for audit purposes

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Register  │  Reset Password  │  Contact Form (App)  │  Contact (Public) │
└─────┬──────┴────────┬─────────┴──────────┬───────────┴────────┬─────┘
      │               │                    │                    │
      ▼               ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LARAVEL APPLICATION                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Application Services (DTOs)                      │   │
│  │   - ContactApplicationService                                 │   │
│  │   - NotificationApplicationService                            │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                           │                                          │
│  ┌────────────────────────▼────────────────────────────────────┐   │
│  │              Domain Events                                    │   │
│  │   - ContactSubmitted                                          │   │
│  │   - UserRegistered (existing: EmailVerificationRequested)     │   │
│  │   - PasswordResetRequested (existing)                         │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                           │                                          │
│  ┌────────────────────────▼────────────────────────────────────┐   │
│  │              Event Listeners                                  │   │
│  │   - SendContactNotification                                   │   │
│  │   - SendRegistrationNotification                              │   │
│  │   - LogNotification (tracks all sent notifications)           │   │
│  └────────────────────────┬────────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION CHANNELS                             │
├──────────────────────────┬──────────────────────────────────────────┤
│         EMAIL            │              DISCORD                      │
│  ┌────────────────────┐  │  ┌────────────────────────────────────┐  │
│  │ Laravel Mail       │  │  │ Discord Webhook Channel             │  │
│  │ - SMTP via Mailpit │  │  │ - Contacts webhook URL              │  │
│  │ - Customizable     │  │  │ - Registrations webhook URL         │  │
│  │   templates        │  │  │ - System alerts webhook URL         │  │
│  └────────────────────┘  │  └────────────────────────────────────┘  │
└──────────────────────────┴──────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION LOG (Database)                       │
│  - notification_type, channel, recipient, subject, body              │
│  - status (sent/failed), sent_at, metadata                          │
│  - Configurable retention (auto-cleanup after X days)                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Notification Channels

### 1. Email Channel (Existing - Enhanced)
- **Driver**: SMTP (Mailpit in development)
- **Templates**: Customizable Blade/Markdown templates
- **Types**:
  - Email verification (existing)
  - Password reset (existing)
  - Contact form submission (new - to admin)
  - Contact form CC (new - to user if logged in)

### 2. Discord Channel (New)
- **Driver**: Webhook-based integration
- **Multiple webhook URLs** for different notification types:
  - `DISCORD_WEBHOOK_CONTACTS` - Contact form submissions
  - `DISCORD_WEBHOOK_REGISTRATIONS` - New user registrations
  - `DISCORD_WEBHOOK_SYSTEM` - System alerts (optional)
- **Configurable in Admin Dashboard** via site_configs table

---

## User-Facing Features

### App Dashboard - Floating Contact Button
- **Location**: Bottom-right corner of all authenticated pages
- **Trigger**: Click to open modal
- **Form Fields**:
  - Reason for contact (dropdown: Error, Question, Help, Other)
  - Contact message (textarea, required)
  - CC myself (checkbox, default: true) - uses logged-in user's email
- **Behavior**:
  - Sends email to admin + optional CC to user
  - Sends Discord notification to contacts channel
  - Shows success/error toast
  - GTM tracking: `contact_form_open`, `contact_form_submit`

### Public Site - Footer Contact Link
- **Location**: Footer "Contact Us" link
- **Trigger**: Click to open modal
- **Form Fields**:
  - Your name (text, required)
  - Your email (email, required)
  - Reason for contact (dropdown: Error, Question, Help, Other)
  - Contact message (textarea, required)
  - *(No CC option - only for logged-in users)*
- **Behavior**:
  - Sends email to admin only
  - Sends Discord notification to contacts channel
  - Shows success/error toast
  - GTM tracking: `contact_form_open`, `contact_form_submit`

### Registration (Enhanced)
- **Current**: Sends verification email
- **New**:
  - BCC admin on registration email
  - Send Discord notification to registrations channel
  - GTM tracking: `user_registered` (may already exist)

### Password Reset (Enhanced)
- **Current**: Sends reset link email
- **New**:
  - Customizable email template
  - GTM tracking: `password_reset_requested`

---

## Admin Features

### Notification History View (`/admin/notifications`)
- **DataTable** showing all sent notifications
- **Columns**: Type, Channel, Recipient, Subject, Status, Sent At
- **Filters**: By type, channel, date range, status
- **Actions**: View details modal (full message content)
- **Retention**: Configurable auto-cleanup (e.g., 30/60/90 days)

### Site Configuration (Discord Webhooks)
- Add to existing Site Config page:
  - Discord webhook URLs (contacts, registrations, system)
  - Notification retention period (days)
  - Enable/disable specific notification channels

---

## Technical Stack

### Backend (Existing - Leveraged)
- **Laravel Notifications** - Already installed
- **Domain Events** - Pattern established
- **Event Listeners** - Pattern established
- **Eloquent Models** - Pattern established

### Backend (New)
- **Discord Notification Channel** - Custom channel class
- **Notification Log Model** - Track sent notifications
- **Contact Domain** - New bounded context

### Frontend (Existing - Leveraged)
- **BaseModal** (App) / **VrlModal** (Public) - Dialog components
- **useToastError** - Toast notifications
- **useGtm** - Google Tag Manager
- **SpeedDial** - Floating action button
- **Form components** - FormInputGroup, validation patterns

### Frontend (New)
- **ContactFloatingButton** (App) - Floating contact trigger
- **ContactModal** (App/Public) - Contact form modals
- **NotificationsView** (Admin) - Notification history
- **useContactForm** - Form validation composable

---

## Implementation Order

### Phase 1: Backend Foundation
1. Create notification_logs database table and model
2. Create Discord notification channel
3. Add Discord webhook configuration to site_configs
4. Create Contact domain (entity, DTO, service)
5. Create notification event listeners

### Phase 2: Contact Forms
1. Backend: Contact API endpoints
2. Frontend (App): Floating button + modal
3. Frontend (Public): Footer link + modal
4. GTM event tracking

### Phase 3: Enhanced System Notifications
1. Update registration flow (BCC admin, Discord)
2. Customize email templates
3. Update password reset templates

### Phase 4: Admin Dashboard
1. Create NotificationsView
2. Add notification history API
3. Add site config for Discord webhooks
4. Implement retention cleanup command

---

## Related Documents

- **[Notifications-Backend-Plan.md](./Notifications-Backend-Plan.md)** - Detailed backend implementation plan
- **[Notifications-Frontend-Plan.md](./Notifications-Frontend-Plan.md)** - Detailed frontend implementation plan

---

## Agents for Implementation

| Phase | Task | Agent |
|-------|------|-------|
| 1 | Backend foundation (Laravel, DDD) | `dev-be` |
| 2 | App dashboard contact form | `dev-fe-app` |
| 2 | Public site contact form | `dev-fe-public` |
| 3 | System notification enhancements | `dev-be` |
| 4 | Admin notification history view | `dev-fe-admin` |
| 4 | Admin API endpoints | `dev-be` |

---

## Configuration Required

### Environment Variables (New)
```env
# Discord Webhooks (can also be stored in site_configs)
DISCORD_WEBHOOK_CONTACTS=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_REGISTRATIONS=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_SYSTEM=https://discord.com/api/webhooks/...

# Notification Settings
NOTIFICATION_RETENTION_DAYS=90
```

### Database Changes
- New table: `notification_logs`
- New columns in `site_configs`: Discord webhook URLs, retention settings
