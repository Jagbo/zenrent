import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const updates: { id: string; category: string }[] = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Perform updates in parallel (could be batched for very large sets)
    const results = await Promise.all(
      updates.map(async ({ id, category }) => {
        const { error } = await supabase
          .from('bank_transactions')
          .update({ category })
          .eq('id', id);
        return { id, success: !error, error: error?.message };
      })
    );

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return NextResponse.json({ error: 'Some updates failed', details: failed }, { status: 207 });
    }

    return NextResponse.json({ success: true, updated: results.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 