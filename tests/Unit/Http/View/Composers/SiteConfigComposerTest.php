<?php

declare(strict_types=1);

namespace Tests\Unit\Http\View\Composers;

use App\Domain\SiteConfig\Entities\SiteConfig;
use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;
use App\Domain\SiteConfig\Repositories\SiteConfigRepositoryInterface;
use App\Domain\SiteConfig\ValueObjects\SiteName;
use App\Domain\SiteConfig\ValueObjects\Timezone;
use App\Domain\SiteConfig\ValueObjects\TrackingId;
use App\Http\View\Composers\SiteConfigComposer;
use Illuminate\View\View;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class SiteConfigComposerTest extends TestCase
{
    private SiteConfigComposer $composer;
    private SiteConfigRepositoryInterface&MockInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = Mockery::mock(SiteConfigRepositoryInterface::class);
        $this->composer = new SiteConfigComposer($this->repository);
    }

    public function test_compose_shares_site_config_with_view(): void
    {
        // Arrange - use config file fallback
        $this->repository->shouldReceive('getActive')
            ->once()
            ->andThrow(InvalidConfigurationException::noActiveConfiguration());

        $view = $this->createMock(View::class);

        // Expect the view to receive the siteConfig array
        $view->expects($this->exactly(2))
            ->method('with')
            ->willReturnCallback(function ($key, $value) use ($view) {
                $this->assertContains($key, ['siteConfig', 'siteConfigJson']);

                if ($key === 'siteConfig') {
                    $this->assertIsArray($value);
                    $this->assertArrayHasKey('name', $value);
                    $this->assertArrayHasKey('timezone', $value);
                    $this->assertArrayHasKey('discord', $value);
                    $this->assertArrayHasKey('maintenance', $value);
                    $this->assertArrayHasKey('registration', $value);
                    $this->assertArrayHasKey('google', $value);
                }

                if ($key === 'siteConfigJson') {
                    $this->assertIsString($value);
                    $this->assertJson($value);
                }

                return $view;
            });

        // Act
        $this->composer->compose($view);
    }

    public function test_site_config_structure_is_correct(): void
    {
        // Arrange - use config file fallback
        $this->repository->shouldReceive('getActive')
            ->once()
            ->andThrow(InvalidConfigurationException::noActiveConfiguration());

        $view = $this->createMock(View::class);
        $capturedConfig = null;

        $view->expects($this->exactly(2))
            ->method('with')
            ->willReturnCallback(function ($key, $value) use (&$capturedConfig, $view) {
                if ($key === 'siteConfig') {
                    $capturedConfig = $value;
                }
                return $view;
            });

        // Act
        $this->composer->compose($view);

        // Assert
        $this->assertNotNull($capturedConfig);
        $this->assertArrayHasKey('discord', $capturedConfig);
        $this->assertArrayHasKey('url', $capturedConfig['discord']);
        $this->assertArrayHasKey('inviteCode', $capturedConfig['discord']);

        $this->assertArrayHasKey('maintenance', $capturedConfig);
        $this->assertArrayHasKey('enabled', $capturedConfig['maintenance']);
        $this->assertArrayHasKey('message', $capturedConfig['maintenance']);

        $this->assertArrayHasKey('registration', $capturedConfig);
        $this->assertArrayHasKey('enabled', $capturedConfig['registration']);

        $this->assertArrayHasKey('google', $capturedConfig);
        $this->assertArrayHasKey('analyticsId', $capturedConfig['google']);
        $this->assertArrayHasKey('tagManagerId', $capturedConfig['google']);

        $this->assertArrayHasKey('emails', $capturedConfig);
    }

    public function test_json_encoding_escapes_special_characters(): void
    {
        // Arrange - use config file fallback
        $this->repository->shouldReceive('getActive')
            ->once()
            ->andThrow(InvalidConfigurationException::noActiveConfiguration());

        $view = $this->createMock(View::class);
        $capturedJson = null;

        $view->expects($this->exactly(2))
            ->method('with')
            ->willReturnCallback(function ($key, $value) use (&$capturedJson, $view) {
                if ($key === 'siteConfigJson') {
                    $capturedJson = $value;
                }
                return $view;
            });

        // Act
        $this->composer->compose($view);

        // Assert
        $this->assertNotNull($capturedJson);
        $decoded = json_decode($capturedJson, true);
        $this->assertIsArray($decoded);

        // Verify JSON encoding flags worked (no raw HTML tags)
        $this->assertStringNotContainsString('<', $capturedJson);
        $this->assertStringNotContainsString('>', $capturedJson);
    }

    public function test_uses_database_config_when_available(): void
    {
        // Arrange - return a database config
        $siteConfig = SiteConfig::create(
            siteName: SiteName::from('Test Site'),
            timezone: Timezone::from('America/New_York'),
            googleTagManagerId: TrackingId::googleTagManager('GTM-TEST123'),
            googleAnalyticsId: TrackingId::googleAnalytics('G-ANALYTICS'),
            discordLink: 'https://discord.gg/testcode',
            maintenanceMode: true,
            userRegistrationEnabled: false,
        );

        $this->repository->shouldReceive('getActive')
            ->once()
            ->andReturn($siteConfig);

        $view = $this->createMock(View::class);
        $capturedConfig = null;

        $view->expects($this->exactly(2))
            ->method('with')
            ->willReturnCallback(function ($key, $value) use (&$capturedConfig, $view) {
                if ($key === 'siteConfig') {
                    $capturedConfig = $value;
                }
                return $view;
            });

        // Act
        $this->composer->compose($view);

        // Assert - values from database
        $this->assertEquals('Test Site', $capturedConfig['name']);
        $this->assertEquals('America/New_York', $capturedConfig['timezone']);
        $this->assertEquals('GTM-TEST123', $capturedConfig['google']['tagManagerId']);
        $this->assertEquals('G-ANALYTICS', $capturedConfig['google']['analyticsId']);
        $this->assertEquals('https://discord.gg/testcode', $capturedConfig['discord']['url']);
        $this->assertEquals('testcode', $capturedConfig['discord']['inviteCode']);
        $this->assertTrue($capturedConfig['maintenance']['enabled']);
        $this->assertFalse($capturedConfig['registration']['enabled']);
    }

    public function test_extracts_discord_invite_code_from_url(): void
    {
        // Arrange
        $siteConfig = SiteConfig::create(
            siteName: SiteName::from('Test'),
            timezone: Timezone::from('UTC'),
            discordLink: 'https://discord.gg/ABC123xyz',
        );

        $this->repository->shouldReceive('getActive')
            ->once()
            ->andReturn($siteConfig);

        $view = $this->createMock(View::class);
        $capturedConfig = null;

        $view->expects($this->exactly(2))
            ->method('with')
            ->willReturnCallback(function ($key, $value) use (&$capturedConfig, $view) {
                if ($key === 'siteConfig') {
                    $capturedConfig = $value;
                }
                return $view;
            });

        // Act
        $this->composer->compose($view);

        // Assert
        $this->assertEquals('ABC123xyz', $capturedConfig['discord']['inviteCode']);
    }
}
