# PWA Auto-Update Quick Reference

## 🚀 Quick Start

### For Developers

**Before Deployment:**
```javascript
// 1. Update version in public/sw.js
const CACHE_VERSION = 'v2.1.1'; // Increment this

// 2. Test locally
// DevTools → Application → Service Workers → "Update on reload"

// 3. Deploy
```

**After Deployment:**
- Android/Desktop: Auto-updates within ~32 seconds
- iOS: Shows update button within ~32 seconds

### For Testers

**Android/Chrome:**
1. Open installed PWA
2. Wait 5 seconds
3. ✅ Should see "Updating..." → auto-reload

**iOS/Safari:**
1. Open installed PWA from home screen
2. Wait 5 seconds
3. ✅ Should see update banner
4. Tap "Update Now"
5. App reloads

## 🔧 Common Tasks

### Force Update Check
```javascript
navigator.serviceWorker.ready.then(reg => reg.update())
```

### Check Current Version
```javascript
caches.keys().then(keys => console.log('Versions:', keys))
```

### Unregister Service Worker
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.unregister()))
```

### Clear All Caches
```javascript
caches.keys().then(keys => 
  Promise.all(keys.map(key => caches.delete(key)))
)
```

## 📊 Update Timings

| Event | Timing |
|-------|--------|
| On app open | Immediate |
| Periodic check | Every 30s |
| Visibility change | Immediate |
| Android auto-update | 2s after detection |
| iOS prompt | Immediate after detection |

## 🐛 Troubleshooting

### Update Not Showing
```javascript
// Check if new SW is waiting
navigator.serviceWorker.ready.then(reg => {
  console.log('Waiting SW:', !!reg.waiting)
  console.log('Installing SW:', !!reg.installing)
})

// Force update
navigator.serviceWorker.ready.then(reg => reg.update())
```

### Stale Content
```bash
# Nuclear option: Clear everything
1. DevTools → Application → Clear storage → Clear site data
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Reopen app
```

### iOS Not Updating
```javascript
// Check if in standalone mode
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches)

// Check iOS version
const iosVersion = navigator.userAgent.match(/OS (\d+)_/)
console.log('iOS version:', iosVersion ? iosVersion[1] : 'Not iOS')
```

## 📱 Platform Differences

| Feature | Android | iOS | Desktop |
|---------|---------|-----|---------|
| Auto-update | ✅ Yes | ❌ No | ✅ Yes |
| Update prompt | ✅ Auto | ✅ Manual | ✅ Auto |
| Background update | ✅ Yes | ⚠️ Limited | ✅ Yes |
| Update timing | ~32s | ~32s | ~32s |

## 🎯 Key Files

```
public/sw.js                           # Service worker (update CACHE_VERSION here)
src/lib/pwaUtils.ts                    # PWA utilities
src/components/PWAUpdateNotification.tsx  # Update UI
src/hooks/usePWAUpdate.ts              # Update hook
public/manifest.json                    # PWA manifest
```

## ✅ Pre-Deploy Checklist

- [ ] Version number updated in `sw.js`
- [ ] Tested locally with update simulation
- [ ] No console errors
- [ ] All routes work
- [ ] Data persists through update
- [ ] Tested on staging environment

## 📞 Support

**Console Logs to Check:**
```
[SW] Installing service worker version: v2.1.0
[SW] Activating service worker version: v2.1.0
[PWA Update] New version detected
[PWA Update] Auto-updating on Android/Desktop
```

**Common Issues:**
1. Update not detected → Check network, force update
2. iOS not auto-updating → Expected, show button
3. Stale cache → Clear and hard refresh
4. Update loop → Check SW version number

## 🔗 Related Docs

- [Full Implementation Guide](./PWA_UPDATE_IMPLEMENTATION.md)
- [Testing Guide](./PWA_UPDATE_TESTING.md)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Remember:** Always increment `CACHE_VERSION` in `public/sw.js` before deploying! 🚀
