# Capacitor Features Available for +AI

## Status: Capacitor Installed ✅

**Branch:** `pwa-capacitor`  
**App Name:** Plus AI Labs  
**Bundle ID:** com.plusailabs.app

---

## 📦 Installed Plugins

All major Capacitor plugins are now installed and ready to use!

---

## 🎥 Camera

**Package:** `@capacitor/camera`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Capture photos from device camera
- Choose images from photo library
- Save photos to device
- Configure camera settings (quality, format, etc.)

### Use Cases for +AI
1. **Avatar Upload** - Take photo for profile (already using web upload)
2. **Image Analysis** - Capture image → send to vision model
3. **Document Scanning** - Photo → OCR → vault storage
4. **Visual Context** - Attach images to chat messages

### Implementation Example
```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
  
  // image.webPath contains the image
  return image;
};
```

### Priority: **HIGH** (Profile photo + vision features)

---

## 📁 File System

**Package:** `@capacitor/filesystem`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Read/write files to device storage
- Create directories
- Download files
- Access native file system

### Use Cases for +AI
1. **Vault Storage** - Save vault items locally
2. **Export Conversations** - Download chat history as files
3. **Offline Access** - Cache vault content locally
4. **Document Management** - Save/load user documents

### Implementation Example
```typescript
import { Filesystem, Directory } from '@capacitor/filesystem';

const saveFile = async (content: string, filename: string) => {
  await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Documents,
    encoding: Encoding.UTF8
  });
};
```

### Priority: **MEDIUM** (Vault offline sync)

---

## 📍 Geolocation

**Package:** `@capacitor/geolocation`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Get current device location
- Track location changes
- Latitude/longitude coordinates
- Location accuracy/altitude

### Use Cases for +AI
1. **Context-Aware Responses** - "Find restaurants near me"
2. **Location-Based Notes** - Tag vault items with location
3. **Travel Assistant** - Location-specific recommendations
4. **Security** - Verify login location

### Implementation Example
```typescript
import { Geolocation } from '@capacitor/geolocation';

const getCurrentPosition = async () => {
  const coordinates = await Geolocation.getCurrentPosition();
  return {
    lat: coordinates.coords.latitude,
    lng: coordinates.coords.longitude
  };
};
```

### Priority: **LOW** (Nice-to-have feature)

---

## 📳 Accelerometer (Motion)

**Package:** `@capacitor/motion`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Access device accelerometer
- Detect device orientation
- Measure motion/vibration
- Track device movement

### Use Cases for +AI
1. **Shake to Clear** - Shake phone to clear chat
2. **Tilt Gestures** - Navigate conversations
3. **Motion Controls** - Alternative input method
4. **Activity Detection** - Context-aware features

### Implementation Example
```typescript
import { Motion } from '@capacitor/motion';

await Motion.addListener('accel', (event) => {
  console.log('Device motion', event);
  if (event.acceleration.x > 2) {
    // Shake detected!
  }
});
```

### Priority: **LOW** (Experimental feature)

---

## 🔔 Push Notifications

**Package:** `@capacitor/push-notifications`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Receive push notifications from server
- Schedule local notifications
- Handle notification taps
- Badge count management

### Use Cases for +AI
1. **Response Ready** - Notify when LLM completes
2. **Usage Alerts** - "Approaching token limit"
3. **Conversation Reminders** - Follow-up prompts
4. **Feature Announcements** - New model available

### Implementation Example
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Register for push
await PushNotifications.requestPermissions();
await PushNotifications.register();

// Listen for notifications
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push received:', notification);
});

// Local notification
await PushNotifications.schedule({
  notifications: [{
    title: "Response Ready",
    body: "Your AI response is complete",
    id: 1,
    schedule: { at: new Date(Date.now() + 1000) }
  }]
});
```

### Priority: **MEDIUM** (Engagement feature)

---

## 🌐 Network

**Package:** `@capacitor/network`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Monitor network connectivity
- Detect wifi/cellular/offline
- Connection type and speed
- Network status changes

### Use Cases for +AI
1. **Offline Mode** - Queue messages when offline
2. **Quality Adjustment** - Lower quality on slow connection
3. **Connection Warnings** - "Limited connectivity" banner
4. **Smart Sync** - Sync vault when wifi available

### Implementation Example
```typescript
import { Network } from '@capacitor/network';

const status = await Network.getStatus();
console.log('Network status:', status);
// { connected: true, connectionType: 'wifi' }

Network.addListener('networkStatusChange', (status) => {
  if (!status.connected) {
    // Handle offline mode
  }
});
```

### Priority: **HIGH** (Critical for reliability)

---

## 📳 Haptics

**Package:** `@capacitor/haptics`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Trigger haptic feedback
- Different vibration patterns
- Touch feedback for interactions
- Notification vibrations

### Use Cases for +AI
1. **Button Feedback** - Haptic on send button
2. **Success Vibration** - Gentle buzz on completion
3. **Error Alert** - Different pattern for errors
4. **Voice Gestures** - Feedback for voice recording

### Implementation Example
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light tap
await Haptics.impact({ style: ImpactStyle.Light });

// Medium impact
await Haptics.impact({ style: ImpactStyle.Medium });

// Heavy impact
await Haptics.impact({ style: ImpactStyle.Heavy });

// Notification
await Haptics.notification({ type: NotificationType.Success });
```

### Priority: **MEDIUM** (UX polish)

---

## 📱 App (Lifecycle)

**Package:** `@capacitor/app`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- App state changes (background/foreground)
- Deep linking (open specific screens)
- App info (version, build number)
- Handle app URLs

### Use Cases for +AI
1. **Background Sync** - Sync vault when app backgrounded
2. **Deep Links** - Share conversation URLs
3. **Version Check** - Force update on old versions
4. **State Management** - Pause streaming when backgrounded

### Implementation Example
```typescript
import { App } from '@capacitor/app';

App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    console.log('App is in foreground');
  } else {
    console.log('App is in background');
  }
});

App.addListener('appUrlOpen', (data) => {
  console.log('App opened with URL:', data.url);
  // Handle deep link
});
```

### Priority: **HIGH** (Core functionality)

---

## ⌨️ Keyboard

**Package:** `@capacitor/keyboard`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Keyboard show/hide events
- Keyboard height
- Accessory bar control
- Scroll behavior

### Use Cases for +AI
1. **Input Adjustment** - Adjust chat UI when keyboard appears
2. **Auto-Scroll** - Keep input visible
3. **Keyboard Toolbar** - Add custom buttons above keyboard
4. **Better Mobile UX** - Smooth keyboard interactions

### Implementation Example
```typescript
import { Keyboard } from '@capacitor/keyboard';

Keyboard.addListener('keyboardWillShow', (info) => {
  console.log('Keyboard height:', info.keyboardHeight);
  // Adjust UI
});

Keyboard.addListener('keyboardWillHide', () => {
  // Reset UI
});

// Hide keyboard programmatically
await Keyboard.hide();
```

### Priority: **HIGH** (Mobile chat UX)

---

## 📊 Status Bar

**Package:** `@capacitor/status-bar`  
**Status:** ✅ Installed, ❌ Not Yet Integrated

### What It Does
- Control status bar appearance
- Set background color
- Show/hide status bar
- Light/dark content

### Use Cases for +AI
1. **Theme Matching** - Status bar matches dark mode
2. **Immersive Mode** - Hide when needed
3. **Brand Colors** - Black status bar for +AI
4. **Polish** - Professional app appearance

### Implementation Example
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Set black background
await StatusBar.setBackgroundColor({ color: '#000000' });

// Light content (white text)
await StatusBar.setStyle({ style: Style.Dark });
```

### Priority: **HIGH** (Visual polish)

---

## 📋 Feature Implementation Priority

### Tier 1: Essential (Implement First)
1. **Status Bar** - Visual polish, easy win
2. **App Lifecycle** - Core functionality
3. **Keyboard** - Better mobile UX
4. **Network** - Reliability

### Tier 2: High Value
5. **Camera** - Profile photos, vision features
6. **Push Notifications** - User engagement
7. **Haptics** - UX feedback

### Tier 3: Nice-to-Have
8. **File System** - Offline vault
9. **Geolocation** - Context features
10. **Accelerometer** - Experimental gestures

---

## 🚀 Quick Win Features (1-2 hours each)

### 1. Status Bar (20 minutes)
```typescript
// In app/layout.tsx or ChatInterface
import { StatusBar } from '@capacitor/status-bar';

useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#000000' : '#FFFFFF' });
    StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
  }
}, [theme]);
```

### 2. Haptics on Send (15 minutes)
```typescript
// In NeuralBox handleTextSubmit
import { Haptics, ImpactStyle } from '@capacitor/haptics';

await Haptics.impact({ style: ImpactStyle.Light });
```

### 3. Network Status (30 minutes)
```typescript
// In ChatContext
import { Network } from '@capacitor/network';

const [isOnline, setIsOnline] = useState(true);

Network.addListener('networkStatusChange', (status) => {
  setIsOnline(status.connected);
  if (!status.connected) {
    showNotification('warning', 'You are offline. Messages will send when reconnected.');
  }
});
```

### 4. Camera for Profile (1 hour)
```typescript
// In ProfileView
import { Camera } from '@capacitor/camera';

const takePicture = async () => {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt // Camera or Photos
  });
  
  // Upload photo.webPath to Firebase Storage
};
```

---

## 🏗️ Next Steps

### Phase 1: Initialize Platforms (Now)
```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android

# Build web app
npm run build

# Sync to native platforms
npx cap sync
```

### Phase 2: Implement Quick Wins (1-2 hours)
1. Status bar theming
2. Haptics on interactions
3. Network monitoring
4. Keyboard handling

### Phase 3: Major Features (4-6 hours)
5. Camera integration
6. Push notifications setup
7. File system for vault

### Phase 4: Test & Deploy (2-3 hours)
8. Test on iOS simulator
9. Test on Android emulator
10. Submit to app stores

---

## 📱 Platform Differences

### What Works Everywhere
- All core chat features
- Vault autocomplete
- State machine
- Dark mode
- Profile settings

### iOS-Specific
- ✅ Haptics (excellent support)
- ✅ Camera (full access)
- ⚠️ Push notifications (requires APNs setup)
- ⚠️ File system (sandboxed)

### Android-Specific
- ✅ Haptics (good support)
- ✅ Camera (full access)
- ✅ Push notifications (FCM)
- ✅ File system (more flexible)

### Web PWA
- ⚠️ Camera (basic getUserMedia)
- ❌ Haptics (not supported)
- ⚠️ Notifications (limited)
- ⚠️ File system (limited)

---

## 🎯 Recommended Implementation Order

### Week 1: Core Native Features
- [ ] Status bar theming
- [ ] App lifecycle handling
- [ ] Keyboard adjustments
- [ ] Haptic feedback

### Week 2: Camera & Media
- [ ] Camera for profile photos
- [ ] Camera for image analysis
- [ ] File picker integration
- [ ] Media gallery access

### Week 3: Engagement
- [ ] Push notification setup
- [ ] Network monitoring
- [ ] Offline queue
- [ ] Background sync

### Week 4: Polish
- [ ] Geolocation features
- [ ] Advanced haptics
- [ ] Custom gestures
- [ ] File system vault cache

---

## 💡 Quick Wins You Can Implement Today

### 1. Haptic Feedback (15 min)
Add to send button, model selection, menu actions

### 2. Status Bar (20 min)
Match theme colors, looks professional immediately

### 3. Network Banner (30 min)
Show "Offline" message, queue messages

### 4. Camera Profile Photo (1 hour)
Replace web upload with native camera

---

## 🔧 Current Capabilities

### ✅ What You Already Have (Web)
- Text chat with LLM
- Vault knowledge base
- Theme switching
- Profile management
- Conversation history
- PWA install
- Service worker

### 🚀 What Capacitor Adds (Native)
- Camera access
- File system
- Push notifications
- Haptic feedback
- Better offline support
- App store presence
- Native performance
- Platform-specific features

---

## 📈 ROI Analysis

### Easiest Wins (High Impact, Low Effort)
1. **Status Bar** - 20 min, huge polish improvement
2. **Haptics** - 15 min, better feel
3. **Network Status** - 30 min, reliability

### Medium Effort (High Impact)
4. **Camera** - 1-2 hours, enables new features
5. **Keyboard Handling** - 1 hour, better mobile UX
6. **App Lifecycle** - 1 hour, proper state management

### Larger Projects (High Value)
7. **Push Notifications** - 4-6 hours, user retention
8. **File System Vault** - 3-4 hours, offline access
9. **Geolocation** - 2-3 hours, contextual features

---

## 🎊 You're Ready!

**Capacitor is installed and configured!**

All plugins are ready to use. You can now:
1. Add iOS/Android platforms
2. Implement native features
3. Test in simulators
4. Deploy to app stores

Would you like to:
- **A)** Implement quick wins (status bar + haptics) now?
- **B)** Add iOS/Android platforms and test?
- **C)** Plan specific feature implementations?

---

*Capacitor setup complete - December 13, 2025*  
*Ready for native app development!* 📱

