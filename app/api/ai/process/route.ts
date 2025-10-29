import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabaseClient';

type Payload = {
  itemId: string;
  title: string;
  description?: string;
  imageUrls: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;
    const { itemId, title, description = '', imageUrls } = body;

    // 1) Generate tags from images + text (max 4)
    const content: any[] = [
      { role: 'system', content: 'You are a helpful assistant extracting short tags from images and text.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Generate up to 4 concise, lowercase tags (single words) capturing color, category, and unique features.' },
          { type: 'text', text: `Title: ${title}` },
          { type: 'text', text: `Description: ${description}` },
          ...imageUrls.slice(0, 3).map((u) => ({ type: 'image_url', image_url: { url: u } })),
        ],
      },
    ];

    const tagResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: content as any,
      temperature: 0.2,
    });
    const raw = tagResp.choices[0]?.message?.content ?? '';
    const tags = (raw || '')
      .toLowerCase()
      .replace(/[^a-z0-9,\s-]/g, '')
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 4);

    // 2) Create embedding from title + description + tags
    const textForEmbedding = [title, description, tags.join(' ')].filter(Boolean).join('\n');
    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textForEmbedding,
    });
    const vector = emb.data[0].embedding;

    // 3) Store tags + embedding
    if (tags.length > 0) {
      await supabase.from('item_tags').insert(tags.map((t) => ({ item_id: itemId, tag: t })));
    }

    await supabase.from('item_embeddings').insert({
      item_id: itemId,
      embedding: vector as unknown as number[],
      provider: 'openai',
    });

    return NextResponse.json({ ok: true, tagsCount: tags.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'AI processing failed' }, { status: 500 });
  }
}

