# Database Setup (Supabase + pgvector)

1) In Supabase SQL Editor, run files in order:
- db/schema.sql
- db/policies.sql
- db/functions.sql

2) Enable Auth settings in Supabase Dashboard:
- Authentication → Email → Domain Allow list: add `um.edu.my`
- Authentication → Providers → Phone: enable and configure SMS provider
- Authentication → URL Configuration: set Site URL (e.g., `http://localhost:3000`)

3) Admin role:
- Promote an account to admin:
```sql
update public.profiles set role = 'admin' where email = 'your_admin@um.edu.my';
```

4) Vector search notes:
- The `item_embeddings.embedding` column is `vector(1536)` (OpenAI text-embedding-3-small).
- `ivfflat` index exists and is used for cosine similarity queries.

5) RLS summary:
- items: public can read approved; owners/admin read all; owners insert/update/delete; admin full.
- item_images/tags/embeddings: reads broadly for search; writes restricted to owner/admin of the parent item.
- claims: users read their own; insert their own; admin updates/decides.
- reports: users read their own; insert their own; admin updates.
- profiles: user reads/updates own; admin reads all.

6) Profile auto-creation:
- Trigger `on_auth_user_created` inserts into `public.profiles` on signup with default role `student`.

7) Email domain enforcement:
- Prefer dashboard allowlist (recommended). For stricter enforcement, implement a sign-up hook (Edge Function) to block non-UM domains before user creation.

8) Environment for AI:
- Add `OPENAI_API_KEY` to `.env.local` for embeddings/tagging API.
