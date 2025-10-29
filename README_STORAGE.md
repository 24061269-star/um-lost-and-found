# Storage Setup (Supabase Storage)

1) Create bucket
- Go to Storage → Create new bucket
- Name: `item-images`
- Public: Enabled (for now). We can switch to signed URLs later.

2) (Optional) Storage policies
If using RLS on Storage (public disabled), add policies on `storage.objects`:
```sql
-- Allow read of objects in item-images for everyone
create policy if not exists "public read item-images" on storage.objects
for select to public
using (bucket_id = 'item-images');

-- Allow owners to upload into their user folder
create policy if not exists "user upload item-images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text
);
```

3) CORS
- If needed, set CORS for `*` origins during development.

4) Usage
- Uploader saves to `item-images/<userId>/<uuid>.<ext>` and returns public URLs.
