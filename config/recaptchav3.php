<?php

return [
    'origin' => env('RECAPTCHAV3_ORIGIN', 'https://www.google.com/recaptcha'),
    'sitekey' => env('RECAPTCHAV3_SITEKEY', ''),
    'secret' => env('RECAPTCHAV3_SECRET', ''),
    'locale' => env('RECAPTCHAV3_LOCALE', 'en'),

    // Custom additions
    'enabled' => env('RECAPTCHAV3_ENABLED', true),
    'min_score' => env('RECAPTCHAV3_MIN_SCORE', 0.5),
];
