'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  ip: string;
  userAgent: string;
  details?: Record<string, any>;
  success: boolean;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('visitor')) return '👤';
    if (action.includes('rate_limit')) return '🚫';
    if (action.includes('error')) return '❌';
    return '📝';
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'text-red-500';
    if (action.includes('rate_limit')) return 'text-yellow-500';
    return 'text-green-500';
  };

  const filteredLogs = logs
    .filter(log => {
      if (filter === 'all') return true;
      if (filter === 'success') return log.success;
      if (filter === 'failed') return !log.success;
      if (filter === 'visitor') return log.action.includes('visitor');
      if (filter === 'rate_limit') return log.action.includes('rate_limit');
      return true;
    })
    .filter(log => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.ip.toLowerCase().includes(searchLower) ||
        log.userAgent.toLowerCase().includes(searchLower)
      );
    });

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold uppercase mb-2">Audit Logs</h1>
            <p className="text-muted-foreground">
              Security and compliance tracking
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/visitors"
              className="px-6 py-2 border-dotted-thick border-border hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="px-6 py-2 border-dotted-thick border-border hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="border-pulse-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Logs</div>
            <div className="text-4xl font-bold">{logs.length}</div>
          </div>
          <div className="border-wave-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Successful</div>
            <div className="text-4xl font-bold text-green-500">
              {logs.filter(l => l.success).length}
            </div>
          </div>
          <div className="border-dashed-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Failed</div>
            <div className="text-4xl font-bold text-red-500">
              {logs.filter(l => !l.success).length}
            </div>
          </div>
          <div className="border-zigzag-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Rate Limited</div>
            <div className="text-4xl font-bold text-yellow-500">
              {logs.filter(l => l.action.includes('rate_limit')).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-solid-animated border-border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by action, IP, or user agent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 bg-background border-2 border-border focus:border-foreground outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 border-2 transition-all ${
                  filter === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border hover:border-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('success')}
                className={`px-4 py-2 border-2 transition-all ${
                  filter === 'success'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-border hover:border-green-500'
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 border-2 transition-all ${
                  filter === 'failed'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'border-border hover:border-red-500'
                }`}
              >
                Failed
              </button>
              <button
                onClick={() => setFilter('visitor')}
                className={`px-4 py-2 border-2 transition-all ${
                  filter === 'visitor'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-border hover:border-blue-500'
                }`}
              >
                Visitors
              </button>
              <button
                onClick={() => setFilter('rate_limit')}
                className={`px-4 py-2 border-2 transition-all ${
                  filter === 'rate_limit'
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'border-border hover:border-yellow-500'
                }`}
              >
                Rate Limited
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="border-double-animated border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold">
              Audit Logs ({filteredLogs.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-bold">Time</th>
                    <th className="p-4 font-bold">Action</th>
                    <th className="p-4 font-bold">IP</th>
                    <th className="p-4 font-bold">User Agent</th>
                    <th className="p-4 font-bold">Details</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border hover:bg-muted transition-colors"
                    >
                      <td className="p-4 font-mono text-sm">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{getActionIcon(log.action)}</span>
                          <span className={getActionColor(log.action, log.success)}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">{log.ip}</td>
                      <td className="p-4 text-sm text-muted-foreground truncate max-w-[200px]">
                        {log.userAgent}
                      </td>
                      <td className="p-4 text-sm">
                        {log.details ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-500 hover:underline">
                              View
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-[300px]">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {log.success ? (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                            ✓ Success
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                            ✗ Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auto refresh indicator */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Auto-refreshing every 30 seconds • Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>
    </div>
  );
}
