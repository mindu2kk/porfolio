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
    
    console.log('🔍 Detected IP:', ip);
    
    // Collect ALL geolocation data from different sources
    const geoSources: any = {
      vercel: null,
      freeipapi: null,
      headers: null,
    };
    
    // Source 1: Vercel Geolocation
    try {
      const geo = geolocation(request);
      console.log('🌍 Vercel geolocation data:', JSON.stringify(geo, null, 2));
      geoSources.vercel = {
        country: geo.country || null,
        city: geo.city || null,
        region: geo.region || null,
        countryRegion: geo.countryRegion || null,
        latitude: geo.latitude || null,
        longitude: geo.longitude || null,
      };
    } catch (vercelGeoError) {
      console.log('⚠️ Vercel geolocation not available:', vercelGeoError);
      geoSources.vercel = { error: 'Not available' };
    }
    
    // Source 2: FreeIPAPI
    if (ip !== 'Unknown' && ip !== '127.0.0.1' && !ip.startsWith('192.168.')) {
      try {
        console.log('🌐 Fetching from FreeIPAPI for IP:', ip);
        const geoResponse = await fetch(`https://freeipapi.com/api/json/${ip}`, {
          signal: AbortSignal.timeout(5000)
        });
        const geoData = await geoResponse.json();
        console.log('📍 FreeIPAPI response:', JSON.stringify(geoData, null, 2));
        
        geoSources.freeipapi = {
          country: geoData.countryName || null,
          countryCode: geoData.countryCode || null,
          city: geoData.cityName || null,
          region: geoData.regionName || null,
          latitude: geoData.latitude || null,
          longitude: geoData.longitude || null,
          timezone: geoData.timeZones?.[0] || null,
          zipCode: geoData.zipCode || null,
          continent: geoData.continent || null,
          isp: geoData.asnOrganization || null,
          isProxy: geoData.isProxy || false,
        };
      } catch (apiError) {
        console.error('❌ FreeIPAPI failed:', apiError);
        geoSources.freeipapi = { error: apiError instanceof Error ? apiError.message : 'Failed' };
      }
    } else {
      geoSources.freeipapi = { error: 'Invalid IP for lookup' };
    }
    
    // Source 3: Vercel Geo Headers (raw)
    geoSources.headers = {
      'x-vercel-ip-city': request.headers.get('x-vercel-ip-city') || null,
      'x-vercel-ip-country': request.headers.get('x-vercel-ip-country') || null,
      'x-vercel-ip-country-region': request.headers.get('x-vercel-ip-country-region') || null,
      'x-vercel-ip-latitude': request.headers.get('x-vercel-ip-latitude') || null,
      'x-vercel-ip-longitude': request.headers.get('x-vercel-ip-longitude') || null,
    };
    
    // Determine best data (prefer FreeIPAPI for accuracy)
    let country = 'Unknown';
    let city = 'Unknown';
    let region = 'Unknown';
    let latitude = 'Unknown';
    let longitude = 'Unknown';
    let timezone = 'Unknown';
    
    if (geoSources.freeipapi && !geoSources.freeipapi.error) {
      country = geoSources.freeipapi.country || 'Unknown';
      city = geoSources.freeipapi.city || 'Unknown';
      region = geoSources.freeipapi.region || 'Unknown';
      latitude = geoSources.freeipapi.latitude?.toString() || 'Unknown';
      longitude = geoSources.freeipapi.longitude?.toString() || 'Unknown';
      timezone = geoSources.freeipapi.timezone || 'Unknown';
      console.log('✅ Using FreeIPAPI data (most accurate)');
    } else if (geoSources.vercel && !geoSources.vercel.error) {
      country = geoSources.vercel.country || 'Unknown';
      city = geoSources.vercel.city || 'Unknown';
      region = geoSources.vercel.region || 'Unknown';
      latitude = geoSources.vercel.latitude || 'Unknown';
      longitude = geoSources.vercel.longitude || 'Unknown';
      console.log('✅ Using Vercel geo data');
    }
    
    console.log('📊 Final geo data:', { country, city, region, latitude, longitude, timezone });
    
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
      geoSources, // Include ALL geolocation sources for comparison
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
