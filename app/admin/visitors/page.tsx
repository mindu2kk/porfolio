'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface VisitorLog {
  timestamp: string;
  userAgent: string;
  referer: string;
  ip: string;
  country: string;
  city: string;
}

interface VisitorData {
  total: number;
  recentVisitors: VisitorLog[];
}

export default function VisitorLogsPage() {
  const [data, setData] = useState<VisitorData>({ total: 0, recentVisitors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visitor');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch visitor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const getDeviceType = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return '📱 Mobile';
    if (userAgent.includes('Tablet')) return '📱 Tablet';
    return '💻 Desktop';
  };

  const getBrowser = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold uppercase mb-2">Visitor Logs</h1>
            <p className="text-muted-foreground">
              Real-time visitor tracking and analytics
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-2 border-dotted-thick border-border hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border-pulse-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Visitors</div>
            <div className="text-4xl font-bold">{data.total.toLocaleString()}</div>
          </div>
          <div className="border-wave-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Recent Visitors</div>
            <div className="text-4xl font-bold">{data.recentVisitors.length}</div>
          </div>
          <div className="border-zigzag-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Status</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </div>
        </div>

        {/* Visitor Logs Table */}
        <div className="border-double-animated border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold">Recent Visitors (Last 10)</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : data.recentVisitors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No visitors yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-bold">Time</th>
                    <th className="p-4 font-bold">Location</th>
                    <th className="p-4 font-bold">Device</th>
                    <th className="p-4 font-bold">Browser</th>
                    <th className="p-4 font-bold">From</th>
                    <th className="p-4 font-bold">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentVisitors.map((visitor, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-muted transition-colors"
                    >
                      <td className="p-4 font-mono text-sm">
                        {formatDate(visitor.timestamp)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>🌍</span>
                          <span>{visitor.city}, {visitor.country}</span>
                        </div>
                      </td>
                      <td className="p-4">{getDeviceType(visitor.userAgent)}</td>
                      <td className="p-4">{getBrowser(visitor.userAgent)}</td>
                      <td className="p-4 text-sm text-muted-foreground truncate max-w-[200px]">
                        {visitor.referer === 'Direct' ? '🔗 Direct' : visitor.referer}
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        {visitor.ip}
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
          Auto-refreshing every 10 seconds
        </div>
      </div>
    </div>
  );
}
