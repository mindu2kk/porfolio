'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  timestamp: string;
  country: string;
  city: string;
  browser?: string;
  device?: string;
  ip: string;
}

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 border-2 border-border hover:bg-muted transition-colors"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
            {activity.country ? activity.country.substring(0, 2).toUpperCase() : '??'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold">
                {activity.city}, {activity.country}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {activity.browser && <span className="mr-2">🌐 {activity.browser}</span>}
              {activity.device && <span className="mr-2">📱 {activity.device}</span>}
              <span className="font-mono text-xs">{activity.ip}</span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"></span>
          </div>
        </div>
      ))}
    </div>
  );
}
