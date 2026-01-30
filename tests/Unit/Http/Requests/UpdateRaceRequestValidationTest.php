<?php

declare(strict_types=1);

namespace Tests\Unit\Http\Requests;

use App\Http\Requests\User\UpdateRaceRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

final class UpdateRaceRequestValidationTest extends TestCase
{
    public function test_accepts_decimal_points_with_one_decimal_place(): void
    {
        $request = new UpdateRaceRequest();
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
        $request = new UpdateRaceRequest();
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
        $request = new UpdateRaceRequest();
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

    public function test_validates_exact_payload_from_error_report(): void
    {
        $request = new UpdateRaceRequest();
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
