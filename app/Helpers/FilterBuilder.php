<?php

declare(strict_types=1);

namespace App\Helpers;

class FilterBuilder
{
    /**
     * Build filters array from validated request data.
     * Only includes non-empty values.
     *
     * @param  array<string, mixed>  $validated
     * @param  array<string, mixed>  $defaults
     * @return array<string, mixed>
     */
    public static function build(array $validated, array $defaults = []): array
    {
        $filters = $defaults;

        foreach ($validated as $key => $value) {
            if ($value !== null && $value !== '' && $value !== []) {
                $filters[$key] = $value;
            }
        }

        return $filters;
    }

    /**
     * Build filters with mapping (e.g., 'sort_field' => 'order_by').
     *
     * @param  array<string, mixed>  $validated
     * @param  array<string, string>  $mapping
     * @param  array<string, mixed>  $defaults
     * @return array<string, mixed>
     */
    public static function buildWithMapping(array $validated, array $mapping, array $defaults = []): array
    {
        $filters = $defaults;

        foreach ($validated as $key => $value) {
            if ($value !== null && $value !== '' && $value !== []) {
                $targetKey = $mapping[$key] ?? $key;
                $filters[$targetKey] = $value;
            }
        }

        return $filters;
    }
}
