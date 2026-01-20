# Backend Notes - Email Template Updates (Optional)

## Overview

This document covers optional email template updates. The existing templates work correctly - this is purely a design enhancement.

**Agent**: `dev-be`
**Priority**: Low (Optional)

---

## Current State

Email templates are located in:
- `resources/views/vendor/mail/html/` - HTML email templates
- `resources/views/vendor/mail/text/` - Plain text email templates
- `resources/views/vendor/mail/html/themes/default.css` - Email styling

### Current Styling
- Light gray wrapper background (`#fafafa`)
- White inner body (`#ffffff`)
- Blue accent color (`#2563eb`)
- System font stack

---

## Proposed Changes

### Option 1: Minimal Update (Recommended)

Keep the existing light theme but ensure consistency with brand:

1. **Update accent color** to match VRL cyan (`#58a6ff`)
2. **Update button colors** to use cyan
3. **Keep white background** for email client compatibility

### Option 2: Enhanced Branding

More significant updates while maintaining email client compatibility:

1. **Header**: Add VRL logo or styled text header
2. **Colors**: Update accent colors to cyan
3. **Footer**: Add VRL branding and links

---

## Files to Update

### `resources/views/vendor/mail/html/themes/default.css`

Suggested color updates:

```css
/* Links */
a {
    color: #58a6ff; /* Was #2563eb */
}

/* Buttons */
.button-blue,
.button-primary {
    background-color: #58a6ff; /* Was #2563eb */
    border-bottom: 8px solid #58a6ff;
    border-left: 18px solid #58a6ff;
    border-right: 18px solid #58a6ff;
    border-top: 8px solid #58a6ff;
}

/* Panels */
.panel {
    border-left: #58a6ff solid 4px; /* Was #2563eb */
}
```

### `resources/views/vendor/mail/html/header.blade.php`

Could add VRL branding:

```blade
<tr>
<td class="header">
<a href="{{ config('app.url') }}" style="display: inline-block;">
{{ config('app.name') }}
</a>
</td>
</tr>
```

---

## Important Considerations

1. **Email Client Compatibility**: Many email clients have limited CSS support
   - Avoid custom fonts (Orbitron won't work in emails)
   - Stick to inline styles or simple CSS
   - Test in multiple email clients

2. **Dark Mode**: Many email clients now support dark mode
   - Light backgrounds are generally safer
   - The current white theme adapts well to dark mode

3. **Accessibility**: Ensure sufficient color contrast
   - Cyan on white: Good contrast
   - Test with accessibility tools

---

## Testing Email Templates

```bash
# Send test password reset email
php artisan tinker
>>> $user = App\Models\User::first();
>>> $user->sendPasswordResetNotification('test-token');

# View emails in Mailpit
# http://localhost:8025
```

---

## Recommendation

**For the initial release**, keep email templates unchanged. The current templates:
- Work correctly
- Are readable and professional
- Support all email clients

Email template updates can be a follow-up task after the frontend pages are complete and tested.

---

## No Backend Logic Changes Required

The authentication backend is fully functional:
- Login/Logout endpoints work
- Registration endpoints work
- Password reset flow works
- Email notifications are sent correctly

**No changes to controllers, services, or API endpoints are needed.**
