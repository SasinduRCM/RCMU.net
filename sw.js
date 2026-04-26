// RCMU — Service Worker v4.0
// GitHub Pages compatible — auto-detects base path

// ── Detect base path (works on localhost AND /repo-name/) ──
const BASE = self.location.pathname.replace(/\/sw\.js$/, '') || '';

const CACHE = 'rcmu-v4';

// All paths are relative to BASE
const STATIC_PATHS = [
  '/',
  '/index.html',
  '/student-portal.html',
  '/student-login.html',
  '/login.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/Rahula_College_Crest.png',
  '/Media Unit Original logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
];

// Prefix every path with BASE
const STATIC = STATIC_PATHS.map(p => BASE + p);

// ── Install ────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — delete old caches ──────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — Network first, cache fallback ─────────────────
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept Firebase / Google API calls
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('cdnjs.cloudflare.com') ||
    e.request.method !== 'GET'
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache fresh responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request)
        .then(cached => cached || caches.match(BASE + '/index.html'))
      )
  );
});

// ── Push notifications ─────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'RCMU Duty Reminder', body: 'You have an upcoming duty.' };
  try { if (e.data) data = e.data.json(); } catch(err) {}

  const urgency = data.urgency || 'default';
  e.waitUntil(
    self.registration.showNotification(data.title || 'RCMU', {
      body: data.body || data.message || 'Check your student portal.',
      icon: BASE + '/icon-192.png',
      badge: BASE + '/icon-96.png',
      tag: data.tag || 'rcmu-duty',
      renotify: true,
      requireInteraction: urgency === 'high',
      data: { url: data.url || (BASE + '/student-portal.html'), notifId: data.notifId },
      actions: [
        { action: 'open',    title: '📱 Open Portal' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// ── Scheduled reminders via postMessage ───────────────────
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'SCHEDULE_REMINDER') return;

  const { notifId, dutyDate, dutyLabel, dutyPeriod, daysBefore, fireAt } = e.data;
  const delay = new Date(fireAt).getTime() - Date.now();
  if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return;

  const msgs = {
    3: `⏰ Duty in 3 days: "${dutyLabel}" on ${dutyDate} (${dutyPeriod})`,
    2: `⏰ Duty in 2 days: "${dutyLabel}" on ${dutyDate} (${dutyPeriod})`,
    1: `🔔 Tomorrow: "${dutyLabel}" is tomorrow! (${dutyDate}, ${dutyPeriod})`,
    0: `🚨 TODAY: "${dutyLabel}" duty is today! (${dutyPeriod})`
  };

  setTimeout(() => {
    self.registration.showNotification('RCMU Duty Reminder', {
      body: msgs[daysBefore] || `Duty reminder: "${dutyLabel}"`,
      icon: BASE + '/icon-192.png',
      badge: BASE + '/icon-96.png',
      tag: 'rcmu-reminder-' + notifId,
      requireInteraction: daysBefore === 0,
      data: { url: BASE + '/student-portal.html', notifId },
      actions: [
        { action: 'open',    title: '📱 Open Portal' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }, delay);
});

// ── Notification click ─────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const url = e.notification.data?.url || (BASE + '/student-portal.html');
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes('student-portal'));
      if (match) { match.focus(); return; }
      return clients.openWindow(url);
    })
  );
});