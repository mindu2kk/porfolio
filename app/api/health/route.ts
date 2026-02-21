import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/monitoring/health';

export async function GET() {
  try {
    const health = await performHealthCheck();
    
    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'down',
        checks: { kv: false, api: false, rateLimit: false },
        metrics: { totalVisitors: 0, rateLimitHits: 0, errorRate: 100, uptime: '0s' },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
