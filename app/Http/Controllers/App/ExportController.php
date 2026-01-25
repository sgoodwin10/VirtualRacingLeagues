<?php

declare(strict_types=1);

namespace App\Http\Controllers\App;

use App\Application\Export\Services\CsvExportService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Export Controller.
 * Handles CSV export requests for race results, standings, and cross-division data.
 * Thin controller pattern (3-5 lines per method).
 */
final class ExportController extends Controller
{
    public function __construct(
        private readonly CsvExportService $csvExportService
    ) {
    }

    /**
     * Export race results as CSV.
     */
    public function exportRaceResults(int $raceId): StreamedResponse
    {
        $data = $this->csvExportService->generateRaceResultsCsv($raceId);

        return $this->streamCsv($data['headers'], $data['rows'], $data['filename']);
    }

    /**
     * Export round standings as CSV.
     */
    public function exportRoundStandings(int $roundId): StreamedResponse
    {
        $data = $this->csvExportService->generateRoundStandingsCsv($roundId);

        return $this->streamCsv($data['headers'], $data['rows'], $data['filename']);
    }

    /**
     * Export cross-division results as CSV.
     *
     * @param  string  $type  One of: 'fastest-laps', 'race-times', 'qualifying-times'
     */
    public function exportCrossDivisionResults(int $roundId, string $type): StreamedResponse|JsonResponse
    {
        if (! in_array($type, ['fastest-laps', 'race-times', 'qualifying-times'])) {
            return ApiResponse::error('Invalid type. Must be one of: fastest-laps, race-times, qualifying-times', null, 400);
        }

        $data = $this->csvExportService->generateCrossDivisionCsv($roundId, $type);

        return $this->streamCsv($data['headers'], $data['rows'], $data['filename']);
    }

    /**
     * Export season standings as CSV.
     */
    public function exportSeasonStandings(int $seasonId, ?int $divisionId = null): StreamedResponse
    {
        $data = $this->csvExportService->generateSeasonStandingsCsv($seasonId, $divisionId);

        return $this->streamCsv($data['headers'], $data['rows'], $data['filename']);
    }

    /**
     * Stream CSV data to the client.
     *
     * @param  array<string>  $headers
     * @param  array<array<mixed>>  $rows
     */
    private function streamCsv(array $headers, array $rows, string $filename): StreamedResponse
    {
        $callback = function () use ($headers, $rows): void {
            $file = fopen('php://output', 'w');
            if ($file === false) {
                return;
            }

            // Write BOM for Excel UTF-8 compatibility
            fwrite($file, "\xEF\xBB\xBF");

            // Write headers
            fputcsv($file, $headers);

            // Write rows
            foreach ($rows as $row) {
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
