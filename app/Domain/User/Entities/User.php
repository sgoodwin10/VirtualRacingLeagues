<?php

declare(strict_types=1);

namespace App\Domain\User\Entities;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Events\EmailVerificationRequested;
use App\Domain\User\Events\EmailVerified;
use App\Domain\User\Events\PasswordResetCompleted;
use App\Domain\User\Events\PasswordResetRequested;
use App\Domain\User\Events\UserActivated;
use App\Domain\User\Events\UserCreated;
use App\Domain\User\Events\UserDeactivated;
use App\Domain\User\Events\UserDeleted;
use App\Domain\User\Events\UserRestored;
use App\Domain\User\Events\UserUpdated;
use App\Domain\User\Exceptions\EmailAlreadyVerifiedException;
use App\Domain\User\Exceptions\InvalidUserStatusException;
use App\Domain\User\Exceptions\UserAlreadyDeletedException;
use App\Domain\User\ValueObjects\UserAlias;
use App\Domain\User\ValueObjects\UserStatus;
use App\Domain\User\ValueObjects\UserUuid;
use DateTimeImmutable;

/**
 * User Domain Entity.
 * Rich domain model containing user business logic and invariants.
 */
final class User
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private FullName $fullName,
        private EmailAddress $email,
        private string $password,
        private ?UserAlias $alias,
        private ?UserUuid $uuid,
        private UserStatus $status,
        private ?DateTimeImmutable $emailVerifiedAt,
        private ?DateTimeImmutable $createdAt,
        private ?DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt,
    ) {
    }

    /**
     * Create a new user.
     */
    public static function create(
        FullName $fullName,
        EmailAddress $email,
        string $password,
        ?UserAlias $alias = null,
        ?UserUuid $uuid = null,
        ?UserStatus $status = null,
    ): self {
        $user = new self(
            id: null,
            fullName: $fullName,
            email: $email,
            password: $password,
            alias: $alias,
            uuid: $uuid ?? UserUuid::generate(),
            status: $status ?? UserStatus::ACTIVE,
            emailVerifiedAt: null,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
            deletedAt: null,
        );

        // Note: UserCreated event will be recorded after persistence when ID is available
        // See recordCreationEvent() method below

        return $user;
    }

    /**
     * Record the UserCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new UserCreated(
            userId: $this->id,
            email: $this->email->value(),
            firstName: $this->fullName->firstName(),
            lastName: $this->fullName->lastName(),
            alias: $this->alias?->value(),
            uuid: $this->uuid?->value(),
        ));
    }

    /**
     * Reconstitute user from persistence.
     */
    public static function reconstitute(
        int $id,
        FullName $fullName,
        EmailAddress $email,
        string $password,
        ?UserAlias $alias,
        ?UserUuid $uuid,
        UserStatus $status,
        ?DateTimeImmutable $emailVerifiedAt,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt,
    ): self {
        return new self(
            id: $id,
            fullName: $fullName,
            email: $email,
            password: $password,
            alias: $alias,
            uuid: $uuid,
            status: $status,
            emailVerifiedAt: $emailVerifiedAt,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
        );
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function fullName(): FullName
    {
        return $this->fullName;
    }

    public function email(): EmailAddress
    {
        return $this->email;
    }

    public function password(): string
    {
        return $this->password;
    }

    public function alias(): ?UserAlias
    {
        return $this->alias;
    }

    public function uuid(): ?UserUuid
    {
        return $this->uuid;
    }

    public function status(): UserStatus
    {
        return $this->status;
    }

    public function emailVerifiedAt(): ?DateTimeImmutable
    {
        return $this->emailVerifiedAt;
    }

    public function createdAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function deletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    // Business logic methods

    /**
     * Update user profile information.
     */
    public function updateProfile(
        ?FullName $fullName = null,
        ?EmailAddress $email = null,
        ?UserAlias $alias = null,
    ): void {
        $changes = [];
        $emailChanged = false;

        if ($fullName !== null && !$fullName->equals($this->fullName)) {
            $this->fullName = $fullName;
            $changes['first_name'] = $fullName->firstName();
            $changes['last_name'] = $fullName->lastName();
        }

        if ($email !== null && !$email->equals($this->email)) {
            $this->email = $email;
            $changes['email'] = $email->value();
            $emailChanged = true;

            // If email changed, require re-verification
            $this->emailVerifiedAt = null;
            $changes['email_verified_at'] = null;
        }

        if (
            $alias !== null && (
            $this->alias === null ||
            !$alias->equals($this->alias)
            )
        ) {
            $this->alias = $alias;
            $changes['alias'] = $alias->value();
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new UserUpdated(
                userId: $this->id ?? 0,
                changedAttributes: $changes,
            ));

            // If email changed, request new verification
            if ($emailChanged) {
                $this->recordEvent(new EmailVerificationRequested($this));
            }
        }
    }

    /**
     * Activate the user account.
     */
    public function activate(): void
    {
        if ($this->isDeleted()) {
            throw InvalidUserStatusException::cannotActivateDeletedUser($this->id ?? 0);
        }

        if ($this->status->isActive()) {
            throw InvalidUserStatusException::alreadyActive($this->id ?? 0);
        }

        $this->status = UserStatus::ACTIVE;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new UserActivated(
            userId: $this->id ?? 0,
        ));
    }

    /**
     * Deactivate the user account.
     */
    public function deactivate(): void
    {
        if ($this->isDeleted()) {
            throw InvalidUserStatusException::cannotDeactivateDeletedUser($this->id ?? 0);
        }

        if ($this->status->isInactive()) {
            throw InvalidUserStatusException::alreadyInactive($this->id ?? 0);
        }

        $this->status = UserStatus::INACTIVE;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new UserDeactivated(
            userId: $this->id ?? 0,
        ));
    }

    /**
     * Delete the user account (soft delete).
     */
    public function delete(): void
    {
        if ($this->isDeleted()) {
            throw UserAlreadyDeletedException::withId($this->id ?? 0);
        }

        $this->status = UserStatus::INACTIVE;
        $this->deletedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new UserDeleted(
            userId: $this->id ?? 0,
        ));
    }

    /**
     * Restore a soft-deleted user account.
     */
    public function restore(): void
    {
        if (!$this->isDeleted()) {
            return; // Already restored, idempotent operation
        }

        $this->status = UserStatus::ACTIVE;
        $this->deletedAt = null;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new UserRestored(
            userId: $this->id ?? 0,
        ));
    }

    /**
     * Mark email as verified.
     */
    public function markEmailAsVerified(): void
    {
        if ($this->emailVerifiedAt !== null) {
            throw new EmailAlreadyVerifiedException();
        }

        $this->emailVerifiedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new EmailVerified($this));
    }

    /**
     * Request email verification.
     */
    public function requestEmailVerification(): void
    {
        $this->recordEvent(new EmailVerificationRequested($this));
    }

    /**
     * Request password reset.
     */
    public function requestPasswordReset(): void
    {
        $this->recordEvent(new PasswordResetRequested($this));
    }

    /**
     * Reset user password.
     * Note: Password should already be hashed before calling this method.
     */
    public function resetPassword(string $hashedPassword): void
    {
        $this->password = $hashedPassword;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new PasswordResetCompleted($this));
    }

    /**
     * Update user password.
     * Note: Password should already be hashed before calling this method.
     */
    public function updatePassword(string $hashedPassword): void
    {
        $this->password = $hashedPassword;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->status->isActive();
    }

    /**
     * Check if user is inactive.
     */
    public function isInactive(): bool
    {
        return $this->status->isInactive();
    }

    /**
     * Check if user is deleted.
     */
    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    /**
     * Check if email is verified.
     */
    public function isEmailVerified(): bool
    {
        return $this->emailVerifiedAt !== null;
    }

    // Domain events management

    /**
     * Record a domain event.
     */
    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * Get recorded domain events.
     *
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }

    /**
     * Check if entity has recorded events.
     */
    public function hasEvents(): bool
    {
        return !empty($this->domainEvents);
    }
}
