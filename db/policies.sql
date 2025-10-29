-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.item_images enable row level security;
alter table public.item_tags enable row level security;
alter table public.item_embeddings enable row level security;
alter table public.claims enable row level security;
alter table public.reports enable row level security;

-- Helper: check admin role
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

-- profiles policies
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

-- items policies
drop policy if exists "items_read_public_approved_or_owner" on public.items;
create policy "items_read_public_approved_or_owner" on public.items
for select to anon, authenticated
using (
  status = 'approved'::item_status or owner_user_id = auth.uid() or public.is_admin(auth.uid())
);

drop policy if exists "items_insert_owner_is_uid" on public.items;
create policy "items_insert_owner_is_uid" on public.items
for insert to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "items_update_owner_or_admin" on public.items;
create policy "items_update_owner_or_admin" on public.items
for update to authenticated
using (owner_user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "items_delete_owner_or_admin" on public.items;
create policy "items_delete_owner_or_admin" on public.items
for delete to authenticated
using (owner_user_id = auth.uid() or public.is_admin(auth.uid()));

-- item_images follows item ownership
drop policy if exists "item_images_crud_owner_or_admin" on public.item_images;
create policy "item_images_crud_owner_or_admin" on public.item_images
for all to authenticated
using (
  exists (select 1 from public.items i where i.id = item_images.item_id and (i.owner_user_id = auth.uid() or public.is_admin(auth.uid())))
)
with check (
  exists (select 1 from public.items i where i.id = item_images.item_id and (i.owner_user_id = auth.uid() or public.is_admin(auth.uid())))
);

-- item_tags follows item ownership; select allowed for all for search
drop policy if exists "item_tags_select_all" on public.item_tags;
create policy "item_tags_select_all" on public.item_tags for select to anon, authenticated using (true);

drop policy if exists "item_tags_write_owner_or_admin" on public.item_tags;
create policy "item_tags_write_owner_or_admin" on public.item_tags for all to authenticated
using (
  exists (select 1 from public.items i where i.id = item_tags.item_id and (i.owner_user_id = auth.uid() or public.is_admin(auth.uid())))
)
with check (
  exists (select 1 from public.items i where i.id = item_tags.item_id and (i.owner_user_id = auth.uid() or public.is_admin(auth.uid())))
);

-- item_embeddings select allowed for all (for search read), write by owner/admin
drop policy if exists "item_embeddings_select_all" on public.item_embeddings;
create policy "item_embeddings_select_all" on public.item_embeddings for select to anon, authenticated using (true);

drop policy if exists "item_embeddings_write_owner_or_admin" on public.item_embeddings;
create policy "item_embeddings_write_owner_or_admin" on public.item_embeddings for all to authenticated
using (
  exists (select 1 from public.items i where i.id = item_embeddings.item_id and (i.owner_user_id = auth.uid() or public.is_admin(auth.uid())))
)
with check (
  exists (select 1 from public.items i where i.id = item_embeddings.item_id and (i.owner_user_id = auth.uid() or public.is_admin(auth.uid())))
);

-- claims: create by any auth, select own claims or admin, update by admin
drop policy if exists "claims_select_self_or_admin" on public.claims;
create policy "claims_select_self_or_admin" on public.claims for select to authenticated
using (claimer_user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "claims_insert_self" on public.claims;
create policy "claims_insert_self" on public.claims for insert to authenticated
with check (claimer_user_id = auth.uid());

drop policy if exists "claims_update_admin_only" on public.claims;
create policy "claims_update_admin_only" on public.claims for update to authenticated
using (public.is_admin(auth.uid()));

-- reports: create by any auth, select own or admin, update admin
drop policy if exists "reports_select_self_or_admin" on public.reports;
create policy "reports_select_self_or_admin" on public.reports for select to authenticated
using (reporter_user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self" on public.reports for insert to authenticated
with check (reporter_user_id = auth.uid());

drop policy if exists "reports_update_admin_only" on public.reports;
create policy "reports_update_admin_only" on public.reports for update to authenticated
using (public.is_admin(auth.uid()));

