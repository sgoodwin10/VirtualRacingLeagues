<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\Contact\Events\ContactSubmitted;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use App\Notifications\ContactCopyNotification;
use App\Notifications\ContactSubmittedNotification;
use Illuminate\Support\Facades\Notification;

final class SendContactNotification
{
    public function handle(ContactSubmitted $event): void
    {
        $contact = $event->contact;

        // Send notification to admin
        $adminEmail = config('notifications.admin_email');
        if ($adminEmail) {
            /** @phpstan-ignore-next-line */
            Notification::route('mail', $adminEmail)
                ->notify(new ContactSubmittedNotification($contact));
        }

        // CC to user if requested and user is logged in
        if ($contact->shouldCcUser() && $contact->userId()) {
            $user = UserEloquent::find($contact->userId());
            if ($user) {
                $user->notify(new ContactCopyNotification($contact));
            }
        }
    }
}
