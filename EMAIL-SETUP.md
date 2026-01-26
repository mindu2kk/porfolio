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

### Bước 5: Kiểm tra logs (QUAN TRỌNG!)

Sau khi deploy xong và có visitor mới:

1. Vào **Logs** tab trong Vercel
2. Tìm các dòng log sau:
   - `📧 [EMAIL] sendVisitorNotification called` - Email function được gọi
   - `📧 [EMAIL] Calling resend.emails.send...` - Đang gửi email
   - `✅ [EMAIL] Email sent successfully!` - Email đã gửi thành công
3. Nếu có lỗi, xem chi tiết trong log

**⚠️ Nếu không thấy email, đọc file `EMAIL-DEBUG.md` để debug chi tiết!**

### Bước 6: Test
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

### ❌ Không nhận được email?

**BƯỚC 1**: Kiểm tra Vercel logs
1. Vào Vercel Dashboard > Logs
2. Tìm log `✅ [EMAIL] Email sent successfully!`
3. Nếu KHÔNG thấy → Đọc `EMAIL-DEBUG.md` để debug

**BƯỚC 2**: Kiểm tra Resend Dashboard
1. Vào https://resend.com/emails
2. Xem email có được gửi không
3. Check status: Delivered / Bounced / Rejected

**BƯỚC 3**: Kiểm tra email
1. Check spam folder
2. Thử email khác
3. Verify email address đúng chưa

**📖 Đọc chi tiết**: `EMAIL-DEBUG.md` - Hướng dẫn debug từng bước với tất cả các trường hợp lỗi!

### Email bị reject:
1. Free tier Resend chỉ gửi được đến email đã verify
2. Hoặc dùng domain `onboarding@resend.dev` (mặc định)
3. Để gửi đến bất kỳ email nào, cần verify domain của bạn

### Rate limit?
- Free tier: 100 emails/day
- Paid tier: 3,000+ emails/day

### Các lỗi khác?
Đọc file `EMAIL-DEBUG.md` - Có hướng dẫn chi tiết cho TẤT CẢ các lỗi có thể xảy ra!

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
