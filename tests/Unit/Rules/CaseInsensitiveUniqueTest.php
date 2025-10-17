<?php

declare(strict_types=1);

namespace Tests\Unit\Rules;

use App\Models\Admin;
use App\Rules\CaseInsensitiveUnique;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseInsensitiveUniqueTest extends TestCase
{
    use RefreshDatabase;

    public function test_passes_when_value_does_not_exist(): void
    {
        // Create an admin with a specific email
        Admin::factory()->create(['email' => 'existing@example.com']);

        // Create the rule
        $rule = new CaseInsensitiveUnique('admins', 'email');

        // Test with a different email
        $fail = false;
        $rule->validate('email', 'new@example.com', function () use (&$fail) {
            $fail = true;
        });

        $this->assertFalse($fail, 'Validation should pass for a unique email');
    }

    public function test_fails_when_value_exists_with_exact_match(): void
    {
        // Create an admin with a specific email
        Admin::factory()->create(['email' => 'existing@example.com']);

        // Create the rule
        $rule = new CaseInsensitiveUnique('admins', 'email');

        // Test with exact same email
        $fail = false;
        $rule->validate('email', 'existing@example.com', function () use (&$fail) {
            $fail = true;
        });

        $this->assertTrue($fail, 'Validation should fail for an existing email');
    }

    public function test_fails_when_value_exists_with_different_case(): void
    {
        // Create an admin with a specific email
        Admin::factory()->create(['email' => 'existing@example.com']);

        // Create the rule
        $rule = new CaseInsensitiveUnique('admins', 'email');

        // Test with uppercase email
        $fail = false;
        $rule->validate('email', 'EXISTING@EXAMPLE.COM', function () use (&$fail) {
            $fail = true;
        });

        $this->assertTrue($fail, 'Validation should fail for an existing email with different case');

        // Test with mixed case email
        $fail = false;
        $rule->validate('email', 'ExIsTiNg@ExAmPlE.cOm', function () use (&$fail) {
            $fail = true;
        });

        $this->assertTrue($fail, 'Validation should fail for an existing email with mixed case');
    }

    public function test_ignores_specified_id_when_updating(): void
    {
        // Create an admin with a specific email
        $admin = Admin::factory()->create(['email' => 'existing@example.com']);

        // Create the rule with ignoreId
        $rule = new CaseInsensitiveUnique('admins', 'email', $admin->id);

        // Test with same email (should pass because we're updating the same record)
        $fail = false;
        $rule->validate('email', 'existing@example.com', function () use (&$fail) {
            $fail = true;
        });

        $this->assertFalse($fail, 'Validation should pass when ignoring the same record ID');

        // Test with same email in different case (should also pass)
        $fail = false;
        $rule->validate('email', 'EXISTING@EXAMPLE.COM', function () use (&$fail) {
            $fail = true;
        });

        $this->assertFalse($fail, 'Validation should pass when ignoring the same record ID with different case');
    }

    public function test_fails_when_value_exists_for_different_id(): void
    {
        // Create two admins
        $admin1 = Admin::factory()->create(['email' => 'admin1@example.com']);
        $admin2 = Admin::factory()->create(['email' => 'admin2@example.com']);

        // Create the rule with ignoreId for admin1
        $rule = new CaseInsensitiveUnique('admins', 'email', $admin1->id);

        // Try to use admin2's email (should fail)
        $fail = false;
        $rule->validate('email', 'admin2@example.com', function () use (&$fail) {
            $fail = true;
        });

        $this->assertTrue($fail, 'Validation should fail when email exists for a different record');

        // Try with different case (should also fail)
        $fail = false;
        $rule->validate('email', 'ADMIN2@EXAMPLE.COM', function () use (&$fail) {
            $fail = true;
        });

        $this->assertTrue($fail, 'Validation should fail when email exists for a different record with different case');
    }

    public function test_passes_for_non_string_values(): void
    {
        // Create an admin
        Admin::factory()->create(['email' => 'existing@example.com']);

        // Create the rule
        $rule = new CaseInsensitiveUnique('admins', 'email');

        // Test with null (should pass as it's handled by other validation rules)
        $fail = false;
        $rule->validate('email', null, function () use (&$fail) {
            $fail = true;
        });

        $this->assertFalse($fail, 'Validation should pass for null value');

        // Test with array (should pass as it's handled by other validation rules)
        $fail = false;
        $rule->validate('email', ['test@example.com'], function () use (&$fail) {
            $fail = true;
        });

        $this->assertFalse($fail, 'Validation should pass for non-string value');
    }

    public function test_fail_callback_receives_correct_message(): void
    {
        // Create an admin
        Admin::factory()->create(['email' => 'existing@example.com']);

        // Create the rule
        $rule = new CaseInsensitiveUnique('admins', 'email');

        // Test and capture the fail message
        $message = null;
        $rule->validate('email', 'existing@example.com', function ($msg) use (&$message) {
            $message = $msg;
        });

        $this->assertEquals('The email has already been taken.', $message);
    }
}
