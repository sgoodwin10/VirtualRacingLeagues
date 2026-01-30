# Laravel Pulse & Sentry.io Integration - Overview

## Executive Summary

This document provides a comprehensive overview of integrating Laravel Pulse and Sentry.io into our Laravel 12 + Vue 3 multi-application codebase. These two complementary monitoring solutions will provide complete visibility into application performance, errors, and user experience across all three SPAs (public site, user dashboard, admin dashboard).

## Table of Contents

1. [What is Laravel Pulse?](#what-is-laravel-pulse)
2. [What is Sentry.io?](#what-is-sentryio)
3. [Why Both? Complementary Strengths](#why-both-complementary-strengths)
4. [Architecture Overview](#architecture-overview)
5. [Prerequisites and Requirements](#prerequisites-and-requirements)
6. [Implementation Roadmap](#implementation-roadmap)

---

## What is Laravel Pulse?

**Laravel Pulse** is a real-time application performance monitoring tool designed specifically for Laravel applications. It provides an elegant, first-party dashboard for monitoring your application's vital signs.

### Key Capabilities

#### 1. Server Metrics
- **Requests**: Track HTTP requests, response times, slow requests
- **Exceptions**: Monitor exception rates and types
- **Slow Queries**: Identify database queries exceeding performance thresholds
- **Cache**: Monitor cache hit/miss rates and performance
- **Queues**: Track queue job processing times and failure rates

#### 2. Usage Tracking
- **User Requests**: See which users are making the most requests
- **Slow User Requests**: Identify specific users experiencing performance issues
- **User Jobs**: Monitor queue jobs by user

#### 3. Application Health
- **Slow Outgoing Requests**: Track external API calls and their performance
- **Slow Jobs**: Identify long-running queue jobs
- **Failed Jobs**: Monitor job failures and retry patterns

### Dashboard Features

- **Real-time updates**: Live metrics without page refresh
- **Time-series data**: View trends over time (1 hour, 24 hours, 7 days)
- **Built-in UI**: Beautiful, pre-built dashboard at `/pulse` route
- **Customizable recorders**: Add custom metrics specific to your domain
- **Minimal performance impact**: Asynchronous recording with negligible overhead

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Laravel Application                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Requests    │  │  Jobs        │  │  Exceptions  │     │
│  │  Recorder    │  │  Recorder    │  │  Recorder    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                  ┌─────────▼─────────┐                      │
│                  │  Pulse Ingestion  │                      │
│                  │  (After Response) │                      │
│                  └─────────┬─────────┘                      │
│                            │                                │
│                  ┌─────────▼─────────┐                      │
│                  │  Pulse Database   │                      │
│                  │  (pulse_* tables) │                      │
│                  └─────────┬─────────┘                      │
│                            │                                │
│                  ┌─────────▼─────────┐                      │
│                  │  Pulse Dashboard  │                      │
│                  │  (/pulse route)   │                      │
│                  └───────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. Recorders capture application events (requests, queries, exceptions, jobs)
2. Data is stored in memory during request execution
3. After HTTP response is sent, Pulse asynchronously writes to database
4. Dashboard queries aggregated metrics from Pulse tables
5. Real-time updates via polling or broadcasting (optional)

---

## What is Sentry.io?

**Sentry.io** is a comprehensive error tracking and performance monitoring platform that aggregates, alerts, and helps debug issues across your entire application stack - backend (PHP/Laravel) and frontend (JavaScript/Vue).

### Key Capabilities

#### 1. Error Tracking
- **Exception Capture**: Automatic capture of unhandled exceptions and errors
- **Stack Traces**: Full stack traces with source code context
- **Breadcrumbs**: User actions and events leading up to an error
- **User Context**: Associate errors with specific users and their environment
- **Error Grouping**: Intelligent grouping of similar errors
- **Release Tracking**: Track errors by deployment version
- **Fingerprinting**: Custom error grouping logic

#### 2. Performance Monitoring
- **Transaction Tracing**: End-to-end distributed tracing across services
- **Database Query Performance**: Track slow queries with query details
- **HTTP Request Performance**: Monitor endpoint response times
- **External API Monitoring**: Track outgoing HTTP requests
- **Frontend Performance**: Track page loads, route changes, component renders
- **Custom Instrumentation**: Add custom spans for domain-specific operations

#### 3. Alerting & Notifications
- **Real-time Alerts**: Instant notifications via email, Slack, Discord, PagerDuty
- **Alert Rules**: Configure alert thresholds and conditions
- **Issue Assignment**: Assign issues to team members
- **Integration Ecosystem**: Jira, GitHub, GitLab, and 100+ integrations

#### 4. Release Management
- **Deploy Tracking**: Track which deployment introduced an error
- **Source Maps**: Unminify frontend errors (critical for production Vue apps)
- **Commit Tracking**: Link errors to specific commits
- **Regression Detection**: Identify when errors resurface

#### 5. Session Replay (Optional Add-on)
- **Visual Debugging**: Watch user sessions that encountered errors
- **Interaction Replay**: See exactly what the user did before an error
- **Privacy Controls**: Mask sensitive data automatically

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  Browser (Vue 3 SPAs)                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Public SPA  │  │  App SPA     │  │  Admin SPA   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │ @sentry/vue      │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│                   ┌────────▼────────┐                         │
│                   │  Sentry Browser │                         │
│                   │  SDK (JS)       │                         │
│                   └────────┬────────┘                         │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             │ HTTPS (POST)
                             │
┌────────────────────────────▼──────────────────────────────────┐
│  Sentry.io Cloud (or Self-Hosted)                             │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Ingestion & Processing                              │     │
│  │  - Error aggregation                                 │     │
│  │  - Performance trace assembly                        │     │
│  │  - Source map processing                             │     │
│  │  - Alert evaluation                                  │     │
│  └──────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Sentry Dashboard                                    │     │
│  │  - Issue management                                  │     │
│  │  - Performance insights                              │     │
│  │  - Release tracking                                  │     │
│  │  - Team collaboration                                │     │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
                             │
                             │ Webhooks / Notifications
                             │
┌────────────────────────────▼──────────────────────────────────┐
│  Laravel Application (PHP)                                    │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Sentry Laravel SDK                                  │     │
│  │  - Exception handler integration                     │     │
│  │  - Performance tracing                               │     │
│  │  - Breadcrumb capture                                │     │
│  │  - Context enrichment                                │     │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

---

## Why Both? Complementary Strengths

Laravel Pulse and Sentry.io serve different but complementary purposes. Here's why you should implement both:

### Laravel Pulse Strengths

| Feature | Description |
|---------|-------------|
| **Internal, Self-Hosted Monitoring** | All data stays within your infrastructure, no external dependencies, no per-event pricing |
| **Laravel-Native Integration** | Built specifically for Laravel patterns and conventions, zero configuration for basic monitoring |
| **Real-Time Operational Dashboard** | Immediate visibility into current application state, perfect for "what's happening right now?" |
| **Cost-Effective for High Volume** | No per-event billing, ideal for high-traffic applications |

### Sentry.io Strengths

| Feature | Description |
|---------|-------------|
| **Comprehensive Error Aggregation** | Intelligent error grouping, rich context with stack traces and breadcrumbs |
| **Alerting & Team Collaboration** | Real-time alerts via Slack/Discord/email, issue assignment and workflow management |
| **Frontend Error Tracking** | Full JavaScript error tracking in Vue SPAs with source map support |
| **Distributed Tracing** | Trace requests across frontend → backend → external services |
| **Production-Ready Features** | Source maps, privacy controls, session replay (optional) |

### Decision Matrix

| Use Case | Use Pulse | Use Sentry | Use Both |
|----------|-----------|------------|----------|
| Real-time operational monitoring | ✅ | | |
| Historical error analysis | | ✅ | |
| Team alerting and workflows | | ✅ | |
| Frontend JavaScript errors | | ✅ | |
| Laravel queue monitoring | ✅ | | |
| Production debugging with source maps | | ✅ | |
| Database query performance | | | ✅ |
| HTTP request performance | | | ✅ |
| User-specific error tracking | | ✅ | |
| Cost-effective high-volume monitoring | ✅ | | |
| Integration with issue trackers | | ✅ | |

### Recommended Strategy

**Pulse for:**
- Internal team operational dashboards
- High-volume metrics (every request, every query)
- Real-time "is the app healthy?" monitoring
- Laravel-specific insights (queues, cache, eloquent)

**Sentry for:**
- Error tracking and alerting
- Production debugging with full context
- Frontend (Vue) error monitoring
- Team collaboration and issue management
- Release tracking and regression detection
- Integration with external tools (Slack, Jira, GitHub)

---

## Architecture Overview

### Complete System Data Flow

```
┌───────────────────────────────────────────────────────────────────┐
│  User Browser                                                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Public SPA   │  │ App SPA      │  │ Admin SPA    │            │
│  │ (Sentry Vue) │  │ (Sentry Vue) │  │ (Sentry Vue) │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         └──────────────────┼──────────────────┘                   │
│                            │ Errors, Performance Traces           │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             │ HTTPS POST
                             │
                    ┌────────▼────────┐
                    │  Sentry.io      │
                    │  Cloud/SaaS     │
                    │                 │
                    │ - Error Mgmt    │
                    │ - Alerting      │
                    │ - Release Track │
                    └─────────────────┘
                             │
                             │ Webhooks, Alerts
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│  Laravel 12 Backend (Docker Container)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Sentry Laravel SDK (PHP)                                   │  │
│  │  - Exception Handler                                        │  │
│  │  - Performance Tracing                                      │  │
│  │  - Breadcrumbs                                              │  │
│  │  - User Context                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            │ Logs to Sentry                       │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────────┐  │
│  │  Laravel Pulse                                              │  │
│  │  ┌───────────────────────────────────────────────────────┐  │  │
│  │  │  Recorders                                            │  │  │
│  │  │  - Requests Recorder                                  │  │  │
│  │  │  - Exceptions Recorder (logs to Pulse DB)             │  │  │
│  │  │  - Queries Recorder                                   │  │  │
│  │  │  - Jobs Recorder                                      │  │  │
│  │  │  - Cache Recorder                                     │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  │                            │                                │  │
│  │                            │ After Response                 │  │
│  │                            │                                │  │
│  │  ┌─────────────────────────▼────────────────────────────┐   │  │
│  │  │  Pulse Database (MariaDB)                            │   │  │
│  │  │  - pulse_aggregates                                  │   │  │
│  │  │  - pulse_entries                                     │   │  │
│  │  │  - pulse_values                                      │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                            │                                │  │
│  │  ┌─────────────────────────▼────────────────────────────┐   │  │
│  │  │  Pulse Dashboard (/pulse)                            │   │  │
│  │  │  - Admin-only access (via middleware)                │   │  │
│  │  │  - Real-time metrics                                 │   │  │
│  │  │  - Time-series charts                                │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  MariaDB                                                     │ │
│  │  - Application tables                                        │ │
│  │  - Pulse tables (pulse_*)                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Redis (Optional for Pulse)                                  │ │
│  │  - Pulse Redis Ingest (for high volume)                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites and Requirements

### Technical Requirements

| Component | Requirement | Current Status |
|-----------|-------------|----------------|
| Laravel | 10.x, 11.x, or 12.x | ✅ Laravel 12 |
| PHP | ^8.1 | ✅ PHP 8.2+ |
| Database | MySQL 8.0.2+, MariaDB 10.3.2+, PostgreSQL 10+ | ✅ MariaDB 10.11 |
| Redis | Optional for high-volume Pulse ingest | ✅ Redis 7 |
| Node.js | 18+ | ✅ Node.js 22.x |
| Vue | 3.x | ✅ Vue 3 |
| Vite | 4+ | ✅ Vite 7 |

### Sentry.io Account Setup

#### 1. Create Sentry Account
- Sign up at [sentry.io](https://sentry.io)
- Free tier includes:
  - 5,000 errors per month
  - 10,000 performance units per month
  - 30-day data retention
  - Unlimited team members

#### 2. Create Projects

**Option A: Single Project (Simpler)**
- One project: "VirtualRacingLeagues"
- Backend and frontend errors in same project
- Filter by `platform` tag (php vs javascript)

**Option B: Multiple Projects (Recommended)**
- Project 1: "VRL-Backend" (Laravel/PHP)
- Project 2: "VRL-Frontend-Public" (Public SPA)
- Project 3: "VRL-Frontend-App" (App Dashboard)
- Project 4: "VRL-Frontend-Admin" (Admin Dashboard)

**Recommendation:** Start with **Option A** (single project), migrate to **Option B** later if needed.

#### 3. Obtain DSNs
- Format: `https://<public_key>@o<org_id>.ingest.sentry.io/<project_id>`
- Find in: Project Settings → Client Keys (DSN)
- Keep DSNs secret (don't commit to git)

#### 4. Generate Auth Token (for source maps)
1. User Settings → Auth Tokens
2. Create token with scopes: `project:releases`, `project:write`, `org:read`
3. Save token securely

### Environment Configuration

Add to `.env`:

```bash
# Sentry Configuration
SENTRY_LARAVEL_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Sentry Frontend (if using separate projects)
VITE_SENTRY_DSN_PUBLIC=https://examplePublicKey@o0.ingest.sentry.io/1
VITE_SENTRY_DSN_APP=https://examplePublicKey@o0.ingest.sentry.io/2
VITE_SENTRY_DSN_ADMIN=https://examplePublicKey@o0.ingest.sentry.io/3

# Sentry Release Tracking
VITE_SENTRY_ORG=your-org-slug
VITE_SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your_auth_token_here

# Laravel Pulse Configuration
PULSE_ENABLED=true
PULSE_INGEST_DRIVER=database
```

---

## Implementation Roadmap

### Phase 1: Backend Implementation (1-2 days)

**Tasks:**
1. Install and configure Laravel Pulse
2. Install and configure Sentry Laravel SDK

**Deliverables:**
- Pulse dashboard accessible at `/pulse` (admin-only)
- Sentry capturing Laravel exceptions and performance
- Environment variables configured

### Phase 2: Frontend Implementation (2-3 days)

**Tasks:**
1. Install Sentry Vue SDK in all three SPAs
2. Configure source map uploads
3. Add user context integration

**Deliverables:**
- Sentry integrated in Public, App, and Admin SPAs
- Source maps uploaded and working
- User context attached to errors

### Phase 3: Testing & Validation (1 day)

**Tasks:**
1. Create test scenarios for all error types
2. Verify Pulse dashboard accuracy
3. Verify Sentry error grouping and context
4. Test alert notifications

### Phase 4: Team Onboarding & Documentation (1 day)

**Tasks:**
1. Create internal documentation
2. Team training session
3. Configure alert rules and workflows

### Phase 5: Production Deployment (1 day)

**Tasks:**
1. Deploy backend changes
2. Deploy frontend changes with source maps
3. Verify all monitoring active

**Total Estimated Time: 6-8 days**

---

## Success Metrics

### Pulse Metrics
- Dashboard accessible and loading < 2 seconds
- Real-time updates functioning
- All recorders capturing data
- No performance degradation (< 5ms overhead per request)

### Sentry Metrics
- Error capture rate: > 95% of errors reported
- Source maps working: production errors unminified
- Alert response time: < 5 minutes from error to notification
- Team engagement: All team members using Sentry

### Business Metrics
- Mean time to detection (MTTD): < 5 minutes
- Mean time to resolution (MTTR): reduced by 50%
- Proactive error detection: catch errors before user reports
- Release confidence: detect regressions within 1 hour

---

## Next Steps

1. Review this overview document
2. Read [backend-plan.md](./backend-plan.md) for detailed backend implementation
3. Read [frontend-plan.md](./frontend-plan.md) for detailed frontend implementation
4. Obtain Sentry account and create projects
5. Begin Phase 1: Backend Implementation

---

## Resources

### Official Documentation
- [Laravel Pulse - Laravel 12.x](https://laravel.com/docs/12.x/pulse)
- [Sentry Laravel Integration](https://docs.sentry.io/platforms/php/guides/laravel/)
- [Sentry Vue Integration](https://docs.sentry.io/platforms/javascript/guides/vue/)

### Package Repositories
- [Laravel Pulse GitHub](https://github.com/laravel/pulse)
- [Sentry Laravel GitHub](https://github.com/getsentry/sentry-laravel)
- [Sentry JavaScript GitHub](https://github.com/getsentry/sentry-javascript)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** Ready for Implementation
