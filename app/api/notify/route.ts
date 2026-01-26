import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sendVisitorNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📧 Notify API called with:', body);
    
    if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL) {
      console.log('⚠️ Email not configured');
      return NextResponse.json({ success: false, message: 'Email not configured' });
    }
    
    const success = await sendVisitorNotification(body);
    
    return NextResponse.json({ 
      success,
      message: success ? 'Email sent' : 'Email failed'
    });
  } catch (error) {
    console.error('❌ Notify API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Use nodejs runtime for Resend
export const runtime = 'nodejs';
