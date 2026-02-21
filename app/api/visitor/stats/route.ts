import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { calculateDeviceStats } from '@/lib/analytics/device';
import { calculateTrafficSources } from '@/lib/analytics/traffic';

const VISITOR_LOG_KEY = 'portfolio:visitor:logs';

interface VisitorLog {
  timestamp: string;
  userAgent: string;
  referer: string;
  ip: string;
  country: string;
  city: string;
  browser?: string;
  os?: string;
  device?: string;
}

export async function GET() {
  try {
    // Get all logs (last 100)
    const logs = await kv.lrange<VisitorLog>(VISITOR_LOG_KEY, 0, 99);
    
    if (!logs || logs.length === 0) {
      return NextResponse.json({
        byCountry: [],
        byDevice: [],
        byBrowser: [],
        byOS: [],
        byTrafficSource: [],
        byTrafficType: [],
        byHour: [],
        byDay: [],
      });
    }
    
    // Count by country
    const countryMap = new Map<string, number>();
    logs.forEach(log => {
      const country = log.country || 'Unknown';
      const count = countryMap.get(country) || 0;
      countryMap.set(country, count + 1);
    });
    const byCountry = Array.from(countryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    // Count by device using new device library
    const deviceStats = calculateDeviceStats(logs);
    const byDevice = deviceStats.devices;
    const byBrowser = deviceStats.browsers;
    const byOS = deviceStats.os;
    
    // Calculate traffic sources
    const trafficStats = calculateTrafficSources(logs);
    const byTrafficSource = trafficStats.sources;
    const byTrafficType = trafficStats.byType;
    
    // Count by hour (last 24 hours) - FIXED LOGIC
    const now = new Date();
    const hourMap = new Map<string, number>();
    
    // Initialize all hours in last 24h
    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hourDate.getHours().toString().padStart(2, '0');
      hourMap.set(hourKey, 0);
    }
    
    // Count visitors per hour
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const timeDiff = now.getTime() - logDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        const hourKey = logDate.getHours().toString().padStart(2, '0');
        const count = hourMap.get(hourKey) || 0;
        hourMap.set(hourKey, count + 1);
      }
    });
    
    const byHour = Array.from(hourMap.entries())
      .map(([hour, visitors]) => ({
        hour: `${hour}:00`,
        visitors,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    
    // Count by day (last 7 days) - FIXED LOGIC
    const dayMap = new Map<string, number>();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = dayNames[dayDate.getDay()];
      const dayKey = `${dayName} ${dayDate.getDate()}/${dayDate.getMonth() + 1}`;
      dayMap.set(dayKey, 0);
    }
    
    // Count visitors per day
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const timeDiff = now.getTime() - logDate.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 7) {
        const dayName = dayNames[logDate.getDay()];
        const dayKey = `${dayName} ${logDate.getDate()}/${logDate.getMonth() + 1}`;
        const count = dayMap.get(dayKey) || 0;
        dayMap.set(dayKey, count + 1);
      }
    });
    
    const byDay = Array.from(dayMap.entries())
      .map(([day, visitors]) => ({ day, visitors }));
    
    return NextResponse.json({
      byCountry,
      byDevice,
      byBrowser,
      byOS,
      byTrafficSource,
      byTrafficType,
      byHour,
      byDay,
    });
  } catch (error) {
    console.error('Failed to get visitor stats:', error);
    return NextResponse.json({
      byCountry: [],
      byDevice: [],
      byBrowser: [],
      byOS: [],
      byTrafficSource: [],
      byTrafficType: [],
      byHour: [],
      byDay: [],
    }, { status: 200 });
  }
}

export const runtime = 'edge';
