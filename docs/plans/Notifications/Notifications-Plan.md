# Overview
- Add notifications (emails, discord) to the application. 
- At first this will be for system notifcations and registration/reset passwords.
- Allow App dashboard users to contact the administrator of the site via a form. The form might send a email or discord notifcation or both, or another service in the future.


# Current
Currently the site only sends email for the registration and lost passwords. I am not sure where the email templates are stored.


# Plan
- add email and discord notifications to the system. (Allow for more in the future)
- install Laravel Notifications - `https://laravel.com/docs/12.x/notifications`
- setup `email` and `discord`
- have a list of files for each notification and notification type.
- track all messages sent
    - have admin section to view all messages sent




## Different Notifications/Emails


### On App Dashboard
- have a permanent floating `contact us` icon on the bottom right of all pages.
- clicking it will open a form that will have a form
- i want to customise email
- Form will have 3 fields
    - Reason for contact  (required)
        - Error, question, other, i need help
    - Contact message  (required)
    - CC myself? (default to true)
    - button to send
- Create a good ux/ui flow for layout
- will send via email and/or discord
- have this easily configurable.
- show success/fail toast
- google tag manager track the open event as well as the send event


### On Public Dashboard
- have a `contact us` footer link hat will open modal
- i want to customise email
- have a form with fields
    - Reason for contact  (required)
        - Error, question, other, i need help
    - Contact message  (required)
    - CC myself? (default to true)
    - your name  (required)
    - your email (required)
    - button to send
- show success/fail toast
- google tag manager track the open event as well as the send event


### Register
- send email, and bcc admin
- send a discord message to a certain channel
- i want to customise email
- google tag manager track the register event


### Lost password
- send email with link
- i want to customise email
- google tag manager track the send reset password link event





# Plan Creation
- Create plans in `docs/plans/notifications`
- have a overview plan that links to each plan. 
- separate out into front end and backend
- ask any questions 1 by 1
