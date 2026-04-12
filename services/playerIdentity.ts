export interface LocalPlayerIdentity {
  id: string;
  displayName: string;
  avatar: string;
  isGuest: boolean;
  authUserId?: string | null;
  email?: string | null;
}

const PLAYER_IDENTITY_STORAGE_KEY = 'medscan.localPlayerIdentity';
const AVATAR_BANK = ['🩺', '🔬', '🧠', '🧬', '🏥', '💊', '📚', '⚕️'];

const buildGuestIdentity = (): LocalPlayerIdentity => {
  const id = crypto.randomUUID();
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  const avatar = AVATAR_BANK[id.charCodeAt(0) % AVATAR_BANK.length];

  return {
    id,
    displayName: `访客${suffix}`,
    avatar,
    isGuest: true,
    authUserId: null,
    email: null,
  };
};

export const saveLocalPlayerIdentity = (identity: LocalPlayerIdentity): LocalPlayerIdentity => {
  localStorage.setItem(PLAYER_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  return identity;
};

export const getLocalPlayerIdentity = (): LocalPlayerIdentity => {
  try {
    const raw = localStorage.getItem(PLAYER_IDENTITY_STORAGE_KEY);
    if (!raw) {
      const created = buildGuestIdentity();
      return saveLocalPlayerIdentity(created);
    }

    const parsed = JSON.parse(raw) as Partial<LocalPlayerIdentity>;
    if (!parsed.id || !parsed.displayName || !parsed.avatar) {
      const recreated = buildGuestIdentity();
      return saveLocalPlayerIdentity(recreated);
    }

    return {
      id: parsed.id,
      displayName: parsed.displayName,
      avatar: parsed.avatar,
      isGuest: parsed.isGuest ?? true,
      authUserId: parsed.authUserId ?? null,
      email: parsed.email ?? null,
    };
  } catch (error) {
    console.error('Failed to read local player identity:', error);
    const fallback = buildGuestIdentity();
    return saveLocalPlayerIdentity(fallback);
  }
};

export const updateLocalPlayerIdentity = (
  patch: Partial<LocalPlayerIdentity>
): LocalPlayerIdentity => {
  const current = getLocalPlayerIdentity();
  const next: LocalPlayerIdentity = {
    ...current,
    ...patch,
  };

  return saveLocalPlayerIdentity(next);
};

export const linkLocalIdentityToAccount = (payload: {
  authUserId: string;
  email: string | null;
  displayName?: string;
}): LocalPlayerIdentity => updateLocalPlayerIdentity({
  displayName: payload.displayName?.trim() || getLocalPlayerIdentity().displayName,
  isGuest: false,
  authUserId: payload.authUserId,
  email: payload.email,
});

export const unlinkLocalIdentityFromAccount = (): LocalPlayerIdentity => updateLocalPlayerIdentity({
  isGuest: true,
  authUserId: null,
  email: null,
});
