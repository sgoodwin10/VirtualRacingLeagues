# Authentication Pages Redesign - Overview Plan

## Feature Summary

Update the authentication pages (Login, Register, Forgot Password, Reset Password) on the **Public Dashboard** to align with the new "VRL Velocity" design system established in `HomeView.vue`.

### Current State

The existing authentication pages use:
- Light gray background (`bg-gray-50`)
- PrimeVue components (`InputText`, `Password`, `Checkbox`, `Message`)
- Standard gray color scheme
- Centered card layout without navigation or footer
- No background effects

### Target State

The redesigned pages will feature:
- Dark theme background (`--bg-dark: #0d1117`)
- VRL Velocity design system CSS variables
- `LandingNav` component for consistent navigation
- `LandingFooter` component for consistent footer
- `BackgroundGrid` animated background effect
- Custom VRL form components (`VrlInput`, `VrlCheckbox`, `VrlButton`, `VrlAlert`, etc.)
- Orbitron display font for headings
- Cyan accent color scheme

---

## Scope

### Pages to Update

| Page | File Path | Priority |
|------|-----------|----------|
| Login | `resources/public/js/views/auth/LoginView.vue` | High |
| Register | `resources/public/js/views/auth/RegisterView.vue` | High |
| Forgot Password | `resources/public/js/views/auth/ForgotPasswordView.vue` | High |
| Reset Password | `resources/public/js/views/auth/ResetPasswordView.vue` | High |
| Email Templates | `resources/views/vendor/mail/` | Optional |

### Out of Scope

- Backend authentication logic (already working)
- API endpoints (no changes needed)
- Authentication flow (login redirects to app subdomain)
- User/Admin dashboard pages

---

## Design Principles

1. **Use existing color schema** - CSS variables defined in `resources/public/css/app.css`
2. **Use existing common components** - Located in `resources/public/js/components/common/`
3. **Tailwind CSS only** - No custom CSS styles
4. **Keep backend flow unchanged** - Authentication logic works correctly
5. **Responsive design** - Mobile-first approach
6. **Accessibility** - Maintain ARIA labels and keyboard navigation

---

## Key Design System Elements

### Colors (CSS Variables)
```css
--bg-dark: #0d1117;          /* Base background */
--bg-panel: #161b22;         /* Panel/card background */
--bg-card: #1c2128;          /* Card background */
--text-primary: #e6edf3;     /* Primary text */
--text-secondary: #8b949e;   /* Secondary text */
--cyan: #58a6ff;             /* Primary accent */
--red: #f85149;              /* Error states */
--green: #7ee787;            /* Success states */
--border: #30363d;           /* Default borders */
```

### Typography
- **Display font**: Orbitron (headings, labels)
- **Body font**: Inter (body text, inputs)

### Common Components to Use
- `VrlButton` - Primary/Secondary buttons
- `VrlInput` - Text inputs with error states
- `VrlPasswordInput` - Password input with visibility toggle **(NEW - to be created)**
- `VrlCheckbox` - Custom styled checkbox
- `VrlAlert` - Error/Success messages
- `VrlFormGroup` - Form field wrapper
- `VrlFormLabel` - Form labels
- `VrlFormError` - Error messages

### Layout Components
- `LandingNav` - Fixed navigation header
- `LandingFooter` - Footer with links
- `BackgroundGrid` - Animated grid background

---

## Implementation Documents

1. **[Frontend Implementation Plan](./01-frontend-plan.md)** - Detailed Vue.js component updates
2. **[Backend Notes](./02-backend-notes.md)** - Email template updates (optional)

---

## Agents to Use

| Agent | Purpose |
|-------|---------|
| `dev-fe-public` | Frontend changes to public dashboard auth pages |
| `dev-be` | Email template updates (optional) |

---

## Success Criteria

- [ ] `VrlPasswordInput` component created with visibility toggle
- [ ] All auth pages use dark theme with VRL Velocity design
- [ ] Navigation and footer are consistent with HomeView
- [ ] Background grid effect is visible
- [ ] Form validation and error states work correctly
- [ ] Authentication flow remains functional
- [ ] Pages are responsive on mobile devices
- [ ] Accessibility requirements are maintained
- [ ] No TypeScript errors
- [ ] Existing tests pass
