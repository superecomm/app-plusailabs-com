# PWA Performance Budgets

Performance targets for +AI Progressive Web App to ensure world-class user experience.

## Core Web Vitals

### LCP (Largest Contentful Paint)
**Target:** < 2.5 seconds

The largest content element (typically the chat interface or neural box) should render within 2.5s.

**Measurement:**
- Use Chrome DevTools Lighthouse
- Test on simulated "Mid-tier mobile" (4x CPU slowdown)
- Measure on cold cache (first visit)

**Key optimizations:**
- Preload critical fonts
- Optimize initial bundle size
- Server-side render initial chat interface
- Lazy load non-critical components

---

### CLS (Cumulative Layout Shift)
**Target:** < 0.1

No unexpected layout shifts during page load or interaction.

**Common causes to avoid:**
- Images without dimensions
- Dynamic content insertion above fold
- Web fonts causing FOIT/FOUT
- Ads or embeds without reserved space

**Key optimizations:**
- Set explicit width/height on all images
- Reserve space for dynamic content (loading skeletons)
- Use `font-display: swap` with fallback metrics
- Avoid injecting content above existing content

---

### TTI (Time to Interactive)
**Target:** < 3.5 seconds (mid-tier device)

User can interact with the app (type, click, scroll) within 3.5s.

**Measurement:**
- Lighthouse with "Mobile" preset
- 4x CPU slowdown, 4G throttling
- Main thread idle for 5 seconds

**Key optimizations:**
- Code split by route
- Defer non-critical JavaScript
- Use React concurrent features
- Minimize JavaScript execution time

---

### FCP (First Contentful Paint)
**Target:** < 1.8 seconds

First pixel renders within 1.8s (perceivable progress).

**Key optimizations:**
- Inline critical CSS
- Minimize render-blocking resources
- Use CDN for static assets
- Enable HTTP/2 server push (if applicable)

---

## PWA Specific

### PWA Score
**Target:** 100/100

Full Progressive Web App compliance.

**Required checklist:**
- ✅ Web app manifest with name, icons, theme
- ✅ Service worker registered
- ✅ HTTPS (required for service worker)
- ✅ Viewport meta tag
- ✅ Icons (192x192, 512x512)
- ✅ Offline fallback
- ✅ Fast load times (<3s on 3G)
- ✅ Redirects HTTP to HTTPS

**Nice-to-have:**
- App shortcuts in manifest
- Share target API
- Background sync
- Push notifications

---

### Install Prompt
**Target:** Appears on 2nd+ visit (Chrome/Edge)

**Criteria for installability:**
- Served over HTTPS
- Includes web app manifest with:
  - `short_name` or `name`
  - `icons` (192px and 512px)
  - `start_url`
  - `display: standalone` or `fullscreen`
- Registered service worker
- User has engaged with site (visited 2+ times within 5 minutes)

---

## Resource Budgets

### JavaScript
**Target:** < 300KB (gzipped)

- Initial bundle: < 150KB
- Per-route chunks: < 50KB each
- Vendor chunks: < 100KB total

**Measurement:**
```bash
# Build and analyze
npm run build
# Check .next/static/chunks sizes
```

**Key optimizations:**
- Remove unused dependencies
- Use dynamic imports for routes
- Tree-shake libraries
- Use lighter alternatives (e.g., date-fns over moment)

---

### Images
**Target:** < 500KB total above-fold

- Hero/logo images: < 50KB each
- Profile avatars: < 20KB each
- Use WebP format with JPEG fallback
- Lazy load below-fold images

**Tools:**
- Next/Image (automatic optimization)
- Manual: `imagemin`, `sharp`

---

### Fonts
**Target:** < 100KB total

- Subset fonts to needed glyphs
- Use variable fonts where possible
- Preload critical fonts
- Use system fonts as fallback

**Example:**
```html
<link rel="preload" href="/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
```

---

## Network Budgets

### API Response Time
**Target:** < 500ms (p95)

- Chat message submission: < 300ms
- LLM first token: < 1.5s
- Vault fetch: < 200ms
- Auth check: < 100ms

**Monitoring:**
- Use Firebase Performance Monitoring
- Track with custom events in /dev/pwa

---

### Offline Support
**Target:** 100% of shell, 80% of features

**Must work offline:**
- View cached conversations
- Read vault items (if previously loaded)
- See profile
- Browse UI

**Graceful degradation offline:**
- Queue new messages (send when online)
- Show "offline" banner
- Disable model selection (keep last used)

---

## Testing Instructions

### Manual Lighthouse Test

1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select:
   - Categories: Performance, PWA, Best Practices, Accessibility
   - Device: Mobile
   - Throttling: Simulated throttling
4. Click "Analyze page load"
5. Review scores and recommendations

**Target scores:**
- Performance: 90+
- PWA: 100
- Best Practices: 95+
- Accessibility: 95+

---

### Field Testing

Test on real devices:

**Low-end device:**
- Moto G4 or equivalent
- Android 7+
- 3G connection

**Mid-tier device:**
- iPhone XR or equivalent
- iOS 14+
- 4G connection

**High-end device:**
- Latest flagship
- 5G connection

**Metrics to track:**
- Time to first interaction
- Chat message round-trip time
- Scroll smoothness (60fps)
- Install flow completion rate

---

### Automated Testing (Future)

When team size justifies it, add CI checks:

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - run: npm install -g @lhci/cli
      - run: lhci autorun --config=lighthouserc.json
```

**lighthouserc.json:**
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run start",
      "url": ["http://localhost:3000/"]
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "interactive": ["error", {"maxNumericValue": 3500}]
      }
    }
  }
}
```

---

## Performance Monitoring

### Current Tools

1. **/dev/pwa** - Real-time diagnostics
   - Install mode
   - SW status
   - Storage usage
   - Network state

2. **Chrome DevTools** - Development
   - Performance profiler
   - Network waterfall
   - Coverage analysis

3. **Lighthouse** - Auditing
   - Run manually
   - Check before each release

### Future Tools (Optional)

- Firebase Performance Monitoring
- Web Vitals library (`web-vitals` npm package)
- Real User Monitoring (RUM)
- Sentry performance tracking

---

## Regression Prevention

### Manual Checks (Current)

Before each deployment:
1. Run Lighthouse on staging
2. Verify all scores meet targets
3. Test install flow on Chrome/iOS
4. Check offline functionality
5. Review bundle sizes

### PR Review Checklist

- [ ] No new large dependencies (>50KB)
- [ ] Images are optimized (WebP + compression)
- [ ] No render-blocking resources added
- [ ] No layout shifts introduced
- [ ] Tested on mobile device
- [ ] Service worker still registers

---

## Success Metrics

After optimizations, users should experience:

- **Fast:** App feels instant (<1s perceived load)
- **Smooth:** 60fps scrolling, no jank
- **Reliable:** Works offline, handles poor networks
- **Installable:** Clear path to install, native-like
- **Engaging:** Fast enough to use daily

Target user feedback: "Feels as fast as a native app"

---

## Last Updated

December 14, 2025

**Next review:** After Phase 2 implementation (offline resilience)

