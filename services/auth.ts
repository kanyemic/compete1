import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

export interface AuthAccountSession {
  userId: string;
  email: string | null;
}

interface LocalAuthUser {
  id: string;
  email: string;
  password: string;
}

const LOCAL_AUTH_USERS_KEY = 'medscan.localAuthUsers';
const LOCAL_AUTH_SESSION_KEY = 'medscan.localAuthSession';
const listeners = new Set<(event: AuthChangeEvent, session: AuthAccountSession | null) => void>();

const mapSession = (session: Session | null): AuthAccountSession | null => {
  const user = session?.user;
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
  };
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const readLocalAuthUsers = (): LocalAuthUser[] => {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_USERS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as LocalAuthUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse local auth users:', error);
    return [];
  }
};

const saveLocalAuthUsers = (users: LocalAuthUser[]) => {
  localStorage.setItem(LOCAL_AUTH_USERS_KEY, JSON.stringify(users));
};

const readLocalAuthSession = (): AuthAccountSession | null => {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthAccountSession;
    if (!parsed.userId) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email ?? null,
    };
  } catch (error) {
    console.error('Failed to parse local auth session:', error);
    return null;
  }
};

const saveLocalAuthSession = (session: AuthAccountSession | null) => {
  if (!session) {
    localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
    return;
  }

  localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify(session));
};

const emitLocalAuthStateChange = (event: AuthChangeEvent, session: AuthAccountSession | null) => {
  listeners.forEach((listener) => listener(event, session));
};

export const isAuthAvailable = (): boolean => true;

export const getAuthAccountSession = async (): Promise<AuthAccountSession | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return readLocalAuthSession();
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Failed to get auth session:', error);
    return null;
  }

  return mapSession(data.session);
};

export const signInWithEmailPassword = async (payload: {
  email: string;
  password: string;
}): Promise<{ session: AuthAccountSession | null; error: string | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const normalizedEmail = normalizeEmail(payload.email);
    const user = readLocalAuthUsers().find((entry) => entry.email === normalizedEmail);
    if (!user || user.password !== payload.password) {
      return {
        session: null,
        error: '邮箱或密码不正确。',
      };
    }

    const session = {
      userId: user.id,
      email: user.email,
    };
    saveLocalAuthSession(session);
    emitLocalAuthStateChange('SIGNED_IN', session);

    return {
      session,
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    return {
      session: null,
      error: error.message,
    };
  }

  return {
    session: mapSession(data.session),
    error: null,
  };
};

export const signUpWithEmailPassword = async (payload: {
  email: string;
  password: string;
}): Promise<{
  session: AuthAccountSession | null;
  error: string | null;
  requiresEmailConfirmation: boolean;
}> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const normalizedEmail = normalizeEmail(payload.email);
    if (!normalizedEmail) {
      return {
        session: null,
        error: '请输入邮箱地址。',
        requiresEmailConfirmation: false,
      };
    }

    if (payload.password.length < 6) {
      return {
        session: null,
        error: '密码至少需要 6 位。',
        requiresEmailConfirmation: false,
      };
    }

    const currentUsers = readLocalAuthUsers();
    if (currentUsers.some((entry) => entry.email === normalizedEmail)) {
      return {
        session: null,
        error: '这个邮箱已经注册过了，请直接登录。',
        requiresEmailConfirmation: false,
      };
    }

    const nextUser: LocalAuthUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      password: payload.password,
    };
    saveLocalAuthUsers([...currentUsers, nextUser]);

    const session = {
      userId: nextUser.id,
      email: nextUser.email,
    };
    saveLocalAuthSession(session);
    emitLocalAuthStateChange('SIGNED_IN', session);

    return {
      session,
      error: null,
      requiresEmailConfirmation: false,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    return {
      session: null,
      error: error.message,
      requiresEmailConfirmation: false,
    };
  }

  return {
    session: mapSession(data.session),
    error: null,
    requiresEmailConfirmation: !data.session,
  };
};

export const signOutAuthAccount = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    saveLocalAuthSession(null);
    emitLocalAuthStateChange('SIGNED_OUT', null);
    return null;
  }

  const { error } = await supabase.auth.signOut();
  return error?.message ?? null;
};

export const subscribeToAuthStateChange = (
  callback: (event: AuthChangeEvent, session: AuthAccountSession | null) => void
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, mapSession(session));
  });
};
