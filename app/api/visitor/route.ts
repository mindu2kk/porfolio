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
    
    // Try multiple ways to get IP
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
    const trueClientIp = request.headers.get('true-client-ip'); // Cloudflare Enterprise
    
    console.log('🔍 IP Detection:');
    console.log('  x-forwarded-for:', xForwardedFor);
    console.log('  x-real-ip:', xRealIp);
    console.log('  cf-connecting-ip:', cfConnectingIp);
    console.log('  true-client-ip:', trueClientIp);
    
    // Extract IP (prefer x-forwarded-for first IP)
    let ip = 'Unknown';
    if (xForwardedFor) {
      ip = xForwardedFor.split(',')[0].trim();
    } else if (xRealIp) {
      ip = xRealIp;
    } else if (cfConnectingIp) {
      ip = cfConnectingIp;
    } else if (trueClientIp) {
      ip = trueClientIp;
    }
    
    console.log('✅ Selected IP:', ip);
    console.log('🔍 IP Type:', 
      ip === 'Unknown' ? 'Unknown' :
      ip === '127.0.0.1' ? 'Localhost' :
      ip.startsWith('192.168.') ? 'Private Network' :
      ip.startsWith('10.') ? 'Private Network' :
      ip.startsWith('172.') ? 'Private Network' :
      'Public IP'
    );
    
    // Collect ALL geolocation data from different sources
    const geoSources: any = {
      vercel: null,
      freeipapi: null,
      ipapi: null,
      ipinfo: null,
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
    
    // Only fetch from external APIs if IP is valid
    const isValidPublicIP = ip !== 'Unknown' && 
                           ip !== '127.0.0.1' && 
                           !ip.startsWith('192.168.') &&
                           !ip.startsWith('10.') &&
                           !ip.startsWith('172.');
    
    if (isValidPublicIP) {
      console.log('✅ Valid public IP detected, fetching from multiple APIs...');
      
      // Source 2: FreeIPAPI
      try {
        console.log('🌐 Fetching from FreeIPAPI...');
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
      
      // Source 3: ipapi.co (backup)
      try {
        console.log('🌐 Fetching from ipapi.co...');
        const ipapiResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: AbortSignal.timeout(5000)
        });
        const ipapiData = await ipapiResponse.json();
        console.log('📍 ipapi.co response:', JSON.stringify(ipapiData, null, 2));
        
        geoSources.ipapi = {
          country: ipapiData.country_name || null,
          countryCode: ipapiData.country_code || null,
          city: ipapiData.city || null,
          region: ipapiData.region || null,
          latitude: ipapiData.latitude || null,
          longitude: ipapiData.longitude || null,
          timezone: ipapiData.timezone || null,
          postal: ipapiData.postal || null,
          org: ipapiData.org || null,
        };
      } catch (apiError) {
        console.error('❌ ipapi.co failed:', apiError);
        geoSources.ipapi = { error: apiError instanceof Error ? apiError.message : 'Failed' };
      }
      
      // Source 4: ipinfo.io (backup)
      try {
        console.log('🌐 Fetching from ipinfo.io...');
        const ipinfoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
          signal: AbortSignal.timeout(5000)
        });
        const ipinfoData = await ipinfoResponse.json();
        console.log('📍 ipinfo.io response:', JSON.stringify(ipinfoData, null, 2));
        
        const [lat, lon] = (ipinfoData.loc || ',').split(',');
        geoSources.ipinfo = {
          country: ipinfoData.country || null,
          city: ipinfoData.city || null,
          region: ipinfoData.region || null,
          latitude: lat || null,
          longitude: lon || null,
          timezone: ipinfoData.timezone || null,
          postal: ipinfoData.postal || null,
          org: ipinfoData.org || null,
        };
      } catch (apiError) {
        console.error('❌ ipinfo.io failed:', apiError);
        geoSources.ipinfo = { error: apiError instanceof Error ? apiError.message : 'Failed' };
      }
    } else {
      console.log('⚠️ Invalid or private IP, skipping external API calls');
      geoSources.freeipapi = { error: 'Invalid IP for lookup' };
      geoSources.ipapi = { error: 'Invalid IP for lookup' };
      geoSources.ipinfo = { error: 'Invalid IP for lookup' };
    }
    
    // Source 5: Vercel Geo Headers (raw)
    geoSources.headers = {
      'x-vercel-ip-city': request.headers.get('x-vercel-ip-city') || null,
      'x-vercel-ip-country': request.headers.get('x-vercel-ip-country') || null,
      'x-vercel-ip-country-region': request.headers.get('x-vercel-ip-country-region') || null,
      'x-vercel-ip-latitude': request.headers.get('x-vercel-ip-latitude') || null,
      'x-vercel-ip-longitude': request.headers.get('x-vercel-ip-longitude') || null,
    };
    
    console.log('📊 All geo sources collected:', JSON.stringify(geoSources, null, 2));
    
    // Determine best data - try multiple sources in order of reliability
    let country = 'Unknown';
    let city = 'Unknown';
    let region = 'Unknown';
    let latitude = 'Unknown';
    let longitude = 'Unknown';
    let timezone = 'Unknown';
    let dataSource = 'None';
    
    // Priority 1: FreeIPAPI (most detailed)
    if (geoSources.freeipapi && !geoSources.freeipapi.error && geoSources.freeipapi.country) {
      country = geoSources.freeipapi.country;
      city = geoSources.freeipapi.city || 'Unknown';
      region = geoSources.freeipapi.region || 'Unknown';
      latitude = geoSources.freeipapi.latitude?.toString() || 'Unknown';
      longitude = geoSources.freeipapi.longitude?.toString() || 'Unknown';
      timezone = geoSources.freeipapi.timezone || 'Unknown';
      dataSource = 'FreeIPAPI';
      console.log('✅ Using FreeIPAPI data');
    }
    // Priority 2: ipapi.co
    else if (geoSources.ipapi && !geoSources.ipapi.error && geoSources.ipapi.country) {
      country = geoSources.ipapi.country;
      city = geoSources.ipapi.city || 'Unknown';
      region = geoSources.ipapi.region || 'Unknown';
      latitude = geoSources.ipapi.latitude?.toString() || 'Unknown';
      longitude = geoSources.ipapi.longitude?.toString() || 'Unknown';
      timezone = geoSources.ipapi.timezone || 'Unknown';
      dataSource = 'ipapi.co';
      console.log('✅ Using ipapi.co data');
    }
    // Priority 3: ipinfo.io
    else if (geoSources.ipinfo && !geoSources.ipinfo.error && geoSources.ipinfo.country) {
      country = geoSources.ipinfo.country;
      city = geoSources.ipinfo.city || 'Unknown';
      region = geoSources.ipinfo.region || 'Unknown';
      latitude = geoSources.ipinfo.latitude || 'Unknown';
      longitude = geoSources.ipinfo.longitude || 'Unknown';
      timezone = geoSources.ipinfo.timezone || 'Unknown';
      dataSource = 'ipinfo.io';
      console.log('✅ Using ipinfo.io data');
    }
    // Priority 4: Vercel geolocation
    else if (geoSources.vercel && !geoSources.vercel.error && geoSources.vercel.country) {
      country = geoSources.vercel.country;
      city = geoSources.vercel.city || 'Unknown';
      region = geoSources.vercel.region || 'Unknown';
      latitude = geoSources.vercel.latitude || 'Unknown';
      longitude = geoSources.vercel.longitude || 'Unknown';
      dataSource = 'Vercel Geo';
      console.log('✅ Using Vercel geo data');
    }
    // Priority 5: Vercel headers
    else if (geoSources.headers && geoSources.headers['x-vercel-ip-country']) {
      country = geoSources.headers['x-vercel-ip-country'];
      city = geoSources.headers['x-vercel-ip-city'] || 'Unknown';
      region = geoSources.headers['x-vercel-ip-country-region'] || 'Unknown';
      latitude = geoSources.headers['x-vercel-ip-latitude'] || 'Unknown';
      longitude = geoSources.headers['x-vercel-ip-longitude'] || 'Unknown';
      dataSource = 'Vercel Headers';
      console.log('✅ Using Vercel headers');
    }
    
    console.log('📊 Final geo data (from ' + dataSource + '):', { country, city, region, latitude, longitude, timezone });
    
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
      dataSource, // Which source was used
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
