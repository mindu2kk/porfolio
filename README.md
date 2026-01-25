# Service Section Standalone - Portfolio

Standalone version của Intro + Service sections từ portfolio chính.

## 🎯 Mục đích

Tách riêng phần Intro và Service sections thành một project độc lập, có thể deploy độc lập lên Vercel.

## ✨ Tính năng

### Intro Section (3 cột)
- **Cột trái**: Name card, Portrait, Action button
- **Cột giữa**: Social links, Personal message, Support section
- **Cột phải**: Studio card, Mind Channel (UTC+7 clock), Quotes, Website info

### Service Section (2 cột)
- **Cột trái**: "Let's Connect" với email link
- **Cột phải**: Social links grid (GitHub, Discord, Dev.to, HuggingFace, LinkedIn, HubSpot)

### Analytics & Tracking
- **Vercel Analytics** - Track pageviews, visitors
- **Visitor Counter** - Real-time visitor count với Vercel KV (Upstash Redis)

### Theme System
- Dark mode / Light mode toggle
- Theme persistence (localStorage)
- System preference detection

## 🚀 Local Development

```bash
npm install
npm run dev
```

## 🌐 Deploy to Vercel

### ⚡ Quick Start (5 phút)
```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/mindu2kk/porfolio.git
git push -u origin main

# 2. Deploy to Vercel
# - Vào https://vercel.com/new
# - Import repository
# - Click Deploy

# 3. Setup KV Database
# - Vào project > Storage > Create Database
# - Chọn KV (Upstash Redis)
# - Connect to Project
# - Redeploy
```

### 📖 Chi tiết
- [QUICK-START.md](./QUICK-START.md) - Hướng dẫn nhanh
- [DEPLOY.md](./DEPLOY.md) - Hướng dẫn chi tiết

## 📦 Tech Stack

- Next.js 15.5.9
- React 18.3.1
- Tailwind CSS 4.1.9
- Vercel Analytics
- Vercel KV (Upstash Redis)
- TypeScript

## 🔗 Links

- **GitHub**: https://github.com/mindu2kk/porfolio
- **Vercel**: https://vercel.com/dashboard

---

© 2025 - Built with 💖 and ☕
