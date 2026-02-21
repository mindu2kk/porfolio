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
  const performanceTrackedRef = useRef<boolean>(false);
  const shouldTrackRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if we should track this page (exclude admin pages)
    const pathname = window.location.pathname;
    shouldTrackRef.current = !pathname.startsWith('/admin');

    // Only initialize tracking for non-admin pages
    if (!shouldTrackRef.current) {
      console.log('🚫 Analytics tracking disabled for admin page:', pathname);
      return;
    }

    console.log('✅ Analytics tracking enabled for:', pathname);

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

    // Setup network and hardware tracking
    trackEnvironment();

    // Setup performance tracking
    trackPerformance();

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

  // Track environment (network + hardware)
  function trackEnvironment() {
    try {
      // Network Information API
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      const networkInfo = connection ? {
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink, // Mbps
        rtt: connection.rtt, // Round trip time in ms
        saveData: connection.saveData, // Data saver mode
        type: connection.type, // 'wifi', 'cellular', etc.
      } : {
        effectiveType: 'unknown',
        downlink: null,
        rtt: null,
        saveData: false,
        type: 'unknown',
      };

      // Hardware Information
      const hardwareInfo = {
        deviceMemory: (navigator as any).deviceMemory || null, // GB
        hardwareConcurrency: navigator.hardwareConcurrency || null, // CPU cores
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenAvailWidth: window.screen.availWidth,
        screenAvailHeight: window.screen.availHeight,
        pixelRatio: window.devicePixelRatio || 1,
        colorDepth: window.screen.colorDepth,
        orientation: window.screen.orientation?.type || 'unknown',
        touchPoints: navigator.maxTouchPoints || 0,
      };

      // Platform Information
      const platformInfo = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        onLine: navigator.onLine,
      };

      // Track environment event
      trackEvent('environment', {
        network: networkInfo,
        hardware: hardwareInfo,
        platform: platformInfo,
        timestamp: Date.now(),
      });

      console.log('🌐 Environment tracked:', {
        network: networkInfo.effectiveType,
        memory: hardwareInfo.deviceMemory ? `${hardwareInfo.deviceMemory}GB` : 'unknown',
        cores: hardwareInfo.hardwareConcurrency,
        screen: `${hardwareInfo.screenWidth}x${hardwareInfo.screenHeight}`,
      });

      // Listen for network changes
      if (connection) {
        connection.addEventListener('change', () => {
          trackEvent('network_change', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            timestamp: Date.now(),
          });
          console.log('📶 Network changed:', connection.effectiveType);
        });
      }

      // Listen for online/offline
      window.addEventListener('online', () => {
        trackEvent('connection_online', { timestamp: Date.now() });
        console.log('✅ Connection online');
      });

      window.addEventListener('offline', () => {
        trackEvent('connection_offline', { timestamp: Date.now() });
        console.log('❌ Connection offline');
      });
    } catch (error) {
      console.error('Failed to track environment:', error);
    }
  }

  // Track performance metrics (RUM - Real User Monitoring)
  function trackPerformance() {
    try {
      // Wait for page load
      if (document.readyState === 'complete') {
        capturePerformanceMetrics();
      } else {
        window.addEventListener('load', capturePerformanceMetrics);
      }

      // Track Web Vitals using PerformanceObserver
      trackWebVitals();
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  function capturePerformanceMetrics() {
    if (performanceTrackedRef.current) return;
    performanceTrackedRef.current = true;

    try {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!perfData) {
        console.warn('Navigation timing not available');
        return;
      }

      const metrics = {
        // Navigation Timing
        dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
        tcp: Math.round(perfData.connectEnd - perfData.connectStart),
        ttfb: Math.round(perfData.responseStart - perfData.requestStart), // Time to First Byte
        download: Math.round(perfData.responseEnd - perfData.responseStart),
        domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
        domComplete: Math.round(perfData.domComplete - perfData.fetchStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart),
        
        // Resource Timing
        transferSize: perfData.transferSize || 0,
        encodedBodySize: perfData.encodedBodySize || 0,
        decodedBodySize: perfData.decodedBodySize || 0,
      };

      trackEvent('performance', {
        metrics,
        page: window.location.pathname,
        timestamp: Date.now(),
      });

      console.log('⚡ Performance metrics:', {
        ttfb: `${metrics.ttfb}ms`,
        domComplete: `${metrics.domComplete}ms`,
        loadComplete: `${metrics.loadComplete}ms`,
      });
    } catch (error) {
      console.error('Failed to capture performance metrics:', error);
    }
  }

  function trackWebVitals() {
    try {
      // FCP - First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            trackEvent('web_vital_fcp', {
              value: Math.round(entry.startTime),
              rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            });
            console.log('🎨 FCP:', Math.round(entry.startTime), 'ms');
            fcpObserver.disconnect();
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        trackEvent('web_vital_lcp', {
          value: Math.round(lastEntry.startTime),
          rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
          element: lastEntry.element?.tagName || 'unknown',
          timestamp: Date.now(),
        });
        console.log('🖼️ LCP:', Math.round(lastEntry.startTime), 'ms');
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          trackEvent('web_vital_fid', {
            value: Math.round(fidEntry.processingStart - fidEntry.startTime),
            rating: (fidEntry.processingStart - fidEntry.startTime) < 100 ? 'good' : 
                   (fidEntry.processingStart - fidEntry.startTime) < 300 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
          });
          console.log('⚡ FID:', Math.round(fidEntry.processingStart - fidEntry.startTime), 'ms');
          fidObserver.disconnect();
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Report CLS after 5 seconds
      setTimeout(() => {
        trackEvent('web_vital_cls', {
          value: Math.round(clsValue * 1000) / 1000,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
        console.log('📐 CLS:', Math.round(clsValue * 1000) / 1000);
        clsObserver.disconnect();
      }, 5000);

    } catch (error) {
      console.error('Failed to track web vitals:', error);
    }
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
    if (!sessionIdRef.current || !shouldTrackRef.current) return;

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
