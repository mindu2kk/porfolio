import { kv } from '@vercel/kv';

// Audit log entry type
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  ip: string;
  userAgent: string;
  details?: Record<string, any>;
  success: boolean;
}

// Log an audit event
export async function logAudit(
  action: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: Record<string, any>
): Promise<void> {
  try {
    const id = `audit:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const log: AuditLog = {
      id,
      timestamp: new Date().toISOString(),
      action,
      ip,
      userAgent,
      details,
      success,
    };

    // Store in KV with 30-day expiration
    await kv.set(id, log, { ex: 30 * 24 * 60 * 60 });
    
    // Add to audit index for retrieval
    await kv.zadd('audit:index', { score: Date.now(), member: id });
  } catch (error) {
    // Silent fail - don't break the main flow
    console.error('Audit logging failed:', error);
  }
}

// Get recent audit logs
export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  try {
    // Get recent log IDs from sorted set
    const logIds = await kv.zrange('audit:index', -limit, -1, { rev: true });
    
    if (!logIds || logIds.length === 0) {
      return [];
    }

    // Fetch all logs
    const logs = await Promise.all(
      logIds.map(async (id) => {
        const log = await kv.get<AuditLog>(id as string);
        return log;
      })
    );

    return logs.filter((log): log is AuditLog => log !== null);
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}

// Get audit logs for specific action
export async function getAuditLogsByAction(
  action: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const allLogs = await getAuditLogs(limit * 2);
  return allLogs.filter((log) => log.action === action).slice(0, limit);
}
