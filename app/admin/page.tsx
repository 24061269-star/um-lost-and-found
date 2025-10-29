'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PendingItem = {
  id: string;
  title: string;
  description: string | null;
  lost_or_found: 'lost' | 'found';
  location_text: string | null;
  created_at: string;
  item_images: { url: string }[];
  item_tags: { tag: string }[];
  owner: { email: string } | null;
};

export default function AdminPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = supabase
        .from('items')
        .select(
          `id, title, description, lost_or_found, location_text, created_at,
           item_images(url), item_tags(tag), owner:profiles!items_owner_user_id_fkey(email)`
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      const { data, error: err } = await q;
      if (err) throw err;
      setItems((data as any) || []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
  }, []);

  async function act(id: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch(`/api/admin/items/${id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Action failed');
      }
      await load();
    } catch (e: any) {
      alert(e?.message || 'Action failed');
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-umblue">Admin Moderation</h1>
      <p className="mt-1 text-sm text-gray-600">Review pending items and approve or reject.</p>

      {loading && <p className="mt-6 text-sm text-gray-600">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <div className="mt-6 rounded-xl border p-6 text-center text-gray-600">No items pending review</div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const img = it.item_images?.[0]?.url || null;
          const tags = (it.item_tags || []).map((t) => t.tag);
          return (
            <div key={it.id} className="rounded-xl border p-3">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img} alt={it.title} className="h-full w-full object-cover" />}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="line-clamp-1 font-medium text-gray-900">{it.title}</h3>
                  <span className="rounded border px-2 py-0.5 text-xs capitalize text-gray-700">{it.lost_or_found}</span>
                </div>
                {it.location_text && (
                  <p className="line-clamp-1 text-sm text-gray-600">{it.location_text}</p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full border px-2 py-0.5 text-xs text-gray-600">{t}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">{it.owner?.email || 'Unknown owner'}</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => act(it.id, 'approve')}
                    className="flex-1 rounded-xl bg-umblue px-3 py-2 text-sm text-white hover:opacity-90"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(it.id, 'reject')}
                    className="flex-1 rounded-xl border border-red-600 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

