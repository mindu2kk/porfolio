import { Resend } from 'resend';

// Only initialize if API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface VisitorInfo {
  count: number;
  time: string;
  country: string;
  city: string;
  device: string;
  from: string;
  ip: string;
}

export async function sendVisitorNotification(visitor: VisitorInfo) {
  // Skip if Resend not configured
  if (!resend || !process.env.NOTIFICATION_EMAIL) {
    console.log('📧 Email notification skipped (not configured)');
    return false;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>', // Sẽ đổi sau khi verify domain
      to: [process.env.NOTIFICATION_EMAIL || 'your-email@example.com'],
      subject: `🎯 New Visitor #${visitor.count} - ${visitor.city}, ${visitor.country}`,
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #000;">
          <h1 style="font-size: 24px; margin-bottom: 20px;">🎯 New Visitor Alert!</h1>
          
          <div style="background: #f5f5f5; padding: 15px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Visitor #:</strong> ${visitor.count}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${visitor.time}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${visitor.city}, ${visitor.country}</p>
            <p style="margin: 5px 0;"><strong>💻 Device:</strong> ${visitor.device}</p>
            <p style="margin: 5px 0;"><strong>🌐 IP:</strong> ${visitor.ip}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px;">
            <p style="margin: 5px 0;"><strong>🔗 Referrer:</strong> ${visitor.from}</p>
          </div>
          
          <hr style="margin: 20px 0; border: 1px dashed #000;">
          
          <p style="font-size: 12px; color: #666;">
            View all visitors: <a href="https://your-domain.vercel.app/admin/visitors">Admin Dashboard</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('✅ Email sent:', data?.id);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
