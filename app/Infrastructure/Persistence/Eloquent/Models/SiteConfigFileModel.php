<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Eloquent model for site_config_files table.
 *
 * @property int $id
 * @property int $site_config_id
 * @property string $file_type
 * @property string $file_name
 * @property string $file_path
 * @property string $storage_disk
 * @property string $mime_type
 * @property int $file_size File size in bytes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel $siteConfig
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereFileName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereFileSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereFileType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereMimeType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereSiteConfigId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereStorageDisk($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigFileModel whereUpdatedAt($value)
 */
class SiteConfigFileModel extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'site_config_files';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'site_config_id',
        'file_type',
        'file_name',
        'file_path',
        'storage_disk',
        'mime_type',
        'file_size',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    /**
     * Get the site configuration this file belongs to.
     *
     * @return BelongsTo<SiteConfigModel, $this>
     */
    public function siteConfig(): BelongsTo
    {
        return $this->belongsTo(SiteConfigModel::class, 'site_config_id');
    }
}
