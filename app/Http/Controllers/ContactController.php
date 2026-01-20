<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Application\Contact\DTOs\CreateContactData;
use App\Application\Contact\Services\ContactApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Requests\StoreContactRequest;
use Exception;
use Illuminate\Http\JsonResponse;

final class ContactController extends Controller
{
    public function __construct(
        private readonly ContactApplicationService $contactService
    ) {
    }

    public function store(StoreContactRequest $request): JsonResponse
    {
        try {
            /** @var array<string, mixed> $validated */
            $validated = $request->validated();

            /** @var string|null $ip */
            /** @phpstan-ignore-next-line */
            $ip = $request->ip();

            /** @var string|null $userAgent */
            /** @phpstan-ignore-next-line */
            $userAgent = $request->userAgent();

            $data = CreateContactData::from([
                ...$validated,
                'source' => $validated['source'] ?? 'public',
                'userId' => auth()->id(),
                'metadata' => [
                    'ip' => $ip,
                    'user_agent' => $userAgent,
                ],
            ]);

            $contact = $this->contactService->submitContact($data);

            return ApiResponse::created($contact->toArray(), 'Message sent successfully. We will get back to you soon.');
        } catch (Exception $e) {
            return ApiResponse::error(
                'Failed to send message. Please try again later.',
                null,
                500
            );
        }
    }
}
