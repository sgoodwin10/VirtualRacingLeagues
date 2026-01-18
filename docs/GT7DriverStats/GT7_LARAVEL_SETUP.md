# Gran Turismo 7 API Integration - Laravel Setup Guide

This guide will help you build a complete Laravel application to query the Gran Turismo 7 API, including PSN user lookup and GT7 player statistics.

## Architecture Overview

```
PSN ID (Username) 
    ↓ [PSN Universal Search]
PSN Account ID + Online ID
    ↓ [GT7 User Profile API]
GT7 User GUID
    ↓ [GT7 Stats API]
Player Statistics (DR, SR, Race Data)
```

## Prerequisites

- PHP 8.1 or higher
- Laravel 10.x or 11.x
- Composer
- Valid PSN Account with NPSSO token
- Gran Turismo 7 Bearer token

---

## Step 1: Installation

```bash
# Install Guzzle HTTP client
composer require guzzlehttp/guzzle

# Clear config cache
php artisan config:clear
```

---

## Step 2: Environment Configuration

### `.env`
Add these to your `.env` file:

```env
NPSSO_TOKEN=your_npsso_token_here
GT7_BEARER_TOKEN=your_gt7_bearer_token_here
```

### `config/services.php`
Add PSN and GT7 configuration:

```php
<?php

return [
    // ... existing services

    'psn' => [
        'npsso_token' => env('NPSSO_TOKEN'),
        'client_id' => 'ac8d161a-d966-4728-b0ea-ffec22f69edc',
        'client_secret' => 'DE3803211D3f4FA296AD1C6811Bb1d1B',
    ],

    'gt7' => [
        'bearer_token' => env('GT7_BEARER_TOKEN'),
        'api_base_url' => env('GT7_API_BASE_URL', 'https://web-api.gt7.game.gran-turismo.com'),
    ],
];
```

---

## Step 3: Create Service Classes

### Create Services Directory
```bash
mkdir -p app/Services
```

### `app/Services/PSNService.php`

```php
<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PSNService
{
    private Client $client;
    private string $npssoToken;
    private ?string $accessToken = null;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'verify' => true,
            'http_errors' => false,
        ]);
        
        $this->npssoToken = config('services.psn.npsso_token');
        
        if (empty($this->npssoToken)) {
            throw new \Exception('NPSSO token not configured. Please set NPSSO_TOKEN in .env');
        }
    }

    /**
     * Get access token from NPSSO (cached for 1 hour)
     */
    public function getAccessToken(): string
    {
        return Cache::remember('psn_access_token', 3600, function () {
            return $this->fetchNewAccessToken();
        });
    }

    /**
     * Fetch a new access token
     */
    private function fetchNewAccessToken(): string
    {
        try {
            // Step 1: Exchange NPSSO for access code
            $accessCode = $this->exchangeNpssoForCode();
            
            // Step 2: Exchange access code for access token
            $tokenData = $this->exchangeCodeForToken($accessCode);
            
            return $tokenData['access_token'];
            
        } catch (GuzzleException $e) {
            Log::error('PSN authentication failed', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw new \Exception('Failed to authenticate with PSN: ' . $e->getMessage());
        }
    }

    /**
     * Exchange NPSSO for access code
     */
    private function exchangeNpssoForCode(): string
    {
        $response = $this->client->get('https://ca.account.sony.com/api/authz/v3/oauth/authorize', [
            'query' => [
                'access_type' => 'offline',
                'client_id' => config('services.psn.client_id'),
                'redirect_uri' => 'com.playstation.PlayStationApp://redirect',
                'response_type' => 'code',
                'scope' => 'psn:mobile.v1 psn:clientapp',
            ],
            'headers' => [
                'Cookie' => "npsso={$this->npssoToken}",
            ],
            'allow_redirects' => false,
        ]);

        $statusCode = $response->getStatusCode();
        
        // Check for redirect (302)
        if ($statusCode === 302) {
            $location = $response->getHeader('Location')[0] ?? '';
            if (preg_match('/code=([^&]+)/', $location, $matches)) {
                return $matches[1];
            }
        }

        // Check response body
        $body = (string) $response->getBody();
        if (preg_match('/code=([^&]+)/', $body, $matches)) {
            return $matches[1];
        }

        throw new \Exception('Failed to extract access code from PSN response. NPSSO may be invalid or expired.');
    }

    /**
     * Exchange access code for bearer token
     */
    private function exchangeCodeForToken(string $code): array
    {
        $response = $this->client->post('https://ca.account.sony.com/api/authz/v3/oauth/token', [
            'headers' => [
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'form_params' => [
                'code' => $code,
                'redirect_uri' => 'com.playstation.PlayStationApp://redirect',
                'grant_type' => 'authorization_code',
                'token_format' => 'jwt',
            ],
            'auth' => [
                config('services.psn.client_id'),
                config('services.psn.client_secret'),
            ],
        ]);

        if ($response->getStatusCode() !== 200) {
            throw new \Exception('Failed to exchange code for token. Status: ' . $response->getStatusCode());
        }

        $data = json_decode($response->getBody(), true);
        
        if (!isset($data['access_token'])) {
            throw new \Exception('No access token in response');
        }

        return $data;
    }

    /**
     * Search for a user by PSN ID (username)
     */
    public function searchUserByPsnId(string $psnId): array
    {
        $accessToken = $this->getAccessToken();

        try {
            $response = $this->client->get('https://m.np.playstation.com/api/search/v1/universalSearch', [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                ],
                'query' => [
                    'searchQuery' => $psnId,
                    'domainRequests' => json_encode([
                        [
                            'domain' => 'SocialAllAccounts',
                        ],
                    ]),
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                return [
                    'found' => false,
                    'error' => 'PSN API returned status: ' . $response->getStatusCode(),
                ];
            }

            $data = json_decode($response->getBody(), true);
            
            if (empty($data['domainResponses'][0]['results'])) {
                return [
                    'found' => false,
                    'message' => 'User not found',
                ];
            }

            $results = [];
            foreach ($data['domainResponses'][0]['results'] as $result) {
                $results[] = [
                    'account_id' => $result['socialMetadata']['accountId'] ?? null,
                    'online_id' => $result['socialMetadata']['onlineId'] ?? null,
                    'avatar_url' => $result['socialMetadata']['avatarUrl'] ?? null,
                    'is_plus' => $result['socialMetadata']['isPsPlus'] ?? false,
                ];
            }

            return [
                'found' => true,
                'count' => count($results),
                'users' => $results,
            ];

        } catch (GuzzleException $e) {
            Log::error('PSN search failed', [
                'psn_id' => $psnId,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'found' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get user profile by account ID
     */
    public function getUserProfile(string $accountId): ?array
    {
        $accessToken = $this->getAccessToken();

        try {
            $response = $this->client->get("https://m.np.playstation.com/api/userProfile/v1/internal/users/{$accountId}/profiles", [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                return null;
            }

            return json_decode($response->getBody(), true);

        } catch (GuzzleException $e) {
            Log::error('Failed to get user profile', [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }
}
```

### `app/Services/GT7Service.php`

```php
<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class GT7Service
{
    private Client $client;
    private string $bearerToken;
    private string $baseUrl;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'verify' => true,
            'http_errors' => false,
        ]);
        
        $this->bearerToken = config('services.gt7.bearer_token');
        $this->baseUrl = config('services.gt7.api_base_url');
        
        if (empty($this->bearerToken)) {
            throw new \Exception('GT7 bearer token not configured. Please set GT7_BEARER_TOKEN in .env');
        }
    }

    /**
     * Get GT7 user profile by PSN online ID
     */
    public function getUserProfileByOnlineId(string $onlineId): ?array
    {
        try {
            $response = $this->client->post("{$this->baseUrl}/user/get_user_profile", [
                'headers' => [
                    'Authorization' => "Bearer {$this->bearerToken}",
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'np_online_id' => $onlineId,
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                Log::warning('GT7 profile lookup failed', [
                    'online_id' => $onlineId,
                    'status' => $response->getStatusCode(),
                    'body' => (string) $response->getBody(),
                ]);
                return null;
            }

            return json_decode($response->getBody(), true);

        } catch (GuzzleException $e) {
            Log::error('GT7 profile lookup exception', [
                'online_id' => $onlineId,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    /**
     * Get GT7 user profile by user ID (GUID)
     */
    public function getUserProfileByUserId(string $userId): ?array
    {
        try {
            $response = $this->client->post("{$this->baseUrl}/user/get_user_profile", [
                'headers' => [
                    'Authorization' => "Bearer {$this->bearerToken}",
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'user_id' => $userId,
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                return null;
            }

            return json_decode($response->getBody(), true);

        } catch (GuzzleException $e) {
            Log::error('GT7 profile lookup by user_id failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    /**
     * Get GT7 stats for a user
     */
    public function getUserStats(string $userId, ?int $year = null, ?int $month = null): ?array
    {
        if ($year === null) {
            $year = (int) date('Y');
        }
        if ($month === null) {
            $month = (int) date('n');
        }

        try {
            $response = $this->client->post("{$this->baseUrl}/stats/get", [
                'headers' => [
                    'Authorization' => "Bearer {$this->bearerToken}",
                    'Content-Type' => 'application/json',
                    'Referer' => 'https://www.gran-turismo.com/',
                ],
                'json' => [
                    'user_id' => $userId,
                    'year' => $year,
                    'month' => $month,
                ],
            ]);

            if ($response->getStatusCode() !== 200) {
                Log::warning('GT7 stats lookup failed', [
                    'user_id' => $userId,
                    'status' => $response->getStatusCode(),
                ]);
                return null;
            }

            return json_decode($response->getBody(), true);

        } catch (GuzzleException $e) {
            Log::error('GT7 stats lookup exception', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    /**
     * Calculate actual DR points from driver rating and ratio
     */
    public function calculateDRPoints(int $driverRating, float $drPointRatio): int
    {
        // DR brackets (0-based, so 1=E, 2=D, 3=C, 4=B, 5=A, 6=A+)
        $brackets = [
            1 => ['min' => 0, 'max' => 4000],      // E
            2 => ['min' => 4000, 'max' => 10000],  // D
            3 => ['min' => 10000, 'max' => 20000], // C
            4 => ['min' => 20000, 'max' => 30000], // B
            5 => ['min' => 30000, 'max' => 50000], // A
            6 => ['min' => 50000, 'max' => 75000], // A+
        ];

        if (!isset($brackets[$driverRating])) {
            return 0;
        }

        $bracket = $brackets[$driverRating];
        $range = $bracket['max'] - $bracket['min'];
        
        return (int) ($bracket['min'] + ($range * $drPointRatio));
    }

    /**
     * Get driver rating letter from number
     */
    public function getDRLetter(int $driverRating): string
    {
        return match($driverRating) {
            1 => 'E',
            2 => 'D',
            3 => 'C',
            4 => 'B',
            5 => 'A',
            6 => 'A+',
            default => 'Unknown',
        };
    }

    /**
     * Get safety rating letter from number
     */
    public function getSRLetter(int $safetyRating): string
    {
        return match($safetyRating) {
            1 => 'E',
            2 => 'D',
            3 => 'C',
            4 => 'B',
            5 => 'A',
            6 => 'S',
            default => 'Unknown',
        };
    }
}
```

---

## Step 4: Create Console Commands

### Command 1: Search PSN User

```bash
php artisan make:command SearchPsnUser
```

### `app/Console/Commands/SearchPsnUser.php`

```php
<?php

namespace App\Console\Commands;

use App\Services\PSNService;
use Illuminate\Console\Command;

class SearchPsnUser extends Command
{
    protected $signature = 'psn:search {psn_id : The PSN ID/username to search for}';
    protected $description = 'Search for a PSN user by their PSN ID';

    public function handle(PSNService $psnService): int
    {
        $psnId = $this->argument('psn_id');
        
        $this->info("🔍 Searching for PSN user: {$psnId}");
        $this->newLine();

        try {
            $result = $psnService->searchUserByPsnId($psnId);

            if (!$result['found']) {
                $this->error('❌ User not found!');
                if (isset($result['error'])) {
                    $this->error("Error: {$result['error']}");
                }
                return self::FAILURE;
            }

            $this->info("✅ Found {$result['count']} user(s):");
            $this->newLine();

            foreach ($result['users'] as $index => $user) {
                $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                $this->line("Result #" . ($index + 1));
                $this->table(
                    ['Field', 'Value'],
                    [
                        ['Online ID', $user['online_id']],
                        ['Account ID', $user['account_id']],
                        ['Avatar URL', $user['avatar_url'] ?: 'N/A'],
                        ['PS Plus', $user['is_plus'] ? '✓ Yes' : '✗ No'],
                    ]
                );
            }

            // If exactly one user found, get full profile
            if ($result['count'] === 1) {
                $this->newLine();
                $this->info("📋 Fetching full PSN profile...");
                
                $accountId = $result['users'][0]['account_id'];
                $profile = $psnService->getUserProfile($accountId);
                
                if ($profile) {
                    $this->info("Full Profile Data:");
                    $this->line(json_encode($profile, JSON_PRETTY_PRINT));
                } else {
                    $this->warn("Could not fetch full profile");
                }
            }

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ An error occurred: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
```

### Command 2: Lookup GT7 User

```bash
php artisan make:command LookupGT7User
```

### `app/Console/Commands/LookupGT7User.php`

```php
<?php

namespace App\Console\Commands;

use App\Services\PSNService;
use App\Services\GT7Service;
use Illuminate\Console\Command;

class LookupGT7User extends Command
{
    protected $signature = 'gt7:lookup {psn_id : The PSN ID to lookup in GT7}';
    protected $description = 'Look up a GT7 player profile by their PSN ID';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $psnId = $this->argument('psn_id');
        
        $this->info("🔍 Looking up GT7 profile for: {$psnId}");
        $this->newLine();

        try {
            // Step 1: Find PSN user
            $this->line("Step 1: Searching PSN...");
            $psnResult = $psnService->searchUserByPsnId($psnId);

            if (!$psnResult['found']) {
                $this->error('❌ PSN user not found!');
                return self::FAILURE;
            }

            if ($psnResult['count'] > 1) {
                $this->warn("⚠️  Found {$psnResult['count']} PSN users. Using the first one.");
            }

            $onlineId = $psnResult['users'][0]['online_id'];
            $accountId = $psnResult['users'][0]['account_id'];

            $this->info("✅ Found PSN user: {$onlineId}");
            $this->line("   Account ID: {$accountId}");
            $this->newLine();

            // Step 2: Get GT7 profile
            $this->line("Step 2: Fetching GT7 profile...");
            $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId);

            if (!$gt7Profile) {
                $this->error("❌ GT7 profile not found for {$onlineId}");
                $this->warn("This user may not have played Gran Turismo 7 or their profile is private.");
                return self::FAILURE;
            }

            if (!isset($gt7Profile['result'])) {
                $this->error("❌ Unexpected GT7 API response format");
                $this->line("Response: " . json_encode($gt7Profile, JSON_PRETTY_PRINT));
                return self::FAILURE;
            }

            $userId = $gt7Profile['result']['user_id'] ?? null;
            $nickname = $gt7Profile['result']['nick_name'] ?? $onlineId;
            $country = $gt7Profile['result']['country_code'] ?? 'Unknown';

            $this->info("✅ GT7 Profile Found!");
            $this->table(
                ['Field', 'Value'],
                [
                    ['GT7 User ID', $userId],
                    ['Nickname', $nickname],
                    ['Country', $country],
                    ['PSN Online ID', $gt7Profile['result']['np_online_id'] ?? 'N/A'],
                ]
            );

            $this->newLine();
            $this->info("Full GT7 Profile Data:");
            $this->line(json_encode($gt7Profile, JSON_PRETTY_PRINT));

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ An error occurred: {$e->getMessage()}");
            $this->line($e->getTraceAsString());
            return self::FAILURE;
        }
    }
}
```

### Command 3: Get GT7 Stats

```bash
php artisan make:command GetGT7Stats
```

### `app/Console/Commands/GetGT7Stats.php`

```php
<?php

namespace App\Console\Commands;

use App\Services\PSNService;
use App\Services\GT7Service;
use Illuminate\Console\Command;

class GetGT7Stats extends Command
{
    protected $signature = 'gt7:stats 
                            {psn_id : The PSN ID to get stats for}
                            {--year= : Year for stats (default: current)}
                            {--month= : Month for stats (default: current)}';
    
    protected $description = 'Get GT7 statistics for a player';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $psnId = $this->argument('psn_id');
        $year = $this->option('year');
        $month = $this->option('month');
        
        $this->info("🏁 Fetching GT7 stats for: {$psnId}");
        $this->newLine();

        try {
            // Step 1: Get PSN user
            $this->line("Step 1: Finding PSN user...");
            $psnResult = $psnService->searchUserByPsnId($psnId);

            if (!$psnResult['found']) {
                $this->error('❌ PSN user not found!');
                return self::FAILURE;
            }

            $onlineId = $psnResult['users'][0]['online_id'];
            $this->info("✅ Found: {$onlineId}");

            // Step 2: Get GT7 profile
            $this->line("Step 2: Fetching GT7 profile...");
            $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId);

            if (!$gt7Profile || !isset($gt7Profile['result']['user_id'])) {
                $this->error("❌ GT7 profile not found");
                return self::FAILURE;
            }

            $userId = $gt7Profile['result']['user_id'];
            $this->info("✅ GT7 User ID: {$userId}");
            $this->newLine();

            // Step 3: Get stats
            $this->line("Step 3: Fetching statistics...");
            $stats = $gt7Service->getUserStats($userId, $year, $month);

            if (!$stats || !isset($stats['result'])) {
                $this->error("❌ Could not fetch statistics");
                return self::FAILURE;
            }

            $result = $stats['result'];

            // Display Driver Rating
            $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->info("📊 DRIVER STATISTICS");
            $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->newLine();

            $driverRating = $result['driver_rating'] ?? 0;
            $drPointRatio = $result['dr_point_ratio'] ?? 0;
            $safetyRating = $result['safety_rating'] ?? 0;
            $srPointRatio = $result['sr_point_ratio'] ?? 0;

            $drLetter = $gt7Service->getDRLetter($driverRating);
            $srLetter = $gt7Service->getSRLetter($safetyRating);
            $drPoints = $gt7Service->calculateDRPoints($driverRating, $drPointRatio);

            $this->table(
                ['Rating Type', 'Letter', 'Points', 'Progress'],
                [
                    [
                        'Driver Rating (DR)',
                        $drLetter,
                        number_format($drPoints),
                        number_format($drPointRatio * 100, 2) . '%'
                    ],
                    [
                        'Safety Rating (SR)',
                        $srLetter,
                        '-',
                        number_format($srPointRatio * 100, 2) . '%'
                    ],
                ]
            );

            // Display race statistics
            $this->newLine();
            $this->info("🏆 RACE STATISTICS");
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Races', $result['race_count'] ?? 0],
                    ['Wins', $result['race_win'] ?? 0],
                    ['Pole Positions', $result['pole_position'] ?? 0],
                    ['Fastest Laps', $result['fastest_lap'] ?? 0],
                    ['Clean Races', $result['clean_race'] ?? 0],
                ]
            );

            // Full data dump
            $this->newLine();
            if ($this->option('verbose')) {
                $this->info("Full Stats Data:");
                $this->line(json_encode($stats, JSON_PRETTY_PRINT));
            } else {
                $this->comment("💡 Tip: Use -v flag to see full stats data");
            }

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ An error occurred: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
```

### Command 4: Complete Player Lookup (All-in-One)

```bash
php artisan make:command GT7CompletePlayerLookup
```

### `app/Console/Commands/GT7CompletePlayerLookup.php`

```php
<?php

namespace App\Console\Commands;

use App\Services\PSNService;
use App\Services\GT7Service;
use Illuminate\Console\Command;

class GT7CompletePlayerLookup extends Command
{
    protected $signature = 'gt7:player {psn_id : The PSN ID to lookup}';
    protected $description = 'Complete player lookup: PSN → GT7 Profile → Stats';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $psnId = $this->argument('psn_id');
        
        $this->info("╔═══════════════════════════════════════════════════════╗");
        $this->info("║     GRAN TURISMO 7 - COMPLETE PLAYER LOOKUP          ║");
        $this->info("╚═══════════════════════════════════════════════════════╝");
        $this->newLine();
        $this->line("Searching for: {$psnId}");
        $this->newLine();

        try {
            // Step 1: PSN Search
            $this->info("🔍 [1/3] Searching PlayStation Network...");
            $psnResult = $psnService->searchUserByPsnId($psnId);

            if (!$psnResult['found']) {
                $this->error('❌ Player not found on PSN');
                return self::FAILURE;
            }

            $onlineId = $psnResult['users'][0]['online_id'];
            $accountId = $psnResult['users'][0]['account_id'];
            
            $this->info("   ✅ PSN Account Located");
            $this->line("   → Online ID: {$onlineId}");
            $this->line("   → Account ID: {$accountId}");
            $this->newLine();

            // Step 2: GT7 Profile
            $this->info("🎮 [2/3] Fetching GT7 Profile...");
            $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId);

            if (!$gt7Profile || !isset($gt7Profile['result']['user_id'])) {
                $this->error('❌ No GT7 profile found');
                $this->warn('   This player may not have played GT7 or their profile is private.');
                return self::FAILURE;
            }

            $userId = $gt7Profile['result']['user_id'];
            $nickname = $gt7Profile['result']['nick_name'] ?? $onlineId;
            $country = $gt7Profile['result']['country_code'] ?? '??';
            
            $this->info("   ✅ GT7 Profile Found");
            $this->line("   → User ID: {$userId}");
            $this->line("   → Nickname: {$nickname}");
            $this->line("   → Country: {$country}");
            $this->newLine();

            // Step 3: Statistics
            $this->info("📊 [3/3] Retrieving Statistics...");
            $stats = $gt7Service->getUserStats($userId);

            if (!$stats || !isset($stats['result'])) {
                $this->warn('⚠️  Statistics not available');
                return self::SUCCESS;
            }

            $result = $stats['result'];
            $this->info("   ✅ Statistics Retrieved");
            $this->newLine();

            // Display Summary
            $this->info("═══════════════════════════════════════════════════════");
            $this->info("                    PLAYER SUMMARY                      ");
            $this->info("═══════════════════════════════════════════════════════");
            $this->newLine();

            $driverRating = $result['driver_rating'] ?? 0;
            $drPointRatio = $result['dr_point_ratio'] ?? 0;
            $safetyRating = $result['safety_rating'] ?? 0;

            $drLetter = $gt7Service->getDRLetter($driverRating);
            $srLetter = $gt7Service->getSRLetter($safetyRating);
            $drPoints = $gt7Service->calculateDRPoints($driverRating, $drPointRatio);

            $this->table(
                ['Category', 'Details'],
                [
                    ['Player', "{$nickname} ({$onlineId})"],
                    ['Country', $country],
                    ['Driver Rating', "{$drLetter} (" . number_format($drPoints) . " points)"],
                    ['Safety Rating', $srLetter],
                    ['Total Races', $result['race_count'] ?? 0],
                    ['Wins', $result['race_win'] ?? 0],
                    ['Win Rate', $this->calculateWinRate($result)],
                    ['Pole Positions', $result['pole_position'] ?? 0],
                    ['Fastest Laps', $result['fastest_lap'] ?? 0],
                ]
            );

            $this->newLine();
            $this->info("✨ Lookup completed successfully!");
            
            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Error: {$e->getMessage()}");
            return self::FAILURE;
        }
    }

    private function calculateWinRate(array $stats): string
    {
        $races = $stats['race_count'] ?? 0;
        $wins = $stats['race_win'] ?? 0;

        if ($races === 0) {
            return 'N/A';
        }

        $rate = ($wins / $races) * 100;
        return number_format($rate, 2) . '%';
    }
}
```

---

## Step 5: Register Service Provider (Optional but Recommended)

### `app/Providers/AppServiceProvider.php`

```php
<?php

namespace App\Providers;

use App\Services\PSNService;
use App\Services\GT7Service;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Register PSN Service as singleton
        $this->app->singleton(PSNService::class, function ($app) {
            return new PSNService();
        });

        // Register GT7 Service as singleton
        $this->app->singleton(GT7Service::class, function ($app) {
            return new GT7Service();
        });
    }

    public function boot(): void
    {
        //
    }
}
```

---

## Step 6: Testing

### Test PSN Search
```bash
php artisan psn:search "xXxPlayer123xXx"
```

Expected output:
```
🔍 Searching for PSN user: xXxPlayer123xXx

✅ Found 1 user(s):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result #1
+------------+-------------------------+
| Field      | Value                   |
+------------+-------------------------+
| Online ID  | xXxPlayer123xXx        |
| Account ID | 1234567890123456789    |
| Avatar URL | https://...            |
| PS Plus    | ✓ Yes                  |
+------------+-------------------------+
```

### Test GT7 Lookup
```bash
php artisan gt7:lookup "xXxPlayer123xXx"
```

### Test GT7 Stats
```bash
php artisan gt7:stats "xXxPlayer123xXx"

# With specific month/year
php artisan gt7:stats "xXxPlayer123xXx" --year=2024 --month=12

# Verbose output
php artisan gt7:stats "xXxPlayer123xXx" -v
```

### Test Complete Lookup
```bash
php artisan gt7:player "xXxPlayer123xXx"
```

---

## Troubleshooting

### Issue: "NPSSO token not configured"
**Solution**: Make sure you've added `NPSSO_TOKEN=...` to your `.env` file

### Issue: "Failed to authenticate with PSN"
**Solution**: Your NPSSO token may be expired. Get a new one:
1. Visit https://ca.account.sony.com/api/v1/ssocookie while logged into PSN
2. Copy the new token
3. Update your `.env` file

### Issue: "GT7 bearer token not configured"
**Solution**: Get your GT7 token:
1. Login to https://www.gran-turismo.com/
2. Visit https://www.gran-turismo.com/us/gt7/info/api/token/
3. Copy the token
4. Add to `.env`: `GT7_BEARER_TOKEN=...`

### Issue: "GT7 profile not found"
**Possible causes**:
- User hasn't played GT7
- User's GT7 profile is private
- PSN ID is correct but not linked to GT7

### Issue: Cache problems
```bash
php artisan config:clear
php artisan cache:clear
```

---

## Advanced Usage

### Batch Processing

Create a command to process multiple users:

```bash
php artisan make:command BatchLookupPlayers
```

```php
<?php

namespace App\Console\Commands;

use App\Services\PSNService;
use App\Services\GT7Service;
use Illuminate\Console\Command;

class BatchLookupPlayers extends Command
{
    protected $signature = 'gt7:batch {file : Path to file with PSN IDs (one per line)}';
    protected $description = 'Batch lookup multiple players from a file';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $filePath = $this->argument('file');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return self::FAILURE;
        }

        $psnIds = array_filter(array_map('trim', file($filePath)));
        $total = count($psnIds);

        $this->info("Processing {$total} players...");
        $this->newLine();

        $bar = $this->output->createProgressBar($total);
        $results = [];

        foreach ($psnIds as $psnId) {
            try {
                // Lookup player
                $psnResult = $psnService->searchUserByPsnId($psnId);
                
                if ($psnResult['found']) {
                    $onlineId = $psnResult['users'][0]['online_id'];
                    $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId);
                    
                    if ($gt7Profile && isset($gt7Profile['result']['user_id'])) {
                        $userId = $gt7Profile['result']['user_id'];
                        $stats = $gt7Service->getUserStats($userId);
                        
                        $results[] = [
                            'psn_id' => $psnId,
                            'found' => true,
                            'gt7_user_id' => $userId,
                            'stats' => $stats,
                        ];
                    } else {
                        $results[] = [
                            'psn_id' => $psnId,
                            'found' => false,
                            'reason' => 'No GT7 profile',
                        ];
                    }
                } else {
                    $results[] = [
                        'psn_id' => $psnId,
                        'found' => false,
                        'reason' => 'PSN user not found',
                    ];
                }

                // Rate limiting
                sleep(1);

            } catch (\Exception $e) {
                $results[] = [
                    'psn_id' => $psnId,
                    'found' => false,
                    'error' => $e->getMessage(),
                ];
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Save results
        $outputFile = 'storage/gt7_batch_results_' . time() . '.json';
        file_put_contents($outputFile, json_encode($results, JSON_PRETTY_PRINT));

        $this->info("Results saved to: {$outputFile}");

        return self::SUCCESS;
    }
}
```

---

## API Endpoints Reference

### PSN API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/authz/v3/oauth/authorize` | GET | Exchange NPSSO for code |
| `/api/authz/v3/oauth/token` | POST | Exchange code for token |
| `/api/search/v1/universalSearch` | GET | Search users |
| `/api/userProfile/v1/internal/users/{id}/profiles` | GET | Get user profile |

### GT7 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user/get_user_profile` | POST | Get GT7 profile by PSN ID or User ID |
| `/stats/get` | POST | Get player statistics |

---

## Data Models Reference

### Driver Rating (DR) Scale
```
E:  0 - 4,000 points
D:  4,000 - 10,000 points
C:  10,000 - 20,000 points
B:  20,000 - 30,000 points
A:  30,000 - 50,000 points
A+: 50,000 - 75,000 points
```

### Safety Rating (SR) Scale
```
E, D, C, B, A, S
(Similar point structure but not publicly documented)
```

---

## Next Steps

1. **Database Storage**: Create models to store player data
2. **API Routes**: Expose REST API endpoints
3. **Scheduled Jobs**: Auto-update player stats
4. **Web Interface**: Build a frontend to display data
5. **Leaderboards**: Track and rank players

---

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS**:

1. Never commit `.env` file to git
2. Never share your NPSSO or bearer tokens
3. Add `.env` to `.gitignore`
4. Tokens expire - implement refresh logic
5. Rate limit your API calls to avoid bans
6. Use dedicated PSN account for API access

---

## Support & Resources

- [PSN API Library (JavaScript)](https://github.com/achievements-app/psn-api)
- [GT Sport API Docs](https://github.com/alexpersian/gtsport-api)
- [GTPlanet Forums](https://www.gtplanet.net/forum/)
- [GTSH-Rank](https://gtsh-rank.com/)

---

## License

This code is for educational purposes. Gran Turismo is copyright Sony Interactive Entertainment and Polyphony Digital.
