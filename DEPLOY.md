# 🚀 Deploy to Vercel Guide

## Bước 1: Push code lên GitHub

```bash
cd service-section-standalone
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/mindu2kk/porfolio.git
git push -u origin main
```

## Bước 2: Import vào Vercel

1. Truy cập: https://vercel.com/new
2. Import repository: `mindu2kk/porfolio`
3. Framework Preset: **Next.js**
4. Root Directory: `service-section-standalone` (nếu push cả folder cha)
5. Click **Deploy**

## Bước 3: Setup Vercel KV (Upstash Redis)

### 3.1. Tạo KV Database

1. Vào Vercel Dashboard > Project > **Storage** tab
2. Click **Create Database**
3. Chọn **KV (Upstash Redis)**
4. Chọn region gần bạn nhất (Singapore cho VN)
5. Click **Create**

### 3.2. Connect to Project

1. Sau khi tạo xong, click **Connect to Project**
2. Chọn project của bạn
3. Vercel sẽ tự động thêm environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 3.3. Redeploy

1. Vào **Deployments** tab
2. Click **Redeploy** trên deployment mới nhất
3. Đợi deploy xong

## Bước 4: Kiểm tra

1. Truy cập domain Vercel của bạn (vd: `your-project.vercel.app`)
2. Kiểm tra "Website Info" card
3. Số visitor sẽ tăng mỗi lần refresh trang

## 🎯 Tính năng sau khi deploy:

✅ **Vercel Analytics** - Track pageviews, visitors (xem trong dashboard)
✅ **Visitor Counter** - Hiển thị số lượng visitors real-time
✅ **Auto SSL** - HTTPS miễn phí
✅ **Global CDN** - Load nhanh toàn cầu
✅ **Auto Deploy** - Mỗi lần push code tự động deploy

## 📝 Custom Domain (Optional)

1. Vào **Settings** > **Domains**
2. Add domain của bạn
3. Update DNS records theo hướng dẫn
4. Đợi DNS propagate (5-10 phút)

## 🔧 Troubleshooting

### Visitor counter hiển thị 0:

1. Kiểm tra KV database đã connect chưa
2. Kiểm tra environment variables trong Settings > Environment Variables
3. Redeploy lại project

### Build failed:

1. Kiểm tra logs trong Deployments
2. Đảm bảo `package.json` có đầy đủ dependencies
3. Kiểm tra Node.js version (recommend: 18.x hoặc 20.x)

## 📊 Xem Analytics

1. Vào Vercel Dashboard > Project > **Analytics** tab
2. Xem:
   - Page views
   - Unique visitors
   - Top pages
   - Countries
   - Devices

---

**Note**: Vercel Free tier bao gồm:
- 100GB bandwidth/month
- Unlimited deployments
- KV: 256MB storage, 3000 commands/day
- Analytics: 2500 events/month

Đủ cho personal portfolio! 🎉
