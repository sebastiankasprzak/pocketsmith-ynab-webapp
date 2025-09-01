# Debugging Blank Page on iOS

## 🔍 Quick Debugging Steps

### 1. Test Simple Route First
Visit: `http://localhost:5173/ios-test`

This should show:
- Blue background if iOS is detected
- White background if not iOS
- Debug information about user agent

### 2. Check Browser Console
Open DevTools Console and look for:
- JavaScript errors
- Failed network requests
- React error boundaries

### 3. Test Different Routes

**Working Routes to Test:**
- `/ios-test` - Simple iOS detection test
- `/ios-demo` - Full iOS component demo
- `/` - Dashboard (should work on both iOS and non-iOS)

### 4. Verify iOS Detection

In browser console, run:
```javascript
console.log('iOS detected:', /iPad|iPhone|iPod/.test(navigator.userAgent));
console.log('User agent:', navigator.userAgent);
console.log('Is mobile:', window.innerWidth <= 768);
```

## 🛠️ Common Issues & Fixes

### Issue 1: CSS Layout Problems
**Symptoms:** Blank page, no content visible
**Check:** 
- Elements have proper height/width
- No `overflow: hidden` hiding content
- Flexbox layout working correctly

**Fix Applied:**
- Changed `height: 100vh` to `min-height: 100vh`
- Added `display: flex, flex-direction: column`
- Fixed iOS body positioning from `fixed` to `relative`

### Issue 2: Component Rendering Errors
**Symptoms:** White screen, console errors
**Check:**
- All imports are correct
- No missing dependencies
- Component props are valid

**Fix Applied:**
- Added try/catch in IOSLayout
- Simplified iOS detection logic
- Removed complex hook dependencies

### Issue 3: Theme/Material-UI Issues
**Symptoms:** Styling errors, theme not loading
**Check:**
- Theme provider is wrapping components
- No conflicting CSS
- Material-UI components importing correctly

## 🧪 Testing Checklist

### ✅ Desktop Testing (Chrome DevTools)
1. Open `http://localhost:5173/ios-test`
2. Open DevTools (F12)
3. Toggle device mode (📱 icon)
4. Select iPhone device
5. Set user agent to "Safari — iOS"
6. Refresh page
7. Should see blue background + iOS detection info

### ✅ Mobile Testing (Actual iOS Device)
1. Connect iPhone/iPad to same network
2. Find your computer's IP address
3. Visit `http://[YOUR-IP]:5173/ios-test`
4. Should see blue background immediately

### ✅ Safari Desktop Testing
1. Open Safari
2. Enable Developer menu (Preferences → Advanced)
3. Go to `http://localhost:5173/ios-test`
4. Develop → User Agent → Safari iOS
5. Should see blue background

## 🔧 Debug Commands

### Check if dev server is running:
```bash
cd pocketsmith-ynab-webapp
npm run dev
```

### Check for TypeScript errors:
```bash
npm run type-check
```

### Check for build errors:
```bash
npm run build
```

## 📱 Expected Behavior

### On iOS Devices (or iOS user agent):
- Blue background on `/ios-test`
- Bottom tab navigation on main app
- iOS-style header with blur effect
- Native iOS colors and fonts

### On Non-iOS Devices:
- Gray background on `/ios-test`
- Regular sidebar navigation
- Standard Material-UI theme

## 🚨 Emergency Fallback

If iOS layout is completely broken, you can temporarily disable it by changing this line in `App.tsx`:

```typescript
// Change this:
const shouldUseIOSLayout = isIOS && isMobile;

// To this (disables iOS layout):
const shouldUseIOSLayout = false;
```

This will make the app use the regular layout for all devices while you debug.

## 📞 Next Steps

1. **First**: Test `/ios-test` route to verify basic iOS detection
2. **Second**: Check browser console for any errors
3. **Third**: Test on actual iOS device if possible
4. **Fourth**: If still blank, try the emergency fallback above

The fixes I applied should resolve the blank page issue. The main problems were:
- CSS layout conflicts with `position: fixed`
- Component rendering logic that was too restrictive
- Missing fallback error handling