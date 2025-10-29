'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lostOrFound, setLostOrFound] = useState<'lost' | 'found'>('lost');
  const [locationText, setLocationText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: qErr } = await supabase
          .from('items')
          .select('title, description, lost_or_found, location_text')
          .eq('id', id)
          .single();
        if (qErr) throw qErr;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setLostOrFound(data.lost_or_found);
        setLocationText(data.location_text || '');
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from('items')
        .update({
          title,
          description,
          lost_or_found: lostOrFound,
          location_text: locationText,
        })
        .eq('id', id);
      if (upErr) throw upErr;
      router.push('/my-items');
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl">Loading…</div>;
  if (error) return <div className="mx-auto max-w-2xl text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-umblue">Edit Item</h1>
      <form onSubmit={onSave} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setLostOrFound('lost')}
                className={`rounded-xl border px-3 py-2 text-sm ${lostOrFound === 'lost' ? 'border-umblue text-umblue' : 'border-gray-300 text-gray-700'}`}
              >
                Lost
              </button>
              <button
                type="button"
                onClick={() => setLostOrFound('found')}
                className={`rounded-xl border px-3 py-2 text-sm ${lostOrFound === 'found' ? 'border-umblue text-umblue' : 'border-gray-300 text-gray-700'}`}
              >
                Found
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-umblue px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/my-items')}
            className="flex-1 rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

