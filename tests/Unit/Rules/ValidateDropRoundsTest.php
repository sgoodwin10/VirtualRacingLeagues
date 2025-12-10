<?php

declare(strict_types=1);

namespace Tests\Unit\Rules;

use App\Rules\ValidateDropRounds;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Tests\TestCase;

/**
 * Test the ValidateDropRounds validation rule.
 *
 * Business Rule: If drop_round=false, then total_drop_rounds MUST be 0.
 */
class ValidateDropRoundsTest extends TestCase
{
    /**
     * Test validation passes when drop_round is true and total_drop_rounds is greater than 0.
     */
    public function test_validation_passes_when_drop_round_enabled_with_positive_total(): void
    {
        $data = [
            'drop_round' => true,
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        $this->assertTrue($validator->passes());
    }

    /**
     * Test validation passes when drop_round is true and total_drop_rounds is 0.
     */
    public function test_validation_passes_when_drop_round_enabled_with_zero_total(): void
    {
        $data = [
            'drop_round' => true,
            'total_drop_rounds' => 0,
        ];

        $validator = $this->makeValidator($data);

        $this->assertTrue($validator->passes());
    }

    /**
     * Test validation passes when drop_round is false and total_drop_rounds is 0.
     */
    public function test_validation_passes_when_drop_round_disabled_with_zero_total(): void
    {
        $data = [
            'drop_round' => false,
            'total_drop_rounds' => 0,
        ];

        $validator = $this->makeValidator($data);

        $this->assertTrue($validator->passes());
    }

    /**
     * Test validation fails when drop_round is false and total_drop_rounds is greater than 0.
     */
    public function test_validation_fails_when_drop_round_disabled_with_positive_total(): void
    {
        $data = [
            'drop_round' => false,
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        $this->assertFalse($validator->passes());
        $this->assertEquals(
            'The total drop rounds must be 0 when drop round is disabled.',
            $validator->errors()->first('total_drop_rounds')
        );
    }

    /**
     * Test validation passes when drop_round is null (update scenario).
     */
    public function test_validation_passes_when_drop_round_is_null(): void
    {
        $data = [
            'drop_round' => null,
            'total_drop_rounds' => 5,
        ];

        $validator = $this->makeValidator($data);

        $this->assertTrue($validator->passes());
    }

    /**
     * Test validation handles string boolean representations.
     */
    public function test_validation_handles_string_boolean_values(): void
    {
        // Test "false" as string with positive total_drop_rounds
        $data = [
            'drop_round' => 'false',
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        $this->assertFalse($validator->passes());
        $this->assertEquals(
            'The total drop rounds must be 0 when drop round is disabled.',
            $validator->errors()->first('total_drop_rounds')
        );

        // Test "true" as string with positive total_drop_rounds
        $data = [
            'drop_round' => 'true',
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        $this->assertTrue($validator->passes());
    }

    /**
     * Test validation with integer values (0 and 1) for drop_round.
     */
    public function test_validation_handles_integer_boolean_values(): void
    {
        // Test 0 (false) with positive total_drop_rounds
        $data = [
            'drop_round' => 0,
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        $this->assertFalse($validator->passes());

        // Test 1 (true) with positive total_drop_rounds
        $data = [
            'drop_round' => 1,
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        $this->assertTrue($validator->passes());
    }

    /**
     * Test validation with negative total_drop_rounds (should fail due to min:0 rule).
     */
    public function test_validation_fails_with_negative_total_drop_rounds(): void
    {
        $data = [
            'drop_round' => true,
            'total_drop_rounds' => -1,
        ];

        $validator = $this->makeValidator($data);

        $this->assertFalse($validator->passes());
        $this->assertNotNull($validator->errors()->first('total_drop_rounds'));
    }

    /**
     * Test validation passes at upper boundary (max:20).
     */
    public function test_validation_passes_at_max_boundary(): void
    {
        $data = [
            'drop_round' => true,
            'total_drop_rounds' => 20,
        ];

        $validator = $this->makeValidator($data);

        $this->assertTrue($validator->passes());
    }

    /**
     * Test validation fails above upper boundary (max:20).
     */
    public function test_validation_fails_above_max_boundary(): void
    {
        $data = [
            'drop_round' => true,
            'total_drop_rounds' => 21,
        ];

        $validator = $this->makeValidator($data);

        $this->assertFalse($validator->passes());
        $this->assertNotNull($validator->errors()->first('total_drop_rounds'));
    }

    /**
     * Test validation fails when drop_round is false and total_drop_rounds is 1 (minimum positive).
     */
    public function test_validation_fails_when_drop_round_disabled_with_one_drop_round(): void
    {
        $data = [
            'drop_round' => false,
            'total_drop_rounds' => 1,
        ];

        $validator = $this->makeValidator($data);

        $this->assertFalse($validator->passes());
        $this->assertEquals(
            'The total drop rounds must be 0 when drop round is disabled.',
            $validator->errors()->first('total_drop_rounds')
        );
    }

    /**
     * Test validation with empty string for drop_round (falsy value).
     */
    public function test_validation_with_empty_string_drop_round(): void
    {
        $data = [
            'drop_round' => '',
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        // Empty string is falsy, so should fail with positive total_drop_rounds
        $this->assertFalse($validator->passes());
    }

    /**
     * Test validation handles zero string as falsy.
     */
    public function test_validation_handles_zero_string_as_falsy(): void
    {
        $data = [
            'drop_round' => '0',
            'total_drop_rounds' => 2,
        ];

        $validator = $this->makeValidator($data);

        $this->assertFalse($validator->passes());
    }

    /**
     * Helper method to create a validator with the ValidateDropRounds rule.
     *
     * @param array<string, mixed> $data
     * @return ValidatorContract&\Illuminate\Validation\Validator
     */
    private function makeValidator(array $data): ValidatorContract
    {
        /** @var ValidatorContract&\Illuminate\Validation\Validator */
        return validator($data, [
            'total_drop_rounds' => ['integer', 'min:0', 'max:20', new ValidateDropRounds()],
        ]);
    }
}
