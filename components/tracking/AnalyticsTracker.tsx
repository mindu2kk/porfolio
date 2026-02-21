'use client';

import { useEffect, useRef } from 'react';

// Client-side analytics tracker
// Handles: heartbeat, visibility, scroll, clicks, idle detection

export default function AnalyticsTracker() {
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    // Initialize session on mount
    initializeSession();

    // Setup heartbeat
    startHeartbeat();

    // Setup visibility tracking
    setupVisibilityTracking();

    // Setup idle detection
    setupIdleDetection();

    // Setup beforeunload (tab close)
    setupBeforeUnload();

    // Cleanup on unmount
    return () => {
      stopHeartbeat();
      endSession('component_unmount');
    };
  }, []);

  // Initialize session
  async function initializeSession() {
    try {
      // Get or create session ID
      let sessionId = sessionStorage.getItem('analytics_session_id');
      
      if (!sessionId) {
        // Create new session
        const response = await fetch('/api/tracking/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            metadata: {
              landingPage: window.location.pathname,
              referrer: document.referrer || 'Direct',
              screen: `${window.screen.width}x${window.screen.height}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          }),
        });

        const data = await response.json();
        sessionId = data.sessionId;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      sessionIdRef.current = sessionId;
      console.log('📊 Analytics session initialized:', sessionId);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  // Start heartbeat (30s interval)
  function startHeartbeat() {
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 seconds
  }

  // Stop heartbeat
  function stopHeartbeat() {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }

  // Send heartbeat
  async function sendHeartbeat() {
    if (!sessionIdRef.current) return;

    try {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const isIdle = timeSinceLastActivity > 60000; // 60 seconds

      if (isIdle) {
        idleTimeRef.current += 30; // Add 30 seconds of idle time
      }

      await fetch('/api/tracking/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          isVisible: isVisibleRef.current,
          idleTime: idleTimeRef.current,
        }),
      });

      console.log('💓 Heartbeat sent:', {
        sessionId: sessionIdRef.current,
        isVisible: isVisibleRef.current,
        idleTime: idleTimeRef.current,
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  // Setup visibility tracking
  function setupVisibilityTracking() {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isVisible;

      // Track visibility change event
      trackEvent('visibility_change', {
        state: isVisible ? 'visible' : 'hidden',
        previousState: !isVisible ? 'visible' : 'hidden',
      });

      console.log('👁️ Visibility changed:', isVisible ? 'visible' : 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  // Setup idle detection
  function setupIdleDetection() {
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      idleTimeRef.current = 0;
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity);
      });
    };
  }

  // Setup beforeunload (tab close)
  function setupBeforeUnload() {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery
      if (sessionIdRef.current && navigator.sendBeacon) {
        const data = JSON.stringify({
          sessionId: sessionIdRef.current,
          reason: 'tab_close',
        });
        
        navigator.sendBeacon('/api/tracking/session/end', data);
        console.log('👋 Session end beacon sent');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }

  // Track custom event
  async function trackEvent(type: string, metadata: Record<string, any>) {
    if (!sessionIdRef.current) return;

    try {
      await fetch('/api/tracking/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          type,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // End session
  async function endSession(reason: string) {
    if (!sessionIdRef.current) return;

    try {
      await fetch('/api/tracking/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          reason,
        }),
      });

      sessionStorage.removeItem('analytics_session_id');
      sessionIdRef.current = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // No UI - just tracking
  return null;
}
