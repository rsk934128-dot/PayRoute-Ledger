/**
 * Utility for managing Browser Push Notifications
 */

export const NOTIFICATION_PERMISSION_GRANTED = 'granted';
export const NOTIFICATION_PERMISSION_DENIED = 'denied';
export const NOTIFICATION_PERMISSION_DEFAULT = 'default';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return NOTIFICATION_PERMISSION_DENIED;
  }

  if (Notification.permission === NOTIFICATION_PERMISSION_GRANTED) {
    return NOTIFICATION_PERMISSION_GRANTED;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return NOTIFICATION_PERMISSION_DENIED;
  }
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export async function sendNotification(options: ShowNotificationOptions) {
  if (!('Notification' in window)) return;

  if (Notification.permission !== NOTIFICATION_PERMISSION_GRANTED) {
    const permission = await requestNotificationPermission();
    if (permission !== NOTIFICATION_PERMISSION_GRANTED) return;
  }

  const { title, body, icon = '/payroute_logo.jpg', tag, data } = options;

  // Try showing via service worker first for background support
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      registration.showNotification(title, {
        body,
        icon,
        tag: tag || 'payroute-alert',
        badge: '/favicon.jpg',
        vibrate: [200, 100, 200],
        data: data || { dateOfArrival: Date.now() },
        actions: [
          { action: 'open', title: 'View Ledger' },
          { action: 'close', title: 'Dismiss' }
        ]
      } as any);
      return;
    }
  }

  // Fallback to standard Notification if SW not ready
  new Notification(title, {
    body,
    icon,
    tag: tag || 'payroute-alert',
  });
}
