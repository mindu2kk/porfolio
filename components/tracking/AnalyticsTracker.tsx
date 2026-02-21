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
  const scrollDepthsTrackedRef = useRef<Set<number>>(new Set());
  const isIdleRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize session on mount
    initializeSession();

    // Setup heartbeat
    startHeartbeat();

    // Setup visibility tracking
    setupVisibilityTracking();

    // Setup idle detection
    setupIdleDetection();

    // Setup scroll depth tracking
    setupScrollDepthTracking();

    // Setup click tracking
    setupClickTracking();

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
    let idleTimeout: NodeJS.Timeout | null = null;

    const resetActivity = () => {
      const wasIdle = isIdleRef.current;
      
      lastActivityRef.current = Date.now();
      idleTimeRef.current = 0;
      isIdleRef.current = false;

      // Track idle_end if was idle
      if (wasIdle) {
        trackEvent('idle_end', {
          timestamp: Date.now(),
        });
        console.log('🟢 User active again');
      }

      // Reset idle timeout
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }

      idleTimeout = setTimeout(() => {
        isIdleRef.current = true;
        trackEvent('idle_start', {
          timestamp: Date.now(),
        });
        console.log('💤 User idle detected');
      }, 60000); // 60 seconds
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivity, { passive: true });
    });

    // Initial timeout
    resetActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity);
      });
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
    };
  }

  // Setup scroll depth tracking
  function setupScrollDepthTracking() {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Calculate scroll percentage
      const scrollableHeight = documentHeight - windowHeight;
      const scrollPercentage = scrollableHeight > 0 
        ? Math.round((scrollTop / scrollableHeight) * 100)
        : 100;

      // Track milestones: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      
      for (const milestone of milestones) {
        if (scrollPercentage >= milestone && !scrollDepthsTrackedRef.current.has(milestone)) {
          scrollDepthsTrackedRef.current.add(milestone);
          
          trackEvent('scroll_depth', {
            depth: milestone,
            page: window.location.pathname,
            timestamp: Date.now(),
          });

          console.log(`📜 Scroll depth: ${milestone}%`);
        }
      }
    };

    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout | null = null;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 500); // Check every 500ms
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }

  // Setup click tracking
  function setupClickTracking() {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Get element info
      const elementId = target.id || undefined;
      const elementTag = target.tagName.toLowerCase();
      const elementText = target.textContent?.slice(0, 50) || undefined;
      const elementClasses = target.className || undefined;
      
      // Get normalized position (0-1)
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      
      // Get section (closest parent with id or data-section)
      let section = undefined;
      let parent = target.parentElement;
      while (parent && !section) {
        if (parent.id) {
          section = parent.id;
        } else if (parent.dataset.section) {
          section = parent.dataset.section;
        }
        parent = parent.parentElement;
      }

      trackEvent('click', {
        elementId,
        elementTag,
        elementText,
        elementClasses,
        x: Math.round(x * 1000) / 1000, // 3 decimal places
        y: Math.round(y * 1000) / 1000,
        section,
        page: window.location.pathname,
        timestamp: Date.now(),
      });

      console.log('🖱️ Click tracked:', {
        element: elementTag,
        id: elementId,
        position: `${Math.round(x * 100)}%, ${Math.round(y * 100)}%`,
      });
    };

    document.addEventListener('click', handleClick, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick);
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
