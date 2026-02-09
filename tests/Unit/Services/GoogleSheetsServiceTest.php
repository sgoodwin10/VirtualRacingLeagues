<?php

namespace Tests\Unit\Services;

use App\Services\GoogleSheetsService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class GoogleSheetsServiceTest extends TestCase
{
    #[DataProvider('validUrlProvider')]
    public function test_parse_sheet_url_extracts_sheet_id_and_gid(
        string $url,
        string $expectedSheetId,
        string $expectedGid
    ): void {
        $service = new GoogleSheetsService();
        $result = $service->parseSheetUrl($url);

        $this->assertNotNull($result);
        $this->assertSame($expectedSheetId, $result['sheet_id']);
        $this->assertSame($expectedGid, $result['gid']);
    }

    /**
     * @return array<string, array{string, string, string}>
     */
    public static function validUrlProvider(): array
    {
        return [
            'url with hash gid' => [
                'https://docs.google.com/spreadsheets/d/1ABC123xyz/edit#gid=456',
                '1ABC123xyz',
                '456',
            ],
            'url with query gid' => [
                'https://docs.google.com/spreadsheets/d/1ABC123xyz/edit?gid=789',
                '1ABC123xyz',
                '789',
            ],
            'url with ampersand gid' => [
                'https://docs.google.com/spreadsheets/d/1ABC123xyz/edit?foo=bar&gid=321',
                '1ABC123xyz',
                '321',
            ],
            'url without gid' => [
                'https://docs.google.com/spreadsheets/d/1ABC123xyz/edit',
                '1ABC123xyz',
                '0',
            ],
            'url without edit' => [
                'https://docs.google.com/spreadsheets/d/1ABC123xyz',
                '1ABC123xyz',
                '0',
            ],
        ];
    }

    #[DataProvider('invalidUrlProvider')]
    public function test_parse_sheet_url_returns_null_for_invalid_urls(string $url): void
    {
        $service = new GoogleSheetsService();
        $result = $service->parseSheetUrl($url);

        $this->assertNull($result);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidUrlProvider(): array
    {
        return [
            'not a google sheets url' => ['https://example.com'],
            'empty url' => [''],
            'invalid format' => ['https://docs.google.com/document/d/123/edit'],
        ];
    }

    public function test_build_csv_export_url(): void
    {
        $service = new GoogleSheetsService();
        $url = $service->buildCsvExportUrl('1ABC123xyz', '456');

        $this->assertSame(
            'https://docs.google.com/spreadsheets/d/1ABC123xyz/export?format=csv&gid=456',
            $url
        );
    }

    public function test_build_csv_export_url_with_default_gid(): void
    {
        $service = new GoogleSheetsService();
        $url = $service->buildCsvExportUrl('1ABC123xyz');

        $this->assertSame(
            'https://docs.google.com/spreadsheets/d/1ABC123xyz/export?format=csv&gid=0',
            $url
        );
    }

    public function test_fetch_sheet_as_csv_throws_exception_for_invalid_url(): void
    {
        $service = new GoogleSheetsService();

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid Google Sheets URL format');

        $service->fetchSheetAsCsv('https://example.com');
    }
}
