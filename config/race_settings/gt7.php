<?php

declare(strict_types=1);

return [
    'weather_conditions' => [
        ['value' => 'clear', 'label' => 'Clear/Dry'],
        ['value' => 'wet', 'label' => 'Wet/Rain'],
        ['value' => 'dynamic', 'label' => 'Dynamic Weather'],
    ],

    'tire_restrictions' => [
        ['value' => 'any', 'label' => 'Any Compound'],
        ['value' => 'soft_only', 'label' => 'Soft Only'],
        ['value' => 'medium_only', 'label' => 'Medium Only'],
        ['value' => 'hard_only', 'label' => 'Hard Only'],
        ['value' => 'multiple_required', 'label' => 'Multiple Compounds Required'],
    ],

    'fuel_usage' => [
        ['value' => 'standard', 'label' => 'Standard'],
        ['value' => 'limited', 'label' => 'Limited Fuel'],
        ['value' => 'unlimited', 'label' => 'Unlimited'],
    ],

    'damage_model' => [
        ['value' => 'off', 'label' => 'Off (No Damage)'],
        ['value' => 'visual', 'label' => 'Visual Only'],
        ['value' => 'mechanical', 'label' => 'Mechanical Damage'],
        ['value' => 'full', 'label' => 'Full Damage'],
        ['value' => 'simulation', 'label' => 'Simulation (Realistic)'],
    ],

    'assists_restrictions' => [
        ['value' => 'any', 'label' => 'Any Assists Allowed'],
        ['value' => 'limited', 'label' => 'Limited Assists (TCS, ABS only)'],
        ['value' => 'none', 'label' => 'No Assists'],
    ],
];
