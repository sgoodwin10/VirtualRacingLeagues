<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidVisibilityException;
use App\Domain\League\ValueObjects\LeagueVisibility;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class LeagueVisibilityTest extends TestCase
{
    #[Test]
    public function it_creates_public_visibility(): void
    {
        $visibility = LeagueVisibility::PUBLIC;

        $this->assertEquals('public', $visibility->value);
        $this->assertTrue($visibility->isPublic());
        $this->assertFalse($visibility->isPrivate());
        $this->assertFalse($visibility->isUnlisted());
    }

    #[Test]
    public function it_creates_private_visibility(): void
    {
        $visibility = LeagueVisibility::PRIVATE;

        $this->assertEquals('private', $visibility->value);
        $this->assertFalse($visibility->isPublic());
        $this->assertTrue($visibility->isPrivate());
        $this->assertFalse($visibility->isUnlisted());
    }

    #[Test]
    public function it_creates_unlisted_visibility(): void
    {
        $visibility = LeagueVisibility::UNLISTED;

        $this->assertEquals('unlisted', $visibility->value);
        $this->assertFalse($visibility->isPublic());
        $this->assertFalse($visibility->isPrivate());
        $this->assertTrue($visibility->isUnlisted());
    }

    #[Test]
    public function it_creates_public_visibility_using_static_method(): void
    {
        $visibility = LeagueVisibility::public();

        $this->assertEquals('public', $visibility->value);
        $this->assertTrue($visibility->isPublic());
    }

    #[Test]
    public function it_creates_private_visibility_using_static_method(): void
    {
        $visibility = LeagueVisibility::private();

        $this->assertEquals('private', $visibility->value);
        $this->assertTrue($visibility->isPrivate());
    }

    #[Test]
    public function it_creates_unlisted_visibility_using_static_method(): void
    {
        $visibility = LeagueVisibility::unlisted();

        $this->assertEquals('unlisted', $visibility->value);
        $this->assertTrue($visibility->isUnlisted());
    }

    #[Test]
    public function it_creates_from_string_public(): void
    {
        $visibility = LeagueVisibility::fromString('public');

        $this->assertEquals(LeagueVisibility::PUBLIC, $visibility);
        $this->assertTrue($visibility->isPublic());
    }

    #[Test]
    public function it_creates_from_string_private(): void
    {
        $visibility = LeagueVisibility::fromString('private');

        $this->assertEquals(LeagueVisibility::PRIVATE, $visibility);
        $this->assertTrue($visibility->isPrivate());
    }

    #[Test]
    public function it_creates_from_string_unlisted(): void
    {
        $visibility = LeagueVisibility::fromString('unlisted');

        $this->assertEquals(LeagueVisibility::UNLISTED, $visibility);
        $this->assertTrue($visibility->isUnlisted());
    }

    #[Test]
    public function it_creates_from_string_case_insensitive(): void
    {
        $testCases = [
            'PUBLIC' => LeagueVisibility::PUBLIC,
            'Public' => LeagueVisibility::PUBLIC,
            'PRIVATE' => LeagueVisibility::PRIVATE,
            'Private' => LeagueVisibility::PRIVATE,
            'UNLISTED' => LeagueVisibility::UNLISTED,
            'Unlisted' => LeagueVisibility::UNLISTED,
        ];

        foreach ($testCases as $input => $expected) {
            $visibility = LeagueVisibility::fromString($input);
            $this->assertEquals($expected, $visibility, "Failed for input: {$input}");
        }
    }

    #[Test]
    public function it_throws_exception_for_invalid_string(): void
    {
        $this->expectException(InvalidVisibilityException::class);
        $this->expectExceptionMessage("Invalid visibility value: invalid. Must be one of: public, private, unlisted");

        LeagueVisibility::fromString('invalid');
    }

    #[Test]
    public function it_throws_exception_for_empty_string(): void
    {
        $this->expectException(InvalidVisibilityException::class);
        $this->expectExceptionMessage("Invalid visibility value: . Must be one of: public, private, unlisted");

        LeagueVisibility::fromString('');
    }

    #[Test]
    public function it_checks_equality_correctly(): void
    {
        $public1 = LeagueVisibility::PUBLIC;
        $public2 = LeagueVisibility::fromString('public');
        $private = LeagueVisibility::PRIVATE;

        $this->assertTrue($public1->equals($public2));
        $this->assertFalse($public1->equals($private));
    }

    #[Test]
    public function it_provides_all_three_visibility_options(): void
    {
        $cases = LeagueVisibility::cases();

        $this->assertCount(3, $cases);
        $this->assertContains(LeagueVisibility::PUBLIC, $cases);
        $this->assertContains(LeagueVisibility::PRIVATE, $cases);
        $this->assertContains(LeagueVisibility::UNLISTED, $cases);
    }

    #[Test]
    public function it_can_be_used_in_match_expressions(): void
    {
        $visibility = LeagueVisibility::PUBLIC;

        $result = match ($visibility) {
            LeagueVisibility::PUBLIC => 'public',
            LeagueVisibility::PRIVATE => 'private',
            LeagueVisibility::UNLISTED => 'unlisted',
        };

        $this->assertEquals('public', $result);
    }
}
