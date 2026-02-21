import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit';

export async function GET() {
  try {
    const logs = await getAuditLogs(100); // Get last 100 logs
    
    return NextResponse.json({
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', logs: [] },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
