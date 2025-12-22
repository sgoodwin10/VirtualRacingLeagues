<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Traits\HasMediaCollections;
use Database\Factories\SiteConfigFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;

/**
 * Eloquent model for site_configs table.
 *
 * @property int $id
 * @property string $site_name
 * @property string|null $google_tag_manager_id
 * @property string|null $google_analytics_id
 * @property string|null $google_search_console_code
 * @property string|null $discord_link
 * @property string|null $support_email
 * @property string|null $contact_email
 * @property string|null $admin_email
 * @property bool $maintenance_mode
 * @property string $timezone
 * @property bool $user_registration_enabled
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Infrastructure\Persistence\Eloquent\Models\SiteConfigFileModel> $files
 * @property-read int|null $files_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereAdminEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereContactEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereDiscordLink($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereGoogleAnalyticsId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereGoogleSearchConsoleCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereGoogleTagManagerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereMaintenanceMode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereSiteName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereSupportEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereTimezone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SiteConfigModel whereUserRegistrationEnabled($value)
 */
class SiteConfigModel extends Model implements HasMedia
{
    use HasFactory;
    use HasMediaCollections;

    /**
     * The table associated with the model.
     */
    protected $table = 'site_configs';

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return SiteConfigFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'site_name',
        'google_tag_manager_id',
        'google_analytics_id',
        'google_search_console_code',
        'discord_link',
        'support_email',
        'contact_email',
        'admin_email',
        'maintenance_mode',
        'timezone',
        'user_registration_enabled',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'maintenance_mode' => 'boolean',
            'user_registration_enabled' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the configuration files.
     *
     * @return HasMany<SiteConfigFileModel, $this>
     */
    public function files(): HasMany
    {
        return $this->hasMany(SiteConfigFileModel::class, 'site_config_id');
    }

    /**
     * Scope to get only active configuration.
     *
     * @param  Builder<SiteConfigModel>  $query
     * @return Builder<SiteConfigModel>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Register media collections for site configuration.
     *
     * @return void
     */
    public function registerMediaCollections(): void
    {
        // Site logo
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']);

        // Site favicon
        $this->addMediaCollection('favicon')
            ->singleFile()
            ->acceptsMimeTypes(['image/x-icon', 'image/png', 'image/svg+xml']);

        // Open Graph default image
        $this->addMediaCollection('og_image')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }
}
