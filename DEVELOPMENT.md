# 🛠️ Development Guide

Complete guide for developing and contributing to the portfolio website.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [V-Model Methodology](#v-model-methodology)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Code Standards](#code-standards)
6. [Contributing](#contributing)

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Code editor (VS Code recommended)

### Installation

```bash
# Clone repository
git clone https://github.com/mindu2kk/porfolio.git
cd service-section-standalone

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Development Server
- **URL:** http://localhost:3000
- **Hot Reload:** Enabled
- **Port:** 3000 (or 3001 if 3000 is busy)

---

## V-Model Methodology

### What is V-Model?

The V-Model is a software development methodology that emphasizes:
- **Incremental development** - Small, manageable changes
- **Testing at each step** - Verify before moving forward
- **Risk minimization** - Catch issues early
- **Quality assurance** - Consistent, reliable results

### Why V-Model?

✅ **Prevents breaking changes** - Test after each step  
✅ **Easy debugging** - Small changes = easy to find issues  
✅ **Clean git history** - One commit per feature  
✅ **Professional workflow** - Industry standard  
✅ **Rollback friendly** - Easy to revert if needed  

### V-Model Process

```
1. Plan → 2. Implement → 3. Test → 4. Commit → 5. Repeat
```

#### 1. Plan
- Define feature clearly
- Break into small steps
- Estimate time
- Identify risks

#### 2. Implement
- One file at a time
- Minimal code changes
- Keep existing features working
- Follow code standards

#### 3. Test
- Build: `npm run build`
- TypeScript: Check diagnostics
- Dev server: `npm run dev`
- Functionality: Test feature
- UI: Verify no breaks

#### 4. Commit
- Small, atomic commits
- Clear commit messages
- One feature per commit

#### 5. Repeat
- Move to next step
- Never skip testing
- Document changes

---

## Development Workflow

### Adding a New Feature

#### Step 1: Create Branch
```bash
git checkout -b feature/your-feature-name
```

#### Step 2: Plan Implementation
- Read existing code
- Identify files to modify
- Plan incremental steps
- Estimate time

#### Step 3: Implement Incrementally

**Example: Adding a new chart**

```typescript
// Step 1: Add data structure
interface NewMetric {
  name: string;
  value: number;
}

// Step 2: Add calculation function
export function calculateNewMetric(logs: any[]): NewMetric[] {
  // Implementation
}

// Step 3: Add API endpoint
// app/api/metrics/new/route.ts

// Step 4: Update dashboard
// app/admin/visitors/page.tsx

// Step 5: Add chart component
// components/admin/NewChart.tsx
```

#### Step 4: Test After Each Step

```bash
# After each file change:
npm run build          # Must succeed
npm run dev            # Check in browser
# Verify feature works
# Verify nothing broke
```

#### Step 5: Commit

```bash
git add [files]
git commit -m "feat: add new metric chart"
```

#### Step 6: Push & PR

```bash
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

---

## Testing

### Manual Testing Protocol

#### 1. Build Test
```bash
npm run build
# ✅ Must succeed
# ✅ No errors
# ✅ No warnings (except lockfile)
```

#### 2. TypeScript Test
```bash
# Check in VS Code or:
npx tsc --noEmit
# ✅ 0 errors
```

#### 3. Dev Server Test
```bash
npm run dev
# ✅ Server starts
# ✅ No errors in console
```

#### 4. Functionality Test
- Test new feature
- Test existing features
- Test edge cases
- Test error handling

#### 5. UI Test
- Check all pages load
- Verify responsive design
- Test theme toggle
- Check console for errors
- Verify no visual breaks

#### 6. API Test
```bash
# Test endpoints
curl http://localhost:3000/api/visitor
curl http://localhost:3000/api/health
curl http://localhost:3000/api/audit
```

### Testing Checklist

- [ ] Build successful
- [ ] No TypeScript errors
- [ ] Dev server runs
- [ ] Homepage loads
- [ ] Admin dashboard loads
- [ ] All charts render
- [ ] Map displays
- [ ] Activity feed works
- [ ] Audit logs load
- [ ] APIs respond correctly
- [ ] No console errors
- [ ] Theme toggle works
- [ ] Mobile responsive

---

## Code Standards

### TypeScript

```typescript
// ✅ Good: Explicit types
interface User {
  name: string;
  age: number;
}

function getUser(): User {
  return { name: 'John', age: 30 };
}

// ❌ Bad: Implicit any
function getUser() {
  return { name: 'John', age: 30 };
}
```

### React Components

```typescript
// ✅ Good: Typed props
interface Props {
  title: string;
  count: number;
}

export default function Component({ title, count }: Props) {
  return <div>{title}: {count}</div>;
}

// ❌ Bad: Untyped props
export default function Component({ title, count }) {
  return <div>{title}: {count}</div>;
}
```

### API Routes

```typescript
// ✅ Good: Error handling
export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch' },
      { status: 500 }
    );
  }
}

// ❌ Bad: No error handling
export async function GET() {
  const data = await fetchData();
  return NextResponse.json(data);
}
```

### Naming Conventions

```typescript
// Files
MyComponent.tsx        // Components (PascalCase)
myUtility.ts          // Utilities (camelCase)
my-page.tsx           // Pages (kebab-case)

// Variables
const userName = 'John';           // camelCase
const MAX_COUNT = 100;             // UPPER_CASE (constants)
const UserProfile = () => {};      // PascalCase (components)

// Functions
function calculateTotal() {}       // camelCase
async function fetchData() {}      // camelCase
```

### Comments

```typescript
// ✅ Good: Explain why, not what
// Use exponential backoff to prevent API rate limiting
await retry(fetchData, { maxAttempts: 3 });

// ❌ Bad: Obvious comments
// Set x to 5
const x = 5;
```

---

## Project Structure

### Directory Organization

```
app/
├── admin/              # Admin pages
│   ├── audit/         # Audit logs
│   └── visitors/      # Analytics dashboard
├── api/               # API routes
│   ├── analytics/     # Analytics endpoints
│   ├── audit/         # Audit endpoint
│   ├── health/        # Health check
│   └── visitor/       # Visitor tracking
├── globals.css        # Global styles
├── layout.tsx         # Root layout
└── page.tsx           # Homepage

components/
├── admin/             # Admin components
├── intro/             # Homepage sections
├── navigation/        # Navigation
└── ui/                # Reusable UI

lib/
├── analytics/         # Analytics libraries
│   ├── behavior.ts   # Behavior metrics
│   ├── device.ts     # Device parsing
│   ├── metrics.ts    # General metrics
│   ├── session.ts    # Session tracking
│   └── traffic.ts    # Traffic analysis
├── monitoring/        # Monitoring
│   └── health.ts     # Health checks
├── audit.ts          # Audit logging
├── email.ts          # Email service
├── ratelimit.ts      # Rate limiting
└── validation.ts     # Input validation
```

### File Naming

- **Pages:** `page.tsx` (Next.js convention)
- **Components:** `ComponentName.tsx` (PascalCase)
- **Libraries:** `libraryName.ts` (camelCase)
- **Types:** `types.ts` or inline interfaces
- **Constants:** `constants.ts`

---

## Git Workflow

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>: <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code restructuring
test:     # Tests
chore:    # Maintenance

# Examples
feat: add traffic source analysis
fix: resolve geolocation API timeout
docs: update deployment guide
refactor: extract device parsing logic
```

### Branch Naming

```bash
feature/feature-name    # New features
fix/bug-description     # Bug fixes
docs/doc-update        # Documentation
refactor/code-cleanup  # Refactoring
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Build successful
- [ ] Tests passed
- [ ] UI verified
- [ ] No breaking changes

## Screenshots
(if applicable)
```

---

## Contributing

### How to Contribute

1. **Fork** the repository
2. **Clone** your fork
3. **Create** feature branch
4. **Implement** following V-Model
5. **Test** thoroughly
6. **Commit** with clear messages
7. **Push** to your fork
8. **Create** Pull Request

### Contribution Guidelines

✅ **Do:**
- Follow V-Model methodology
- Test after each change
- Write clear commit messages
- Update documentation
- Keep changes minimal
- Ask questions if unsure

❌ **Don't:**
- Make large, sweeping changes
- Skip testing
- Break existing features
- Commit untested code
- Mix multiple features in one PR

### Code Review Process

1. **Automated Checks**
   - Build must pass
   - TypeScript must pass
   - No console errors

2. **Manual Review**
   - Code quality
   - Follows standards
   - Tests included
   - Documentation updated

3. **Approval**
   - At least 1 approval required
   - All comments addressed
   - CI/CD passes

---

## Debugging

### Common Issues

#### Build Fails
```bash
# Clear cache
rm -rf .next
npm run build
```

#### TypeScript Errors
```bash
# Check specific file
npx tsc --noEmit path/to/file.ts
```

#### Dev Server Issues
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

#### KV Connection Issues
```bash
# Verify environment variables
echo $KV_REST_API_TOKEN
echo $KV_REST_API_URL
```

### Debug Tools

- **VS Code Debugger** - Set breakpoints
- **React DevTools** - Inspect components
- **Network Tab** - Check API calls
- **Console** - Log debugging info
- **Vercel Logs** - Production debugging

---

## Performance

### Optimization Tips

1. **Code Splitting**
   ```typescript
   // Use dynamic imports
   const Map = dynamic(() => import('./Map'), { ssr: false });
   ```

2. **Memoization**
   ```typescript
   // Cache expensive calculations
   const memoized = useMemo(() => calculate(data), [data]);
   ```

3. **Lazy Loading**
   ```typescript
   // Load components on demand
   const Component = lazy(() => import('./Component'));
   ```

4. **Image Optimization**
   ```typescript
   // Use Next.js Image
   import Image from 'next/image';
   ```

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Recharts Docs](https://recharts.org/en-US)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Git](https://git-scm.com/)

### Community
- [Next.js Discord](https://nextjs.org/discord)
- [GitHub Discussions](https://github.com/mindu2kk/porfolio/discussions)

---

## FAQ

**Q: How do I add a new chart?**  
A: Follow V-Model: 1) Add data calculation, 2) Update API, 3) Add chart component, 4) Test each step

**Q: How do I test locally?**  
A: Run `npm run dev` and visit http://localhost:3000

**Q: How do I deploy?**  
A: Push to GitHub, Vercel auto-deploys. See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Q: How do I add a new metric?**  
A: 1) Add calculation in `lib/analytics/`, 2) Create API endpoint, 3) Update dashboard

**Q: Can I skip testing?**  
A: No! Testing after each step is crucial to V-Model methodology

---

**Last Updated:** February 20, 2026  
**Methodology:** V-Model  
**Status:** Active Development
