<?php

declare(strict_types=1);

namespace Tests\Unit\Http\Requests;

use App\Http\Requests\User\CreateRaceRequest;
use Illuminate\Support\Facades\Validator;
use Mockery;
use Tests\TestCase;

final class CreateRaceRequestValidationTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_accepts_integer_points(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'points_system' => [
                    1 => 25,
                    2 => 18,
                    3 => 15,
                ],
                'dnf_points' => 0,
                'dns_points' => 0,
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    public function test_accepts_decimal_points_with_one_decimal_place(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'points_system' => [
                    1 => 12.5,
                    2 => 10.5,
                    3 => 8.5,
                ],
                'dnf_points' => 0.5,
                'dns_points' => 0.5,
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    public function test_accepts_decimal_points_with_two_decimal_places(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'points_system' => [
                    1 => 12.75,
                    2 => 10.25,
                    3 => 8.99,
                ],
                'dnf_points' => 0.75,
                'dns_points' => 0.25,
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    public function test_rejects_decimal_points_with_more_than_two_decimal_places(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'points_system' => [
                    1 => 12.567,
                ],
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('points_system.1'));
    }

    public function test_rejects_dnf_points_with_more_than_two_decimal_places(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'dnf_points' => 0.999,
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('dnf_points'));
    }

    public function test_rejects_dns_points_with_more_than_two_decimal_places(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'dns_points' => 1.9999,
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('dns_points'));
    }

    public function test_rejects_negative_points(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'points_system' => [
                    1 => -5.5,
                ],
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('points_system.1'));
    }

    public function test_accepts_zero_points(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'points_system' => [
                    1 => 0,
                    2 => 0.0,
                ],
                'dnf_points' => 0,
                'dns_points' => 0.00,
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    public function test_validates_exact_payload_from_error_report(): void
    {
        $request = new CreateRaceRequest();
        $validator = Validator::make(
            [
                'points_system' => [
                    1 => 12.5,
                    2 => 10,
                    3 => 8,
                    4 => 6.5,
                    5 => 5.5,
                    6 => 5,
                    7 => 4.5,
                    8 => 4,
                    9 => 3.5,
                    10 => 3,
                    11 => 1.5,
                    12 => 2,
                    13 => 1.5,
                    14 => 1,
                    15 => 0.5,
                    16 => 0,
                ],
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes(), 'The exact payload from the error report should pass validation');
    }
}
