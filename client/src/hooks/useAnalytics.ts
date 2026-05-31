import { useCallback, useRef } from "react";

interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
}

const EVENT_BUFFER: AnalyticsEvent[] = [];
const MAX_BUFFER = 50;

function sendEvent(event: AnalyticsEvent): void {
  if (EVENT_BUFFER.length >= MAX_BUFFER) {
    EVENT_BUFFER.shift();
  }
  EVENT_BUFFER.push(event);

  // Send to console in development
  if (import.meta.env.DEV) {
    return;
  }

  // Send to any connected analytics endpoint
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/analytics/event", JSON.stringify(event));
    }
  } catch {
    // Silently fail for analytics
  }
}

export function useAnalytics() {
  const eventCount = useRef(0);

  const track = useCallback((category: string, action: string, label?: string, value?: number) => {
    eventCount.current += 1;
    sendEvent({
      event: "custom",
      category,
      action,
      label,
      value,
      properties: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        sessionId: getSessionId(),
      },
    });
  }, []);

  const trackPageView = useCallback((pagePath: string, pageTitle?: string) => {
    sendEvent({
      event: "pageview",
      category: "navigation",
      action: "page_view",
      label: pagePath,
      properties: {
        title: pageTitle ?? document.title,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
      },
    });
  }, []);

  const trackCTA = useCallback((ctaName: string, ctaLocation: string) => {
    sendEvent({
      event: "cta_click",
      category: "conversion",
      action: "cta_click",
      label: ctaName,
      properties: {
        location: ctaLocation,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
      },
    });
  }, []);

  const trackError = useCallback((errorName: string, errorMessage: string) => {
    sendEvent({
      event: "error",
      category: "error",
      action: errorName,
      label: errorMessage.substring(0, 100),
      properties: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        sessionId: getSessionId(),
      },
    });
  }, []);

  return { track, trackPageView, trackCTA, trackError, eventCount: eventCount.current };
}

function getSessionId(): string {
  let id = sessionStorage.getItem("allobricolage_session_id");
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("allobricolage_session_id", id);
  }
  return id;
}

// Global analytics helper (can be called from anywhere)
export function analytics(): ReturnType<typeof useAnalytics> {
  return {
    track: (category: string, action: string, label?: string, value?: number) => {
      sendEvent({
        event: "custom",
        category,
        action,
        label,
        value,
        properties: {
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          sessionId: getSessionId(),
        },
      });
    },
    trackPageView: (pagePath: string, pageTitle?: string) => {
      sendEvent({
        event: "pageview",
        category: "navigation",
        action: "page_view",
        label: pagePath,
        properties: {
          title: pageTitle ?? document.title,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
        },
      });
    },
    trackCTA: (ctaName: string, ctaLocation: string) => {
      sendEvent({
        event: "cta_click",
        category: "conversion",
        action: "cta_click",
        label: ctaName,
        properties: {
          location: ctaLocation,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
        },
      });
    },
    trackError: (errorName: string, errorMessage: string) => {
      sendEvent({
        event: "error",
        category: "error",
        action: errorName,
        label: errorMessage.substring(0, 100),
        properties: {
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          sessionId: getSessionId(),
        },
      });
    },
    eventCount: EVENT_BUFFER.length,
  };
}
