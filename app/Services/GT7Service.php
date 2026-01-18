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
     * Get GT7 user profile by PSN account ID
     *
     * @return array<string, mixed>|null
     */
    public function getUserProfileByOnlineId(string $onlineId, ?string $accountId = null): ?array
    {
        try {
            // Use account_id which is the PSN Account ID from Universal Search
            $payload = [];
            if ($accountId !== null) {
                $payload['account_id'] = $accountId;
            } else {
                $payload['np_online_id'] = $onlineId;
            }

            $response = $this->client->post("{$this->baseUrl}/user/get_user_profile", [
                'headers' => [
                    'Authorization' => "Bearer {$this->bearerToken}",
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
            ]);

            $body = (string) $response->getBody();
            $statusCode = $response->getStatusCode();

            if ($statusCode !== 200) {
                $errorData = json_decode($body, true);
                $errorCode = $errorData['error']['code'] ?? 'unknown';

                // Error -1358757886 typically means token expired or unauthorized
                if ($errorCode === -1358757886) {
                    Log::warning('GT7 token may be expired', [
                        'status' => $statusCode,
                        'error_code' => $errorCode,
                    ]);
                }

                Log::warning('GT7 profile lookup failed', [
                    'online_id' => $onlineId,
                    'account_id' => $accountId,
                    'status' => $statusCode,
                    'error_code' => $errorCode,
                ]);
                return null;
            }

            $data = json_decode($body, true);

            // Verify we got the right user
            $returnedOnlineId = $data['result']['np_online_id'] ?? null;
            if ($returnedOnlineId !== null && strtolower($returnedOnlineId) !== strtolower($onlineId)) {
                Log::warning('GT7 returned different user profile', [
                    'requested' => $onlineId,
                    'returned' => $returnedOnlineId,
                ]);
                return null;
            }

            return $data;
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
     *
     * @return array<string, mixed>|null
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
     *
     * @return array<string, mixed>|null
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
        return match ($driverRating) {
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
        return match ($safetyRating) {
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
