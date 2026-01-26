# 📧 Email Notification Setup

## Tính năng
Nhận email mỗi khi có visitor mới truy cập website!

## Setup Resend (5 phút)

### Bước 1: Tạo tài khoản Resend
1. Truy cập: https://resend.com/signup
2. Đăng ký miễn phí (100 emails/day)
3. Verify email

### Bước 2: Lấy API Key
1. Vào https://resend.com/api-keys
2. Click **Create API Key**
3. Name: `Portfolio Notifications`
4. Permission: **Sending access**
5. Copy API key (chỉ hiện 1 lần!)

### Bước 3: Add vào Vercel
1. Vào Vercel Dashboard > Project > **Settings** > **Environment Variables**
2. Thêm 2 biến:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   NOTIFICATION_EMAIL=your-email@example.com
   ```
3. Click **Save**

### Bước 4: Redeploy
1. Vào **Deployments** tab
2. Click **Redeploy** trên deployment mới nhất
3. Đợi deploy xong

### Bước 5: Test
1. Truy cập website của bạn
2. Kiểm tra email (có thể trong Spam)
3. Bạn sẽ nhận email như này:

```
🎯 New Visitor #123 - Ho Chi Minh City, Vietnam

Visitor #: 123
Time: 26/01/2025, 10:45:17

📍 Location: Ho Chi Minh City, Vietnam
💻 Device: Mobile
🌐 IP: 123.456.789.0

🔗 Referrer: https://google.com
```

## Tùy chỉnh Email Template

Sửa file: `lib/email.ts`

```typescript
// Thay đổi subject
subject: `🎯 New Visitor #${visitor.count}`,

// Thay đổi HTML template
html: `...your custom HTML...`
```

## Verify Domain (Optional)

Để gửi từ domain của bạn (vd: `noreply@yourdomain.com`):

1. Vào https://resend.com/domains
2. Click **Add Domain**
3. Nhập domain của bạn
4. Add DNS records theo hướng dẫn
5. Đợi verify (5-10 phút)
6. Update `from` trong `lib/email.ts`:
   ```typescript
   from: 'Portfolio <noreply@yourdomain.com>'
   ```

## Troubleshooting

### Email không đến:
1. Kiểm tra Spam folder
2. Kiểm tra RESEND_API_KEY đúng chưa
3. Kiểm tra NOTIFICATION_EMAIL đúng chưa
4. Xem logs trong Vercel: Functions > /api/visitor

### Email bị reject:
1. Verify domain (xem trên)
2. Hoặc dùng email test của Resend: `onboarding@resend.dev`

## Giới hạn Free Tier

- **100 emails/day**
- **1 domain**
- **Unlimited API keys**

Đủ cho personal portfolio! 🎉

## Nâng cấp (Optional)

Nếu cần nhiều hơn:
- Pro: $20/month - 50,000 emails/month
- Business: $80/month - 200,000 emails/month

---

**Note**: Email sẽ gửi async (không block visitor), nếu fail sẽ log error nhưng visitor vẫn được count bình thường.
