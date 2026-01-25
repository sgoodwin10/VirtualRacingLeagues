<?php

declare(strict_types=1);

namespace App\Helpers;

use Illuminate\Http\Request;

class PaginationHelper
{
    /**
     * Build pagination links for API responses.
     *
     * @param  Request  $request  The current HTTP request
     * @param  int  $currentPage  Current page number
     * @param  int  $lastPage  Last page number
     * @return array{first: string, last: string, prev: string|null, next: string|null} Pagination links
     */
    public static function buildLinks(Request $request, int $currentPage, int $lastPage): array
    {
        /** @var string $baseUrl */
        $baseUrl = $request->url(); // @phpstan-ignore-line
        /** @var array<string, mixed> $queryParams */
        $queryParams = $request->except('page'); // @phpstan-ignore-line

        return [
            'first' => $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1])),
            'last' => $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage])),
            'prev' => $currentPage > 1
                ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
                : null,
            'next' => $currentPage < $lastPage
                ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
                : null,
        ];
    }
}
