<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class GoogleSheetsService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'verify' => true,
            'http_errors' => false,
        ]);
    }

    /**
     * Extract sheet ID and GID from a Google Sheets URL
     *
     * Supported formats:
     * - https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
     * - https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?gid={GID}
     * - https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
     * - https://docs.google.com/spreadsheets/d/{SHEET_ID}
     *
     * @return array{sheet_id: string, gid: string}|null
     */
    public function parseSheetUrl(string $url): ?array
    {
        // Match the sheet ID from the URL
        $pattern = '/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/';
        if (!preg_match($pattern, $url, $matches)) {
            return null;
        }

        $sheetId = $matches[1];

        // Extract GID if present (defaults to 0 for first sheet)
        $gid = '0';
        if (preg_match('/[#?&]gid=(\d+)/', $url, $gidMatches)) {
            $gid = $gidMatches[1];
        }

        return [
            'sheet_id' => $sheetId,
            'gid' => $gid,
        ];
    }

    /**
     * Build the CSV export URL for a Google Sheet
     */
    public function buildCsvExportUrl(string $sheetId, string $gid = '0'): string
    {
        return "https://docs.google.com/spreadsheets/d/{$sheetId}/export?format=csv&gid={$gid}";
    }

    /**
     * Fetch a public Google Sheet as CSV
     *
     * @throws \Exception If the sheet cannot be fetched
     */
    public function fetchSheetAsCsv(string $url): string
    {
        $parsed = $this->parseSheetUrl($url);
        if ($parsed === null) {
            throw new \InvalidArgumentException('Invalid Google Sheets URL format');
        }

        $csvUrl = $this->buildCsvExportUrl($parsed['sheet_id'], $parsed['gid']);

        try {
            $response = $this->client->get($csvUrl, [
                'headers' => [
                    'Accept' => 'text/csv',
                ],
            ]);

            $statusCode = $response->getStatusCode();

            if ($statusCode === 404) {
                throw new \Exception('Google Sheet not found. Make sure the sheet exists and is publicly accessible.');
            }

            if ($statusCode !== 200) {
                Log::warning('Google Sheets fetch failed', [
                    'url' => $url,
                    'status' => $statusCode,
                ]);
                throw new \Exception('Failed to fetch Google Sheet. Please check that the sheet is publicly shared.');
            }

            $body = (string) $response->getBody();

            if (empty($body)) {
                throw new \Exception('Google Sheet is empty');
            }

            // Check if we got HTML instead of CSV (happens when sheet is not public)
            if (str_starts_with(trim($body), '<!DOCTYPE') || str_starts_with(trim($body), '<html')) {
                throw new \Exception(
                    'Cannot access Google Sheet. Please make sure the sheet is shared publicly ' .
                    '(Anyone with the link can view).'
                );
            }

            return $body;
        } catch (GuzzleException $e) {
            Log::error('Google Sheets fetch exception', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to connect to Google Sheets. Please try again.');
        }
    }
}
