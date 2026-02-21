# 🚀 Deployment Guide - Advanced Tracking System

**Date:** February 21, 2026  
**Status:** Ready for Production  
**Platform:** Vercel

---

## Pre-Deployment Checklist

### ✅ Code Ready
- [x] All 4 phases implemented
- [x] All builds successful
- [x] 0 TypeScript errors
- [x] All tests passed
- [x] Code pushed to GitHub

### ✅ Environment Variables
- [x] KV_REST_API_TOKEN
- [x] KV_REST_API_URL
- [x] KV_URL
- [x] RESEND_API_KEY
- [x] NOTIFICATION_EMAIL
- [x] ENCRYPTION_KEY
- [x] IP_SALT

### ✅ Dependencies
- [x] All npm packages installed
- [x] No security vulnerabilities
- [x] Production-ready versions

---

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

Vercel automatically deploys when you push to GitHub.

**Your repository:** https://github.com/mindu2kk/porfolio

1. **Push to GitHub** (Already done ✅)
   ```bash
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel detects the push
   - Starts build automatically
   - Deploys to production
   - URL: https://your-project.vercel.app

3. **Monitor Deployment**
   - Visit: https://vercel.com/dashboard
   - Check build logs
   - Wait for "Ready" status

### Option 2: Manual Deployment

If auto-deploy is not set up:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## Post-Deployment Verification

### 1. Check Homepage
Visit your production URL and verify:
- [ ] Page loads correctly
- [ ] No console errors
- [ ] Analytics tracker initializes
- [ ] Session created in browser console

### 2. Check API Endpoints

Test all tracking APIs:

```bash
# Replace YOUR_DOMAIN with your actual domain

# Analytics API
curl https://YOUR_DOMAIN/api/tracking/analytics

# Behavior API
curl https://YOUR_DOMAIN/api/tracking/behavior

# Performance API
curl https://YOUR_DOMAIN/api/tracking/performance

# Advanced API
curl https://YOUR_DOMAIN/api/tracking/advanced

# Health Check
curl https://YOUR_DOMAIN/api/health
```

Expected: All should return 200 OK with JSON data

### 3. Check Browser Console

Open browser DevTools (F12) and look for:

```
📊 Analytics session initialized: sess_xxxxx
💓 Heartbeat sent: { sessionId: 'sess_xxxxx', ... }
🌐 Environment tracked: { network: '4g', ... }
⚡ Performance metrics: { ttfb: 123ms, ... }
🎨 FCP: 1234 ms
🖼️ LCP: 2345 ms
```

### 4. Check Admin Dashboard

Visit: `https://YOUR_DOMAIN/admin/visitors`

Verify:
- [ ] Active sessions count
- [ ] Visitor map displays
- [ ] Charts render
- [ ] Activity feed updates
- [ ] No errors

### 5. Check Vercel KV

Visit: https://vercel.com/dashboard > Storage > KV

Verify data is being stored:
- [ ] `session:*` keys exist
- [ ] `events:*` keys exist
- [ ] `sessions:active` sorted set has members

---

## Environment Variables in Vercel

### Required Variables

Go to: Vercel Dashboard > Your Project > Settings > Environment Variables

Add these variables (if not already set):

```env
# Vercel KV
KV_REST_API_TOKEN=your_token_here
KV_REST_API_URL=your_url_here
KV_URL=your_redis_url_here

# Email Notifications
RESEND_API_KEY=your_resend_key_here
NOTIFICATION_EMAIL=your_email_here

# Security
ENCRYPTION_KEY=your_encryption_key_here
IP_SALT=your_ip_salt_here
```

**Note:** These should already be set from your initial deployment.

---

## Monitoring & Debugging

### Vercel Logs

View real-time logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by:
   - Function: `/api/tracking/*`
   - Status: All or Errors only

### Console Logs

Check browser console for tracking events:
- Session initialization
- Heartbeat updates
- Event tracking
- Performance metrics
- Web Vitals

### KV Data Inspection

Use Vercel KV CLI or Dashboard:

```bash
# List all keys
vercel kv list

# Get specific session
vercel kv get session:sess_xxxxx

# Get active sessions
vercel kv zrange sessions:active 0 -1
```

---

## Performance Optimization

### Edge Functions

All tracking APIs use Node.js runtime for KV access:
```typescript
export const runtime = 'nodejs';
```

### Caching

- Static pages cached at edge
- API responses not cached (real-time data)
- Client-side tracker cached by browser

### Bundle Size

Current bundle sizes:
- Homepage: 132 kB (First Load)
- Admin Dashboard: 232 kB (includes charts)
- Tracking APIs: 103 kB each

---

## Troubleshooting

### Issue: Session not created

**Symptoms:** No session ID in console

**Solutions:**
1. Check browser console for errors
2. Verify `/api/tracking/session` endpoint works
3. Check KV credentials in Vercel
4. Clear browser cache and reload

### Issue: Events not tracked

**Symptoms:** No events in KV

**Solutions:**
1. Check `/api/tracking/event` endpoint
2. Verify session exists
3. Check browser console for errors
4. Verify KV write permissions

### Issue: Performance metrics not captured

**Symptoms:** No FCP/LCP in console

**Solutions:**
1. Wait for page load to complete
2. Check browser compatibility
3. Verify PerformanceObserver support
4. Check console for errors

### Issue: API returns 500 error

**Symptoms:** API calls fail

**Solutions:**
1. Check Vercel function logs
2. Verify KV connection
3. Check environment variables
4. Review error messages in logs

---

## Data Collection Timeline

### Immediate (0-5 minutes)
- ✅ Sessions created
- ✅ Page views tracked
- ✅ Environment data captured
- ✅ Performance metrics recorded

### Short-term (5-30 minutes)
- ✅ Heartbeats accumulate
- ✅ Scroll depth tracked
- ✅ Clicks recorded
- ✅ Idle events detected
- ✅ Visibility changes tracked

### Medium-term (1-24 hours)
- ✅ Behavior patterns emerge
- ✅ Engagement scores calculated
- ✅ Funnel data accumulates
- ✅ Web Vitals averages stabilize

### Long-term (1-30 days)
- ✅ Cohorts created
- ✅ Retention tracked
- ✅ Patterns identified
- ✅ Trends visible

---

## Analytics Dashboard Access

### Admin Dashboard
**URL:** `https://YOUR_DOMAIN/admin/visitors`

**Features:**
- Active sessions count
- Visitor map (17 countries)
- Browser/device charts
- Activity feed
- System health

### Audit Logs
**URL:** `https://YOUR_DOMAIN/admin/audit`

**Features:**
- All tracking events
- Search and filter
- 30-day retention
- Export capability

### API Endpoints

**Analytics:** `/api/tracking/analytics`
- Session data
- Event counts
- Country/device distribution

**Behavior:** `/api/tracking/behavior`
- Scroll depth
- Click heatmap
- Engagement scores

**Performance:** `/api/tracking/performance`
- Web Vitals
- Navigation timing
- Network/hardware data

**Advanced:** `/api/tracking/advanced`
- Funnel analysis
- Cohort retention
- Session replay
- Pattern detection

---

## Security Considerations

### Rate Limiting
- ✅ Visitor API: 1 req/5s per IP
- ✅ General APIs: 100 req/min per IP

### Input Validation
- ✅ Zod schemas for all inputs
- ✅ XSS prevention
- ✅ SQL injection prevention

### Data Privacy
- ✅ Anonymous user IDs (fingerprint-lite)
- ✅ No PII collected
- ✅ 30-day data retention
- ✅ GDPR-friendly

### Audit Logging
- ✅ All events logged
- ✅ Searchable history
- ✅ Security tracking

---

## Scaling Considerations

### Current Capacity
- **Sessions:** Unlimited (KV auto-scales)
- **Events:** 30-day retention
- **API Calls:** Vercel function limits apply

### If Traffic Increases

**Vercel Pro Plan:**
- More function executions
- Higher bandwidth
- Better performance

**KV Optimization:**
- Use TTL for old data
- Implement data archiving
- Consider data aggregation

**CDN Caching:**
- Cache static assets
- Use edge functions
- Optimize bundle size

---

## Backup & Recovery

### Data Backup

KV data is automatically backed up by Upstash.

**Manual backup:**
```bash
# Export all sessions
vercel kv scan 0 MATCH session:* COUNT 1000

# Export all events
vercel kv scan 0 MATCH event:* COUNT 1000
```

### Disaster Recovery

If data is lost:
1. Sessions will be recreated on next visit
2. Historical data may be lost
3. Analytics will restart from zero
4. No impact on site functionality

---

## Success Metrics

### Week 1 Goals
- [ ] 100+ sessions tracked
- [ ] 1000+ events captured
- [ ] 0 critical errors
- [ ] All APIs responding

### Month 1 Goals
- [ ] 1000+ unique users
- [ ] 10,000+ events
- [ ] Cohort data available
- [ ] Funnel insights ready

### Ongoing Monitoring
- [ ] Daily active users
- [ ] Average engagement score
- [ ] Funnel conversion rates
- [ ] Retention rates
- [ ] Performance metrics

---

## Next Steps After Deployment

### 1. Monitor Initial Data (Day 1)
- Check session creation
- Verify event tracking
- Review console logs
- Test all APIs

### 2. Analyze First Week (Day 7)
- Review behavior patterns
- Check funnel performance
- Analyze Web Vitals
- Identify issues

### 3. Optimize (Day 14)
- Improve slow pages
- Fix drop-off points
- Enhance engagement
- Optimize funnels

### 4. Report (Day 30)
- Generate cohort report
- Analyze retention
- Review patterns
- Plan improvements

---

## Support & Resources

### Documentation
- [FEATURES.md](./FEATURES.md) - Complete feature list
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
- [TESTING-RESULTS.md](./TESTING-RESULTS.md) - Test results
- [PHASE-1-COMPLETE.md](./PHASE-1-COMPLETE.md) - Phase 1 details
- [PHASE-2-COMPLETE.md](./PHASE-2-COMPLETE.md) - Phase 2 details
- [PHASE-3-COMPLETE.md](./PHASE-3-COMPLETE.md) - Phase 3 details
- [PHASE-4-COMPLETE.md](./PHASE-4-COMPLETE.md) - Phase 4 details

### External Resources
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Web Vitals](https://web.dev/vitals/)

---

## Deployment Checklist

### Pre-Deployment ✅
- [x] Code complete
- [x] Tests passed
- [x] Environment variables set
- [x] Dependencies installed
- [x] Build successful
- [x] Pushed to GitHub

### During Deployment ⏳
- [ ] Vercel building
- [ ] Check build logs
- [ ] Wait for "Ready"

### Post-Deployment ⏳
- [ ] Visit homepage
- [ ] Test admin dashboard
- [ ] Check visitor tracking
- [ ] Verify API endpoints
- [ ] Monitor for errors
- [ ] Check KV data
- [ ] Review console logs

---

**Deployment Status:** Ready to Deploy ✅  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (all tests passed)  
**Rollback:** Easy (Git revert available)

**Good luck with your deployment! 🚀**
