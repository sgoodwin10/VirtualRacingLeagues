<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (Fallback)
|--------------------------------------------------------------------------
|
| This file now serves as a FALLBACK ONLY. All primary routing is handled
| by routes/subdomain.php which is loaded first.
|
| These routes will only match if subdomain routing doesn't match the request.
| This is useful for handling requests without proper subdomain configuration.
|
*/

// Fallback route - if no subdomain routing matches, show an error or redirect
Route::fallback(function () {
    return response()->json([
        'error' => 'Route not found. Please ensure you are accessing the correct subdomain.',
        'domains' => [
            'public' => 'virtualracingleagues.localhost:8000',
            'app' => 'app.virtualracingleagues.localhost:8000',
            'admin' => 'admin.virtualracingleagues.localhost:8000',
        ],
    ], 404);
});
