<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Notification\Services\NotificationApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class NotificationLogController extends Controller
{
    public function __construct(
        private readonly NotificationApplicationService $notificationService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $filters */
        /** @phpstan-ignore-next-line */
        $filters = $request->only(['type', 'channel', 'status', 'date_from', 'date_to', 'search']);

        /** @phpstan-ignore-next-line */
        $page = (int) ($request->input('page') ?? 1);
        /** @phpstan-ignore-next-line */
        $perPage = (int) ($request->input('per_page') ?? 20);

        $result = $this->notificationService->getNotificationLogs(
            filters: $filters,
            page: $page,
            perPage: $perPage
        );

        return ApiResponse::paginated(
            $result['data'],
            [
                'total' => $result['total'],
                'current_page' => $result['page'],
                'per_page' => $result['per_page'],
                'last_page' => $result['last_page'],
            ]
        );
    }

    public function show(int $id): JsonResponse
    {
        $log = $this->notificationService->getNotificationById($id);

        if ($log === null) {
            return ApiResponse::notFound('Notification log not found');
        }

        return ApiResponse::success($log->toArray());
    }
}
