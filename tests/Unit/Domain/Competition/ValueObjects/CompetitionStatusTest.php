<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\ValueObjects\CompetitionStatus;
use PHPUnit\Framework\TestCase;

class CompetitionStatusTest extends TestCase
{
    public function test_active_status_exists(): void
    {
        $status = CompetitionStatus::ACTIVE;

        $this->assertSame('active', $status->value);
    }

    public function test_archived_status_exists(): void
    {
        $status = CompetitionStatus::ARCHIVED;

        $this->assertSame('archived', $status->value);
    }

    public function test_is_active_returns_true_for_active(): void
    {
        $status = CompetitionStatus::ACTIVE;

        $this->assertTrue($status->isActive());
        $this->assertFalse($status->isArchived());
    }

    public function test_is_archived_returns_true_for_archived(): void
    {
        $status = CompetitionStatus::ARCHIVED;

        $this->assertTrue($status->isArchived());
        $this->assertFalse($status->isActive());
    }

    public function test_from_string_converts_active(): void
    {
        $status = CompetitionStatus::fromString('active');

        $this->assertSame(CompetitionStatus::ACTIVE, $status);
    }

    public function test_from_string_converts_archived(): void
    {
        $status = CompetitionStatus::fromString('archived');

        $this->assertSame(CompetitionStatus::ARCHIVED, $status);
    }

    public function test_from_string_is_case_insensitive(): void
    {
        $status1 = CompetitionStatus::fromString('ACTIVE');
        $status2 = CompetitionStatus::fromString('Active');
        $status3 = CompetitionStatus::fromString('active');

        $this->assertSame(CompetitionStatus::ACTIVE, $status1);
        $this->assertSame(CompetitionStatus::ACTIVE, $status2);
        $this->assertSame(CompetitionStatus::ACTIVE, $status3);
    }

    public function test_from_string_throws_exception_for_invalid_status(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid status: invalid');

        CompetitionStatus::fromString('invalid');
    }
}
