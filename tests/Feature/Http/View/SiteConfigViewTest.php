<?php

declare(strict_types=1);

namespace Tests\Feature\Http\View;

use Tests\TestCase;

class SiteConfigViewTest extends TestCase
{
    public function test_public_view_receives_site_config(): void
    {
        // Act
        $response = $this->get('/');

        // Assert
        $response->assertStatus(200);
        $response->assertSee('window.__SITE_CONFIG__', false);
    }


    public function test_site_config_contains_expected_keys(): void
    {
        // Act
        $response = $this->get('/');

        // Assert
        $response->assertStatus(200);

        // Check for expected config keys in the JSON
        $response->assertSee('"name"', false);
        $response->assertSee('"timezone"', false);
        $response->assertSee('"discord"', false);
        $response->assertSee('"maintenance"', false);
        $response->assertSee('"registration"', false);
        $response->assertSee('"google"', false);
    }

    public function test_google_tag_manager_renders_when_id_is_set(): void
    {
        // Arrange
        config(['site.google.tag_manager_id' => 'GTM-XXXXX']);

        // Act
        $response = $this->get('/');

        // Assert
        $response->assertStatus(200);
        $response->assertSee('googletagmanager.com', false);
        $response->assertSee('GTM-XXXXX', false);
    }

    public function test_google_tag_manager_does_not_render_when_id_is_null(): void
    {
        // Arrange
        config(['site.google.tag_manager_id' => null]);

        // Act
        $response = $this->get('/');

        // Assert
        $response->assertStatus(200);
        $response->assertDontSee('googletagmanager.com', false);
    }

    public function test_site_name_is_displayed_in_title(): void
    {
        // Arrange
        config(['site.name' => 'Test Site Name']);

        // Act
        $response = $this->get('/');

        // Assert
        $response->assertStatus(200);
        $response->assertSee('<title>Test Site Name</title>', false);
    }
}
