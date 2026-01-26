import { Resend } from 'resend';

// Only initialize if API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface VisitorInfo {
  count: number;
  time: string;
  country: string;
  city: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  device: string;
  from: string;
  ip: string;
  userAgent?: string;
  allHeaders?: Record<string, string>;
}

function getBrowserInfo(userAgent: string) {
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // Detect Browser
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';
  
  // Detect OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { browser, os };
}

export async function sendVisitorNotification(visitor: VisitorInfo) {
  console.log('📧 [EMAIL] sendVisitorNotification called');
  console.log('📧 [EMAIL] Visitor data:', JSON.stringify(visitor, null, 2));
  
  // Check configuration
  console.log('📧 [EMAIL] Checking configuration...');
  console.log('📧 [EMAIL] resend object exists:', !!resend);
  console.log('📧 [EMAIL] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('📧 [EMAIL] RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
  console.log('📧 [EMAIL] NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL);
  
  // Skip if Resend not configured
  if (!resend) {
    console.log('❌ [EMAIL] Resend object is null - API key missing or invalid');
    return false;
  }
  
  if (!process.env.NOTIFICATION_EMAIL) {
    console.log('❌ [EMAIL] NOTIFICATION_EMAIL is missing');
    return false;
  }
  
  try {
    console.log('📧 [EMAIL] Preparing to send email to:', process.env.NOTIFICATION_EMAIL);
    
    // Parse user agent for more details
    const { browser, os } = visitor.userAgent 
      ? getBrowserInfo(visitor.userAgent) 
      : { browser: 'Unknown', os: 'Unknown' };
    
    console.log('📧 [EMAIL] Browser info:', { browser, os });
    console.log('📧 [EMAIL] Calling resend.emails.send...');
    
    const { data, error } = await resend.emails.send({
      from: 'Portfolio Notifications <onboarding@resend.dev>',
      to: [process.env.NOTIFICATION_EMAIL],
      subject: `🎯 Visitor #${visitor.count} from ${visitor.city}, ${visitor.country}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Courier New', monospace; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border: 3px solid #000; box-shadow: 8px 8px 0 #000; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .badge { background: #fff; color: #000; padding: 5px 15px; margin-top: 10px; font-size: 14px; font-weight: bold; }
            .content { padding: 30px; }
            .section { margin-bottom: 20px; padding: 15px; border: 2px dashed #000; background: #fafafa; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #666; }
            .info-row { padding: 8px 0; border-bottom: 1px dotted #ddd; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #333; }
            .value { color: #000; }
            .highlight { background: #ffeb3b; padding: 2px 6px; font-weight: bold; }
            .footer { background: #000; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
            .footer a { color: #ffeb3b; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 NEW VISITOR ALERT</h1>
              <div class="badge">VISITOR #${visitor.count}</div>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">⏰ TIMESTAMP</div>
                <div class="info-row">
                  <span class="label">Time:</span>
                  <span class="value highlight">${visitor.time}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">🌍 LOCATION</div>
                <div class="info-row">
                  <span class="label">Country:</span>
                  <span class="value highlight">${visitor.country}</span>
                </div>
                <div class="info-row">
                  <span class="label">City:</span>
                  <span class="value highlight">${visitor.city}</span>
                </div>
                ${visitor.region ? `
                <div class="info-row">
                  <span class="label">Region:</span>
                  <span class="value">${visitor.region}</span>
                </div>
                ` : ''}
                ${visitor.timezone ? `
                <div class="info-row">
                  <span class="label">Timezone:</span>
                  <span class="value">${visitor.timezone}</span>
                </div>
                ` : ''}
                ${visitor.latitude && visitor.longitude ? `
                <div class="info-row">
                  <span class="label">Coordinates:</span>
                  <span class="value">${visitor.latitude}, ${visitor.longitude}</span>
                </div>
                <div class="info-row">
                  <span class="label">Google Maps:</span>
                  <span class="value">
                    <a href="https://www.google.com/maps?q=${visitor.latitude},${visitor.longitude}" target="_blank" style="color: #000;">
                      📍 View on Map
                    </a>
                  </span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="label">IP:</span>
                  <span class="value">${visitor.ip}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">💻 DEVICE & BROWSER</div>
                <div class="info-row">
                  <span class="label">Device:</span>
                  <span class="value">${visitor.device === 'Mobile' ? '📱' : '💻'} ${visitor.device}</span>
                </div>
                <div class="info-row">
                  <span class="label">Browser:</span>
                  <span class="value">${browser}</span>
                </div>
                <div class="info-row">
                  <span class="label">OS:</span>
                  <span class="value">${os}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">🔗 TRAFFIC SOURCE</div>
                <div class="info-row">
                  <span class="label">From:</span>
                  <span class="value">${visitor.from === 'Direct' ? '🔗 Direct Visit' : visitor.from}</span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>📊 View Full Analytics</strong></p>
              <p><a href="https://your-domain.vercel.app/admin/visitors">→ Open Dashboard</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('📧 [EMAIL] Resend API call completed');
    console.log('📧 [EMAIL] Response data:', data);
    console.log('📧 [EMAIL] Response error:', error);
    
    if (error) {
      console.error('❌ [EMAIL] Failed to send email:', error);
      console.error('❌ [EMAIL] Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ [EMAIL] Email sent successfully! ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ [EMAIL] Exception caught:', error);
    console.error('❌ [EMAIL] Error type:', typeof error);
    console.error('❌ [EMAIL] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [EMAIL] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return false;
  }
}
