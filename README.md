# 🎨 Portfolio Website - Advanced Analytics Dashboard

A modern, professional portfolio website with enterprise-level analytics and monitoring capabilities.

## 🚀 Live Demo

**Production:** [Your Vercel URL]

## ✨ Key Features

### 🎯 Core Features
- Modern, responsive portfolio design
- Dark/Light theme support
- Real-time visitor tracking
- Email notifications (Resend)
- Multi-source geolocation (Vercel, FreeIPAPI, ipapi.co, ipinfo.io)

### 📊 Advanced Analytics Dashboard
- **Audit Logs Viewer** - Complete security audit trail with filters
- **System Health Monitoring** - Real-time KV, API, and error rate tracking
- **Interactive World Map** - Leaflet-powered visitor location visualization
- **Browser & Device Intelligence** - Detailed browser, OS, and device analytics
- **User Behavior Analytics** - Session duration, bounce rate, engagement scoring
- **Traffic Source Analysis** - Referrer tracking with social/search detection
- **Real-time Activity Feed** - Live visitor stream with time-ago display

### 🔒 Security Features
- Rate limiting (1 req/5s for visitors, 100 req/min for API)
- Input validation and sanitization (XSS prevention)
- Audit logging (30-day retention)
- IP-based tracking with privacy considerations

## 📈 Analytics Metrics

### Visitor Metrics
- Total visitors, Active sessions, Return visitors
- Session duration, Bounce rate, Pages per session
- Engagement score (0-100)

### Technical Metrics
- Browser distribution (Chrome, Firefox, Safari, Edge, etc.)
- OS distribution (Windows, macOS, Linux, Android, iOS)
- Device types (Desktop, Mobile, Tablet)

### Traffic Metrics
- Traffic sources (Direct, Social, Search, Referral)
- Top referrer domains
- Geographic distribution (country, city)

### Time-based Metrics
- Hourly traffic (last 24 hours)
- Daily traffic (last 7 days)
- Peak hours and trends

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15.5.9 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Maps:** Leaflet + React Leaflet
- **Date:** date-fns

### Backend
- **Runtime:** Node.js (API routes), Edge (stats)
- **Database:** Vercel KV (Upstash Redis)
- **Email:** Resend
- **Geolocation:** Vercel Functions + Multiple APIs

### Analytics Libraries
- **User Agent Parsing:** ua-parser-js
- **Rate Limiting:** @upstash/ratelimit
- **Validation:** Zod

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/mindu2kk/porfolio.git
cd service-section-standalone

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔑 Environment Variables

Required variables in `.env.local`:

```env
# Vercel KV (Upstash Redis)
KV_REST_API_TOKEN=your_token
KV_REST_API_URL=your_url
KV_URL=your_redis_url

# Email (Resend)
RESEND_API_KEY=your_api_key
NOTIFICATION_EMAIL=your_email

# Security (auto-generated)
ENCRYPTION_KEY=auto_generated
IP_SALT=auto_generated
NEXTAUTH_SECRET=auto_generated
```

## 📁 Project Structure

```
├── app/
│   ├── admin/
│   │   ├── audit/          # Audit logs viewer
│   │   └── visitors/       # Main analytics dashboard
│   ├── api/
│   │   ├── analytics/      # Analytics endpoints
│   │   ├── audit/          # Audit API
│   │   ├── health/         # Health check
│   │   └── visitor/        # Visitor tracking
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Homepage
├── components/
│   ├── admin/              # Admin components
│   ├── intro/              # Homepage sections
│   ├── navigation/         # Navigation components
│   └── ui/                 # UI components
├── lib/
│   ├── analytics/          # Analytics libraries
│   │   ├── behavior.ts     # Behavior metrics
│   │   ├── device.ts       # Device intelligence
│   │   ├── metrics.ts      # General metrics
│   │   ├── session.ts      # Session tracking
│   │   └── traffic.ts      # Traffic analysis
│   ├── monitoring/         # Monitoring tools
│   │   └── health.ts       # Health checks
│   ├── audit.ts            # Audit logging
│   ├── email.ts            # Email notifications
│   ├── ratelimit.ts        # Rate limiting
│   └── validation.ts       # Input validation
└── public/                 # Static assets
```

## 🎯 Admin Dashboard

Access the admin dashboard at `/admin/visitors`

### Features:
- System health monitoring
- User behavior analytics
- 8 interactive charts
- Interactive world map
- Real-time activity feed
- Visitor logs table
- Audit logs (separate page at `/admin/audit`)

## 🔐 Security

- Rate limiting on all API endpoints
- Input sanitization to prevent XSS
- Audit logging for compliance
- IP-based tracking (hashed for privacy)
- Environment variable encryption
- No authentication required (add if needed)

## 📊 API Endpoints

### Public APIs
- `GET /api/visitor` - Get visitor count and recent visitors
- `POST /api/visitor` - Track new visitor
- `GET /api/visitor/stats` - Get visitor statistics

### Admin APIs
- `GET /api/audit` - Get audit logs
- `GET /api/health` - System health check
- `GET /api/analytics/behavior` - Behavior metrics

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## 📝 Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for:
- V-Model methodology
- Development workflow
- Testing procedures
- Contribution guidelines

## 📖 Documentation

- [FEATURES.md](./FEATURES.md) - Complete feature list
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [PROJECT-HISTORY.md](./PROJECT-HISTORY.md) - Development history

## 🎓 Methodology

This project was built using the **V-Model** methodology:
- Incremental development
- Test after each step
- Small, atomic commits
- No breaking changes
- Professional workflow

## 📈 Performance

- Build time: ~20 seconds
- Homepage size: 18.9 KB
- Admin dashboard: 127 KB
- Total dependencies: ~290 KB
- Lighthouse score: 95+ (estimated)

## 🤝 Contributing

Contributions are welcome! Please follow the V-Model approach:
1. Create feature branch
2. Implement incrementally
3. Test thoroughly
4. Submit PR with clear description

## 📄 License

MIT License - feel free to use for your own portfolio!

## 👤 Author

**Your Name**
- GitHub: [@mindu2kk](https://github.com/mindu2kk)
- Email: kataroto2021@gmail.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and KV database
- Recharts for beautiful charts
- Leaflet for interactive maps
- All open-source contributors

---

**Built with ❤️ using Next.js, TypeScript, and V-Model methodology**

Last updated: February 20, 2026
