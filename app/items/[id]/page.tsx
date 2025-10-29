import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ItemDetails = {
  id: string;
  title: string;
  description: string | null;
  lost_or_found: 'lost' | 'found';
  location_text: string | null;
  created_at: string;
  status: string;
  item_images?: { url: string | null }[] | null;
  item_tags?: { tag: string | null }[] | null;
};

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: item, error } = await supabase
    .from('items')
    .select(
      `id, title, description, lost_or_found, location_text, created_at, status, item_images(url), item_tags(tag)`
    )
    .eq('id', params.id)
    .single<ItemDetails>();

  if (error || !item || item.status !== 'approved') {
    notFound();
  }

  const primaryImage = item.item_images?.[0]?.url ?? null;
  const otherImages = (item.item_images ?? []).slice(1).filter((img) => img?.url);
  const tags = (item.item_tags ?? []).map((t) => t.tag).filter((t): t is string => Boolean(t));
  const createdAt = new Date(item.created_at);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm capitalize">
          <span className="font-medium text-umblue">{item.lost_or_found}</span>
          <span className="text-gray-500">Item</span>
        </div>
        <h1 className="text-3xl font-semibold text-gray-900">{item.title}</h1>
        <p className="text-sm text-gray-500">
          Posted on {createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {primaryImage && (
        <div className="overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryImage} alt={item.title} className="h-full w-full object-cover" />
        </div>
      )}

      {otherImages.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {otherImages.map((img) => (
            <div key={img.url ?? ''} className="overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url ?? ''} alt={item.title} className="h-48 w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {item.description && (
        <section className="space-y-2 rounded-xl border p-4">
          <h2 className="text-lg font-medium text-gray-900">Description</h2>
          <p className="whitespace-pre-line text-gray-700">{item.description}</p>
        </section>
      )}

      {item.location_text && (
        <section className="space-y-2 rounded-xl border p-4">
          <h2 className="text-lg font-medium text-gray-900">Location</h2>
          <p className="text-gray-700">{item.location_text}</p>
        </section>
      )}

      {tags.length > 0 && (
        <section className="space-y-2 rounded-xl border p-4">
          <h2 className="text-lg font-medium text-gray-900">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-umblue/10 px-3 py-1 text-sm text-umblue">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
