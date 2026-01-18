<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

final class ImportResultData extends Data
{
    /**
     * @param int $success_count Number of drivers successfully imported
     * @param int $skipped_count Number of drivers skipped (already exist in league)
     * @param array<int, array{row: int, message: string}> $errors Validation or processing errors
     */
    public function __construct(
        public readonly int $success_count,
        public readonly int $skipped_count,
        public readonly array $errors
    ) {
    }

    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }

    public function errorCount(): int
    {
        return count($this->errors);
    }
}
