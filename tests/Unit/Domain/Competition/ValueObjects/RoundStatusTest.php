<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\ValueObjects\RoundStatus;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for RoundStatus enum.
 */
final class RoundStatusTest extends TestCase
{
    #[Test]
    public function it_has_correct_values(): void
    {
        $this->assertEquals('scheduled', RoundStatus::SCHEDULED->value);
        $this->assertEquals('pre_race', RoundStatus::PRE_RACE->value);
        $this->assertEquals('in_progress', RoundStatus::IN_PROGRESS->value);
        $this->assertEquals('completed', RoundStatus::COMPLETED->value);
        $this->assertEquals('cancelled', RoundStatus::CANCELLED->value);
    }

    #[Test]
    public function it_provides_labels(): void
    {
        $this->assertEquals('Scheduled', RoundStatus::SCHEDULED->label());
        $this->assertEquals('Pre-Race', RoundStatus::PRE_RACE->label());
        $this->assertEquals('In Progress', RoundStatus::IN_PROGRESS->label());
        $this->assertEquals('Completed', RoundStatus::COMPLETED->label());
        $this->assertEquals('Cancelled', RoundStatus::CANCELLED->label());
    }

    #[Test]
    public function it_checks_if_active(): void
    {
        $this->assertTrue(RoundStatus::IN_PROGRESS->isActive());
        $this->assertFalse(RoundStatus::SCHEDULED->isActive());
        $this->assertFalse(RoundStatus::COMPLETED->isActive());
    }

    #[Test]
    public function it_checks_if_completed(): void
    {
        $this->assertTrue(RoundStatus::COMPLETED->isCompleted());
        $this->assertFalse(RoundStatus::SCHEDULED->isCompleted());
        $this->assertFalse(RoundStatus::IN_PROGRESS->isCompleted());
    }
}
