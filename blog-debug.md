# Blog System Root Cause Analysis

## Trace

```
/blog
↓
React Component (`src/routes/blog.tsx`)
↓
TanStack Loader / Query (`useQuery` fetching `["public", "blog-posts"]`)
↓
Supabase Query (`.from("blog_posts").select("*").eq("status", "published").order("published_at", { ascending: false })`)
↓
Database Table (`blog_posts`)
↓
RLS (Enabled, but missing policies!)
↓
Returned Data (Empty Array `[]`)
```

## Phase 2: Debugging Results

### 1. Which table is queried?
The table being queried is `blog_posts`.

### 2. Actual Query
```ts
supabase
  .from("blog_posts")
  .select("*")
  .eq("status", "published")
  .order("published_at", { ascending: false });
```

### 3. Verify Filters
- `status = 'published'`

### 4. Check Inserted Data
```sql
SELECT id, title, slug, status, published_at FROM blog_posts;
```
**Result:**
Row count: 1
- **id**: `e7035fe7-2e3d-4f5d-bdb0-11624d59152f`
- **title**: `Why BrokersConnect Exists`
- **slug**: `why-brokersconnect-exists`
- **status**: `published`
- **published_at**: `2026-06-30 21:29:21.78578+00`

The record is successfully inserted and marked as `published`.

### 5. Check RLS
```sql
SELECT relrowsecurity FROM pg_class WHERE relname = 'blog_posts';
```
**Result:** `true` (RLS is enabled).

```sql
SELECT * FROM pg_policies WHERE tablename = 'blog_posts';
```
**Result:** `[]` (No policies exist).

**Conclusion on RLS:** Because RLS is enabled on `blog_posts` but no permissive policies exist, PostgreSQL completely denies all reads and writes via the API. This is why the frontend receives an empty array despite the data existing.

### 6. Verify Slug
The generated slug is `why-brokersconnect-exists`, which perfectly matches `/blog/why-brokersconnect-exists`.

## Phase 3: Root Cause & Fix

**Root Cause:** The `blog_posts` table has Row Level Security (RLS) enabled, but there are no policies granting the `anon` or `authenticated` roles the ability to `SELECT` data. As a result, the frontend query silently returns zero rows.

**Fix Applied:** We need to create a permissive RLS policy allowing public reads for published blog posts.

```sql
CREATE POLICY "Public can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (status = 'published');
```
