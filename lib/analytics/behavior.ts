import { kv } from '@vercel/kv';

export interface BehaviorMetrics {
  averageSessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  engagementScore: number;
  returnVisitorRate: number;
}

// Calculate session duration from logs
export function calculateSessionDuration(logs: Array<{ timestamp: string; ip: string }>): number {
  if (logs.length === 0) return 0;
  
  // Group by IP to identify sessions
  const sessionMap = new Map<string, Date[]>();
  
  logs.forEach(log => {
    const ip = log.ip;
    const timestamp = new Date(log.timestamp);
    
    if (!sessionMap.has(ip)) {
      sessionMap.set(ip, []);
    }
    sessionMap.get(ip)!.push(timestamp);
  });
  
  // Calculate average session duration
  let totalDuration = 0;
  let sessionCount = 0;
  
  sessionMap.forEach((timestamps) => {
    if (timestamps.length > 1) {
      timestamps.sort((a, b) => a.getTime() - b.getTime());
      const duration = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime();
      totalDuration += duration;
      sessionCount++;
    }
  });
  
  if (sessionCount === 0) return 0;
  
  // Return average in seconds
  return Math.round(totalDuration / sessionCount / 1000);
}

// Calculate bounce rate (visitors who view only 1 page)
export function calculateBounceRate(logs: Array<{ ip: string }>): number {
  if (logs.length === 0) return 0;
  
  const visitorPageCount = new Map<string, number>();
  
  logs.forEach(log => {
    const count = visitorPageCount.get(log.ip) || 0;
    visitorPageCount.set(log.ip, count + 1);
  });
  
  const singlePageVisitors = Array.from(visitorPageCount.values()).filter(count => count === 1).length;
  const totalVisitors = visitorPageCount.size;
  
  return Math.round((singlePageVisitors / totalVisitors) * 100);
}

// Calculate pages per session
export function calculatePagesPerSession(logs: Array<{ ip: string }>): number {
  if (logs.length === 0) return 0;
  
  const visitorPageCount = new Map<string, number>();
  
  logs.forEach(log => {
    const count = visitorPageCount.get(log.ip) || 0;
    visitorPageCount.set(log.ip, count + 1);
  });
  
  const totalPages = logs.length;
  const totalSessions = visitorPageCount.size;
  
  return Math.round((totalPages / totalSessions) * 10) / 10; // 1 decimal place
}

// Calculate return visitor rate
export function calculateReturnVisitorRate(logs: Array<{ ip: string }>): number {
  if (logs.length === 0) return 0;
  
  const visitorCount = new Map<string, number>();
  
  logs.forEach(log => {
    const count = visitorCount.get(log.ip) || 0;
    visitorCount.set(log.ip, count + 1);
  });
  
  const returnVisitors = Array.from(visitorCount.values()).filter(count => count > 1).length;
  const totalVisitors = visitorCount.size;
  
  return Math.round((returnVisitors / totalVisitors) * 100);
}

// Calculate engagement score (0-100)
export function calculateEngagementScore(
  sessionDuration: number,
  pagesPerSession: number,
  bounceRate: number,
  returnRate: number
): number {
  // Scoring weights
  const durationScore = Math.min((sessionDuration / 300) * 30, 30); // Max 30 points for 5+ min
  const pagesScore = Math.min((pagesPerSession / 5) * 25, 25); // Max 25 points for 5+ pages
  const bounceScore = Math.max(20 - (bounceRate / 5), 0); // Max 20 points for 0% bounce
  const returnScore = (returnRate / 100) * 25; // Max 25 points for 100% return
  
  return Math.round(durationScore + pagesScore + bounceScore + returnScore);
}

// Get all behavior metrics
export async function getBehaviorMetrics(): Promise<BehaviorMetrics> {
  try {
    const logs = await kv.lrange('portfolio:visitor:logs', 0, 99);
    
    if (!logs || logs.length === 0) {
      return {
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        engagementScore: 0,
        returnVisitorRate: 0,
      };
    }
    
    const sessionDuration = calculateSessionDuration(logs as any[]);
    const bounceRate = calculateBounceRate(logs as any[]);
    const pagesPerSession = calculatePagesPerSession(logs as any[]);
    const returnRate = calculateReturnVisitorRate(logs as any[]);
    const engagementScore = calculateEngagementScore(
      sessionDuration,
      pagesPerSession,
      bounceRate,
      returnRate
    );
    
    return {
      averageSessionDuration: sessionDuration,
      bounceRate,
      pagesPerSession,
      engagementScore,
      returnVisitorRate: returnRate,
    };
  } catch (error) {
    console.error('Failed to calculate behavior metrics:', error);
    return {
      averageSessionDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      engagementScore: 0,
      returnVisitorRate: 0,
    };
  }
}

// Format duration for display
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
