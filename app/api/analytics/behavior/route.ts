import { NextResponse } from 'next/server';
import { getBehaviorMetrics } from '@/lib/analytics/behavior';

export async function GET() {
  try {
    const metrics = await getBehaviorMetrics();
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to get behavior metrics:', error);
    return NextResponse.json(
      {
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        engagementScore: 0,
        returnVisitorRate: 0,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
