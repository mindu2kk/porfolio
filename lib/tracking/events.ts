// Event-based tracking system
// Replaces simple counter with comprehensive event logging

export type EventType =
  | 'page_view'
  | 'session_start'
  | 'session_end'
  | 'heartbeat'
  | 'click'
  | 'scroll_depth'
  | 'visibility_change'
  | 'idle_start'
  | 'idle_end'
  | 'tab_hidden'
  | 'tab_visible'
  | 'tab_close'
  | 'api_call'
  | 'error_event'
  | 'conversion_event';

export interface TrackingEvent {
  id: string;
  type: EventType;
  userId: string;
  sessionId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface PageViewMetadata {
  page: string;
  referrer: string;
  title: string;
  userAgent: string;
  ip: string;
  country: string;
  city: string;
  browser?: string;
  os?: string;
  device?: string;
}

export interface HeartbeatMetadata {
  isVisible: boolean;
  idleTime: number;
}

export interface ClickMetadata {
  elementId?: string;
  elementTag: string;
  elementText?: string;
  x: number;
  y: number;
  section?: string;
}

export interface ScrollDepthMetadata {
  depth: number; // 25, 50, 75, 100
  page: string;
}

export interface VisibilityMetadata {
  state: 'visible' | 'hidden';
  previousState: 'visible' | 'hidden';
}

// Generate unique event ID
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate anonymous user ID (fingerprint-lite)
export function generateUserId(userAgent: string, timezone: string, screen: string): string {
  const data = `${userAgent}|${timezone}|${screen}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `user_${Math.abs(hash).toString(36)}`;
}

// Generate session ID
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create event
export function createEvent(
  type: EventType,
  userId: string,
  sessionId: string,
  metadata: Record<string, any>
): TrackingEvent {
  return {
    id: generateEventId(),
    type,
    userId,
    sessionId,
    timestamp: Date.now(),
    metadata,
  };
}
