<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Helpers\ApiResponse;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;

/**
 * Request for listing activity logs.
 *
 * Validates and authorizes access to league activity logs.
 */
class ListActivityLogsRequest extends FormRequest
{
    private const DEFAULT_LIMIT = 50;
    private const MAX_LIMIT = 100;
    private const DEFAULT_PAGE = 1;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var League $league */
        $league = $this->route('league');

        return $league->owner_user_id === auth()->id();
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            ApiResponse::forbidden('You do not have permission to view this league\'s activities.')
        );
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::validationError($validator->errors())
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'limit' => 'nullable|integer|min:1|max:' . self::MAX_LIMIT,
            'page' => 'nullable|integer|min:1',
            'entity_type' => 'nullable|string|max:255',
            'action' => 'nullable|string|max:255',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ];
    }

    /**
     * Get the validated limit with defaults applied.
     */
    public function getLimit(): int
    {
        return (int) $this->input('limit', self::DEFAULT_LIMIT);
    }

    /**
     * Get the validated page with defaults applied.
     */
    public function getPage(): int
    {
        return max((int) $this->input('page', self::DEFAULT_PAGE), 1);
    }

    /**
     * Get the validated entity type filter.
     */
    public function getEntityType(): ?string
    {
        return $this->input('entity_type');
    }

    /**
     * Get the validated action filter.
     */
    public function getAction(): ?string
    {
        return $this->input('action');
    }

    /**
     * Get the validated from_date filter.
     */
    public function getFromDate(): ?Carbon
    {
        $fromDate = $this->input('from_date');

        return $fromDate !== null ? Carbon::parse($fromDate) : null;
    }

    /**
     * Get the validated to_date filter.
     */
    public function getToDate(): ?Carbon
    {
        $toDate = $this->input('to_date');

        return $toDate !== null ? Carbon::parse($toDate) : null;
    }

    /**
     * Get the offset for pagination.
     */
    public function getOffset(): int
    {
        return ($this->getPage() - 1) * $this->getLimit();
    }

    /**
     * Get all filters as an array.
     *
     * @return array<string, mixed>
     */
    public function getFilters(): array
    {
        return [
            'entity_type' => $this->getEntityType(),
            'action' => $this->getAction(),
            'from_date' => $this->getFromDate(),
            'to_date' => $this->getToDate(),
            'limit' => $this->getLimit(),
            'offset' => $this->getOffset(),
        ];
    }
}
