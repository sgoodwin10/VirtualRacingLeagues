<?php

declare(strict_types=1);

namespace App\Application\Activity\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for league activity log entries.
 *
 * Maps Spatie activity log data to a structured format
 * with computed fields for easier frontend consumption.
 */
class LeagueActivityData extends Data
{
    public function __construct(
        public int $id,
        public string $log_name,
        public string $description,
        public ?string $subject_type,
        public ?int $subject_id,
        public ?string $causer_type,
        public ?int $causer_id,
        public ?string $causer_name,
        /** @var array<string, mixed> */
        public array $properties,
        public ?string $event,
        public string $created_at,
        // Computed fields from properties
        public ?string $entity_type = null,
        public ?int $entity_id = null,
        public ?string $entity_name = null,
        public ?string $action = null,
    ) {
        // Auto-populate computed fields from properties if not already set
        if ($this->entity_type === null && isset($properties['entity_type'])) {
            $this->entity_type = $properties['entity_type'];
        }
        if ($this->entity_id === null && isset($properties['entity_id'])) {
            $this->entity_id = (int) $properties['entity_id'];
        }
        if ($this->entity_name === null && isset($properties['entity_name'])) {
            $this->entity_name = $properties['entity_name'];
        }
        if ($this->action === null && isset($properties['action'])) {
            $this->action = $properties['action'];
        }
    }
}
