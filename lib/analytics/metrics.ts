import { kv } from '@vercel/kv';
import { getActiveSessions } from './session';

// Metrics data structure
export interface VisitorMetrics {
  totalVisitors: number;
  activeSessions: number;
  topCountries: Array<{ country: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  recentVisitors: Array<{
    timestamp: string;
    country: string;
    city: string;
    ip: string;
  }>;
}

// Calculate visitor metrics
export async function calculateMetrics(): Promise<VisitorMetrics> {
  try {
    // Get total visitor count
    const totalVisitors = (await kv.get<number>('portfolio:visitor:count')) || 0;

    // Get active sessions
    const sessions = await getActiveSessions();
    const activeSessions = sessions.length;

    // Get recent visitor logs
    const logs = await kv.lrange('portfolio:visitor:logs', 0, 99);

    // Calculate top countries
    const countryMap = new Map<string, number>();
    logs.forEach((log: any) => {
      if (log.country && log.country !== 'Unknown') {
        countryMap.set(log.country, (countryMap.get(log.country) || 0) + 1);
      }
    });
    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate top cities
    const cityMap = new Map<string, number>();
    logs.forEach((log: any) => {
      if (log.city && log.city !== 'Unknown') {
        cityMap.set(log.city, (cityMap.get(log.city) || 0) + 1);
      }
    });
    const topCities = Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent visitors (last 10)
    const recentVisitors = logs.slice(0, 10).map((log: any) => ({
      timestamp: log.timestamp,
      country: log.country,
      city: log.city,
      ip: log.ip,
    }));

    return {
      totalVisitors,
      activeSessions,
      topCountries,
      topCities,
      recentVisitors,
    };
  } catch (error) {
    console.error('Failed to calculate metrics:', error);
    return {
      totalVisitors: 0,
      activeSessions: 0,
      topCountries: [],
      topCities: [],
      recentVisitors: [],
    };
  }
}

// Get visitor stats by time period
export async function getVisitorStats(hours: number = 24): Promise<number> {
  try {
    const logs = await kv.lrange('portfolio:visitor:logs', 0, -1);
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentCount = logs.filter((log: any) => {
      const logTime = new Date(log.timestamp);
      return logTime > cutoffTime;
    }).length;

    return recentCount;
  } catch (error) {
    console.error('Failed to get visitor stats:', error);
    return 0;
  }
}
