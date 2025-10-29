'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

type MyItem = {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'claimed' | 'rejected';
  lost_or_found: 'lost' | 'found';
  location_text: string | null;
  created_at: string;
  item_images: { url: string }[];
};

export default function MyItemsPage() {
  const [items, setItems] = useState<MyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr || new Error('Not signed in');
      const userId = userData.user.id;

      const { data, error: qErr } = await supabase
        .from('items')
        .select('id, title, status, lost_or_found, location_text, created_at, item_images(url)')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setItems((data as any) || []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
  }, []);

  async function onDelete(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Delete failed');
      return;
    }
    await load();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-umblue">My Items</h1>
      <p className="mt-1 text-sm text-gray-600">Manage your submissions.</p>

      {loading && <p className="mt-6 text-sm text-gray-600">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <div className="mt-6 rounded-xl border p-6 text-center text-gray-600">No items yet.</div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const img = it.item_images?.[0]?.url || null;
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
                <div className="flex items-center justify-between text-sm">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{it.status}</span>
                  <span className="text-xs text-gray-500">{new Date(it.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href={`/my-items/${it.id}/edit`} className="flex-1 rounded-xl border px-3 py-2 text-center text-sm hover:bg-gray-50">
                    Edit
                  </Link>
                  <button onClick={() => onDelete(it.id)} className="flex-1 rounded-xl border border-red-600 px-3 py-2 text-sm text-red-700 hover:bg-red-50">
                    Delete
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

