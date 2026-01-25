<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Driver\DTOs;

use App\Application\Driver\DTOs\AdminCreateDriverData;
use PHPUnit\Framework\TestCase;

final class AdminCreateDriverDataTest extends TestCase
{
    public function test_get_effective_nickname_returns_provided_nickname(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: 'JD',
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'discord123'
        );

        $this->assertSame('JD', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_discord_id_when_no_nickname(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: 'PSNUser123',
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser123'
        );

        // Discord ID has highest priority
        $this->assertSame('DiscordUser123', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_psn_id_when_no_nickname_and_no_discord_id(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: 'PSNUser123',
            iracing_id: 'iRacingUser456',
            iracing_customer_id: 789,
            discord_id: null
        );

        // PSN ID has priority over other platform IDs
        $this->assertSame('PSNUser123', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_iracing_id_when_no_nickname_discord_or_psn(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: 'iRacingUser456',
            iracing_customer_id: 789,
            discord_id: null
        );

        // iRacing ID has priority over iRacing Customer ID
        $this->assertSame('iRacingUser456', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_iracing_customer_id_when_no_other_platform_ids(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: 789,
            discord_id: null
        );

        // iRacing Customer ID as string
        $this->assertSame('789', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_first_name_when_no_platform_ids(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: null
        );

        // First name is the fallback
        $this->assertSame('John', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_null_when_no_nickname_and_no_identifiers(): void
    {
        $data = new AdminCreateDriverData(
            first_name: null,
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: null
        );

        // No nickname, platform IDs, or first name - should return null
        $this->assertNull($data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_handles_empty_string_nickname(): void
    {
        $data = new AdminCreateDriverData(
            first_name: null,
            last_name: null,
            nickname: '',
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser456'
        );

        // Empty nickname should fall back to Discord ID
        $this->assertSame('DiscordUser456', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_handles_whitespace_nickname(): void
    {
        $data = new AdminCreateDriverData(
            first_name: null,
            last_name: null,
            nickname: '   ',
            email: null,
            phone: null,
            psn_id: 'PSNUser123',
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: null
        );

        // Whitespace-only nickname should fall back to PSN ID
        $this->assertSame('PSNUser123', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_priority_discord_over_psn(): void
    {
        $data = new AdminCreateDriverData(
            first_name: null,
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: 'PSNUser123',
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser456'
        );

        // Discord ID has priority over PSN ID
        $this->assertSame('DiscordUser456', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_priority_platform_id_over_first_name(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: 'PSNUser123',
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: null
        );

        // PSN ID has priority over first name
        $this->assertSame('PSNUser123', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_handles_empty_platform_ids(): void
    {
        $data = new AdminCreateDriverData(
            first_name: 'John',
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: '',
            iracing_id: '   ',
            iracing_customer_id: null,
            discord_id: ''
        );

        // Empty/whitespace platform IDs should be ignored, fall back to first name
        $this->assertSame('John', $data->getEffectiveNickname());
    }
}
