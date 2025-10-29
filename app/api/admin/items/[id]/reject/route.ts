import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.cookies.get('umlf_role')?.value;
    if (role !== 'admin') return NextResponse.redirect(new URL('/', req.url));

    const id = params.id;
    const { error } = await supabase.from('items').update({ status: 'rejected' }).eq('id', id);
    if (error) throw error;

    // Optional audit log
    try {
      await supabase.from('audit_logs').insert({
        entity: 'item',
        entity_id: id,
        action: 'reject',
      } as any);
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}

