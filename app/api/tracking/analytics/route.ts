import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getActiveSessions, type EnhancedSession } from '@/lib/tracking/session';
import { type TrackingEvent } from '@/lib/tracking/events';

export async function GET() {
  try {
    // Get active sessions
    const activeSessions = await getActiveSessions();
    
    // Get recent events (last 100)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const eventIds = await kv.zrange('events:all', oneDayAgo, now, {
      byScore: true,
      rev: true,
    });

    // Fetch events
    const events = await Promise.all(
      (eventIds || []).slice(0, 100).map(async (id) => {
        const event = await kv.get<TrackingEvent>(`event:${id as string}`);
        return event;
      })
    );

    const validEvents = events.filter((e): e is TrackingEvent => e !== null);

    // Calculate metrics
    const totalSessions = activeSessions.length;
    const totalEvents = validEvents.length;
    
    // Event type breakdown
    const eventsByType = validEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Session metrics
    const avgDuration = activeSessions.length > 0
      ? activeSessions.reduce((sum, s) => sum + s.metrics.duration, 0) / activeSessions.length
      : 0;

    const avgPageViews = activeSessions.length > 0
      ? activeSessions.reduce((sum, s) => sum + s.metrics.pageViews, 0) / activeSessions.length
      : 0;

    // Country breakdown
    const byCountry = activeSessions.reduce((acc, session) => {
      const country = session.metadata.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Device breakdown
    const byDevice = activeSessions.reduce((acc, session) => {
      const device = session.metadata.device || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity (last 10 sessions)
    const recentActivity = activeSessions
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .slice(0, 10)
      .map(session => ({
        id: session.id,
        country: session.metadata.country,
        city: session.metadata.city,
        device: session.metadata.device,
        browser: session.metadata.browser,
        duration: session.metrics.duration,
        pageViews: session.metrics.pageViews,
        lastActivity: new Date(session.lastActivity).toISOString(),
      }));

    return NextResponse.json({
      summary: {
        activeSessions: totalSessions,
        totalEvents,
        avgDuration: Math.round(avgDuration),
        avgPageViews: Math.round(avgPageViews * 10) / 10,
      },
      eventsByType: Object.entries(eventsByType).map(([name, value]) => ({
        name,
        value,
      })),
      byCountry: Object.entries(byCountry).map(([name, value]) => ({
        name,
        value,
      })),
      byDevice: Object.entries(byDevice).map(([name, value]) => ({
        name,
        value,
      })),
      recentActivity,
      sessions: activeSessions.map(s => ({
        id: s.id,
        userId: s.userId,
        country: s.metadata.country,
        city: s.metadata.city,
        duration: s.metrics.duration,
        pageViews: s.metrics.pageViews,
        clicks: s.metrics.clicks,
        scrollDepth: s.metrics.scrollDepth,
        activeTime: s.metrics.activeTime,
        idleTime: s.metrics.idleTime,
      })),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
