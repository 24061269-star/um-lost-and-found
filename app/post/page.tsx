'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { UploadDropzone } from '@/components/UploadDropzone';

export default function PostPage() {
  const router = useRouter();
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lostOrFound, setLostOrFound] = useState<'lost' | 'found'>('lost');
  const [locationText, setLocationText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (uploadedUrls.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr || new Error('Not signed in');
      const userId = userData.user.id;

      const { data: item, error: insertErr } = await supabase
        .from('items')
        .insert({
          title,
          description,
          lost_or_found: lostOrFound,
          location_text: locationText,
          owner_user_id: userId,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      const imagesPayload = uploadedUrls.map((url) => ({ item_id: item.id, url }));
      const { error: imgErr } = await supabase.from('item_images').insert(imagesPayload);
      if (imgErr) throw imgErr;

      // Call AI processing for tags + embedding
      try {
        await fetch('/api/ai/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            title,
            description,
            imageUrls: uploadedUrls,
          }),
        });
      } catch {}

      setInfo('Item submitted. AI processing started. Awaiting approval.');
      // Navigate to My Items (placeholder route to be built later)
      router.push('/my-items');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create item.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-umblue">Post an Item</h1>
      <p className="text-sm text-gray-600">Upload images and fill in details.</p>

      <UploadDropzone onUploaded={setUploadedUrls} />

      {uploadedUrls.length > 0 && (
        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Uploaded</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {uploadedUrls.map((u) => (
              <li key={u} className="break-all">{u}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
            placeholder="e.g., Black wallet with UM logo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
            placeholder="Details like brand, distinguishing marks, contents, etc."
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
              placeholder="e.g., Library, Engineering Faculty"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-umblue px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}

