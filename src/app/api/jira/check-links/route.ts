
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('linked_jira_items')
      .select('jira_key');

    if (error) {
      throw error;
    }

    const keys = data.map(item => item.jira_key);
    return NextResponse.json(keys);
  } catch (error: any) {
    console.error('Error fetching linked Jira keys:', error);
    return NextResponse.json({ error: 'Failed to fetch linked tickets.' }, { status: 500 });
  }
}
