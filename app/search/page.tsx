'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadDropzone } from '@/components/UploadDropzone';

type ResultItem = {
  id: string;
  title: string;
  description: string | null;
  lost_or_found: 'lost' | 'found';
  location_text: string | null;
  created_at: string;
  similarity: number | null;
  image: string | null;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);

  async function runSearch() {
    setLoading(true);
    setError(null);
    try {
      const body = {
        keyword: keyword.trim() || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        imageUrl: imageUrl || undefined,
      };
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Search failed');
      setResults(json.items || []);
    } catch (err: any) {
      setError(err?.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q && keyword === '') {
      setKeyword(q);
      // Optionally auto-run search when query provided
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        await new Promise((r) => setTimeout(r, 0));
        await runSearch();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-umblue">Search</h1>
      <div className="rounded-xl border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
              placeholder="wallet, umbrella, blue bottle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
              placeholder="blue, wallet, leather"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Optional: search by image</label>
          <div className="mt-2">
            <UploadDropzone
              onUploaded={(urls) => setImageUrl(urls[0] || null)}
              maxFiles={1}
              bucket="item-images"
            />
            {imageUrl && (
              <p className="mt-2 text-sm text-gray-600 break-all">Using image: {imageUrl}</p>
            )}
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4">
          <button
            type="button"
            disabled={loading}
            onClick={runSearch}
            className="rounded-xl bg-umblue px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <a key={r.id} href={`/#`} className="group rounded-xl border p-3 hover:shadow">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.image && <img src={r.image} alt={r.title} className="h-full w-full object-cover" />}
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="rounded border px-2 py-0.5">{r.lost_or_found}</span>
                  {r.similarity !== null && (
                    <span className="text-xs">sim {(r.similarity * 100).toFixed(0)}%</span>
                  )}
                </div>
                <h3 className="mt-1 line-clamp-1 font-medium text-gray-900">{r.title}</h3>
                {r.location_text && (
                  <p className="line-clamp-1 text-sm text-gray-600">{r.location_text}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

