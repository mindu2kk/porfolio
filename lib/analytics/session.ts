import { kv } from '@vercel/kv';

// Session data structure
export interface Session {
  id: string;
  ip: string;
  userAgent: string;
  country: string;
  city: string;
  startTime: string;
  lastActivity: string;
  pageViews: number;
}

// Create or update a session
export async function trackSession(
  ip: string,
  userAgent: string,
  country: string,
  city: string
): Promise<Session> {
  const sessionId = `session:${ip}:${Date.now()}`;
  const now = new Date().toISOString();

  const session: Session = {
    id: sessionId,
    ip,
    userAgent,
    country,
    city,
    startTime: now,
    lastActivity: now,
    pageViews: 1,
  };

  // Store session with 30-minute expiration
  await kv.set(sessionId, session, { ex: 30 * 60 });
  
  // Add to active sessions index
  await kv.zadd('sessions:active', { score: Date.now(), member: sessionId });

  return session;
}

// Get active sessions (last 30 minutes)
export async function getActiveSessions(): Promise<Session[]> {
  try {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    
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
        const session = await kv.get<Session>(id as string);
        return session;
      })
    );

    return sessions.filter((session): session is Session => session !== null);
  } catch (error) {
    console.error('Failed to get active sessions:', error);
    return [];
  }
}

// Clean up old sessions
export async function cleanupOldSessions(): Promise<void> {
  try {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    
    // Remove old entries from sorted set
    await kv.zremrangebyscore('sessions:active', 0, thirtyMinutesAgo);
  } catch (error) {
    console.error('Failed to cleanup old sessions:', error);
  }
}
