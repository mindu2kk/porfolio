import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { NextRequest } from 'next/server';
import { sendVisitorNotification } from '@/lib/email';

const VISITOR_KEY = 'portfolio:visitor:count';
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
    const count = await kv.get<number>(VISITOR_KEY);
    
    // Get recent logs (last 10)
    const logs = await kv.lrange<VisitorLog>(VISITOR_LOG_KEY, 0, 9);
    
    return NextResponse.json({ 
      total: count || 0,
      recentVisitors: logs || []
    });
  } catch (error) {
    console.error('Failed to get visitor count:', error);
    return NextResponse.json({ total: 0, recentVisitors: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Increment counter
    const count = await kv.incr(VISITOR_KEY);
    
    // Get visitor info
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown';
    const country = request.geo?.country || 'Unknown';
    const city = request.geo?.city || 'Unknown';
    
    // Create log entry
    const logEntry: VisitorLog = {
      timestamp: new Date().toISOString(),
      userAgent,
      referer,
      ip,
      country,
      city,
    };
    
    // Save to logs (keep last 100)
    await kv.lpush(VISITOR_LOG_KEY, logEntry);
    await kv.ltrim(VISITOR_LOG_KEY, 0, 99);
    
    // Log to console (visible in Vercel Logs)
    const visitorInfo = {
      count,
      time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      country,
      city,
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      from: referer,
      ip,
    };
    
    console.log('🎯 New Visitor:', visitorInfo);
    
    // Send email notification (async, don't wait)
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      sendVisitorNotification(visitorInfo).catch(err => 
        console.error('Email notification failed:', err)
      );
    }
    
    return NextResponse.json({ total: count });
  } catch (error) {
    console.error('Failed to increment visitor count:', error);
    return NextResponse.json({ total: 0 }, { status: 200 });
  }
}

export const runtime = 'edge';
