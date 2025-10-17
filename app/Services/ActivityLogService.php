<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Activity;

/**
 * Service for managing activity logs.
 */
class ActivityLogService
{
    /**
     * Log a custom activity for a user.
     *
     * @param  Model|null  $causer  The user/admin causing the activity
     * @param  string  $description  Description of the activity
     * @param  Model|null  $subject  The model being acted upon
     * @param  array<string, mixed>  $properties  Additional properties to log
     * @param  string  $logName  The log name (user, admin, or custom)
     */
    public function log(
        ?Model $causer,
        string $description,
        ?Model $subject = null,
        array $properties = [],
        string $logName = 'default'
    ): Activity {
        $activityBuilder = activity($logName)
            ->causedBy($causer)
            ->withProperties($properties);

        if ($subject !== null) {
            $activityBuilder->performedOn($subject);
        }

        /** @var Activity $activity */
        $activity = $activityBuilder->log($description);

        return $activity;
    }

    /**
     * Log a user activity.
     *
     * @param  Model  $user  The user performing the action
     * @param  string  $description  Description of the activity
     * @param  Model|null  $subject  The model being acted upon
     * @param  array<string, mixed>  $properties  Additional properties to log
     */
    public function logUserActivity(
        Model $user,
        string $description,
        ?Model $subject = null,
        array $properties = []
    ): Activity {
        return $this->log($user, $description, $subject, $properties, 'user');
    }

    /**
     * Log an admin activity.
     *
     * @param  Model  $admin  The admin performing the action
     * @param  string  $description  Description of the activity
     * @param  Model|null  $subject  The model being acted upon
     * @param  array<string, mixed>  $properties  Additional properties to log
     */
    public function logAdminActivity(
        Model $admin,
        string $description,
        ?Model $subject = null,
        array $properties = []
    ): Activity {
        return $this->log($admin, $description, $subject, $properties, 'admin');
    }

    /**
     * Get activities for a specific causer (user or admin).
     *
     * @param  Model  $causer  The user or admin
     * @param  int|null  $limit  Maximum number of activities to retrieve
     * @return \Illuminate\Database\Eloquent\Collection<int, Activity>
     */
    public function getActivitiesForCauser(Model $causer, ?int $limit = null): \Illuminate\Database\Eloquent\Collection
    {
        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->with('causer', 'subject')
            ->where('causer_type', get_class($causer))
            ->where('causer_id', $causer->getKey())
            ->orderBy('created_at', 'desc');

        if ($limit !== null) {
            $query->limit($limit);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Activity> $result */
        $result = $query->get();

        return $result;
    }

    /**
     * Get activities for a specific subject (model).
     *
     * @param  Model  $subject  The model
     * @param  int|null  $limit  Maximum number of activities to retrieve
     * @return \Illuminate\Database\Eloquent\Collection<int, Activity>
     */
    public function getActivitiesForSubject(
        Model $subject,
        ?int $limit = null
    ): \Illuminate\Database\Eloquent\Collection {
        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->with('causer', 'subject')
            ->where('subject_type', get_class($subject))
            ->where('subject_id', $subject->getKey())
            ->orderBy('created_at', 'desc');

        if ($limit !== null) {
            $query->limit($limit);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Activity> $result */
        $result = $query->get();

        return $result;
    }

    /**
     * Get activities by log name.
     *
     * @param  string  $logName  The log name
     * @param  int|null  $limit  Maximum number of activities to retrieve
     * @return \Illuminate\Database\Eloquent\Collection<int, Activity>
     */
    public function getActivitiesByLogName(
        string $logName,
        ?int $limit = null
    ): \Illuminate\Database\Eloquent\Collection {
        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->with('causer', 'subject')
            ->where('log_name', $logName)
            ->orderBy('created_at', 'desc');

        if ($limit !== null) {
            $query->limit($limit);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Activity> $result */
        $result = $query->get();

        return $result;
    }

    /**
     * Get user activities.
     *
     * @param  int|null  $limit  Maximum number of activities to retrieve
     * @return \Illuminate\Database\Eloquent\Collection<int, Activity>
     */
    public function getUserActivities(?int $limit = null): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getActivitiesByLogName('user', $limit);
    }

    /**
     * Get admin activities.
     *
     * @param  int|null  $limit  Maximum number of activities to retrieve
     * @return \Illuminate\Database\Eloquent\Collection<int, Activity>
     */
    public function getAdminActivities(?int $limit = null): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getActivitiesByLogName('admin', $limit);
    }

    /**
     * Delete old activity logs.
     *
     * @param  int  $days  Number of days to keep
     */
    public function deleteOldActivities(int $days = 365): int
    {
        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->where('created_at', '<', now()->subDays($days));

        return $query->delete();
    }
}
