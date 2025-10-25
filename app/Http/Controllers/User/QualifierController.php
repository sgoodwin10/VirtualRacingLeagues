<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateQualifierData;
use App\Application\Competition\DTOs\UpdateQualifierData;
use App\Application\Competition\Services\QualifierApplicationService;
use App\Domain\Competition\Exceptions\QualifierAlreadyExistsException;
use App\Domain\Competition\Exceptions\QualifierNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class QualifierController extends Controller
{
    public function __construct(
        private readonly QualifierApplicationService $qualifierService,
    ) {
    }

    public function show(int $roundId): JsonResponse
    {
        try {
            $qualifier = $this->qualifierService->getQualifierByRound($roundId);

            if ($qualifier === null) {
                return ApiResponse::success(null);
            }

            return ApiResponse::success($qualifier->toArray());
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve qualifier', null, 500);
        }
    }

    public function store(CreateQualifierData $data, int $roundId): JsonResponse
    {
        try {
            $qualifier = $this->qualifierService->createQualifier($data, $roundId);
            return ApiResponse::created($qualifier->toArray());
        } catch (QualifierAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function update(UpdateQualifierData $data, int $qualifierId): JsonResponse
    {
        try {
            $qualifier = $this->qualifierService->updateQualifier($qualifierId, $data);
            return ApiResponse::success($qualifier->toArray());
        } catch (QualifierNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function destroy(int $qualifierId): JsonResponse
    {
        try {
            $this->qualifierService->deleteQualifier($qualifierId);
            return ApiResponse::success(['message' => 'Qualifier deleted successfully']);
        } catch (QualifierNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete qualifier', null, 500);
        }
    }
}
