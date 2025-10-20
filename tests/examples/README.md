# Testing Examples

This directory contains example tests demonstrating best practices for testing Vue 3 components in this project.

## Files

- **LoginForm.example.test.ts** - Comprehensive example showing:
  - `@testing-library/vue` for accessible queries
  - `@testing-library/user-event` for realistic user interactions
  - MSW for API mocking
  - happy-dom environment (faster than jsdom)

## Running the Examples

```bash
# Run all tests including examples
npm test

# Run only example tests
npm test tests/examples

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Key Differences: Testing Library vs Vue Test Utils

### Vue Test Utils (Traditional)
```typescript
import { mount } from '@vue/test-utils';

const wrapper = mount(MyComponent);
wrapper.find('button').trigger('click');
expect(wrapper.find('.result').text()).toBe('Clicked');
```

**Pros:**
- Direct access to component internals
- Can test implementation details
- Vue-specific features (slots, emits, etc.)

**Cons:**
- Tests implementation, not behavior
- Brittle tests (break on refactoring)
- Not user-centric

### Testing Library (Recommended for User-Facing Features)
```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

render(MyComponent);
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: /submit/i }));
expect(screen.getByText('Clicked')).toBeInTheDocument();
```

**Pros:**
- Tests from user perspective
- Encourages accessible markup
- Resilient to refactoring
- More realistic interactions

**Cons:**
- Cannot access component internals
- Requires semantic HTML
- Slightly more verbose setup

## When to Use Each

### Use Testing Library for:
- User-facing features (forms, interactions, workflows)
- Integration tests
- Accessibility testing
- E2E-style component tests

### Use Vue Test Utils for:
- Testing component props and emits
- Testing slots and dynamic components
- Testing Vue-specific features (provide/inject, teleport)
- Unit testing composables with component context

### Use Both Together:
You can combine both libraries in the same test!

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

const { emitted } = render(MyComponent);
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
expect(emitted()).toHaveProperty('submit');
```

## MSW (Mock Service Worker) Benefits

### Traditional Approach (Mocking axios/fetch)
```typescript
vi.mock('axios');
axios.post.mockResolvedValue({ data: { ... } });
```

**Problems:**
- Coupled to implementation (axios vs fetch)
- Doesn't test actual HTTP layer
- Different mocks for dev vs test

### MSW Approach
```typescript
// handlers.ts defines the mocks once
http.post('/api/login', () => HttpResponse.json({ ... }))

// Tests just make real fetch/axios calls - MSW intercepts
const response = await fetch('/api/login', { ... });
```

**Benefits:**
- Mock at network level
- Same mocks for dev and test
- Test actual HTTP integration
- Easy to override per test

## Best Practices

1. **Query Priority** (Testing Library)
   ```typescript
   // ✅ Best (accessible)
   screen.getByRole('button', { name: /submit/i })

   // ✅ Good (semantic)
   screen.getByLabelText('Email')

   // ⚠️ Acceptable (less semantic)
   screen.getByPlaceholderText('Enter email')

   // ❌ Last resort (not semantic)
   screen.getByTestId('email-input')
   ```

2. **Async Testing**
   ```typescript
   // ✅ Wait for element to appear
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument();
   });

   // ✅ Find query (async built-in)
   expect(await screen.findByText('Success')).toBeInTheDocument();

   // ❌ Don't use arbitrary delays
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```

3. **User Interactions**
   ```typescript
   const user = userEvent.setup();

   // ✅ Realistic typing
   await user.type(input, 'Hello');

   // ✅ Realistic clicking
   await user.click(button);

   // ❌ Don't use fireEvent (less realistic)
   fireEvent.click(button);
   ```

4. **MSW Handler Overrides**
   ```typescript
   it('handles server error', async () => {
     // Override for this test only
     server.use(
       http.post('/api/login', () => {
         return HttpResponse.json({ error: 'Server error' }, { status: 500 });
       })
     );

     // Test error handling...
   });
   ```

## Resources

- [Testing Library Docs](https://testing-library.com/docs/vue-testing-library/intro/)
- [Vue Test Utils Docs](https://test-utils.vuejs.org/)
- [MSW Docs](https://mswjs.io/)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library Queries Cheatsheet](https://testing-library.com/docs/queries/about)
