// Session replay-lite (event sequence reconstruction)
import { kv } from '@vercel/kv';
import { type TrackingEvent } from './events';
import { type EnhancedSession } from './session';

export interface ReplayEvent {
  id: string;
  type: string;
  timestamp: number;
  timeDelta: number; // milliseconds since previous event
  metadata: Record<string, any>;
}

export interface SessionReplay {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalEvents: number;
  events: ReplayEvent[];
  summary: {
    pageViews: number;
    clicks: number;
    scrollEvents: number;
    idleEvents: number;
    visibilityChanges: number;
    performanceEvents: number;
  };
  userJourney: {
    step: number;
    action: string;
    timestamp: number;
    timeSinceStart: number;
  }[];
}

// Get session replay data
export async function getSessionReplay(
  sessionId: string
): Promise<SessionReplay | null> {
  try {
    // Get session
    const session = await kv.get<EnhancedSession>(`session:${sessionId}`);
    if (!session) return null;

    // Get all events for this session
    const eventIds = await kv.zrange(`events:session:${sessionId}`, 0, -1, {
      byScore: false,
    });

    if (!eventIds || eventIds.length === 0) {
      return null;
    }

    // Fetch events
    const events = await Promise.all(
      eventIds.map(async (id) => {
        const event = await kv.get<TrackingEvent>(`event:${id as string}`);
        return event;
      })
    );

    const validEvents = events.filter((e): e is TrackingEvent => e !== null);
    
    // Sort by timestamp
    validEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate time deltas
    const replayEvents: ReplayEvent[] = validEvents.map((event, index) => {
      const prevTimestamp = index > 0 ? validEvents[index - 1].timestamp : event.timestamp;
      const timeDelta = event.timestamp - prevTimestamp;

      return {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        timeDelta,
        metadata: event.metadata,
      };
    });

    // Calculate summary
    const summary = {
      pageViews: validEvents.filter(e => e.type === 'page_view').length,
      clicks: validEvents.filter(e => e.type === 'click').length,
      scrollEvents: validEvents.filter(e => e.type === 'scroll_depth').length,
      idleEvents: validEvents.filter(e => e.type === 'idle_start').length,
      visibilityChanges: validEvents.filter(e => e.type === 'visibility_change').length,
      performanceEvents: validEvents.filter(e => e.type === 'performance').length,
    };

    // Generate user journey
    const userJourney = generateUserJourney(validEvents, session.startTime);

    return {
      sessionId,
      userId: session.userId,
      startTime: session.startTime,
      endTime: session.lastActivity,
      duration: session.metrics.duration,
      totalEvents: validEvents.length,
      events: replayEvents,
      summary,
      userJourney,
    };
  } catch (error) {
    console.error('Failed to get session replay:', error);
    return null;
  }
}

// Generate human-readable user journey
function generateUserJourney(
  events: TrackingEvent[],
  sessionStart: number
): SessionReplay['userJourney'] {
  const journey: SessionReplay['userJourney'] = [];
  let step = 0;

  for (const event of events) {
    let action = '';

    switch (event.type) {
      case 'session_start':
        action = `Started session on ${event.metadata.landingPage || '/'}`;
        break;
      
      case 'page_view':
        action = `Viewed page: ${event.metadata.page || 'unknown'}`;
        break;
      
      case 'click':
        const element = event.metadata.elementId 
          ? `#${event.metadata.elementId}` 
          : event.metadata.elementTag || 'element';
        action = `Clicked ${element}`;
        break;
      
      case 'scroll_depth':
        action = `Scrolled to ${event.metadata.depth}%`;
        break;
      
      case 'idle_start':
        action = 'Became idle';
        break;
      
      case 'idle_end':
        action = 'Became active again';
        break;
      
      case 'visibility_change':
        action = event.metadata.state === 'hidden' 
          ? 'Tab hidden' 
          : 'Tab visible';
        break;
      
      case 'performance':
        action = `Performance metrics captured (TTFB: ${event.metadata.metrics?.ttfb}ms)`;
        break;
      
      case 'web_vital_fcp':
        action = `FCP: ${event.metadata.value}ms (${event.metadata.rating})`;
        break;
      
      case 'web_vital_lcp':
        action = `LCP: ${event.metadata.value}ms (${event.metadata.rating})`;
        break;
      
      case 'environment':
        action = `Environment: ${event.metadata.network?.effectiveType || 'unknown'} network`;
        break;
      
      case 'heartbeat':
        // Skip heartbeats in journey (too noisy)
        continue;
      
      case 'session_end':
        action = `Session ended (${event.metadata.reason})`;
        break;
      
      default:
        action = `${event.type} event`;
    }

    if (action) {
      journey.push({
        step: ++step,
        action,
        timestamp: event.timestamp,
        timeSinceStart: event.timestamp - sessionStart,
      });
    }
  }

  return journey;
}

// Get replay summary for multiple sessions
export async function getReplaySummaries(
  sessionIds: string[]
): Promise<{
  sessionId: string;
  userId: string;
  duration: number;
  totalEvents: number;
  pageViews: number;
  clicks: number;
  engagementScore: number;
}[]> {
  const summaries = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const replay = await getSessionReplay(sessionId);
      if (!replay) return null;

      // Calculate engagement score
      const engagementScore = Math.min(
        (replay.summary.clicks * 5) +
        (replay.summary.scrollEvents * 3) +
        (replay.summary.pageViews * 10),
        100
      );

      return {
        sessionId: replay.sessionId,
        userId: replay.userId,
        duration: replay.duration,
        totalEvents: replay.totalEvents,
        pageViews: replay.summary.pageViews,
        clicks: replay.summary.clicks,
        engagementScore,
      };
    })
  );

  return summaries.filter((s): s is NonNullable<typeof s> => s !== null);
}

// Export replay as JSON for external analysis
export async function exportReplay(
  sessionId: string
): Promise<string | null> {
  const replay = await getSessionReplay(sessionId);
  if (!replay) return null;

  return JSON.stringify(replay, null, 2);
}

// Analyze replay patterns
export interface ReplayPattern {
  pattern: string;
  description: string;
  frequency: number;
  avgDuration: number;
  examples: string[]; // session IDs
}

export async function analyzeReplayPatterns(
  sessionIds: string[]
): Promise<ReplayPattern[]> {
  const patterns: Map<string, {
    count: number;
    durations: number[];
    examples: string[];
  }> = new Map();

  for (const sessionId of sessionIds) {
    const replay = await getSessionReplay(sessionId);
    if (!replay) continue;

    // Identify patterns
    const eventSequence = replay.events.map(e => e.type).join(' -> ');
    
    // Common patterns
    if (eventSequence.includes('page_view -> scroll_depth -> click')) {
      addPattern(patterns, 'engaged_reader', replay.duration, sessionId);
    }
    
    if (eventSequence.includes('page_view -> idle_start')) {
      addPattern(patterns, 'quick_bounce', replay.duration, sessionId);
    }
    
    if (replay.summary.clicks > 5 && replay.summary.scrollEvents > 3) {
      addPattern(patterns, 'highly_engaged', replay.duration, sessionId);
    }
    
    if (replay.summary.visibilityChanges > 3) {
      addPattern(patterns, 'multi_tasker', replay.duration, sessionId);
    }
    
    if (replay.duration > 300000) { // 5 minutes
      addPattern(patterns, 'long_session', replay.duration, sessionId);
    }
  }

  // Convert to array
  const patternDescriptions: Record<string, string> = {
    engaged_reader: 'Users who scroll and click after viewing',
    quick_bounce: 'Users who become idle quickly',
    highly_engaged: 'Users with many interactions',
    multi_tasker: 'Users who switch tabs frequently',
    long_session: 'Sessions longer than 5 minutes',
  };

  return Array.from(patterns.entries()).map(([pattern, data]) => ({
    pattern,
    description: patternDescriptions[pattern] || pattern,
    frequency: data.count,
    avgDuration: Math.round(data.durations.reduce((sum, d) => sum + d, 0) / data.count),
    examples: data.examples.slice(0, 5),
  }));
}

function addPattern(
  patterns: Map<string, { count: number; durations: number[]; examples: string[] }>,
  pattern: string,
  duration: number,
  sessionId: string
) {
  if (!patterns.has(pattern)) {
    patterns.set(pattern, { count: 0, durations: [], examples: [] });
  }
  
  const data = patterns.get(pattern)!;
  data.count++;
  data.durations.push(duration);
  if (data.examples.length < 5) {
    data.examples.push(sessionId);
  }
}
