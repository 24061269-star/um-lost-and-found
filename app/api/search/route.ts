import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { openai } from '@/lib/openai';

type SearchPayload = {
  keyword?: string;
  tags?: string[];
  imageUrl?: string;
  limit?: number;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { keyword = '', tags = [], imageUrl, limit = 20 } = (await req.json()) as SearchPayload;

    let useEmbedding = false;
    let queryEmbedding: number[] | null = null;

    if (imageUrl) {
      // Describe the image briefly then embed
      const chat = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Describe this image in 1 concise sentence focusing on object and color.' },
          { role: 'user', content: [{ type: 'image_url', image_url: { url: imageUrl } }] as any },
        ],
        temperature: 0.1,
      });
      const caption = chat.choices[0]?.message?.content ?? '';
      const emb = await openai.embeddings.create({ model: 'text-embedding-3-small', input: caption });
      queryEmbedding = emb.data[0].embedding as unknown as number[];
      useEmbedding = true;
    } else if (keyword.trim().length > 0) {
      const emb = await openai.embeddings.create({ model: 'text-embedding-3-small', input: keyword });
      queryEmbedding = emb.data[0].embedding as unknown as number[];
      useEmbedding = true;
    }

    // 1) If embedding available, get top matches by vector similarity
    let matchedIds: { item_id: string; similarity: number }[] = [];
    if (useEmbedding && queryEmbedding) {
      const { data: matches, error: matchErr } = await supabase.rpc('match_items', {
        query_embedding: queryEmbedding,
        limit_count: limit,
      });
      if (matchErr) throw matchErr;
      matchedIds = (matches || []) as any[];
    }

    // 2) Fetch items with optional tag filter and keyword fallback
    let query = supabase
      .from('items')
      .select('id, title, description, lost_or_found, location_text, created_at, item_images(url)', { count: 'exact' })
      .eq('status', 'approved');

    if (tags.length > 0) {
      // Filter where item has any of the provided tags
      const { data: tagItemIds, error: tagErr } = await supabase
        .from('item_tags')
        .select('item_id')
        .in('tag', tags);
      if (tagErr) throw tagErr;
      const ids = Array.from(new Set((tagItemIds || []).map((r) => r.item_id)));
      if (ids.length > 0) query = query.in('id', ids);
      else return NextResponse.json({ items: [] });
    }

    if (!useEmbedding && keyword.trim().length > 0) {
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    if (matchedIds.length > 0) {
      const ids = matchedIds.map((m) => m.item_id);
      query = query.in('id', ids);
    }

    const { data: items, error: itemsErr } = await query.limit(limit);
    if (itemsErr) throw itemsErr;

    // Attach similarity if present
    const simMap = new Map(matchedIds.map((m) => [m.item_id, m.similarity]));
    const itemsWithSim = (items || []).map((it: any) => ({
      ...it,
      similarity: simMap.get(it.id) ?? null,
      image: it.item_images?.[0]?.url ?? null,
    }));

    // If vector search used, order by similarity desc
    if (matchedIds.length > 0) {
      itemsWithSim.sort((a: any, b: any) => (b.similarity ?? 0) - (a.similarity ?? 0));
    }

    return NextResponse.json({ items: itemsWithSim });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Search failed' }, { status: 500 });
  }
}

