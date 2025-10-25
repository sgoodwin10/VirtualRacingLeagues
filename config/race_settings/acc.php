<?php

declare(strict_types=1);

return [
    'weather_conditions' => [
        ['value' => 'clear', 'label' => 'Clear'],
        ['value' => 'overcast', 'label' => 'Overcast'],
        ['value' => 'light_rain', 'label' => 'Light Rain'],
        ['value' => 'heavy_rain', 'label' => 'Heavy Rain'],
        ['value' => 'dynamic', 'label' => 'Dynamic Weather'],
    ],

    'tire_restrictions' => [
        ['value' => 'any', 'label' => 'Any Compound'],
        ['value' => 'dry_only', 'label' => 'Dry Only'],
        ['value' => 'wet_only', 'label' => 'Wet Only'],
    ],

    'fuel_usage' => [
        ['value' => 'realistic', 'label' => 'Realistic'],
        ['value' => 'unlimited', 'label' => 'Unlimited'],
    ],

    'damage_model' => [
        ['value' => 'off', 'label' => 'Off'],
        ['value' => 'reduced', 'label' => 'Reduced Damage'],
        ['value' => 'realistic', 'label' => 'Realistic Damage'],
    ],

    'assists_restrictions' => [
        ['value' => 'any', 'label' => 'Any Assists'],
        ['value' => 'stability_only', 'label' => 'Stability Control Only'],
        ['value' => 'abs_only', 'label' => 'ABS Only'],
        ['value' => 'none', 'label' => 'No Assists'],
    ],
];
