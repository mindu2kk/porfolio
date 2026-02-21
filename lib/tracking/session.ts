// Enhanced session management with event tracking
import { kv } from '@vercel/kv';
import { TrackingEvent, generateSessionId, generateUserId, createEvent } from './events';

export interface EnhancedSession {
  id: string;
  userId: string;
  startTime: number;
  lastHeartbeat: number;
  lastActivity: number;
  events: string[]; // Event IDs
  metrics: SessionMetrics;
  metadata: SessionMetadata;
}

export interface SessionMetrics {
  duration: number; // seconds
  pageViews: number;
  clicks: number;
  scrollDepth: number; // max depth reached
  idleTime: number; // seconds
  activeTime: number; // seconds
}

export interface SessionMetadata {
  ip: string;
  userAgent: string;
  country: string;
  city: string;
  browser?: string;
  os?: string;
  device?: string;
  referrer: string;
  landingPage: string;
}

const SESSION_TTL = 30 * 60; // 30 minutes
const HEARTBEAT_INTERVAL = 30; // 30 seconds
const HEARTBEAT_MISS_THRESHOLD = 2; // End session after 2 missed heartbeats

// Create new session
export async function createSession(
  userAgent: string,
  metadata: SessionMetadata
): Promise<EnhancedSession> {
  // Generate user ID (fingerprint-lite)
  const timezone = 'UTC'; // Will be provided by client
  const screen = '1920x1080'; // Will be provided by client
  const userId = generateUserId(userAgent, timezone, screen);
  
  const sessionId = generateSessionId();
  const now = Date.now();

  const session: EnhancedSession = {
    id: sessionId,
    userId,
    startTime: now,
    lastHeartbeat: now,
    lastActivity: now,
    events: [],
    metrics: {
      duration: 0,
      pageViews: 1,
      clicks: 0,
      scrollDepth: 0,
      idleTime: 0,
      activeTime: 0,
    },
    metadata,
  };

  // Store session
  await kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL });
  
  // Add to active sessions index
  await kv.zadd('sessions:active', { score: now, member: sessionId });

  // Create session_start event
  const event = createEvent('session_start', userId, sessionId, {
    ...metadata,
    timestamp: now,
  });
  
  // Store event
  await storeEvent(event);
  
  // Add event to session
  session.events.push(event.id);
  await kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL });

  return session;
}

// Get session by ID
export async function getSession(sessionId: string): Promise<EnhancedSession | null> {
  try {
    const session = await kv.get<EnhancedSession>(`session:${sessionId}`);
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

// Update session heartbeat
export async function updateHeartbeat(
  sessionId: string,
  isVisible: boolean,
  idleTime: number
): Promise<boolean> {
  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    const now = Date.now();
    session.lastHeartbeat = now;
    
    if (isVisible && idleTime === 0) {
      session.lastActivity = now;
    }

    // Update metrics
    session.metrics.duration = Math.floor((now - session.startTime) / 1000);
    session.metrics.idleTime += idleTime;
    session.metrics.activeTime = session.metrics.duration - session.metrics.idleTime;

    // Store updated session
    await kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL });
    
    // Update active sessions index
    await kv.zadd('sessions:active', { score: now, member: sessionId });

    // Create heartbeat event
    const event = createEvent('heartbeat', session.userId, sessionId, {
      isVisible,
      idleTime,
      duration: session.metrics.duration,
    });
    
    await storeEvent(event);
    session.events.push(event.id);
    await kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL });

    return true;
  } catch (error) {
    console.error('Failed to update heartbeat:', error);
    return false;
  }
}

// End session
export async function endSession(sessionId: string, reason: string): Promise<boolean> {
  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    const now = Date.now();
    
    // Update final metrics
    session.metrics.duration = Math.floor((now - session.startTime) / 1000);

    // Create session_end event
    const event = createEvent('session_end', session.userId, sessionId, {
      reason,
      duration: session.metrics.duration,
      metrics: session.metrics,
    });
    
    await storeEvent(event);
    session.events.push(event.id);

    // Store final session state
    await kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL });
    
    // Remove from active sessions
    await kv.zrem('sessions:active', sessionId);

    return true;
  } catch (error) {
    console.error('Failed to end session:', error);
    return false;
  }
}

// Get active sessions
export async function getActiveSessions(): Promise<EnhancedSession[]> {
  try {
    const thirtyMinutesAgo = Date.now() - SESSION_TTL * 1000;
    
    // Get session IDs from sorted set
    const sessionIds = await kv.zrange('sessions:active', thirtyMinutesAgo, Date.now(), {
      byScore: true,
    });

    if (!sessionIds || sessionIds.length === 0) {
      return [];
    }

    // Fetch all sessions
    const sessions = await Promise.all(
      sessionIds.map(async (id) => {
        const session = await kv.get<EnhancedSession>(`session:${id as string}`);
        return session;
      })
    );

    return sessions.filter((session): session is EnhancedSession => session !== null);
  } catch (error) {
    console.error('Failed to get active sessions:', error);
    return [];
  }
}

// Store event
async function storeEvent(event: TrackingEvent): Promise<void> {
  try {
    // Store event
    await kv.set(`event:${event.id}`, event, { ex: 30 * 24 * 60 * 60 }); // 30 days
    
    // Add to events index
    await kv.zadd('events:all', { score: event.timestamp, member: event.id });
    
    // Add to user events index
    await kv.zadd(`events:user:${event.userId}`, { score: event.timestamp, member: event.id });
    
    // Add to session events index
    await kv.zadd(`events:session:${event.sessionId}`, { score: event.timestamp, member: event.id });
  } catch (error) {
    console.error('Failed to store event:', error);
  }
}

// Clean up old sessions
export async function cleanupOldSessions(): Promise<void> {
  try {
    const cutoff = Date.now() - SESSION_TTL * 1000;
    
    // Get old session IDs
    const oldSessionIds = await kv.zrange('sessions:active', 0, cutoff, {
      byScore: true,
    });

    if (!oldSessionIds || oldSessionIds.length === 0) {
      return;
    }

    // End each old session
    for (const sessionId of oldSessionIds) {
      await endSession(sessionId as string, 'timeout');
    }
  } catch (error) {
    console.error('Failed to cleanup old sessions:', error);
  }
}
