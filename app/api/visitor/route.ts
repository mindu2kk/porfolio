import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { geolocation } from '@vercel/functions';
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
    
    // Get visitor info with ALL available data
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               'Unknown';
    
    // Use Vercel's official geolocation function
    const geo = geolocation(request);
    
    console.log('🌍 Vercel geolocation data:', JSON.stringify(geo, null, 2));
    
    // Extract geo data from Vercel's geolocation helper
    const country = geo.country || 'Unknown';
    const city = geo.city || 'Unknown';
    const region = geo.region || 'Unknown';
    const latitude = geo.latitude || 'Unknown';
    const longitude = geo.longitude || 'Unknown';
    
    // Map country to timezone (common timezones)
    const timezoneMap: Record<string, string> = {
      'VN': 'Asia/Ho_Chi_Minh',
      'US': 'America/New_York',
      'GB': 'Europe/London',
      'JP': 'Asia/Tokyo',
      'CN': 'Asia/Shanghai',
      'AU': 'Australia/Sydney',
      'SG': 'Asia/Singapore',
      'TH': 'Asia/Bangkok',
      'MY': 'Asia/Kuala_Lumpur',
      'ID': 'Asia/Jakarta',
      'PH': 'Asia/Manila',
      'KR': 'Asia/Seoul',
      'IN': 'Asia/Kolkata',
      'FR': 'Europe/Paris',
      'DE': 'Europe/Berlin',
    };
    
    const timezone = geo.countryRegion ? timezoneMap[geo.countryRegion] || 'UTC' : 'UTC';
    
    console.log('✅ Processed geo data:', { country, city, region, latitude, longitude, timezone });
    
    // Get all headers for debugging
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
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
      region,
      latitude,
      longitude,
      timezone,
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      from: referer,
      ip,
      userAgent,
      allHeaders, // Include all headers for maximum info
    };
    
    console.log('🎯 New Visitor (FULL DATA):', JSON.stringify(visitorInfo, null, 2));
    
    // Send email notification - USE THE IMPORTED FUNCTION DIRECTLY
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      console.log('📧 Triggering email notification...');
      console.log('📧 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
      console.log('📧 NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL);
      
      // Call the function directly (already imported at top)
      sendVisitorNotification(visitorInfo)
        .then(success => {
          console.log(success ? '✅ Email sent successfully!' : '❌ Email failed to send');
        })
        .catch(err => {
          console.error('❌ Email error caught:', err);
          console.error('❌ Error stack:', err.stack);
        });
    } else {
      console.log('⚠️ Email notification skipped - missing config');
      console.log('⚠️ RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'MISSING');
      console.log('⚠️ NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL || 'MISSING');
    }
    
    return NextResponse.json({ total: count });
  } catch (error) {
    console.error('Failed to increment visitor count:', error);
    return NextResponse.json({ total: 0 }, { status: 200 });
  }
}

// Use nodejs runtime for Resend email support
export const runtime = 'nodejs';
