## Pattern Examples: [Pattern Type]

### Pattern 1: [Descriptive Name]
**Found in**: `src/api/users.js:45-67`
**Used for**: User listing with pagination

```javascript
// Pagination implementation example
router.get('/users', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const users = await db.users.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  const total = await db.users.count();

  res.json({
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

**Key aspects**:
- Uses query parameters for page/limit
- Calculates offset from page number
- Returns pagination metadata
- Handles defaults

### Pattern 2: [Alternative Approach]
**Found in**: `src/api/products.js:89-120`
**Used for**: Product listing with cursor-based pagination

```javascript
// Cursor-based pagination example
router.get('/products', async (req, res) => {
  const { cursor, limit = 20 } = req.query;

  const query = {
    take: limit + 1, // Fetch one extra to check if more exist
    orderBy: { id: 'asc' }
  };

  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1; // Skip the cursor itself
  }

  const products = await db.products.findMany(query);
  const hasMore = products.length > limit;

  if (hasMore) products.pop(); // Remove the extra item

  res.json({
    data: products,
    cursor: products[products.length - 1]?.id,
    hasMore
  });
});
```

**Key aspects**:
- Uses cursor instead of page numbers
- More efficient for large datasets
- Stable pagination (no skipped items)

### Testing Patterns
**Found in**: `tests/api/pagination.test.js:15-45`

```javascript
describe('Pagination', () => {
  it('should paginate results', async () => {
    // Create test data
    await createUsers(50);

    // Test first page
    const page1 = await request(app)
      .get('/users?page=1&limit=20')
      .expect(200);

    expect(page1.body.data).toHaveLength(20);
    expect(page1.body.pagination.total).toBe(50);
    expect(page1.body.pagination.pages).toBe(3);
  });
});
```

### Pattern Usage in Codebase
- **Offset pagination**: Found in user listings, admin dashboards
- **Cursor pagination**: Found in API endpoints, mobile app feeds
- Both patterns appear throughout the codebase
- Both include error handling in the actual implementations

### Related Utilities
- `src/utils/pagination.js:12` - Shared pagination helpers
- `src/middleware/validate.js:34` - Query parameter validation
