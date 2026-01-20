# Notifications System - Backend Plan

## Table of Contents
- [Overview](#overview)
- [Database Schema](#database-schema)
- [Domain Layer](#domain-layer)
- [Application Layer](#application-layer)
- [Infrastructure Layer](#infrastructure-layer)
- [Interface Layer (API)](#interface-layer-api)
- [Event Listeners](#event-listeners)
- [Configuration](#configuration)
- [Testing Strategy](#testing-strategy)
- [Implementation Checklist](#implementation-checklist)

---

## Overview

This document details the Laravel backend implementation for the notifications system, following the established DDD architecture patterns.

**Key Backend Components:**
1. Notification logging system
2. Discord webhook channel
3. Contact form domain
4. Enhanced registration/password reset notifications
5. Admin API for notification history

---

## Database Schema

### New Table: `notification_logs`

```php
Schema::create('notification_logs', function (Blueprint $table) {
    $table->id();
    $table->string('notification_type', 50);     // contact, registration, password_reset, etc.
    $table->string('channel', 20);               // email, discord
    $table->string('recipient')->nullable();     // email address or discord channel
    $table->string('subject')->nullable();       // email subject
    $table->text('body')->nullable();            // message content
    $table->json('metadata')->nullable();        // additional data (user_id, form data, etc.)
    $table->string('status', 20)->default('pending'); // pending, sent, failed
    $table->text('error_message')->nullable();   // error details if failed
    $table->timestamp('sent_at')->nullable();
    $table->timestamps();

    // Indexes for common queries
    $table->index('notification_type');
    $table->index('channel');
    $table->index('status');
    $table->index('created_at');
});
```

### New Table: `contacts` (for contact form submissions)

```php
Schema::create('contacts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('name');
    $table->string('email');
    $table->string('reason', 50);                // error, question, help, other
    $table->text('message');
    $table->string('source', 20);                // app, public
    $table->boolean('cc_user')->default(false);
    $table->string('status', 20)->default('new'); // new, read, responded, archived
    $table->json('metadata')->nullable();        // IP, user agent, etc.
    $table->timestamps();

    $table->index('status');
    $table->index('created_at');
});
```

### Updates to `site_configs` table

Add new config keys for Discord webhooks and notification settings:
- `discord_webhook_contacts` - Webhook URL for contact notifications
- `discord_webhook_registrations` - Webhook URL for registration notifications
- `discord_webhook_system` - Webhook URL for system alerts
- `notification_retention_days` - Days to keep notification logs (default: 90)
- `notifications_email_enabled` - Enable/disable email channel
- `notifications_discord_enabled` - Enable/disable Discord channel

---

## Domain Layer

### Contact Bounded Context

#### Entity: `Contact`

**Location**: `app/Domain/Contact/Entities/Contact.php`

```php
namespace App\Domain\Contact\Entities;

class Contact
{
    private ?int $id;
    private ?int $userId;
    private string $name;
    private EmailAddress $email;
    private ContactReason $reason;
    private string $message;
    private ContactSource $source;
    private bool $ccUser;
    private ContactStatus $status;
    private array $metadata;
    private ?DateTimeImmutable $createdAt;
    private array $domainEvents = [];

    public static function create(
        string $name,
        EmailAddress $email,
        ContactReason $reason,
        string $message,
        ContactSource $source,
        bool $ccUser = false,
        ?int $userId = null,
        array $metadata = []
    ): self {
        $contact = new self();
        $contact->name = $name;
        $contact->email = $email;
        $contact->reason = $reason;
        $contact->message = $message;
        $contact->source = $source;
        $contact->ccUser = $ccUser;
        $contact->userId = $userId;
        $contact->status = ContactStatus::New;
        $contact->metadata = $metadata;
        $contact->createdAt = new DateTimeImmutable();

        $contact->recordEvent(new ContactSubmitted($contact));

        return $contact;
    }

    public function markAsRead(): void { /* ... */ }
    public function markAsResponded(): void { /* ... */ }
    public function archive(): void { /* ... */ }
}
```

#### Value Objects

**Location**: `app/Domain/Contact/ValueObjects/`

1. **ContactReason.php** (Enum)
```php
enum ContactReason: string
{
    case Error = 'error';
    case Question = 'question';
    case Help = 'help';
    case Other = 'other';

    public function label(): string
    {
        return match($this) {
            self::Error => 'I found an error',
            self::Question => 'I have a question',
            self::Help => 'I need help',
            self::Other => 'Other',
        };
    }
}
```

2. **ContactSource.php** (Enum)
```php
enum ContactSource: string
{
    case App = 'app';
    case Public = 'public';
}
```

3. **ContactStatus.php** (Enum)
```php
enum ContactStatus: string
{
    case New = 'new';
    case Read = 'read';
    case Responded = 'responded';
    case Archived = 'archived';
}
```

#### Domain Events

**Location**: `app/Domain/Contact/Events/`

1. **ContactSubmitted.php**
```php
class ContactSubmitted
{
    public function __construct(
        public readonly Contact $contact
    ) {}
}
```

#### Repository Interface

**Location**: `app/Domain/Contact/Repositories/ContactRepositoryInterface.php`

```php
interface ContactRepositoryInterface
{
    public function save(Contact $contact): Contact;
    public function findById(int $id): ?Contact;
    public function findAll(array $filters = [], int $page = 1, int $perPage = 20): array;
    public function countByStatus(ContactStatus $status): int;
}
```

---

### Notification Bounded Context

#### Entity: `NotificationLog`

**Location**: `app/Domain/Notification/Entities/NotificationLog.php`

```php
class NotificationLog
{
    private ?int $id;
    private NotificationType $type;
    private NotificationChannel $channel;
    private ?string $recipient;
    private ?string $subject;
    private ?string $body;
    private array $metadata;
    private NotificationStatus $status;
    private ?string $errorMessage;
    private ?DateTimeImmutable $sentAt;

    public static function create(
        NotificationType $type,
        NotificationChannel $channel,
        ?string $recipient,
        ?string $subject,
        ?string $body,
        array $metadata = []
    ): self { /* ... */ }

    public function markAsSent(): void { /* ... */ }
    public function markAsFailed(string $errorMessage): void { /* ... */ }
}
```

#### Value Objects

**Location**: `app/Domain/Notification/ValueObjects/`

1. **NotificationType.php** (Enum)
```php
enum NotificationType: string
{
    case Contact = 'contact';
    case Registration = 'registration';
    case EmailVerification = 'email_verification';
    case PasswordReset = 'password_reset';
    case System = 'system';
}
```

2. **NotificationChannel.php** (Enum)
```php
enum NotificationChannel: string
{
    case Email = 'email';
    case Discord = 'discord';
}
```

3. **NotificationStatus.php** (Enum)
```php
enum NotificationStatus: string
{
    case Pending = 'pending';
    case Sent = 'sent';
    case Failed = 'failed';
}
```

---

## Application Layer

### Contact Application Service

**Location**: `app/Application/Contact/Services/ContactApplicationService.php`

```php
namespace App\Application\Contact\Services;

class ContactApplicationService
{
    public function __construct(
        private ContactRepositoryInterface $contactRepository,
        private EventDispatcherInterface $eventDispatcher
    ) {}

    public function submitContact(CreateContactData $data): ContactData
    {
        $contact = Contact::create(
            name: $data->name,
            email: new EmailAddress($data->email),
            reason: ContactReason::from($data->reason),
            message: $data->message,
            source: ContactSource::from($data->source),
            ccUser: $data->ccUser,
            userId: $data->userId,
            metadata: $data->metadata
        );

        $savedContact = $this->contactRepository->save($contact);

        // Dispatch domain events (triggers notifications)
        $this->eventDispatcher->dispatch($contact->pullDomainEvents());

        return ContactData::fromEntity($savedContact);
    }

    public function getContacts(array $filters, int $page, int $perPage): PaginatedResult
    {
        return $this->contactRepository->findAll($filters, $page, $perPage);
    }

    public function markAsRead(int $id): ContactData { /* ... */ }
    public function markAsResponded(int $id): ContactData { /* ... */ }
    public function archive(int $id): void { /* ... */ }
}
```

### DTOs

**Location**: `app/Application/Contact/DTOs/`

1. **CreateContactData.php**
```php
use Spatie\LaravelData\Data;

class CreateContactData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public string $reason,
        public string $message,
        public string $source,
        public bool $ccUser = false,
        public ?int $userId = null,
        public array $metadata = []
    ) {}
}
```

2. **ContactData.php**
```php
class ContactData extends Data
{
    public function __construct(
        public int $id,
        public ?int $userId,
        public string $name,
        public string $email,
        public string $reason,
        public string $reasonLabel,
        public string $message,
        public string $source,
        public bool $ccUser,
        public string $status,
        public array $metadata,
        public string $createdAt
    ) {}

    public static function fromEntity(Contact $contact): self { /* ... */ }
}
```

### Notification Application Service

**Location**: `app/Application/Notification/Services/NotificationApplicationService.php`

```php
class NotificationApplicationService
{
    public function getNotificationLogs(array $filters, int $page, int $perPage): PaginatedResult
    {
        return $this->notificationLogRepository->findAll($filters, $page, $perPage);
    }

    public function getNotificationById(int $id): ?NotificationLogData { /* ... */ }

    public function cleanupOldNotifications(int $daysToKeep): int
    {
        return $this->notificationLogRepository->deleteOlderThan(
            now()->subDays($daysToKeep)
        );
    }
}
```

---

## Infrastructure Layer

### Discord Notification Channel

**Location**: `app/Infrastructure/Notifications/Channels/DiscordChannel.php`

```php
namespace App\Infrastructure\Notifications\Channels;

use Illuminate\Support\Facades\Http;
use Illuminate\Notifications\Notification;

class DiscordChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $message = $notification->toDiscord($notifiable);

        if (!$message || !$message->webhookUrl) {
            return;
        }

        $response = Http::post($message->webhookUrl, [
            'content' => $message->content,
            'embeds' => $message->embeds,
            'username' => $message->username ?? config('app.name'),
            'avatar_url' => $message->avatarUrl,
        ]);

        if ($response->failed()) {
            throw new DiscordNotificationException(
                "Discord webhook failed: " . $response->body()
            );
        }
    }
}
```

### Discord Message Builder

**Location**: `app/Infrastructure/Notifications/Messages/DiscordMessage.php`

```php
class DiscordMessage
{
    public ?string $webhookUrl = null;
    public ?string $content = null;
    public array $embeds = [];
    public ?string $username = null;
    public ?string $avatarUrl = null;

    public function webhookUrl(string $url): self
    {
        $this->webhookUrl = $url;
        return $this;
    }

    public function content(string $content): self
    {
        $this->content = $content;
        return $this;
    }

    public function embed(array $embed): self
    {
        $this->embeds[] = $embed;
        return $this;
    }

    public function title(string $title): self { /* convenience method */ }
    public function description(string $description): self { /* convenience method */ }
    public function color(int $color): self { /* convenience method */ }
    public function field(string $name, string $value, bool $inline = false): self { /* ... */ }
}
```

### Notification Classes

**Location**: `app/Notifications/`

1. **ContactSubmittedNotification.php**
```php
class ContactSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private Contact $contact
    ) {}

    public function via(object $notifiable): array
    {
        $channels = [];

        if (config('notifications.email_enabled', true)) {
            $channels[] = 'mail';
        }

        if (config('notifications.discord_enabled', true)) {
            $channels[] = DiscordChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("New Contact: {$this->contact->getReason()->label()}")
            ->greeting("New contact form submission")
            ->line("**From:** {$this->contact->getName()} ({$this->contact->getEmail()})")
            ->line("**Reason:** {$this->contact->getReason()->label()}")
            ->line("**Message:**")
            ->line($this->contact->getMessage())
            ->line("**Source:** {$this->contact->getSource()->value} dashboard");
    }

    public function toDiscord(object $notifiable): DiscordMessage
    {
        $webhookUrl = SiteConfig::get('discord_webhook_contacts');

        if (!$webhookUrl) {
            return new DiscordMessage(); // Empty, won't send
        }

        return (new DiscordMessage())
            ->webhookUrl($webhookUrl)
            ->embed([
                'title' => "New Contact: {$this->contact->getReason()->label()}",
                'color' => 0x3498db, // Blue
                'fields' => [
                    ['name' => 'From', 'value' => $this->contact->getName(), 'inline' => true],
                    ['name' => 'Email', 'value' => $this->contact->getEmail()->toString(), 'inline' => true],
                    ['name' => 'Source', 'value' => ucfirst($this->contact->getSource()->value), 'inline' => true],
                    ['name' => 'Message', 'value' => substr($this->contact->getMessage(), 0, 1000)],
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
    }
}
```

2. **ContactCopyNotification.php** (CC to user)
```php
class ContactCopyNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return ['mail']; // Email only for user CC
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("Copy of your message to " . config('app.name'))
            ->greeting("Hello {$this->contact->getName()},")
            ->line("This is a copy of the message you sent to us:")
            ->line("---")
            ->line("**Reason:** {$this->contact->getReason()->label()}")
            ->line("**Message:**")
            ->line($this->contact->getMessage())
            ->line("---")
            ->line("We'll get back to you as soon as possible.");
    }
}
```

3. **UserRegisteredNotification.php** (Enhanced)
```php
class UserRegisteredNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return [DiscordChannel::class]; // Discord only for admin notification
    }

    public function toDiscord(object $notifiable): DiscordMessage
    {
        $webhookUrl = SiteConfig::get('discord_webhook_registrations');

        return (new DiscordMessage())
            ->webhookUrl($webhookUrl)
            ->embed([
                'title' => 'New User Registration',
                'color' => 0x2ecc71, // Green
                'fields' => [
                    ['name' => 'Name', 'value' => $this->user->getFullName(), 'inline' => true],
                    ['name' => 'Email', 'value' => $this->user->getEmail(), 'inline' => true],
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
    }
}
```

### Eloquent Models

**Location**: `app/Infrastructure/Persistence/Eloquent/Models/`

1. **ContactEloquent.php**
2. **NotificationLogEloquent.php**

### Repository Implementations

**Location**: `app/Infrastructure/Persistence/Eloquent/Repositories/`

1. **EloquentContactRepository.php**
2. **EloquentNotificationLogRepository.php**

---

## Interface Layer (API)

### Controllers

**Location**: `app/Http/Controllers/`

1. **ContactController.php** (Public/App API)
```php
namespace App\Http\Controllers;

class ContactController extends Controller
{
    public function __construct(
        private ContactApplicationService $contactService
    ) {}

    public function store(StoreContactRequest $request): JsonResponse
    {
        try {
            $data = CreateContactData::from([
                ...$request->validated(),
                'source' => $request->input('source', 'public'),
                'userId' => auth()->id(),
                'metadata' => [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
            ]);

            $contact = $this->contactService->submitContact($data);

            return ApiResponse::created($contact->toArray(), 'Message sent successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to send message', null, 500);
        }
    }
}
```

2. **Admin/ContactController.php** (Admin API)
```php
namespace App\Http\Controllers\Admin;

class ContactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $result = $this->contactService->getContacts(
            filters: $request->only(['status', 'source', 'search']),
            page: $request->input('page', 1),
            perPage: $request->input('per_page', 20)
        );

        return ApiResponse::success($result);
    }

    public function show(int $id): JsonResponse { /* ... */ }
    public function markRead(int $id): JsonResponse { /* ... */ }
    public function markResponded(int $id): JsonResponse { /* ... */ }
    public function archive(int $id): JsonResponse { /* ... */ }
}
```

3. **Admin/NotificationLogController.php** (Admin API)
```php
namespace App\Http\Controllers\Admin;

class NotificationLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $result = $this->notificationService->getNotificationLogs(
            filters: $request->only(['type', 'channel', 'status', 'date_from', 'date_to']),
            page: $request->input('page', 1),
            perPage: $request->input('per_page', 20)
        );

        return ApiResponse::success($result);
    }

    public function show(int $id): JsonResponse { /* ... */ }
}
```

### Form Requests

**Location**: `app/Http/Requests/`

1. **StoreContactRequest.php**
```php
class StoreContactRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'reason' => ['required', 'string', 'in:error,question,help,other'],
            'message' => ['required', 'string', 'max:2000'],
            'cc_user' => ['boolean'],
            'source' => ['sometimes', 'string', 'in:app,public'],
        ];
    }
}
```

### Routes

**Location**: `routes/subdomain.php`

```php
// Public Site API
Route::domain('{domain}.localhost')->group(function () {
    Route::prefix('api')->group(function () {
        // Existing routes...

        // Contact form (public - no auth required)
        Route::post('/contact', [ContactController::class, 'store']);
    });
});

// App Dashboard API
Route::domain('app.{domain}.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // Existing routes...

        // Contact form (authenticated)
        Route::post('/contact', [ContactController::class, 'store']);
    });
});

// Admin Dashboard API
Route::domain('admin.{domain}.localhost')->group(function () {
    Route::prefix('admin/api')->middleware(['auth:admin', 'admin.authenticate'])->group(function () {
        // Existing routes...

        // Contact management
        Route::get('/contacts', [Admin\ContactController::class, 'index']);
        Route::get('/contacts/{id}', [Admin\ContactController::class, 'show']);
        Route::patch('/contacts/{id}/read', [Admin\ContactController::class, 'markRead']);
        Route::patch('/contacts/{id}/responded', [Admin\ContactController::class, 'markResponded']);
        Route::patch('/contacts/{id}/archive', [Admin\ContactController::class, 'archive']);

        // Notification logs
        Route::get('/notifications', [Admin\NotificationLogController::class, 'index']);
        Route::get('/notifications/{id}', [Admin\NotificationLogController::class, 'show']);
    });
});
```

---

## Event Listeners

**Location**: `app/Infrastructure/Listeners/`

### SendContactNotification.php
```php
class SendContactNotification
{
    public function handle(ContactSubmitted $event): void
    {
        $contact = $event->contact;

        // Send to admin
        Notification::route('mail', config('mail.admin_email'))
            ->notify(new ContactSubmittedNotification($contact));

        // CC to user if requested and logged in
        if ($contact->shouldCcUser() && $contact->getUserId()) {
            $user = User::find($contact->getUserId());
            $user?->notify(new ContactCopyNotification($contact));
        }

        // Log the notification
        NotificationLog::create(...);
    }
}
```

### SendRegistrationDiscordNotification.php
```php
class SendRegistrationDiscordNotification
{
    public function handle(EmailVerificationRequested $event): void
    {
        // Send Discord notification about new registration
        Notification::route(DiscordChannel::class, null)
            ->notify(new UserRegisteredNotification($event->user));
    }
}
```

### EventServiceProvider Updates

```php
protected $listen = [
    // Existing...

    ContactSubmitted::class => [
        SendContactNotification::class,
        LogUserActivity::class,
    ],

    EmailVerificationRequested::class => [
        SendEmailVerification::class,  // Existing
        SendRegistrationDiscordNotification::class, // New
        LogUserActivity::class,  // Existing
    ],
];
```

---

## Configuration

### config/notifications.php (New)
```php
return [
    'email_enabled' => env('NOTIFICATIONS_EMAIL_ENABLED', true),
    'discord_enabled' => env('NOTIFICATIONS_DISCORD_ENABLED', true),

    'discord' => [
        'contacts_webhook' => env('DISCORD_WEBHOOK_CONTACTS'),
        'registrations_webhook' => env('DISCORD_WEBHOOK_REGISTRATIONS'),
        'system_webhook' => env('DISCORD_WEBHOOK_SYSTEM'),
    ],

    'retention' => [
        'days' => env('NOTIFICATION_RETENTION_DAYS', 90),
    ],

    'admin_email' => env('ADMIN_EMAIL', 'admin@example.com'),
];
```

### Artisan Command: Cleanup Old Notifications

**Location**: `app/Console/Commands/CleanupNotificationLogs.php`

```php
class CleanupNotificationLogs extends Command
{
    protected $signature = 'notifications:cleanup {--days= : Days to keep}';
    protected $description = 'Delete old notification logs based on retention policy';

    public function handle(NotificationApplicationService $service): int
    {
        $days = $this->option('days') ?? config('notifications.retention.days', 90);
        $deleted = $service->cleanupOldNotifications($days);

        $this->info("Deleted {$deleted} notification logs older than {$days} days.");

        return self::SUCCESS;
    }
}
```

Schedule in `app/Console/Kernel.php`:
```php
$schedule->command('notifications:cleanup')->daily();
```

---

## Testing Strategy

### Unit Tests (Domain Layer)
- `tests/Unit/Domain/Contact/Entities/ContactTest.php`
- `tests/Unit/Domain/Contact/ValueObjects/ContactReasonTest.php`
- `tests/Unit/Domain/Notification/Entities/NotificationLogTest.php`

### Feature Tests (Integration)
- `tests/Feature/Contact/SubmitContactTest.php`
- `tests/Feature/Admin/ContactManagementTest.php`
- `tests/Feature/Admin/NotificationLogTest.php`
- `tests/Feature/Notifications/DiscordChannelTest.php`

---

## Implementation Checklist

### Phase 1: Database & Domain Foundation
- [ ] Create migration for `notification_logs` table
- [ ] Create migration for `contacts` table
- [ ] Add notification settings to `site_configs` seeder
- [ ] Create `NotificationType`, `NotificationChannel`, `NotificationStatus` enums
- [ ] Create `NotificationLog` entity
- [ ] Create `ContactReason`, `ContactSource`, `ContactStatus` enums
- [ ] Create `Contact` entity
- [ ] Create `ContactSubmitted` domain event

### Phase 2: Infrastructure
- [ ] Create `DiscordChannel` notification channel
- [ ] Create `DiscordMessage` builder
- [ ] Create `ContactEloquent` model
- [ ] Create `NotificationLogEloquent` model
- [ ] Create `EloquentContactRepository`
- [ ] Create `EloquentNotificationLogRepository`
- [ ] Register repositories in service provider

### Phase 3: Application Services
- [ ] Create `CreateContactData` DTO
- [ ] Create `ContactData` DTO
- [ ] Create `ContactApplicationService`
- [ ] Create `NotificationLogData` DTO
- [ ] Create `NotificationApplicationService`

### Phase 4: Notifications
- [ ] Create `ContactSubmittedNotification`
- [ ] Create `ContactCopyNotification`
- [ ] Create `UserRegisteredNotification` (Discord)
- [ ] Update `EmailVerificationNotification` (BCC admin)
- [ ] Create `config/notifications.php`

### Phase 5: Event Listeners
- [ ] Create `SendContactNotification` listener
- [ ] Create `SendRegistrationDiscordNotification` listener
- [ ] Update `EventServiceProvider`

### Phase 6: API Controllers & Routes
- [ ] Create `StoreContactRequest`
- [ ] Create `ContactController` (Public/App)
- [ ] Create `Admin\ContactController`
- [ ] Create `Admin\NotificationLogController`
- [ ] Add routes to `routes/subdomain.php`

### Phase 7: Cleanup & Maintenance
- [ ] Create `CleanupNotificationLogs` command
- [ ] Schedule cleanup in Kernel
- [ ] Write unit tests
- [ ] Write feature tests

---

## Agent Assignment

**All backend tasks should be implemented using the `dev-be` agent.**

The agent should follow the DDD architecture patterns established in:
- `.claude/guides/backend/ddd-overview.md`
- `.claude/guides/backend/admin-backend-guide.md`
