import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const VISITOR_LOG_KEY = 'portfolio:visitor:logs';

interface VisitorLog {
  timestamp: string;
  userAgent: string;
  referer: string;
  ip: string;
  country: string;
  city: string;
}

export async function GET() {
  try {
    // Get all logs (last 100)
    const logs = await kv.lrange<VisitorLog>(VISITOR_LOG_KEY, 0, 99);
    
    if (!logs || logs.length === 0) {
      return NextResponse.json({
        byCountry: [],
        byDevice: [],
        byHour: [],
        byDay: [],
      });
    }
    
    // Count by country
    const countryMap = new Map<string, number>();
    logs.forEach(log => {
      const count = countryMap.get(log.country) || 0;
      countryMap.set(log.country, count + 1);
    });
    const byCountry = Array.from(countryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    // Count by device
    const deviceMap = new Map<string, number>();
    logs.forEach(log => {
      const device = log.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
      const count = deviceMap.get(device) || 0;
      deviceMap.set(device, count + 1);
    });
    const byDevice = Array.from(deviceMap.entries())
      .map(([name, value]) => ({ name, value }));
    
    // Count by hour (last 24 hours)
    const hourMap = new Map<number, number>();
    const now = new Date();
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const hoursDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60));
      if (hoursDiff < 24) {
        const hour = logDate.getHours();
        const count = hourMap.get(hour) || 0;
        hourMap.set(hour, count + 1);
      }
    });
    const byHour = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      visitors: hourMap.get(i) || 0,
    }));
    
    // Count by day (last 7 days)
    const dayMap = new Map<string, number>();
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        const day = logDate.toLocaleDateString('en-US', { weekday: 'short' });
        const count = dayMap.get(day) || 0;
        dayMap.set(day, count + 1);
      }
    });
    const byDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      visitors: dayMap.get(day) || 0,
    }));
    
    return NextResponse.json({
      byCountry,
      byDevice,
      byHour,
      byDay,
    });
  } catch (error) {
    console.error('Failed to get visitor stats:', error);
    return NextResponse.json({
      byCountry: [],
      byDevice: [],
      byHour: [],
      byDay: [],
    }, { status: 200 });
  }
}

export const runtime = 'edge';
