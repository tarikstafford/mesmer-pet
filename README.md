# 🐾 Mesmer - AR Pet App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![PRD Completion](https://img.shields.io/badge/PRD%20Completion-30%2F30-brightgreen)](prd.json)

An augmented reality virtual pet application that combines Tamagotchi-style care mechanics with advanced AI, genetics-based breeding, and educational capabilities. Built autonomously by Ralph AI agent from a comprehensive PRD.

## ✨ Features

### 🧬 Genetics & Breeding
- **30 Genetic Traits** across 4 rarity tiers (Common, Uncommon, Rare, Legendary)
- **Advanced Breeding System** with 50/50 parent inheritance and 15% mutation chance
- **Interactive Family Tree** visualization showing complete lineage
- **Compatibility Scoring** based on health, age, and trait similarity
- **Generation Tracking** with unlimited breeding depth

### 🤖 AI-Powered Personalities
- **GPT-4o-mini Integration** for natural conversations
- **Personality-Driven Responses** influenced by 5 core traits
- **Hybrid Memory System** - 50 recent interactions + summarized history
- **Encrypted Conversations** with AES-256-GCM
- **Teaching Skills** - Math, Science, History, Language tutoring
- **Game Skills** - Play chess via algebraic notation

### 🎮 Interactive Gameplay
- **Real-time 3D Models** with React Three Fiber
- **Stat System** - Health, Hunger, Happiness, Energy (0-100)
- **Automatic Stat Degradation** with background jobs every 15 minutes
- **Feeding System** with 60-minute cooldowns
- **Health Warnings** with 3 severity levels and visual sick states
- **Critical State Prevention** - pets never die permanently
- **Recovery Items** - Health Potions and Revival Spells
- **Daily Login Bonuses** with streak tracking (7, 30, 100 day milestones)

### 🛒 Skill Marketplace
- **20 Predefined Skills** across Education, Games, Arts, and Sports
- **Real Money Purchases** via Stripe, Apple IAP, Google Play Billing
- **Price Tiers** - $0.99 to $4.99
- **Featured Skills System** with search and filtering
- **Admin Dashboard** for skill management and analytics

### 📱 Augmented Reality
- **WebXR Integration** for cross-platform AR
- **Surface Detection** for realistic pet placement
- **Tap Interactions** - animations on touch
- **Voice Chat** in AR mode
- **Gesture Recognition** - pet responds to waves
- **Cross-Platform Sync** between web and AR (updates within 5 seconds)

### 👥 Social Features
- **Friend System** - send/accept/decline friend requests
- **View Friends' Pets** with full profile access
- **Collaborative Breeding** with friend approval flow
- **Online Status Tracking**
- **Friend Limit** - 50 friends per user

### 🔒 Privacy & Compliance
- **GDPR Compliant** - full data export and deletion
- **COPPA Compliant** - age verification (13+ requirement)
- **Cookie Consent Management** with granular preferences
- **AES-256-GCM Encryption** for all conversations
- **Privacy Policy & Terms of Service**
- **Data Processing Transparency**

### 🎓 User Experience
- **Interactive Onboarding** - 5-step tutorial with rewards
- **Multi-Pet Management** - up to 10 pets per user
- **Bulk Actions** - feed all, health check all
- **Color-Coded Stats** - visual health indicators
- **Relative Timestamps** - "5m ago", "3h ago"
- **Sentry Error Logging** with performance monitoring

## 🛠️ Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - 3D graphics
- [TailwindCSS 4](https://tailwindcss.com/) - Utility-first styling

**Backend**
- [Prisma 7](https://www.prisma.io/) - Type-safe ORM
- [SQLite](https://www.sqlite.org/) - Database (easily swappable)
- [OpenAI GPT-4o-mini](https://openai.com/) - AI conversations
- [JWT](https://jwt.io/) - Authentication

**Payments**
- [Stripe](https://stripe.com/) - Web payments
- Apple In-App Purchases
- Google Play Billing

**AR/3D**
- [WebXR](https://immersiveweb.dev/) - AR framework
- [Three.js](https://threejs.org/) - 3D rendering
- [ARCore](https://developers.google.com/ar) - Android AR
- [ARKit](https://developer.apple.com/augmented-reality/) - iOS AR

**Monitoring**
- [Sentry](https://sentry.io/) - Error tracking
- Performance monitoring
- Custom metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/tarikstafford/mesmer-pet.git
cd mesmer-pet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys:
# - ENCRYPTION_KEY (generate with: openssl rand -hex 16)
# - OPENAI_API_KEY
# - STRIPE_SECRET_KEY
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Run database migrations
npx prisma migrate dev

# Seed the database with traits and skills
npx prisma db seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your AR Pet App!

### Production Build

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
mesmer-pet/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Seed data (traits, skills)
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── marketplace/     # Skill marketplace
│   │   ├── breed/           # Breeding interface
│   │   └── settings/        # User settings
│   ├── components/          # React components
│   │   ├── PetModel3D.tsx  # 3D pet renderer
│   │   ├── ChatInterface.tsx # AI chat
│   │   ├── FamilyTree.tsx  # Genetics visualization
│   │   └── ...
│   ├── lib/                 # Business logic
│   │   ├── prisma.ts       # Prisma client
│   │   ├── genetics.ts     # Breeding algorithms
│   │   ├── memory.ts       # AI memory system
│   │   ├── encryption.ts   # Data encryption
│   │   └── ...
│   └── types/              # TypeScript types
├── scripts/
│   └── ralph/              # Ralph automation scripts
├── tasks/
│   └── prd-ar-pet-app-mvp.md # Original PRD
├── prd.json                # Ralph task tracking
├── progress.txt            # Development learnings
└── package.json
```

## 📊 Development Stats

- **User Stories Completed:** 30/30 (100%)
- **Git Commits:** 57
- **TypeScript Files:** 116
- **Total Lines of Code:** ~15,000+
- **Development Time:** Built autonomously by Ralph AI
- **Build Status:** ✅ Passing
- **TypeCheck Status:** ✅ Passing

## 🤖 Built with Ralph

This entire application was built autonomously using [Ralph](https://github.com/snarktank/ralph), an AI agent loop that iteratively implements PRD user stories. Ralph used:

- **Claude Sonnet 4.5** for code generation
- **Autonomous iteration** through 30 user stories
- **Self-correction** via typecheck and build validation
- **Learning accumulation** in `progress.txt`
- **Zero human coding** - 100% AI-generated implementation

See `progress.txt` for detailed learnings from each iteration.

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login with JWT
- `POST /api/auth/verify-email` - Email verification

### Pets
- `GET /api/pets` - List user's pets
- `POST /api/pets` - Create new pet
- `POST /api/pets/feed` - Feed a pet
- `POST /api/pets/recover` - Use recovery item
- `GET /api/pets/family-tree/[petId]` - Get lineage

### Breeding
- `POST /api/breeding/breed` - Breed two pets
- `GET /api/breeding/check-breeding` - Check eligibility

### Skills
- `GET /api/marketplace/skills` - List available skills
- `POST /api/skills/assign` - Assign skill to pet
- `DELETE /api/skills/remove` - Remove skill from pet

### Memory & Chat
- `POST /api/memory/store` - Store interaction
- `GET /api/memory/[petId]` - Get memory context
- `POST /api/chat` - Send message to pet

### Privacy
- `GET /api/privacy/export-data` - Export all user data
- `POST /api/privacy/delete-account` - Request account deletion
- `POST /api/privacy/cookie-consent` - Update consent

Full API documentation available in [API.md](docs/API.md).

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linter
npm run lint

# Build for production (validates everything)
npm run build
```

## 🌍 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t mesmer-pet .

# Run container
docker run -p 3000:3000 mesmer-pet
```

### Environment Variables for Production
```env
DATABASE_URL=postgresql://... # Upgrade from SQLite to PostgreSQL
ENCRYPTION_KEY=<32-char-hex>
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
SENTRY_DSN=https://...
```

## 🐛 Known Issues & Future Enhancements

See [ROADMAP.md](docs/ROADMAP.md) for planned features and known limitations.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Ralph AI Agent](https://github.com/snarktank/ralph)
- Powered by [Claude Sonnet 4.5](https://www.anthropic.com/claude)
- Genetics system inspired by [forkMonkey](https://github.com/roeiba/forkMonkey)
- AI Pet concepts from [AI-Pet](https://github.com/imustitanveer/AI-Pet)

## 📞 Contact

- GitHub: [@tarikstafford](https://github.com/tarikstafford)
- Repository: [mesmer-pet](https://github.com/tarikstafford/mesmer-pet)

---

**Built with ❤️ and AI** - 100% autonomous implementation by Ralph
