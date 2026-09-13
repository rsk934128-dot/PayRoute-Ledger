/**
 * PayRoute Service Worker for Push Notifications
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  notification.close();

  if (action === 'close') {
    return;
  }

  // Open the app or a specific URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Listener for background push events from a real server
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PayRoute Alert';
  const options = {
    body: data.body || 'New transaction update received.',
    icon: '/payroute_logo.jpg',
    badge: '/favicon.jpg',
    vibrate: [100, 50, 100],
    data: data.payload || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
