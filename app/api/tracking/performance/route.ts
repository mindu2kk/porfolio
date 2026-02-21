import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { type TrackingEvent } from '@/lib/tracking/events';

export async function GET() {
  try {
    // Get recent performance events (last 24 hours)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const eventIds = await kv.zrange('events:all', oneDayAgo, now, {
      byScore: true,
      rev: true,
    });

    // Fetch events
    const events = await Promise.all(
      (eventIds || []).slice(0, 500).map(async (id) => {
        const event = await kv.get<TrackingEvent>(`event:${id as string}`);
        return event;
      })
    );

    const validEvents = events.filter((e): e is TrackingEvent => e !== null);

    // Filter performance-related events
    const performanceEvents = validEvents.filter(e => e.type === 'performance');
    const fcpEvents = validEvents.filter(e => e.type === 'web_vital_fcp');
    const lcpEvents = validEvents.filter(e => e.type === 'web_vital_lcp');
    const fidEvents = validEvents.filter(e => e.type === 'web_vital_fid');
    const clsEvents = validEvents.filter(e => e.type === 'web_vital_cls');
    const environmentEvents = validEvents.filter(e => e.type === 'environment');
    const networkEvents = validEvents.filter(e => e.type === 'network_change');

    // Calculate averages for navigation timing
    const avgMetrics = performanceEvents.length > 0 ? {
      dns: Math.round(performanceEvents.reduce((sum, e) => sum + (e.metadata.metrics?.dns || 0), 0) / performanceEvents.length),
      tcp: Math.round(performanceEvents.reduce((sum, e) => sum + (e.metadata.metrics?.tcp || 0), 0) / performanceEvents.length),
      ttfb: Math.round(performanceEvents.reduce((sum, e) => sum + (e.metadata.metrics?.ttfb || 0), 0) / performanceEvents.length),
      download: Math.round(performanceEvents.reduce((sum, e) => sum + (e.metadata.metrics?.download || 0), 0) / performanceEvents.length),
      domInteractive: Math.round(performanceEvents.reduce((sum, e) => sum + (e.metadata.metrics?.domInteractive || 0), 0) / performanceEvents.length),
      domComplete: Math.round(performanceEvents.reduce((sum, e) => sum + (e.metadata.metrics?.domComplete || 0), 0) / performanceEvents.length),
      loadComplete: Math.round(performanceEvents.reduce((sum, e) => sum + (e.metadata.metrics?.loadComplete || 0), 0) / performanceEvents.length),
    } : null;

    // Web Vitals averages
    const avgFCP = fcpEvents.length > 0
      ? Math.round(fcpEvents.reduce((sum, e) => sum + (e.metadata.value || 0), 0) / fcpEvents.length)
      : null;

    const avgLCP = lcpEvents.length > 0
      ? Math.round(lcpEvents.reduce((sum, e) => sum + (e.metadata.value || 0), 0) / lcpEvents.length)
      : null;

    const avgFID = fidEvents.length > 0
      ? Math.round(fidEvents.reduce((sum, e) => sum + (e.metadata.value || 0), 0) / fidEvents.length)
      : null;

    const avgCLS = clsEvents.length > 0
      ? Math.round(clsEvents.reduce((sum, e) => sum + (e.metadata.value || 0), 0) / clsEvents.length * 1000) / 1000
      : null;

    // Web Vitals ratings distribution
    const fcpRatings = fcpEvents.reduce((acc, e) => {
      const rating = e.metadata.rating || 'unknown';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lcpRatings = lcpEvents.reduce((acc, e) => {
      const rating = e.metadata.rating || 'unknown';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const fidRatings = fidEvents.reduce((acc, e) => {
      const rating = e.metadata.rating || 'unknown';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const clsRatings = clsEvents.reduce((acc, e) => {
      const rating = e.metadata.rating || 'unknown';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Network distribution
    const networkTypes = environmentEvents.reduce((acc, e) => {
      const type = e.metadata.network?.effectiveType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Hardware distribution
    const deviceMemory = environmentEvents.reduce((acc, e) => {
      const memory = e.metadata.hardware?.deviceMemory || 'unknown';
      const key = memory === 'unknown' ? 'unknown' : `${memory}GB`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cpuCores = environmentEvents.reduce((acc, e) => {
      const cores = e.metadata.hardware?.hardwareConcurrency || 'unknown';
      const key = cores === 'unknown' ? 'unknown' : `${cores} cores`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Screen resolutions
    const screenResolutions = environmentEvents.reduce((acc, e) => {
      const width = e.metadata.hardware?.screenWidth;
      const height = e.metadata.hardware?.screenHeight;
      if (width && height) {
        const key = `${width}x${height}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Performance score (0-100)
    const calculatePerformanceScore = (fcp: number, lcp: number, fid: number, cls: number) => {
      let score = 0;
      
      // FCP (0-25 points)
      if (fcp < 1800) score += 25;
      else if (fcp < 3000) score += 15;
      else score += 5;
      
      // LCP (0-25 points)
      if (lcp < 2500) score += 25;
      else if (lcp < 4000) score += 15;
      else score += 5;
      
      // FID (0-25 points)
      if (fid < 100) score += 25;
      else if (fid < 300) score += 15;
      else score += 5;
      
      // CLS (0-25 points)
      if (cls < 0.1) score += 25;
      else if (cls < 0.25) score += 15;
      else score += 5;
      
      return score;
    };

    const performanceScores = performanceEvents.map((_, idx) => {
      const fcp = fcpEvents[idx]?.metadata.value || 2000;
      const lcp = lcpEvents[idx]?.metadata.value || 3000;
      const fid = fidEvents[idx]?.metadata.value || 150;
      const cls = clsEvents[idx]?.metadata.value || 0.15;
      
      return {
        score: calculatePerformanceScore(fcp, lcp, fid, cls),
        fcp,
        lcp,
        fid,
        cls,
      };
    }).slice(0, 20);

    const avgPerformanceScore = performanceScores.length > 0
      ? Math.round(performanceScores.reduce((sum, s) => sum + s.score, 0) / performanceScores.length)
      : null;

    return NextResponse.json({
      summary: {
        totalPerformanceEvents: performanceEvents.length,
        totalWebVitalEvents: fcpEvents.length + lcpEvents.length + fidEvents.length + clsEvents.length,
        avgPerformanceScore,
      },
      navigationTiming: avgMetrics,
      webVitals: {
        fcp: {
          avg: avgFCP,
          ratings: fcpRatings,
          count: fcpEvents.length,
        },
        lcp: {
          avg: avgLCP,
          ratings: lcpRatings,
          count: lcpEvents.length,
        },
        fid: {
          avg: avgFID,
          ratings: fidRatings,
          count: fidEvents.length,
        },
        cls: {
          avg: avgCLS,
          ratings: clsRatings,
          count: clsEvents.length,
        },
      },
      environment: {
        networkTypes: Object.entries(networkTypes).map(([type, count]) => ({ type, count })),
        deviceMemory: Object.entries(deviceMemory).map(([memory, count]) => ({ memory, count })),
        cpuCores: Object.entries(cpuCores).map(([cores, count]) => ({ cores, count })),
        screenResolutions: Object.entries(screenResolutions)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([resolution, count]) => ({ resolution, count })),
      },
      performanceScores,
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance analytics' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
