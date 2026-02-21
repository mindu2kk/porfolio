import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSession, endSession } from '@/lib/tracking/session';
import { sanitizeString } from '@/lib/validation';
import { geolocation } from '@vercel/functions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, metadata, sessionId, reason } = body;

    if (action === 'create') {
      // Create new session
      const userAgent = sanitizeString(request.headers.get('user-agent') || 'Unknown');
      const referer = sanitizeString(request.headers.get('referer') || 'Direct');
      
      // Get IP
      const xForwardedFor = request.headers.get('x-forwarded-for');
      const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : 'Unknown';
      
      // Get geolocation
      let country = 'Unknown';
      let city = 'Unknown';
      
      try {
        const geo = geolocation(request);
        country = geo.country || 'Unknown';
        city = geo.city || 'Unknown';
      } catch (error) {
        console.log('Geolocation not available');
      }

      const session = await createSession(userAgent, {
        ip,
        userAgent,
        country,
        city,
        referrer: metadata?.referrer || referer,
        landingPage: metadata?.landingPage || '/',
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
      });
    } else if (action === 'end') {
      // End session
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID required' },
          { status: 400 }
        );
      }

      const success = await endSession(sessionId, reason || 'manual');
      
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
