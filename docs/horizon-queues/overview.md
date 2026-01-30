# Laravel Horizon & Queues Implementation Plan

## Overview

This document outlines the plan to implement Laravel Horizon and a robust queue system for handling all notifications (emails, Discord messages, etc.) asynchronously in the Virtual Racing Leagues application.

## Current State Assessment

### What Already Exists

| Component | Status | Details |
|-----------|--------|---------|
| **Notification Infrastructure** | ✅ Complete | 5 notification classes, custom Discord channel, application service |
| **Events/Listeners** | ✅ Complete | 24+ domain events, 8 listeners registered |
| **Notification Logging** | ✅ Complete | Domain entity, app service, repository, database table |
| **Discord Integration** | ✅ Complete | Webhook support, rich embeds, 3 webhook types |
| **Mail Configuration** | ✅ Complete | SMTP configured, Mailpit for testing |
| **Queue Configuration** | ⚠️ Partial | Database driver configured, Redis available but unused |
| **Database Tables** | ✅ Complete | `jobs`, `job_batches`, `failed_jobs`, `notification_logs` |
| **Docker Services** | ⚠️ Partial | Redis 7 available, no dedicated worker service |
| **Horizon** | ❌ Missing | Not installed |
| **Jobs** | ❌ Missing | No job classes created |
| **Supervisor/Process Management** | ❌ Missing | No process management for production |

### Existing Notification Classes

```
app/Notifications/
├── ContactSubmittedNotification.php   # Email + Discord channels
├── ContactCopyNotification.php        # Email channel
├── EmailVerificationNotification.php  # Email channel
├── PasswordResetNotification.php      # Email channel
└── UserRegisteredNotification.php     # Discord channel
```

All notifications already use the `Queueable` trait but lack explicit queue configuration.

### Existing Listeners That Send Notifications

```
app/Listeners/
├── SendContactNotification.php              # Sends contact emails + Discord
├── SendRegistrationDiscordNotification.php  # Discord on signup
├── SendEmailVerification.php                # Email verification
├── LogUserActivity.php                      # Activity logging
└── ... (other logging listeners)
```

## Implementation Goals

1. **Install and configure Laravel Horizon** for queue monitoring and management
2. **Switch to Redis** as the primary queue driver for better performance
3. **Configure notifications** to run on dedicated queues with proper retry policies
4. **Set up Docker** with dedicated queue worker containers
5. **Implement Supervisor** configuration for production reliability
6. **Add monitoring and alerting** for queue health
7. **Secure the Horizon dashboard** with admin authentication
8. **Create documentation** for operations and troubleshooting

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                            │
│  Controllers → Events → Listeners → Notifications → Queue          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          REDIS QUEUES                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   default   │  │    mail     │  │   discord   │                 │
│  │  (general)  │  │   (email)   │  │  (webhooks) │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HORIZON SUPERVISORS                            │
│  ┌────────────────────────┐  ┌────────────────────────┐            │
│  │  supervisor-default    │  │  supervisor-notifications│           │
│  │  (general jobs)        │  │  (mail + discord)       │           │
│  │  maxProcesses: 3       │  │  maxProcesses: 5        │           │
│  └────────────────────────┘  └────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       HORIZON DASHBOARD                             │
│  admin.virtualracingleagues.localhost/admin/horizon                 │
│  - Job monitoring & metrics                                         │
│  - Failed job management                                            │
│  - Queue throughput visualization                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Queue Strategy

### Queue Names and Purpose

| Queue | Purpose | Priority | Workers |
|-------|---------|----------|---------|
| `default` | General background jobs | Normal | 2-3 |
| `mail` | Email notifications | High | 2-3 |
| `discord` | Discord webhook notifications | Normal | 1-2 |
| `media-conversions` | Media processing (existing) | Low | 1-2 |

### Retry and Timeout Policies

| Queue | Tries | Timeout | Backoff |
|-------|-------|---------|---------|
| `default` | 3 | 60s | Exponential (5, 30, 60s) |
| `mail` | 5 | 120s | Exponential (10, 60, 300s) |
| `discord` | 3 | 30s | Exponential (5, 15, 30s) |

## Implementation Phases

### Phase 1: Foundation (Backend)
1. Install Laravel Horizon
2. Configure Redis as queue driver
3. Set up Horizon configuration
4. Update notification classes with queue settings

### Phase 2: Infrastructure (Docker/DevOps)
1. Add Horizon worker container to Docker
2. Create Supervisor configuration
3. Set up health checks

### Phase 3: Dashboard & Security (Frontend/Admin)
1. Configure Horizon dashboard route
2. Implement admin authentication for dashboard
3. Add Horizon to admin navigation

### Phase 4: Monitoring & Alerting
1. Configure long wait notifications
2. Set up failed job alerts
3. Add scheduled maintenance tasks

## Environment Variables

New variables to add to `.env`:

```env
# Queue Configuration
QUEUE_CONNECTION=redis

# Horizon Configuration
HORIZON_DOMAIN=admin.virtualracingleagues.localhost
HORIZON_PATH=admin/horizon
HORIZON_PREFIX=vrl_horizon:

# Notifications (existing, ensure configured)
NOTIFICATIONS_EMAIL_ENABLED=true
NOTIFICATIONS_DISCORD_ENABLED=true
```

## Security Considerations

1. **Dashboard Access**: Only authenticated admins can access Horizon
2. **Redis Security**: Use password authentication in production
3. **Job Encryption**: Sensitive notification data encrypted in queue
4. **Network Isolation**: Redis only accessible from application containers

## Success Criteria

- [ ] All notifications are processed asynchronously (no blocking HTTP requests)
- [ ] Horizon dashboard accessible to admins at `/admin/horizon`
- [ ] Failed jobs are tracked and can be retried from dashboard
- [ ] Queue workers auto-recover from crashes
- [ ] Long queue wait times trigger alerts
- [ ] Development environment matches production architecture

## Related Documentation

- [Backend Implementation Plan](./backend-plan.md)
- [Frontend Implementation Plan](./frontend-plan.md)
- [Laravel Horizon Docs](https://laravel.com/docs/horizon)
- [Laravel Queues Docs](https://laravel.com/docs/queues)
