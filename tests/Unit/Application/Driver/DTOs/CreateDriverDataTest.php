<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Driver\DTOs;

use App\Application\Driver\DTOs\CreateDriverData;
use PHPUnit\Framework\TestCase;

final class CreateDriverDataTest extends TestCase
{
    public function test_get_effective_nickname_returns_provided_nickname(): void
    {
        $data = new CreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: 'JD',
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'discord123',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertSame('JD', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_discord_id_when_no_nickname_and_no_first_last_name(): void
    {
        $data = new CreateDriverData(
            first_name: null,
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser123',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertSame('DiscordUser123', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_discord_id_when_empty_nickname_and_no_first_last_name(): void
    {
        $data = new CreateDriverData(
            first_name: null,
            last_name: null,
            nickname: '',
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser456',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertSame('DiscordUser456', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_discord_id_when_whitespace_nickname(): void
    {
        $data = new CreateDriverData(
            first_name: null,
            last_name: null,
            nickname: '   ',
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser789',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertSame('DiscordUser789', $data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_null_when_no_nickname_but_has_first_name(): void
    {
        $data = new CreateDriverData(
            first_name: 'John',
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser123',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertNull($data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_null_when_no_nickname_but_has_last_name(): void
    {
        $data = new CreateDriverData(
            first_name: null,
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser123',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertNull($data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_null_when_no_nickname_but_has_both_names(): void
    {
        $data = new CreateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: 'DiscordUser123',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertNull($data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_null_when_no_nickname_and_no_discord_id(): void
    {
        $data = new CreateDriverData(
            first_name: null,
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: 'PSNUser123',
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: null,
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertNull($data->getEffectiveNickname());
    }

    public function test_get_effective_nickname_returns_null_when_no_nickname_and_empty_discord_id(): void
    {
        $data = new CreateDriverData(
            first_name: null,
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: 'PSNUser123',
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: '',
            driver_number: null,
            status: 'active',
            league_notes: null
        );

        $this->assertNull($data->getEffectiveNickname());
    }
}
