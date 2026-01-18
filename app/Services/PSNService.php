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

    /**
     * Mobile browser user agents to rotate through (mimics PSN mobile app)
     *
     * @var array<string>
     */
    private array $userAgents = [
        'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Mobile Safari/537.36',
    ];

    public function __construct()
    {
        $userAgent = $this->userAgents[array_rand($this->userAgents)];

        $this->client = new Client([
            'timeout' => 30,
            'verify' => true,
            'http_errors' => false,
            'headers' => [
                'User-Agent' => $userAgent,
                'Accept-Language' => 'en-US,en;q=0.9',
                'Country' => 'US',
            ],
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
                'redirect_uri' => config('services.psn.redirect_uri'),
                'response_type' => 'code',
                'scope' => config('services.psn.scope'),
            ],
            'headers' => [
                'Cookie' => "npsso={$this->npssoToken}",
            ],
            'allow_redirects' => false,
        ]);

        $statusCode = $response->getStatusCode();
        $body = (string) $response->getBody();

        // Check for redirect (302)
        if ($statusCode === 302) {
            $location = $response->getHeader('Location')[0] ?? '';
            if (preg_match('/code=([^&]+)/', $location, $matches)) {
                return $matches[1];
            }
        }

        // Check response body for code
        if (preg_match('/code=([^&]+)/', $body, $matches)) {
            return $matches[1];
        }

        // Provide more specific error messages
        if ($statusCode === 401 || $statusCode === 403) {
            throw new \Exception("PSN authentication failed (HTTP {$statusCode}). NPSSO token is invalid or expired. Get a new one from: https://ca.account.sony.com/api/v1/ssocookie");
        }

        if ($statusCode === 200) {
            // Check if it's asking for login
            if (str_contains($body, 'login') || str_contains($body, 'sign-in')) {
                throw new \Exception('PSN returned login page. NPSSO token is invalid or expired.');
            }
        }

        throw new \Exception("Failed to extract access code from PSN response. Status: {$statusCode}. Check logs for details.");
    }

    /**
     * Exchange access code for bearer token
     *
     * @return array<string, mixed>
     */
    private function exchangeCodeForToken(string $code): array
    {
        $response = $this->client->post('https://ca.account.sony.com/api/authz/v3/oauth/token', [
            'headers' => [
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'form_params' => [
                'code' => $code,
                'redirect_uri' => config('services.psn.redirect_uri'),
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
     * Search for a user by PSN ID (username) using GraphQL API
     *
     * @return array<string, mixed>
     */
    public function searchUserByPsnId(string $psnId): array
    {
        $accessToken = $this->getAccessToken();

        try {
            // PSN now uses GraphQL for search
            $extensions = json_encode([
                'persistedQuery' => [
                    'version' => 1,
                    'sha256Hash' => 'ac5fb2b82c4d086ca0d272fba34418ab327a7762dd2cd620e63f175bbc5aff10',
                ],
            ]);

            $variables = json_encode([
                'searchTerm' => $psnId,
                'searchContext' => 'MobileUniversalSearchSocial',
                'displayTitleLocale' => 'en-US',
            ]);

            $response = $this->client->get('https://m.np.playstation.com/api/graphql/v1/op', [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'apollographql-client-name' => 'PlayStationApp-Android',
                    'apollographql-client-version' => '25.4.0',
                ],
                'query' => [
                    'operationName' => 'metGetContextSearchResults',
                    'variables' => $variables,
                    'extensions' => $extensions,
                ],
            ]);

            $statusCode = $response->getStatusCode();
            $body = (string) $response->getBody();

            if ($statusCode !== 200) {
                return [
                    'found' => false,
                    'error' => 'PSN API returned status: ' . $statusCode,
                ];
            }

            $data = json_decode($body, true);

            // Extract users from GraphQL response
            $results = $this->extractUsersFromGraphQLResponse($data);

            if (empty($results)) {
                return [
                    'found' => false,
                    'message' => 'User not found',
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
     * Extract user data from GraphQL response
     *
     * @param array<string, mixed>|null $data
     * @return array<int, array<string, mixed>>
     */
    private function extractUsersFromGraphQLResponse(?array $data): array
    {
        $results = [];

        if (!$data) {
            return $results;
        }

        // Navigate the GraphQL response structure
        $domainResults = $data['data']['universalContextSearch']['results'] ?? [];

        foreach ($domainResults as $domainResult) {
            if (($domainResult['domain'] ?? '') !== 'SocialAllAccounts') {
                continue;
            }

            foreach ($domainResult['searchResults'] ?? [] as $searchResult) {
                // The user data is in the 'result' key
                $player = $searchResult['result'] ?? [];

                if (empty($player)) {
                    continue;
                }

                $results[] = [
                    'account_id' => $player['accountId'] ?? null,
                    'online_id' => $player['onlineId'] ?? $player['displayName'] ?? null,
                    'avatar_url' => $player['avatarUrl'] ?? null,
                    'is_plus' => $player['isPsPlus'] ?? false,
                ];
            }
        }

        return $results;
    }

    /**
     * Get user profile by account ID
     *
     * @return array<string, mixed>|null
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
