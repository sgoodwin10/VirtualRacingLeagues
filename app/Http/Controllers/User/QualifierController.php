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
use App\Http\Requests\User\CreateQualifierRequest;
use App\Http\Requests\User\UpdateQualifierRequest;
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

            return ApiResponse::success($qualifier === null ? null : $qualifier->toArray());
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve qualifier', null, 500);
        }
    }

    public function store(CreateQualifierRequest $request, int $roundId): JsonResponse
    {
        try {
            $data = CreateQualifierData::from($request->validated());
            $userId = $request->user()->id;
            $qualifierData = $this->qualifierService->createQualifier($data, $roundId, $userId);

            return ApiResponse::created($qualifierData->toArray());
        } catch (QualifierAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function update(UpdateQualifierRequest $request, int $qualifierId): JsonResponse
    {
        try {
            $data = UpdateQualifierData::from($request->validated());
            $userId = $request->user()->id;
            $qualifierData = $this->qualifierService->updateQualifier($qualifierId, $data, $userId);

            return ApiResponse::success($qualifierData->toArray());
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
