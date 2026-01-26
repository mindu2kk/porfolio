# 🔍 EMAIL DEBUGGING GUIDE

## Changes Made (Latest Update)

### 1. Fixed Email Function Call
- **BEFORE**: Dynamic import inside POST handler (causing duplicate import)
- **AFTER**: Direct call to imported function at top of file
- **WHY**: The dynamic import was creating a new module context, potentially causing issues

### 2. Enhanced Logging
Added detailed logging at every step:
- `[EMAIL]` prefix for all email-related logs
- Configuration checks (API key, email address)
- Resend API call status
- Detailed error information

### 3. Fixed TypeScript Errors
- Added `GeoNextRequest` interface to properly type `request.geo`
- Removed unused import warning

## How to Debug

### Step 1: Check Vercel Logs
After deploying, visit your site and check logs at:
https://vercel.com/your-project/logs

Look for these log patterns:

#### ✅ GOOD - Email Working:
```
🎯 New Visitor (FULL DATA): {...}
📧 Triggering email notification...
📧 RESEND_API_KEY exists: true
📧 NOTIFICATION_EMAIL: your@email.com
📧 [EMAIL] sendVisitorNotification called
📧 [EMAIL] Checking configuration...
📧 [EMAIL] resend object exists: true
📧 [EMAIL] Calling resend.emails.send...
📧 [EMAIL] Resend API call completed
✅ [EMAIL] Email sent successfully! ID: abc123
✅ Email sent successfully!
```

#### ❌ BAD - Configuration Missing:
```
⚠️ Email notification skipped - missing config
⚠️ RESEND_API_KEY: MISSING
⚠️ NOTIFICATION_EMAIL: MISSING
```

#### ❌ BAD - Resend Object Null:
```
📧 [EMAIL] resend object exists: false
❌ [EMAIL] Resend object is null - API key missing or invalid
```

#### ❌ BAD - API Error:
```
📧 [EMAIL] Response error: {...}
❌ [EMAIL] Failed to send email: {...}
```

### Step 2: Verify Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Check these exist:
   - `RESEND_API_KEY` (starts with `re_`)
   - `NOTIFICATION_EMAIL` (your email address)

### Step 3: Test Resend API Key

Visit Resend Dashboard:
https://resend.com/api-keys

- Check if API key is active
- Check if domain is verified (or use `onboarding@resend.dev`)
- Check rate limits (free tier: 100 emails/day)

### Step 4: Check Email Delivery

Visit Resend Emails:
https://resend.com/emails

- If email appears here → Resend received it
- Check status: Delivered / Bounced / Rejected
- If not appearing → API call failed

## Common Issues & Solutions

### Issue 1: "resend object is null"
**Cause**: RESEND_API_KEY not set or invalid
**Solution**: 
1. Check API key in Vercel env vars
2. Regenerate API key in Resend dashboard
3. Redeploy after updating

### Issue 2: "Email notification skipped"
**Cause**: Environment variables not set
**Solution**:
1. Add RESEND_API_KEY and NOTIFICATION_EMAIL in Vercel
2. Redeploy (env vars only load on deploy)

### Issue 3: Email sent but not received
**Cause**: Email in spam or blocked
**Solution**:
1. Check spam folder
2. Check Resend dashboard for delivery status
3. Try different email address
4. Verify domain in Resend (for production)

### Issue 4: "Module not found: @react-email/render"
**Cause**: Missing dependency
**Solution**:
```bash
npm install @react-email/render
```

### Issue 5: Edge Runtime Error
**Cause**: Using Edge runtime instead of Node.js
**Solution**: Already fixed - `export const runtime = 'nodejs'` at bottom of route.ts

## Testing Checklist

After deploying, test in this order:

1. ✅ Visit your site
2. ✅ Check Vercel logs immediately
3. ✅ Look for `📧 [EMAIL]` logs
4. ✅ Check Resend dashboard
5. ✅ Check your email inbox (and spam)

## Expected Email Content

You should receive an email with:
- **Subject**: `🎯 Visitor #X from City, Country`
- **Content**:
  - Timestamp
  - Location (Country, City, Region, Timezone, Coordinates)
  - Google Maps link
  - IP Address
  - Device & Browser info
  - Traffic source
  - Link to admin dashboard

## Next Steps if Still Not Working

If emails still don't send after following this guide:

1. **Share Vercel logs** - Copy the full log output
2. **Check Resend dashboard** - Screenshot the emails page
3. **Verify env vars** - Confirm they're set correctly
4. **Test API key** - Try sending test email from Resend dashboard

The detailed logging will show exactly where the process fails!
