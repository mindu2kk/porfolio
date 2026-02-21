# 🚀 Deployment Guide

Complete guide for deploying the portfolio website to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Ready
- [ ] All features implemented
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All tests passed

### ✅ Environment Variables
- [ ] KV database credentials
- [ ] Resend API key
- [ ] Notification email
- [ ] Security keys generated

### ✅ Git Ready
- [ ] All changes committed
- [ ] Clean git status
- [ ] Pushed to GitHub

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended) ⭐

#### Why Vercel?
- ✅ Zero configuration
- ✅ Automatic deployments
- ✅ Built-in KV database
- ✅ Edge network (fast)
- ✅ Free tier available
- ✅ Perfect for Next.js

#### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select your repository

3. **Configure Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables:
   
   ```env
   # Vercel KV (from Vercel Storage)
   KV_REST_API_TOKEN=your_token
   KV_REST_API_URL=your_url
   KV_URL=your_redis_url
   REDIS_URL=your_redis_url
   KV_REST_API_READ_ONLY_TOKEN=your_readonly_token
   
   # Resend (from resend.com)
   RESEND_API_KEY=your_api_key
   NOTIFICATION_EMAIL=your_email@example.com
   
   # Security (generate new)
   ENCRYPTION_KEY=generate_random_64_char_hex
   IP_SALT=generate_random_64_char_hex
   NEXTAUTH_SECRET=generate_random_64_char_hex
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done! 🎉

#### Auto-Deploy
- Every push to `main` triggers deployment
- Preview deployments for PRs
- Rollback available

---

### Option 2: Manual Deployment

#### Requirements
- Node.js 18+
- npm or yarn
- Server with public IP

#### Steps:

1. **Build**
   ```bash
   npm run build
   ```

2. **Start**
   ```bash
   npm start
   ```

3. **PM2 (Production)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "portfolio" -- start
   pm2 save
   pm2 startup
   ```

---

## 🔧 Setup Services

### 1. Vercel KV Database

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Select "KV" (Redis)
6. Copy credentials to `.env.local`

**Free Tier:**
- 256 MB storage
- 10,000 commands/day
- Perfect for portfolio

### 2. Resend Email

1. Go to [resend.com](https://resend.com)
2. Sign up (free)
3. Go to "API Keys"
4. Create new API key
5. Copy to `.env.local`

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- Perfect for notifications

### 3. Generate Security Keys

```bash
# Generate random keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run 3 times for:
- ENCRYPTION_KEY
- IP_SALT
- NEXTAUTH_SECRET

---

## 🧪 Testing Deployment

### 1. Homepage Test
```bash
curl https://your-domain.vercel.app
# Should return 200 OK
```

### 2. Admin Dashboard Test
```bash
curl https://your-domain.vercel.app/admin/visitors
# Should return 200 OK
```

### 3. API Test
```bash
curl https://your-domain.vercel.app/api/visitor
# Should return JSON with visitor count
```

### 4. Health Check
```bash
curl https://your-domain.vercel.app/api/health
# Should return health status
```

---

## 📊 Post-Deployment Verification

### ✅ Functionality Checks

1. **Homepage**
   - [ ] Loads correctly
   - [ ] Theme toggle works
   - [ ] All sections visible
   - [ ] No console errors

2. **Visitor Tracking**
   - [ ] POST /api/visitor works
   - [ ] Counter increments
   - [ ] Email notification sent
   - [ ] Geolocation detected

3. **Admin Dashboard**
   - [ ] /admin/visitors loads
   - [ ] All 4 stat cards display
   - [ ] All 8 charts render
   - [ ] Map displays
   - [ ] Activity feed shows
   - [ ] Auto-refresh works

4. **Audit Logs**
   - [ ] /admin/audit loads
   - [ ] Logs display
   - [ ] Filters work
   - [ ] Search works

5. **System Health**
   - [ ] Health section displays
   - [ ] All checks pass
   - [ ] Metrics accurate

---

## 🔍 Monitoring

### Vercel Dashboard
- **Analytics:** View traffic stats
- **Logs:** Check function logs
- **Deployments:** See deployment history
- **Speed Insights:** Monitor performance

### Admin Dashboard
- **System Health:** Monitor in real-time
- **Error Rate:** Track errors
- **Rate Limits:** Check for abuse
- **Audit Logs:** Review all actions

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"
```bash
# Solution: Install dependencies
npm install
```

**Error:** "TypeScript errors"
```bash
# Solution: Check diagnostics
npm run build
# Fix errors shown
```

### Environment Variables Missing

**Error:** "KV_REST_API_TOKEN is not defined"
```bash
# Solution: Add to Vercel
# Settings → Environment Variables
# Add all required variables
# Redeploy
```

### Email Not Sending

**Check:**
1. RESEND_API_KEY is correct
2. NOTIFICATION_EMAIL is valid
3. Check Resend dashboard for errors
4. Verify API key permissions

### Geolocation Not Working

**Check:**
1. IP is public (not localhost)
2. APIs are responding
3. Check Vercel logs
4. Verify KV connection

### Rate Limiting Too Strict

**Solution:**
Edit `lib/ratelimit.ts`:
```typescript
// Change from 1 req/5s to 5 req/5s
Ratelimit.slidingWindow(5, '5 s')
```

---

## 🔄 Update Deployment

### Method 1: Git Push (Auto)
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel auto-deploys
```

### Method 2: Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Method 3: Manual Redeploy
- Go to Vercel Dashboard
- Deployments tab
- Click "Redeploy"

---

## 🔙 Rollback

### Vercel Dashboard
1. Go to Deployments
2. Find previous working deployment
3. Click "..." menu
4. Select "Promote to Production"

### Git Revert
```bash
git revert HEAD
git push origin main
```

---

## 📈 Performance Optimization

### Vercel Settings
- **Edge Network:** Enabled by default
- **Compression:** Automatic
- **Caching:** Configured in `next.config.ts`

### Recommendations
- Use Edge runtime for stats API
- Enable ISR for static pages
- Optimize images with Next.js Image
- Minimize bundle size

---

## 🔐 Security Checklist

- [ ] Environment variables not in code
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Audit logging working
- [ ] HTTPS enabled (Vercel default)
- [ ] Security headers configured
- [ ] No sensitive data in logs

---

## 📊 Monitoring Checklist

- [ ] Vercel Analytics enabled
- [ ] Error tracking active
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Email notifications working
- [ ] Admin dashboard accessible

---

## 🎯 Success Criteria

Deployment is successful when:
- ✅ Build completes without errors
- ✅ Homepage loads correctly
- ✅ Admin dashboard functional
- ✅ Visitor tracking works
- ✅ Email notifications sent
- ✅ All charts render
- ✅ Map displays
- ✅ No console errors
- ✅ Performance is good (< 3s load)
- ✅ Mobile responsive

---

## 📞 Support

### Issues?
1. Check Vercel logs
2. Check browser console
3. Review admin dashboard health
4. Check audit logs
5. Verify environment variables

### Resources
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Resend Docs](https://resend.com/docs)
- [Upstash Docs](https://docs.upstash.com)

---

**Last Updated:** February 20, 2026  
**Status:** Production Ready ✅  
**Deployment Time:** ~5 minutes
