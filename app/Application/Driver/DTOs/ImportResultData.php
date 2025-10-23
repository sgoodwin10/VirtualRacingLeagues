<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

final class ImportResultData extends Data
{
    /**
     * @param int $success_count
     * @param array<int, array{row: int, message: string}> $errors
     */
    public function __construct(
        public readonly int $success_count,
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
