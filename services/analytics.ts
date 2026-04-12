const ANALYTICS_STORAGE_KEY = 'medscan.analyticsEvents';
const MAX_ANALYTICS_EVENTS = 200;

export interface AnalyticsEvent {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const getAnalyticsEvents = (): AnalyticsEvent[] => {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as AnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse analytics events:', error);
    return [];
  }
};

export const trackEvent = (
  name: string,
  payload: Record<string, unknown> = {}
): AnalyticsEvent[] => {
  const nextEvent: AnalyticsEvent = {
    id: crypto.randomUUID(),
    name,
    payload,
    createdAt: new Date().toISOString(),
  };

  const nextEvents = [nextEvent, ...getAnalyticsEvents()].slice(0, MAX_ANALYTICS_EVENTS);
  localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(nextEvents));
  return nextEvents;
};
