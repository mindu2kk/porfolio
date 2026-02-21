import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getActiveSessions } from '@/lib/tracking/session';
import { type TrackingEvent } from '@/lib/tracking/events';

export async function GET() {
  try {
    // Get active sessions
    const activeSessions = await getActiveSessions();
    
    // Get ALL recent events (not just last 24h)
    const eventIds = await kv.zrange('events:all', 0, -1, {
      byScore: false,
      rev: true,
    });

    // Fetch events (limit to 500 most recent)
    const events = await Promise.all(
      (eventIds || []).slice(0, 500).map(async (id) => {
        const event = await kv.get<TrackingEvent>(`event:${id as string}`);
        return event;
      })
    );

    const validEvents = events.filter((e): e is TrackingEvent => e !== null);

    // Filter behavior events
    const behaviorEvents = validEvents.filter(e => 
      ['click', 'scroll_depth', 'idle_start', 'idle_end', 'visibility_change'].includes(e.type)
    );

    // Scroll depth analysis
    const scrollEvents = behaviorEvents.filter(e => e.type === 'scroll_depth');
    const scrollDepthDistribution = scrollEvents.reduce((acc, event) => {
      const depth = event.metadata.depth || 0;
      acc[depth] = (acc[depth] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Click heatmap data
    const clickEvents = behaviorEvents.filter(e => e.type === 'click');
    const clicksByPage = clickEvents.reduce((acc, event) => {
      const page = event.metadata.page || 'unknown';
      if (!acc[page]) acc[page] = [];
      acc[page].push({
        x: event.metadata.x,
        y: event.metadata.y,
        element: event.metadata.elementTag,
        timestamp: event.timestamp,
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Most clicked elements
    const elementClicks = clickEvents.reduce((acc, event) => {
      const element = event.metadata.elementTag || 'unknown';
      const id = event.metadata.elementId || '';
      const key = id ? `${element}#${id}` : element;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topElements = Object.entries(elementClicks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, clicks]) => ({ name, clicks }));

    // Idle analysis
    const idleStartEvents = behaviorEvents.filter(e => e.type === 'idle_start');
    const idleEndEvents = behaviorEvents.filter(e => e.type === 'idle_end');
    
    // Visibility analysis
    const visibilityEvents = behaviorEvents.filter(e => e.type === 'visibility_change');
    const tabHiddenCount = visibilityEvents.filter(e => e.metadata.state === 'hidden').length;
    const tabVisibleCount = visibilityEvents.filter(e => e.metadata.state === 'visible').length;

    // Session behavior metrics
    const avgScrollDepth = activeSessions.length > 0
      ? activeSessions.reduce((sum, s) => sum + s.metrics.maxScrollDepth, 0) / activeSessions.length
      : 0;

    const avgClicks = activeSessions.length > 0
      ? activeSessions.reduce((sum, s) => sum + s.metrics.clickCount, 0) / activeSessions.length
      : 0;

    const avgIdleEvents = activeSessions.length > 0
      ? activeSessions.reduce((sum, s) => sum + s.metrics.idleEvents, 0) / activeSessions.length
      : 0;

    // Engagement score (0-100)
    const calculateEngagementScore = (session: any) => {
      let score = 0;
      
      // Scroll depth (0-30 points)
      score += (session.metrics.maxScrollDepth / 100) * 30;
      
      // Clicks (0-25 points, max at 10 clicks)
      score += Math.min(session.metrics.clickCount / 10, 1) * 25;
      
      // Active time ratio (0-25 points)
      const activeRatio = session.metrics.duration > 0
        ? session.metrics.activeTime / session.metrics.duration
        : 0;
      score += activeRatio * 25;
      
      // Page views (0-20 points, max at 5 pages)
      score += Math.min(session.metrics.pageViews / 5, 1) * 20;
      
      return Math.round(score);
    };

    const engagementScores = activeSessions.map(s => ({
      sessionId: s.id,
      score: calculateEngagementScore(s),
      country: s.metadata.country,
      duration: s.metrics.duration,
    }));

    const avgEngagement = engagementScores.length > 0
      ? engagementScores.reduce((sum, s) => sum + s.score, 0) / engagementScores.length
      : 0;

    return NextResponse.json({
      summary: {
        totalBehaviorEvents: behaviorEvents.length,
        scrollEvents: scrollEvents.length,
        clickEvents: clickEvents.length,
        idleEvents: idleStartEvents.length,
        visibilityEvents: visibilityEvents.length,
        avgScrollDepth: Math.round(avgScrollDepth),
        avgClicks: Math.round(avgClicks * 10) / 10,
        avgIdleEvents: Math.round(avgIdleEvents * 10) / 10,
        avgEngagement: Math.round(avgEngagement),
      },
      scrollDepth: Object.entries(scrollDepthDistribution).map(([depth, count]) => ({
        depth: parseInt(depth),
        count,
      })).sort((a, b) => a.depth - b.depth),
      topElements,
      clicksByPage: Object.entries(clicksByPage).map(([page, clicks]) => ({
        page,
        clicks: clicks.length,
        heatmapData: clicks,
      })),
      visibility: {
        tabHidden: tabHiddenCount,
        tabVisible: tabVisibleCount,
        switchFrequency: tabHiddenCount + tabVisibleCount,
      },
      engagementScores: engagementScores.sort((a, b) => b.score - a.score).slice(0, 20),
    });
  } catch (error) {
    console.error('Behavior analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch behavior analytics' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
