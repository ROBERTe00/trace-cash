# PWA Auto-Update Testing Guide

## Overview
The Trace Cash PWA now automatically updates to the latest version when changes are deployed, with platform-specific behaviors for Android and iOS.

## How It Works

### Service Worker Strategy
- **Network-first** for HTML, JS, CSS (ensures latest app code)
- **Cache-first** for images, fonts (static assets)
- **Network-first** for API calls (fresh data)
- Automatic update checks every 30 seconds when app is active
- Update checks on page visibility change
- `skipWaiting()` and `clients.claim()` for immediate activation

### Platform-Specific Behavior

#### Android (Chrome/Edge)
- **Auto-updates in background** after 2-second delay
- Shows subtle notification: "Updating app..."
- Automatically reloads to new version
- No user action required

#### iOS Safari (Standalone)
- Shows update banner: "New version available"
- Requires user tap to update (iOS PWA limitation)
- Banner includes "Update Now" button
- Can be dismissed (with reminder about home screen installation)

#### Desktop Browsers
- Auto-updates similar to Android
- Seamless background update
- Page reloads automatically

## Testing Instructions

### Prerequisites
1. Deploy a change to production
2. Have the PWA installed on test devices

### Android Testing

1. **Install PWA**
   ```
   - Open Chrome/Edge browser
   - Go to app URL
   - Tap "Add to Home Screen" or use install prompt
   ```

2. **Test Auto-Update**
   ```
   - Deploy new version
   - Open installed PWA from home screen
   - Wait ~2 seconds
   - App should show "Updating..." notification
   - App automatically reloads with new version
   ```

3. **Verify Update**
   ```
   - Check version number in Settings
   - Verify new features are present
   - Confirm no data loss
   - Test core functionality
   ```

### iOS Testing

1. **Install PWA**
   ```
   - Open Safari
   - Go to app URL
   - Tap Share button
   - Tap "Add to Home Screen"
   - Open from home screen
   ```

2. **Test Update Detection**
   ```
   - Deploy new version
   - Open installed PWA
   - App should show update banner
   - Tap "Update Now" button
   - App reloads with new version
   ```

3. **Test Background Updates**
   ```
   - Leave PWA open in background
   - Deploy new version
   - Return to PWA (change visibility)
   - Update banner should appear
   ```

4. **Verify iOS Limitations**
   ```
   - Update requires user action
   - Can't force automatic reload (iOS security)
   - Banner is user-friendly and non-intrusive
   ```

### Desktop Testing

1. **Install PWA**
   ```
   - Chrome: Click install icon in address bar
   - Edge: Click App Available icon
   - Open as standalone window
   ```

2. **Test Auto-Update**
   ```
   - Deploy new version
   - Open installed PWA
   - App auto-updates in background
   - Page reloads automatically
   ```

## Verification Checklist

### After Each Update
- [ ] No console errors
- [ ] All routes work correctly
- [ ] Data persists (localStorage, IndexedDB)
- [ ] Session remains active
- [ ] Investments data intact
- [ ] Dashboard loads correctly
- [ ] AI insights functional
- [ ] Bank statement analyzer works
- [ ] Multilingual support maintained

### Service Worker Verification
- [ ] New SW version activated
- [ ] Old caches cleared
- [ ] New caches populated
- [ ] Network requests working
- [ ] Offline mode functional

## Troubleshooting

### Update Not Detected
1. Check service worker registration
2. Force update check: `navigator.serviceWorker.ready.then(reg => reg.update())`
3. Verify cache version in sw.js
4. Check browser console for SW logs

### iOS Update Issues
1. Ensure app is in standalone mode
2. Check `display-mode: standalone` media query
3. Verify visibility change events
4. Test with Safari Technology Preview

### Stale Content
1. Clear browser cache
2. Unregister service worker: `navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()))`
3. Reinstall PWA
4. Check network tab for cache hits

### Update Loop
1. Check SW version number
2. Verify skipWaiting logic
3. Check for SW registration errors
4. Review controllerchange event

## Monitoring

### Key Metrics
- Time to update detection (should be < 30s)
- Update success rate
- User update completion rate (iOS)
- Cache hit rates
- Offline functionality

### Console Logs
```javascript
// Service Worker logs
'[SW] Installing service worker version: v2.1.0'
'[SW] Activating service worker version: v2.1.0'
'[SW] Claiming clients to take control immediately'

// PWA Update logs
'[PWA Update] New version detected'
'[PWA Update] Auto-updating on Android/Desktop'
'[PWA Update] Applying update...'
'[PWA Update] Controller changed, reloading page'
```

## Best Practices

1. **Version Control**
   - Update CACHE_VERSION in sw.js for each deployment
   - Use semantic versioning (v2.1.0)

2. **Testing Cadence**
   - Test on real devices, not just simulators
   - Test both WiFi and cellular connections
   - Test with poor network conditions

3. **User Experience**
   - Don't interrupt critical user flows
   - Save form data before update
   - Show clear update messages
   - Minimize disruption

4. **Rollback Plan**
   - Keep previous SW version
   - Test rollback procedures
   - Monitor error rates after updates

## Technical Details

### Cache Strategy
```javascript
// Network-first for core files
- HTML, JS, CSS
- Always fetch from network
- Fall back to cache if offline

// Cache-first for assets
- Images, fonts, icons
- Serve from cache immediately
- Update cache in background
```

### Update Flow
```
1. User opens app
2. SW checks for updates (every 30s)
3. New SW downloads and installs
4. New SW enters 'installed' state
5. Update notification appears
6. User clicks update (iOS) or auto-update (Android)
7. skipWaiting() called
8. New SW activates
9. clients.claim() takes control
10. Page reloads
11. New version active
```

## Known Limitations

### iOS
- Cannot force automatic reload without user action
- Must show update prompt
- Update banner can be dismissed
- Background updates require visibility change

### Android
- Rare race conditions with very fast updates
- May need refresh if app suspended during update

### All Platforms
- Network required for update detection
- Large updates may take time to download
- Can't update while offline

## Support

For issues or questions:
1. Check browser console logs
2. Review service worker status in DevTools
3. Test in incognito/private mode
4. Verify network connectivity
5. Contact development team

## Change Log

### v2.1.0 (Current)
- Implemented automatic PWA updates
- Added platform-specific update strategies
- Created update notification component
- Enhanced service worker with network-first for core files
- Added periodic update checks (30s interval)
- Implemented visibility change detection
- Added iOS-specific update handling
- Improved cache management
