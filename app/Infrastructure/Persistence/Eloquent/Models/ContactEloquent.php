<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $name
 * @property string $email
 * @property string $reason
 * @property string $message
 * @property string $source
 * @property bool $cc_user
 * @property string $status
 * @property array<string, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class ContactEloquent extends Model
{
    use HasFactory;

    protected $table = 'contacts';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'reason',
        'message',
        'source',
        'cc_user',
        'status',
        'metadata',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'user_id' => 'integer',
        'cc_user' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<UserEloquent, ContactEloquent>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserEloquent::class, 'user_id');
    }
}
