import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { endSession } from '@/lib/tracking/session';

// Dedicated endpoint for sendBeacon (tab close)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reason } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const success = await endSession(sessionId, reason || 'tab_close');
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
