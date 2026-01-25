import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const VISITOR_KEY = 'portfolio:visitor:count';

export async function GET() {
  try {
    const count = await kv.get<number>(VISITOR_KEY);
    return NextResponse.json({ total: count || 0 });
  } catch (error) {
    console.error('Failed to get visitor count:', error);
    return NextResponse.json({ total: 0 }, { status: 200 });
  }
}

export async function POST() {
  try {
    const count = await kv.incr(VISITOR_KEY);
    return NextResponse.json({ total: count });
  } catch (error) {
    console.error('Failed to increment visitor count:', error);
    return NextResponse.json({ total: 0 }, { status: 200 });
  }
}

export const runtime = 'edge';
