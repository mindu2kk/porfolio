import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { createEvent, type EventType } from '@/lib/tracking/events';
import { getSession } from '@/lib/tracking/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, type, metadata } = body;

    if (!sessionId || !type) {
      return NextResponse.json(
        { error: 'Session ID and event type required' },
        { status: 400 }
      );
    }

    // Get session to verify it exists
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create event
    const event = createEvent(
      type as EventType,
      session.userId,
      sessionId,
      metadata || {}
    );

    // Store event
    await kv.set(`event:${event.id}`, event, { ex: 30 * 24 * 60 * 60 }); // 30 days
    
    // Add to indexes
    await kv.zadd('events:all', { score: event.timestamp, member: event.id });
    await kv.zadd(`events:user:${event.userId}`, { score: event.timestamp, member: event.id });
    await kv.zadd(`events:session:${sessionId}`, { score: event.timestamp, member: event.id });

    // Add event to session
    session.events.push(event.id);
    await kv.set(`session:${sessionId}`, session, { ex: 30 * 60 });

    return NextResponse.json({
      success: true,
      eventId: event.id,
    });
  } catch (error) {
    console.error('Event tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
