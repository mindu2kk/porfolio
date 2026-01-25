# ⚡ Quick Start - Deploy to Vercel

## 🎯 Mục tiêu
Deploy portfolio lên Vercel với visitor counter hoạt động

## 📋 Checklist

### 1️⃣ Push to GitHub
```bash
cd service-section-standalone
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/mindu2kk/porfolio.git
git push -u origin main
```

### 2️⃣ Deploy to Vercel
1. Vào https://vercel.com/new
2. Import `mindu2kk/porfolio`
3. Root Directory: `service-section-standalone` (nếu cần)
4. Click **Deploy**

### 3️⃣ Setup KV Database
1. Vào project > **Storage** tab
2. **Create Database** > **KV (Upstash Redis)**
3. Chọn region: **Singapore**
4. **Connect to Project**
5. **Redeploy** project

### 4️⃣ Done! 🎉
- Visitor counter sẽ hoạt động
- Analytics tracking tự động
- HTTPS + CDN miễn phí

## 🔗 Links
- Vercel Dashboard: https://vercel.com/dashboard
- Chi tiết deploy: [DEPLOY.md](./DEPLOY.md)
- GitHub Repo: https://github.com/mindu2kk/porfolio

---

**Thời gian**: ~5 phút
**Chi phí**: Miễn phí (Vercel Free tier)
