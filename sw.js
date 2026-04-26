// RCMU — Service Worker v3.0
const CACHE = 'rcmu-v3';
const STATIC = [
  '/',
  '/student-portal.html',
  '/student-login.html',
  '/style.css',
  '/admin-data.js',
  '/manifest.json',
  '/Rahula_College_Crest.png',
  '/Media Unit Original logo.png',
  '/icon-16.png',
  '/icon-32.png',
  '/icon-48.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-384.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('firestore') || e.request.url.includes('googleapis')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// ── Push: server-sent push (e.g. from Firebase Cloud Messaging or manual trigger)
self.addEventListener('push', e => {
  let data = { title: 'RCMU Duty Reminder', body: 'You have an upcoming duty.' };
  try { data = e.data ? e.data.json() : data; } catch(err) {}

  const urgency = data.urgency || 'default'; // 'high' for today/assigned, 'normal' for reminders
  const icon = urgency === 'high' ? '/icon-192.png' : '/icon-192.png';
  const badge = '/icon-96.png';

  e.waitUntil(
    self.registration.showNotification(data.title || 'RCMU', {
      body: data.body || data.message || 'Check your student portal.',
      icon,
      badge,
      tag: data.tag || 'rcmu-duty',
      renotify: true,
      requireInteraction: urgency === 'high', // Stay until user dismisses for urgent
      data: { url: data.url || '/student-portal.html', notifId: data.notifId },
      actions: [
        { action: 'open', title: '📱 Open Portal' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// ── Message: allow pages to trigger SW notifications directly ──
// This lets student-portal.html request a scheduled notification via postMessage
self.addEventListener('message', e => {
  if (!e.data) return;

  // Schedule a local reminder at a future time
  if (e.data.type === 'SCHEDULE_REMINDER') {
    const { notifId, dutyDate, dutyLabel, dutyPeriod, daysBefore, fireAt } = e.data;
    const delay = new Date(fireAt).getTime() - Date.now();
    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return; // ignore past or >7 days

    const msgMap = {
      3: `⏰ Duty in 3 days: "${dutyLabel}" on ${dutyDate} (${dutyPeriod})`,
      2: `⏰ Duty in 2 days: "${dutyLabel}" on ${dutyDate} (${dutyPeriod})`,
      1: `🔔 Tomorrow: "${dutyLabel}" is tomorrow! (${dutyDate}, ${dutyPeriod})`,
      0: `🚨 TODAY: "${dutyLabel}" duty is today! Check in on time. (${dutyPeriod})`
    };

    setTimeout(() => {
      self.registration.showNotification('RCMU Duty Reminder', {
        body: msgMap[daysBefore] || `Duty reminder: "${dutyLabel}"`,
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'rcmu-reminder-' + notifId,
        requireInteraction: daysBefore === 0,
        data: { url: '/student-portal.html', notifId },
        actions: [
          { action: 'open', title: '📱 Open Portal' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });
    }, delay);
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/student-portal.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes('student-portal'));
      if (match) { match.focus(); return; }
      return clients.openWindow(url);
    })
  );
});

const CACHE = 'rcmu-v2';
const STATIC = [
  '/',
  '/student-portal.html',
  '/student-login.html',
  '/style.css',
  '/admin-data.js',
  '/manifest.json',
  '/Rahula_College_Crest.png',
  '/Media Unit Original logo.png',
  '/icon-16.png',
  '/icon-32.png',
  '/icon-48.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-384.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('firestore') || e.request.url.includes('googleapis')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'RCMU Duty Reminder', body: 'You have an upcoming duty.' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'RCMU', {
      body: data.body || 'Check your student portal.',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'rcmu-duty',
      renotify: true,
      data: { url: data.url || '/student-portal.html' },
      actions: [
        { action: 'open', title: 'View Profile' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/student-portal.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes('student-portal'));
      if (match) { match.focus(); return; }
      return clients.openWindow(url);
    })
  );
});