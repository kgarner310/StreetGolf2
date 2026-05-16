self.addEventListener('push', e => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Threadboard', {
      body: data.body ?? 'A score was just submitted.',
      icon: '/globe.svg',
      badge: '/globe.svg',
      data: { url: data.url ?? '/' },
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url ?? '/'));
});
