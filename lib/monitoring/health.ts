import { kv } from '@vercel/kv';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  checks: {
    kv: boolean;
    api: boolean;
    rateLimit: boolean;
  };
  metrics: {
    totalVisitors: number;
    rateLimitHits: number;
    errorRate: number;
    uptime: string;
  };
  timestamp: string;
}

// Check KV database connection
export async function checkKVHealth(): Promise<boolean> {
  try {
    await kv.ping();
    return true;
  } catch (error) {
    console.error('KV health check failed:', error);
    return false;
  }
}

// Get rate limit statistics
export async function getRateLimitStats(): Promise<number> {
  try {
    // Count rate limit hits from audit logs
    const logs = await kv.lrange('audit:index', 0, -1);
    const rateLimitLogs = logs.filter((id: any) => 
      typeof id === 'string' && id.includes('rate_limit')
    );
    return rateLimitLogs.length;
  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return 0;
  }
}

// Calculate error rate from audit logs
export async function getErrorRate(): Promise<number> {
  try {
    const logs = await kv.lrange('audit:index', 0, 99);
    if (logs.length === 0) return 0;
    
    let errorCount = 0;
    for (const id of logs) {
      const log = await kv.get(id as string);
      if (log && typeof log === 'object' && 'success' in log && !log.success) {
        errorCount++;
      }
    }
    
    return Math.round((errorCount / logs.length) * 100);
  } catch (error) {
    console.error('Failed to calculate error rate:', error);
    return 0;
  }
}

// Get system uptime (from process start)
export function getUptime(): string {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Perform full health check
export async function performHealthCheck(): Promise<HealthStatus> {
  const kvHealthy = await checkKVHealth();
  const rateLimitHits = await getRateLimitStats();
  const errorRate = await getErrorRate();
  
  // Get total visitors
  let totalVisitors = 0;
  try {
    totalVisitors = (await kv.get<number>('portfolio:visitor:count')) || 0;
  } catch (error) {
    console.error('Failed to get visitor count:', error);
  }
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'down' = 'healthy';
  if (!kvHealthy) {
    status = 'down';
  } else if (errorRate > 10) {
    status = 'degraded';
  }
  
  return {
    status,
    checks: {
      kv: kvHealthy,
      api: true, // If we got here, API is working
      rateLimit: rateLimitHits < 100, // Healthy if less than 100 rate limit hits
    },
    metrics: {
      totalVisitors,
      rateLimitHits,
      errorRate,
      uptime: getUptime(),
    },
    timestamp: new Date().toISOString(),
  };
}
