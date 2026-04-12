import { ensureBackendPlayerProfile } from './backend';
import { getLocalPlayerIdentity } from './playerIdentity';
import { getSupabaseClient } from './supabase';

const ANALYTICS_STORAGE_KEY = 'medscan.analyticsEvents';
const MAX_ANALYTICS_EVENTS = 200;
let analyticsSyncInFlight = false;

export interface AnalyticsEvent {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
  syncedAt?: string | null;
  identityId?: string | null;
}

const saveAnalyticsEvents = (events: AnalyticsEvent[]) => {
  localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
};

const normalizeAnalyticsEvent = (event: Partial<AnalyticsEvent>): AnalyticsEvent | null => {
  if (!event.id || !event.name || !event.createdAt) {
    return null;
  }

  return {
    id: event.id,
    name: event.name,
    payload: event.payload ?? {},
    createdAt: event.createdAt,
    syncedAt: event.syncedAt ?? null,
    identityId: event.identityId ?? null,
  };
};

export const getAnalyticsEvents = (): AnalyticsEvent[] => {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Partial<AnalyticsEvent>[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeAnalyticsEvent)
      .filter((event): event is AnalyticsEvent => Boolean(event));
  } catch (error) {
    console.error('Failed to parse analytics events:', error);
    return [];
  }
};

const markAnalyticsEventsSynced = (eventIds: string[]) => {
  if (eventIds.length === 0) {
    return;
  }

  const syncedAt = new Date().toISOString();
  const nextEvents = getAnalyticsEvents().map((event) => (
    eventIds.includes(event.id)
      ? { ...event, syncedAt }
      : event
  ));
  saveAnalyticsEvents(nextEvents);
};

export const flushAnalyticsEvents = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase || analyticsSyncInFlight) {
    return;
  }

  const pendingEvents = getAnalyticsEvents().filter((event) => !event.syncedAt);
  if (pendingEvents.length === 0) {
    return;
  }

  analyticsSyncInFlight = true;

  try {
    const identity = getLocalPlayerIdentity();
    const userId = await ensureBackendPlayerProfile(identity);

    if (!userId) {
      return;
    }

    const { error } = await supabase
      .from('analytics_events')
      .upsert(
        pendingEvents.map((event) => ({
          id: event.id,
          user_id: userId,
          event_name: event.name,
          payload: event.payload,
          client_created_at: event.createdAt,
        })),
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Failed to sync analytics events:', error);
      return;
    }

    markAnalyticsEventsSynced(pendingEvents.map((event) => event.id));
  } finally {
    analyticsSyncInFlight = false;
  }
};

export const trackEvent = (
  name: string,
  payload: Record<string, unknown> = {}
): AnalyticsEvent[] => {
  const identity = getLocalPlayerIdentity();
  const nextEvent: AnalyticsEvent = {
    id: crypto.randomUUID(),
    name,
    payload,
    createdAt: new Date().toISOString(),
    syncedAt: null,
    identityId: identity.id,
  };

  const nextEvents = [nextEvent, ...getAnalyticsEvents()].slice(0, MAX_ANALYTICS_EVENTS);
  saveAnalyticsEvents(nextEvents);
  void flushAnalyticsEvents();
  return nextEvents;
};
