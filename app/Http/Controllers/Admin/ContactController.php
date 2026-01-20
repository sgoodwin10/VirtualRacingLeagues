<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Contact\Services\ContactApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ContactController extends Controller
{
    public function __construct(
        private readonly ContactApplicationService $contactService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $filters */
        /** @phpstan-ignore-next-line */
        $filters = $request->only(['status', 'source', 'reason', 'search']);

        /** @phpstan-ignore-next-line */
        $page = (int) ($request->input('page') ?? 1);
        /** @phpstan-ignore-next-line */
        $perPage = (int) ($request->input('per_page') ?? 20);

        $result = $this->contactService->getContacts(
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
        $contact = $this->contactService->getContactById($id);

        if ($contact === null) {
            return ApiResponse::notFound('Contact not found');
        }

        return ApiResponse::success($contact->toArray());
    }

    public function markRead(int $id): JsonResponse
    {
        $contact = $this->contactService->markAsRead($id);

        if ($contact === null) {
            return ApiResponse::notFound('Contact not found');
        }

        return ApiResponse::success($contact->toArray(), 'Contact marked as read');
    }

    public function markResponded(int $id): JsonResponse
    {
        $contact = $this->contactService->markAsResponded($id);

        if ($contact === null) {
            return ApiResponse::notFound('Contact not found');
        }

        return ApiResponse::success($contact->toArray(), 'Contact marked as responded');
    }

    public function archive(int $id): JsonResponse
    {
        $contact = $this->contactService->archive($id);

        if ($contact === null) {
            return ApiResponse::notFound('Contact not found');
        }

        return ApiResponse::success($contact->toArray(), 'Contact archived');
    }
}
