'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import map (client-side only)
const VisitorMap = dynamic(() => import('@/components/admin/VisitorMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center border-2 border-border bg-muted"><div className="text-muted-foreground">Loading map...</div></div>
});

// Dynamically import activity feed
const ActivityFeed = dynamic(() => import('@/components/admin/ActivityFeed'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading...</div>
});

interface VisitorLog {
  timestamp: string;
  userAgent: string;
  referer: string;
  ip: string;
  country: string;
  city: string;
  browser?: string;
  os?: string;
  device?: string;
}

interface VisitorData {
  total: number;
  recentVisitors: VisitorLog[];
  activeSessions?: number;
}

interface Stats {
  byCountry: { name: string; value: number }[];
  byDevice: { name: string; value: number }[];
  byBrowser: { name: string; value: number }[];
  byOS: { name: string; value: number }[];
  byTrafficSource: { name: string; value: number }[];
  byTrafficType: { name: string; value: number }[];
  byHour: { hour: string; visitors: number }[];
  byDay: { day: string; visitors: number }[];
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  checks: {
    kv: boolean;
    api: boolean;
    rateLimit: boolean;
  };
  metrics: {
    totalVisitors: number;
    rateLimitHits: number;
    errorRate: number;
    uptime: string;
  };
  timestamp: string;
}

interface BehaviorMetrics {
  averageSessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  engagementScore: number;
  returnVisitorRate: number;
}

interface TrackingAnalytics {
  summary: {
    activeSessions: number;
    totalEvents: number;
    avgDuration: number;
    avgPageViews: number;
  };
  eventsByType: { name: string; value: number }[];
  byCountry: { name: string; value: number }[];
  byDevice: { name: string; value: number }[];
}

interface BehaviorAnalytics {
  summary: {
    totalBehaviorEvents: number;
    scrollEvents: number;
    clickEvents: number;
    idleEvents: number;
    visibilityEvents: number;
    avgScrollDepth: number;
    avgClicks: number;
    avgEngagement: number;
  };
  scrollDepth: { depth: number; count: number }[];
  topElements: { name: string; clicks: number }[];
}

interface PerformanceAnalytics {
  summary: {
    totalPerformanceEvents: number;
    totalWebVitalEvents: number;
    avgPerformanceScore: number | null;
  };
  navigationTiming: {
    dns: number;
    tcp: number;
    ttfb: number;
    download: number;
    domInteractive: number;
    domComplete: number;
    loadComplete: number;
  } | null;
  webVitals: {
    fcp: { avg: number | null; ratings: Record<string, number>; count: number };
    lcp: { avg: number | null; ratings: Record<string, number>; count: number };
    fid: { avg: number | null; ratings: Record<string, number>; count: number };
    cls: { avg: number | null; ratings: Record<string, number>; count: number };
  };
  environment: {
    networkTypes: { type: string; count: number }[];
    deviceMemory: { memory: string; count: number }[];
    cpuCores: { cores: string; count: number }[];
  };
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export default function VisitorLogsPage() {
  const [data, setData] = useState<VisitorData>({ total: 0, recentVisitors: [] });
  const [stats, setStats] = useState<Stats>({ byCountry: [], byDevice: [], byBrowser: [], byOS: [], byTrafficSource: [], byTrafficType: [], byHour: [], byDay: [] });
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [behavior, setBehavior] = useState<BehaviorMetrics | null>(null);
  const [tracking, setTracking] = useState<TrackingAnalytics | null>(null);
  const [behaviorAnalytics, setBehaviorAnalytics] = useState<BehaviorAnalytics | null>(null);
  const [performance, setPerformance] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visitorRes, statsRes, healthRes, behaviorRes, trackingRes, behaviorAnalyticsRes, performanceRes] = await Promise.all([
          fetch('/api/visitor'),
          fetch('/api/visitor/stats'),
          fetch('/api/health'),
          fetch('/api/analytics/behavior'),
          fetch('/api/tracking/analytics'),
          fetch('/api/tracking/behavior'),
          fetch('/api/tracking/performance'),
        ]);
        const visitorData = await visitorRes.json();
        const statsData = await statsRes.json();
        const healthData = await healthRes.json();
        const behaviorData = await behaviorRes.json();
        const trackingData = await trackingRes.json();
        const behaviorAnalyticsData = await behaviorAnalyticsRes.json();
        const performanceData = await performanceRes.json();
        setData(visitorData);
        setStats(statsData);
        setHealth(healthData);
        setBehavior(behaviorData);
        setTracking(trackingData);
        setBehaviorAnalytics(behaviorAnalyticsData);
        setPerformance(performanceData);
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
            <h1 className="text-4xl font-bold uppercase mb-2">Visitor Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time visitor tracking and analytics
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/audit"
              className="px-6 py-2 border-dotted-thick border-border hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Audit Logs
            </Link>
            <Link
              href="/"
              className="px-6 py-2 border-dotted-thick border-border hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Home
            </Link>
          </div>
        </div>

        {/* System Health */}
        {health && (
          <div className="border-solid-animated border-border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🏥 System Health
              <span className={`text-sm px-3 py-1 rounded ${
                health.status === 'healthy' ? 'bg-green-500 text-white' :
                health.status === 'degraded' ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {health.status.toUpperCase()}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Health Checks */}
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">KV Database</div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${health.checks.kv ? 'text-green-500' : 'text-red-500'}`}>
                    {health.checks.kv ? '✓' : '✗'}
                  </span>
                  <span className="font-bold">{health.checks.kv ? 'Connected' : 'Down'}</span>
                </div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">API Status</div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${health.checks.api ? 'text-green-500' : 'text-red-500'}`}>
                    {health.checks.api ? '✓' : '✗'}
                  </span>
                  <span className="font-bold">{health.checks.api ? 'Operational' : 'Down'}</span>
                </div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Rate Limiting</div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${health.checks.rateLimit ? 'text-green-500' : 'text-yellow-500'}`}>
                    {health.checks.rateLimit ? '✓' : '⚠'}
                  </span>
                  <span className="font-bold">{health.metrics.rateLimitHits} hits</span>
                </div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Error Rate</div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${health.metrics.errorRate < 5 ? 'text-green-500' : health.metrics.errorRate < 10 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {health.metrics.errorRate < 5 ? '✓' : health.metrics.errorRate < 10 ? '⚠' : '✗'}
                  </span>
                  <span className="font-bold">{health.metrics.errorRate}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              Uptime: {health.metrics.uptime} • Last check: {new Date(health.timestamp).toLocaleTimeString('vi-VN')}
            </div>
          </div>
        )}

        {/* User Behavior Analytics (NEW!) */}
        {behavior && (
          <div className="border-wave-animated border-border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🎭 User Behavior Analytics
              <span className={`text-sm px-3 py-1 rounded ${
                behavior.engagementScore >= 80 ? 'bg-green-500 text-white' :
                behavior.engagementScore >= 50 ? 'bg-blue-500 text-white' :
                behavior.engagementScore >= 20 ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                Score: {behavior.engagementScore}/100
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Avg Session Duration</div>
                <div className="text-2xl font-bold">
                  {behavior.averageSessionDuration < 60 
                    ? `${behavior.averageSessionDuration}s`
                    : `${Math.floor(behavior.averageSessionDuration / 60)}m ${behavior.averageSessionDuration % 60}s`
                  }
                </div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Bounce Rate</div>
                <div className="text-2xl font-bold">
                  <span className={behavior.bounceRate < 40 ? 'text-green-500' : behavior.bounceRate < 70 ? 'text-yellow-500' : 'text-red-500'}>
                    {behavior.bounceRate}%
                  </span>
                </div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Pages/Session</div>
                <div className="text-2xl font-bold">
                  {behavior.pagesPerSession.toFixed(1)}
                </div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Return Visitors</div>
                <div className="text-2xl font-bold">
                  <span className={behavior.returnVisitorRate > 30 ? 'text-green-500' : 'text-yellow-500'}>
                    {behavior.returnVisitorRate}%
                  </span>
                </div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Engagement</div>
                <div className="text-2xl font-bold">
                  <span className={
                    behavior.engagementScore >= 80 ? 'text-green-500' :
                    behavior.engagementScore >= 50 ? 'text-blue-500' :
                    behavior.engagementScore >= 20 ? 'text-yellow-500' :
                    'text-red-500'
                  }>
                    {behavior.engagementScore >= 80 ? 'Very High' :
                     behavior.engagementScore >= 50 ? 'High' :
                     behavior.engagementScore >= 20 ? 'Medium' :
                     'Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 1: Event Tracking Analytics */}
        {tracking && (
          <div className="border-solid-animated border-border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              📊 Phase 1: Event Tracking Analytics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border-2 border-border bg-blue-500/10">
                <div className="text-sm text-muted-foreground mb-2">Active Sessions</div>
                <div className="text-3xl font-bold text-blue-500">{tracking.summary.activeSessions}</div>
              </div>
              
              <div className="p-4 border-2 border-border bg-green-500/10">
                <div className="text-sm text-muted-foreground mb-2">Total Events</div>
                <div className="text-3xl font-bold text-green-500">{tracking.summary.totalEvents}</div>
              </div>
              
              <div className="p-4 border-2 border-border bg-purple-500/10">
                <div className="text-sm text-muted-foreground mb-2">Avg Duration</div>
                <div className="text-3xl font-bold text-purple-500">{tracking.summary.avgDuration}s</div>
              </div>
              
              <div className="p-4 border-2 border-border bg-orange-500/10">
                <div className="text-sm text-muted-foreground mb-2">Avg Page Views</div>
                <div className="text-3xl font-bold text-orange-500">{tracking.summary.avgPageViews.toFixed(1)}</div>
              </div>
            </div>

            {tracking.eventsByType.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-3">Event Types Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tracking.eventsByType.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#999" 
                      style={{ fontSize: '10px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a1a', 
                        border: '2px solid #fff',
                        color: '#fff',
                        borderRadius: '4px'
                      }}
                    />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Behavior Tracking Details */}
        {behaviorAnalytics && (
          <div className="border-dashed-animated border-border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🎯 Phase 2: Behavior Tracking Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Scroll Events</div>
                <div className="text-2xl font-bold">{behaviorAnalytics.summary.scrollEvents}</div>
                <div className="text-xs text-muted-foreground mt-1">Avg: {behaviorAnalytics.summary.avgScrollDepth}%</div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Click Events</div>
                <div className="text-2xl font-bold">{behaviorAnalytics.summary.clickEvents}</div>
                <div className="text-xs text-muted-foreground mt-1">Avg: {behaviorAnalytics.summary.avgClicks.toFixed(1)}/session</div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Idle Events</div>
                <div className="text-2xl font-bold">{behaviorAnalytics.summary.idleEvents}</div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Visibility Changes</div>
                <div className="text-2xl font-bold">{behaviorAnalytics.summary.visibilityEvents}</div>
              </div>
              
              <div className="p-4 border-2 border-border">
                <div className="text-sm text-muted-foreground mb-2">Engagement Score</div>
                <div className="text-2xl font-bold text-green-500">{behaviorAnalytics.summary.avgEngagement}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scroll Depth Distribution */}
              {behaviorAnalytics.scrollDepth.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3">Scroll Depth Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={behaviorAnalytics.scrollDepth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="depth" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#1a1a1a', 
                          border: '2px solid #fff',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Clicked Elements */}
              {behaviorAnalytics.topElements.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3">Top Clicked Elements</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={behaviorAnalytics.topElements.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#999"
                        style={{ fontSize: '10px' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#999" />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#1a1a1a', 
                          border: '2px solid #fff',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="clicks" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 3: Performance Metrics */}
        {performance && (
          <div className="border-wave-animated border-border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ⚡ Phase 3: Performance Metrics
              {performance.summary.avgPerformanceScore !== null && (
                <span className={`text-sm px-3 py-1 rounded ${
                  performance.summary.avgPerformanceScore >= 90 ? 'bg-green-500 text-white' :
                  performance.summary.avgPerformanceScore >= 70 ? 'bg-blue-500 text-white' :
                  performance.summary.avgPerformanceScore >= 50 ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  Score: {performance.summary.avgPerformanceScore}/100
                </span>
              )}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border-2 border-border bg-purple-500/10">
                <div className="text-sm text-muted-foreground mb-2">Performance Events</div>
                <div className="text-3xl font-bold text-purple-500">{performance.summary.totalPerformanceEvents}</div>
              </div>
              
              <div className="p-4 border-2 border-border bg-blue-500/10">
                <div className="text-sm text-muted-foreground mb-2">Web Vital Events</div>
                <div className="text-3xl font-bold text-blue-500">{performance.summary.totalWebVitalEvents}</div>
              </div>
              
              <div className="p-4 border-2 border-border bg-green-500/10">
                <div className="text-sm text-muted-foreground mb-2">Performance Score</div>
                <div className="text-3xl font-bold text-green-500">
                  {performance.summary.avgPerformanceScore !== null ? `${performance.summary.avgPerformanceScore}/100` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Navigation Timing */}
            {performance.navigationTiming && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">🚀 Navigation Timing (Average)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="p-3 border border-border bg-background">
                    <div className="text-xs text-muted-foreground mb-1">DNS</div>
                    <div className="text-lg font-bold">{performance.navigationTiming.dns}ms</div>
                  </div>
                  <div className="p-3 border border-border bg-background">
                    <div className="text-xs text-muted-foreground mb-1">TCP</div>
                    <div className="text-lg font-bold">{performance.navigationTiming.tcp}ms</div>
                  </div>
                  <div className="p-3 border border-border bg-background">
                    <div className="text-xs text-muted-foreground mb-1">TTFB</div>
                    <div className="text-lg font-bold">{performance.navigationTiming.ttfb}ms</div>
                  </div>
                  <div className="p-3 border border-border bg-background">
                    <div className="text-xs text-muted-foreground mb-1">Download</div>
                    <div className="text-lg font-bold">{performance.navigationTiming.download}ms</div>
                  </div>
                  <div className="p-3 border border-border bg-background">
                    <div className="text-xs text-muted-foreground mb-1">DOM Interactive</div>
                    <div className="text-lg font-bold">{performance.navigationTiming.domInteractive}ms</div>
                  </div>
                  <div className="p-3 border border-border bg-background">
                    <div className="text-xs text-muted-foreground mb-1">DOM Complete</div>
                    <div className="text-lg font-bold">{performance.navigationTiming.domComplete}ms</div>
                  </div>
                  <div className="p-3 border border-border bg-background">
                    <div className="text-xs text-muted-foreground mb-1">Load Complete</div>
                    <div className="text-lg font-bold">{performance.navigationTiming.loadComplete}ms</div>
                  </div>
                </div>
              </div>
            )}

            {/* Web Vitals */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">📊 Web Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* FCP */}
                <div className="p-4 border-2 border-border">
                  <div className="text-sm text-muted-foreground mb-2">First Contentful Paint (FCP)</div>
                  <div className="text-2xl font-bold mb-2">
                    {performance.webVitals.fcp.avg !== null ? `${performance.webVitals.fcp.avg}ms` : 'N/A'}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-500">Good:</span>
                      <span>{performance.webVitals.fcp.ratings.good || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-500">Needs Improvement:</span>
                      <span>{performance.webVitals.fcp.ratings['needs-improvement'] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500">Poor:</span>
                      <span>{performance.webVitals.fcp.ratings.poor || 0}</span>
                    </div>
                  </div>
                </div>

                {/* LCP */}
                <div className="p-4 border-2 border-border">
                  <div className="text-sm text-muted-foreground mb-2">Largest Contentful Paint (LCP)</div>
                  <div className="text-2xl font-bold mb-2">
                    {performance.webVitals.lcp.avg !== null ? `${performance.webVitals.lcp.avg}ms` : 'N/A'}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-500">Good:</span>
                      <span>{performance.webVitals.lcp.ratings.good || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-500">Needs Improvement:</span>
                      <span>{performance.webVitals.lcp.ratings['needs-improvement'] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500">Poor:</span>
                      <span>{performance.webVitals.lcp.ratings.poor || 0}</span>
                    </div>
                  </div>
                </div>

                {/* FID */}
                <div className="p-4 border-2 border-border">
                  <div className="text-sm text-muted-foreground mb-2">First Input Delay (FID)</div>
                  <div className="text-2xl font-bold mb-2">
                    {performance.webVitals.fid.avg !== null ? `${performance.webVitals.fid.avg}ms` : 'N/A'}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-500">Good:</span>
                      <span>{performance.webVitals.fid.ratings.good || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-500">Needs Improvement:</span>
                      <span>{performance.webVitals.fid.ratings['needs-improvement'] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500">Poor:</span>
                      <span>{performance.webVitals.fid.ratings.poor || 0}</span>
                    </div>
                  </div>
                </div>

                {/* CLS */}
                <div className="p-4 border-2 border-border">
                  <div className="text-sm text-muted-foreground mb-2">Cumulative Layout Shift (CLS)</div>
                  <div className="text-2xl font-bold mb-2">
                    {performance.webVitals.cls.avg !== null ? performance.webVitals.cls.avg.toFixed(3) : 'N/A'}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-500">Good:</span>
                      <span>{performance.webVitals.cls.ratings.good || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-500">Needs Improvement:</span>
                      <span>{performance.webVitals.cls.ratings['needs-improvement'] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500">Poor:</span>
                      <span>{performance.webVitals.cls.ratings.poor || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Data */}
            <div>
              <h3 className="text-lg font-bold mb-3">🌐 Environment Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Network Types */}
                {performance.environment.networkTypes.length > 0 && (
                  <div className="p-4 border-2 border-border">
                    <div className="text-sm font-bold mb-3">Network Types</div>
                    <div className="space-y-2">
                      {performance.environment.networkTypes.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.type}:</span>
                          <span className="font-bold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Device Memory */}
                {performance.environment.deviceMemory.length > 0 && (
                  <div className="p-4 border-2 border-border">
                    <div className="text-sm font-bold mb-3">Device Memory</div>
                    <div className="space-y-2">
                      {performance.environment.deviceMemory.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.memory}:</span>
                          <span className="font-bold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CPU Cores */}
                {performance.environment.cpuCores.length > 0 && (
                  <div className="p-4 border-2 border-border">
                    <div className="text-sm font-bold mb-3">CPU Cores</div>
                    <div className="space-y-2">
                      {performance.environment.cpuCores.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.cores}:</span>
                          <span className="font-bold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="border-pulse-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Visitors</div>
            <div className="text-4xl font-bold">{data.total.toLocaleString()}</div>
          </div>
          <div className="border-wave-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Recent Visitors</div>
            <div className="text-4xl font-bold">{data.recentVisitors.length}</div>
          </div>
          <div className="border-dashed-animated border-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Active Now</div>
            <div className="text-4xl font-bold">{data.activeSessions || 0}</div>
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
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
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

            {/* Visitors by Browser (NEW!) */}
            <div className="border-pulse-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">🌐 Visitors by Browser</h3>
              {stats.byBrowser && stats.byBrowser.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byBrowser}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#999" 
                      style={{ fontSize: '10px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
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
                    <Bar dataKey="value" fill="#FFA07A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>

            {/* Visitors by OS (NEW!) */}
            <div className="border-zigzag-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">💻 Visitors by Operating System</h3>
              {stats.byOS && stats.byOS.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byOS}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {stats.byOS.map((entry, index) => (
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

            {/* Traffic Sources (NEW!) */}
            <div className="border-solid-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">🔗 Top Traffic Sources</h3>
              {stats.byTrafficSource && stats.byTrafficSource.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byTrafficSource}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#999" 
                      style={{ fontSize: '10px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
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
                    <Bar dataKey="value" fill="#98D8C8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>

            {/* Traffic by Type (NEW!) */}
            <div className="border-dashed-animated border-border p-6 bg-background">
              <h3 className="text-xl font-bold mb-4">📊 Traffic by Type</h3>
              {stats.byTrafficType && stats.byTrafficType.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byTrafficType}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {stats.byTrafficType.map((entry, index) => (
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

        {/* Interactive World Map */}
        {!loading && stats.byCountry.length > 0 && (
          <div className="border-pulse-animated border-border p-6 mb-8 bg-background">
            <h3 className="text-xl font-bold mb-4">🗺️ Visitor Locations (Interactive Map)</h3>
            <VisitorMap visitors={stats.byCountry.map(c => ({ country: c.name, count: c.value }))} />
            <div className="mt-4 text-sm text-muted-foreground">
              Click on markers to see visitor count • Powered by OpenStreetMap
            </div>
          </div>
        )}

        {/* Real-time Activity Feed (NEW!) */}
        {!loading && data.recentVisitors.length > 0 && (
          <div className="border-zigzag-animated border-border p-6 mb-8 bg-background">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              📡 Real-time Activity Feed
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </h3>
            <ActivityFeed 
              activities={data.recentVisitors.slice(0, 10).map(v => ({
                timestamp: v.timestamp,
                country: v.country,
                city: v.city,
                browser: v.browser,
                device: v.device,
                ip: v.ip,
              }))} 
            />
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
