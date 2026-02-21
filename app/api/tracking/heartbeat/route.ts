import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateHeartbeat } from '@/lib/tracking/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, isVisible, idleTime } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const success = await updateHeartbeat(
      sessionId,
      isVisible ?? true,
      idleTime ?? 0
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
