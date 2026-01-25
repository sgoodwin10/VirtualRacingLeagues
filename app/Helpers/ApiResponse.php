<?php

declare(strict_types=1);

namespace App\Helpers;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Create a successful JSON response.
     */
    public static function success(
        mixed $data = null,
        ?string $message = null,
        int $status = 200
    ): JsonResponse {
        $response = [
            'success' => true,
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $status);
    }

    /**
     * Create an error JSON response.
     */
    public static function error(
        string $message,
        mixed $errors = null,
        int $status = 400
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    /**
     * Create a created response.
     */
    public static function created(
        mixed $data = null,
        ?string $message = null
    ): JsonResponse {
        return self::success($data, $message ?? 'Resource created successfully', 201);
    }

    /**
     * Create a no content response.
     */
    public static function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Create a not found response.
     */
    public static function notFound(?string $message = null): JsonResponse
    {
        return self::error($message ?? 'Resource not found', null, 404);
    }

    /**
     * Create an unauthorized response.
     */
    public static function unauthorized(?string $message = null): JsonResponse
    {
        return self::error($message ?? 'Unauthorized', null, 401);
    }

    /**
     * Create a forbidden response.
     */
    public static function forbidden(?string $message = null): JsonResponse
    {
        return self::error($message ?? 'Forbidden', null, 403);
    }

    /**
     * Create a validation error response.
     */
    public static function validationError(
        mixed $errors,
        ?string $message = null
    ): JsonResponse {
        return self::error(
            $message ?? 'The given data was invalid.',
            $errors,
            422
        );
    }

    /**
     * Create a paginated JSON response.
     *
     * @param  array  $data  The paginated data items
     * @param  array  $meta  Pagination metadata (total, per_page, current_page, last_page, etc.)
     * @param  array|null  $links  Pagination links (first, last, prev, next)
     * @param  string|null  $message  Optional success message
     * @param  int  $status  HTTP status code (default: 200)
     */
    public static function paginated(
        array $data,
        array $meta,
        ?array $links = null,
        ?string $message = null,
        int $status = 200
    ): JsonResponse {
        $response = [
            'success' => true,
            'data' => $data,
            'meta' => $meta,
        ];

        if ($links !== null) {
            $response['links'] = $links;
        }

        if ($message !== null) {
            $response['message'] = $message;
        }

        return response()->json($response, $status);
    }
}
