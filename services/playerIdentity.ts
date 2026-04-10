export interface LocalPlayerIdentity {
  id: string;
  displayName: string;
  avatar: string;
  isGuest: boolean;
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
  };
};

export const getLocalPlayerIdentity = (): LocalPlayerIdentity => {
  try {
    const raw = localStorage.getItem(PLAYER_IDENTITY_STORAGE_KEY);
    if (!raw) {
      const created = buildGuestIdentity();
      localStorage.setItem(PLAYER_IDENTITY_STORAGE_KEY, JSON.stringify(created));
      return created;
    }

    const parsed = JSON.parse(raw) as Partial<LocalPlayerIdentity>;
    if (!parsed.id || !parsed.displayName || !parsed.avatar) {
      const recreated = buildGuestIdentity();
      localStorage.setItem(PLAYER_IDENTITY_STORAGE_KEY, JSON.stringify(recreated));
      return recreated;
    }

    return {
      id: parsed.id,
      displayName: parsed.displayName,
      avatar: parsed.avatar,
      isGuest: parsed.isGuest ?? true,
    };
  } catch (error) {
    console.error('Failed to read local player identity:', error);
    const fallback = buildGuestIdentity();
    localStorage.setItem(PLAYER_IDENTITY_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};
