<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $notification_type
 * @property string $channel
 * @property string|null $recipient
 * @property string|null $subject
 * @property string|null $body
 * @property array<string, mixed>|null $metadata
 * @property string $status
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $sent_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class NotificationLogEloquent extends Model
{
    use HasFactory;

    protected $table = 'notification_logs';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'notification_type',
        'channel',
        'recipient',
        'subject',
        'body',
        'metadata',
        'status',
        'error_message',
        'sent_at',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
