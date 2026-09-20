import { playScoreSound } from './audio';

const STORAGE_KEY_SUBSCRIPTIONS = 'arenapulse_game_subscriptions';
const STORAGE_KEY_GLOBAL_PREFS = 'arenapulse_global_alert_prefs';

export const DEFAULT_PREFERENCES = {
  touchdowns: true, // Touchdowns, goals, home runs, scoring plays
  quarters: true,   // Quarter / Period end & Halftime updates
  finalScore: true, // End of game / Final score
  closeGame: false  // Close game alerts
};

// Check if browser notifications are supported
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status: 'default' | 'granted' | 'denied' | 'unsupported'
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

// Subscriptions storage helpers
export function getSubscriptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSubscriptions(subscriptions) {
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subscriptions));
    window.dispatchEvent(new CustomEvent('arenapulse:subscriptions-changed', { detail: subscriptions }));
  } catch (err) {
    console.warn('Failed to save subscriptions:', err);
  }
}

export function getGlobalPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL_PREFS);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveGlobalPreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_PREFS, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Failed to save global preferences:', err);
  }
}

export function isGameSubscribed(gameId) {
  if (!gameId) return false;
  const subs = getSubscriptions();
  return Boolean(subs[gameId]);
}

export function getGameAlertPreferences(gameId) {
  const global = getGlobalPreferences();
  const subs = getSubscriptions();
  const sub = subs[gameId];
  // Only keys the user explicitly customized for this game override the
  // global triggers; everything else follows the global preferences, so
  // toggling a global trigger applies to already-tracked games too.
  if (sub && sub.preferenceOverrides) {
    return { ...global, ...sub.preferenceOverrides };
  }
  return global;
}

export function subscribeToGame(game, customPreferences = null) {
  if (!game || !game.id) return;
  const subs = getSubscriptions();

  subs[game.id] = {
    gameId: game.id,
    subscribedAt: new Date().toISOString(),
    league: game.league,
    leagueName: game.leagueName || game.league?.toUpperCase(),
    sport: game.sport,
    homeTeam: {
      name: game.homeTeam?.displayName || game.homeTeam?.name || 'Home',
      logo: game.homeTeam?.logo
    },
    awayTeam: {
      name: game.awayTeam?.displayName || game.awayTeam?.name || 'Away',
      logo: game.awayTeam?.logo
    },
    // Store only explicitly customized per-game keys (not a full snapshot),
    // so untweaked games keep following the global triggers.
    preferenceOverrides: customPreferences ? { ...customPreferences } : {}
  };

  saveSubscriptions(subs);
  return subs[game.id];
}

export function unsubscribeFromGame(gameId) {
  if (!gameId) return;
  const subs = getSubscriptions();
  if (subs[gameId]) {
    delete subs[gameId];
    saveSubscriptions(subs);
  }
}

export function toggleGameSubscription(game) {
  if (!game || !game.id) return false;
  if (isGameSubscribed(game.id)) {
    unsubscribeFromGame(game.id);
    return false;
  } else {
    subscribeToGame(game);
    return true;
  }
}

export function updateGamePreferences(gameId, overrides) {
  const subs = getSubscriptions();
  if (subs[gameId]) {
    subs[gameId].preferenceOverrides = {
      ...(subs[gameId].preferenceOverrides || {}),
      ...overrides
    };
    saveSubscriptions(subs);
  }
}

// Dispatch browser notification + audio chime
export async function sendGameAlert({ title, body, icon, gameId, playChime = true, tag = 'game-alert' }) {
  // Play sound if requested
  if (playChime) {
    playScoreSound();
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.log(`[ALERT] (In-App Only - Browser notifications not granted): ${title} - ${body}`);
    return;
  }

  const notificationOptions = {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: `${tag}-${gameId || 'arena'}`,
    renotify: true,
    data: {
      url: gameId ? `/?gameId=${gameId}` : '/'
    }
  };

  // Try Service Worker registration first for best mobile/desktop reliability
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return;
      }
    }
  } catch (swErr) {
    console.warn('[PWA Notification] SW showNotification error, falling back to window.Notification:', swErr);
  }

  // Fallback to standard window.Notification
  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn('[Notification Error]', err);
  }
}

// Test notification trigger
export async function sendTestNotification() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      alert('Please enable browser notification permissions in your browser bar to receive game updates!');
      return false;
    }
  }

  await sendGameAlert({
    title: '🏈 TOUCHDOWN! Kansas City Chiefs',
    body: 'Travis Kelce 14-yard pass from Patrick Mahomes! KC 24, SF 20 (Q4 3:18)',
    tag: 'test-touchdown',
    playChime: true
  });
  return true;
}
