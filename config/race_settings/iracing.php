<?php

declare(strict_types=1);

return [
    'weather_conditions' => [
        ['value' => 'clear', 'label' => 'Clear'],
        ['value' => 'partly_cloudy', 'label' => 'Partly Cloudy'],
        ['value' => 'overcast', 'label' => 'Overcast'],
        ['value' => 'rain', 'label' => 'Rain'],
        ['value' => 'dynamic', 'label' => 'Dynamic Weather'],
    ],

    'tire_restrictions' => [
        ['value' => 'fixed', 'label' => 'Fixed Setup'],
        ['value' => 'open', 'label' => 'Open Setup'],
    ],

    'fuel_usage' => [
        ['value' => 'realistic', 'label' => 'Realistic'],
    ],

    'damage_model' => [
        ['value' => 'off', 'label' => 'Off'],
        ['value' => 'light', 'label' => 'Light Damage'],
        ['value' => 'full', 'label' => 'Full Damage'],
    ],

    'assists_restrictions' => [
        ['value' => 'any', 'label' => 'Any Assists'],
        ['value' => 'limited', 'label' => 'Limited Assists'],
        ['value' => 'none', 'label' => 'No Assists (Realistic)'],
    ],
];
