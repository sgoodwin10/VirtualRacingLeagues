<?php

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Services\GoogleSheetsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleSheetsController extends Controller
{
    public function __construct(
        private readonly GoogleSheetsService $googleSheetsService
    ) {
    }

    /**
     * Fetch a Google Sheet as CSV
     */
    public function fetchAsCsv(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'string', 'url', 'regex:/docs\.google\.com\/spreadsheets/'],
        ], [
            'url.regex' => 'Please enter a valid Google Sheets URL',
        ]);

        try {
            $csv = $this->googleSheetsService->fetchSheetAsCsv($validated['url']);

            return ApiResponse::success([
                'csv' => $csv,
            ]);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 400);
        }
    }
}
