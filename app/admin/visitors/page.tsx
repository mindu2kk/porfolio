'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface Stats {
  byCountry: { name: string; value: number }[];
  byDevice: { name: string; value: number }[];
  byHour: { hour: string; visitors: number }[];
  byDay: { day: string; visitors: number }[];
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export default function VisitorLogsPage() {
  const [data, setData] = useState<VisitorData>({ total: 0, recentVisitors: [] });
  const [stats, setStats] = useState<Stats>({ byCountry: [], byDevice: [], byHour: [], byDay: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visitorRes, statsRes] = await Promise.all([
          fetch('/api/visitor'),
          fetch('/api/visitor/stats'),
        ]);
        const visitorData = await visitorRes.json();
        const statsData = await statsRes.json();
        setData(visitorData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch visitor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
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

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Visitors by Country */}
            <div className="border-solid-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">🌍 Visitors by Country</h3>
              {stats.byCountry.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byCountry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#999" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a1a', 
                        border: '2px solid #fff',
                        color: '#fff',
                        borderRadius: '4px'
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>

            {/* Visitors by Device */}
            <div className="border-dashed-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">📱 Visitors by Device</h3>
              {stats.byDevice.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byDevice}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {stats.byDevice.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a1a', 
                        border: '2px solid #fff',
                        color: '#fff',
                        borderRadius: '4px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>

            {/* Visitors by Hour (Last 24h) */}
            <div className="border-wave-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">⏰ Visitors by Hour (Last 24h)</h3>
              {stats.byHour.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.byHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#999"
                      style={{ fontSize: '10px' }}
                      interval={2}
                    />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a1a', 
                        border: '2px solid #fff',
                        color: '#fff',
                        borderRadius: '4px'
                      }}
                      cursor={{ stroke: '#4ECDC4', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#4ECDC4" 
                      strokeWidth={3}
                      dot={{ fill: '#4ECDC4', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>

            {/* Visitors by Day (Last 7 days) */}
            <div className="border-zigzag-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">📅 Visitors by Day (Last 7 days)</h3>
              {stats.byDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#999"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a1a', 
                        border: '2px solid #fff',
                        color: '#fff',
                        borderRadius: '4px'
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Bar dataKey="visitors" fill="#45B7D1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </div>
        )}

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
          Auto-refreshing every 30 seconds
        </div>
      </div>
    </div>
  );
}
