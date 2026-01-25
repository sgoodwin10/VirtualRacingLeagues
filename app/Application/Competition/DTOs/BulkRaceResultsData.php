<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;

final class BulkRaceResultsData extends Data
{
    /**
     * @param  DataCollection<int, CreateRaceResultData>  $results
     */
    public function __construct(
        #[DataCollectionOf(CreateRaceResultData::class)]
        public DataCollection $results,
    ) {
    }
}
