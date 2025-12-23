<?php

declare(strict_types=1);

namespace App\Http\Controllers\App;

use App\Application\Competition\DTOs\TiebreakerRuleData;
use App\Application\Competition\Services\SeasonApplicationService;
use App\Domain\Competition\Repositories\RoundTiebreakerRuleRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\App\UpdateSeasonTiebreakerRulesRequest;
use Illuminate\Http\JsonResponse;

/**
 * Tiebreaker Rule Controller.
 *
 * Manages tiebreaker rules for resolving ties in round totals.
 */
final class TiebreakerRuleController extends Controller
{
    public function __construct(
        private readonly RoundTiebreakerRuleRepositoryInterface $tiebreakerRuleRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly SeasonApplicationService $seasonService,
    ) {
    }

    /**
     * Get all available tiebreaker rules.
     *
     * GET /api/tiebreaker-rules
     */
    public function index(): JsonResponse
    {
        $rules = $this->tiebreakerRuleRepository->getAllActive();

        $data = array_map(
            fn($rule) => TiebreakerRuleData::fromEntity($rule)->toArray(),
            $rules
        );

        return ApiResponse::success($data);
    }

    /**
     * Get tiebreaker rules configured for a specific season.
     *
     * GET /api/seasons/{seasonId}/tiebreaker-rules
     */
    public function getSeasonRules(int $seasonId): JsonResponse
    {
        try {
            $season = $this->seasonRepository->findById($seasonId);

            $configuration = $season->getTiebreakerRules();

            $data = [
                'enabled' => $season->hasTiebreakerRulesEnabled(),
                'rules' => array_map(
                    fn($rule) => [
                        'id' => $rule->id(),
                        'slug' => $rule->slug()->value(),
                        'order' => $rule->order(),
                    ],
                    $configuration->rules()
                ),
            ];

            return ApiResponse::success($data);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Update tiebreaker rules order for a season.
     *
     * PUT /api/seasons/{seasonId}/tiebreaker-rules
     */
    public function updateSeasonRules(UpdateSeasonTiebreakerRulesRequest $request, int $seasonId): JsonResponse
    {
        try {
            $validated = $request->validated();

            $this->seasonService->updateTiebreakerRulesOrder($seasonId, $validated['rules']);

            return ApiResponse::success(null, 'Tiebreaker rules updated successfully');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }
}
