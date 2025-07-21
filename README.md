# The Man Behind the Music (TMBM) Platform

A modern music submission platform connecting artists with Grammy-winning producers and industry legends.

## 🚀 Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Run development server: `npm run dev`

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom session-based auth
- **Styling**: Tailwind CSS, shadcn/ui components
- **Deployment**: Vercel

## 📊 Features

- Music submission system
- Producer profiles and podcast integration
- Tiered access (Free, Creator, Pro)
- Admin portal with user management
- File storage for music submissions
- Real-time dashboard updates

## 🔧 Environment Variables

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MASTER_DEV_KEY_HARRIS=your_master_key
MASTER_DEV_KEY_IPXS=your_master_key
\`\`\`

## 📝 License

MIT License - see LICENSE file for details.

## 🗄️ Database Schema

The platform uses a comprehensive PostgreSQL schema with:

- **Users**: User profiles with tiers and roles
- **Hosts**: Producer/host information
- **Tracks**: Music submissions with metadata
- **Submissions**: Track submissions to hosts
- **Placements**: Successful media placements
- **Podcast Episodes**: YouTube episode management
- **Sessions**: Custom authentication sessions

## 🔐 Authentication

Custom session-based authentication system with:
- User registration and login
- Master developer access with secure keys
- Role-based permissions (user, admin, master_dev)
- Session management with expiration

## 📁 File Storage

Supabase Storage buckets for:
- `music-submissions`: Private music files
- `host-images`: Public host profile images
- `platform-assets`: Public platform media
- `user-avatars`: Public user profile pictures

## 🚀 Deployment

### Automatic Deployment
- **Staging**: Auto-deploys from `develop` branch
- **Production**: Auto-deploys from `main` branch
- **Database**: Migrations run automatically on schema changes

### Manual Deployment
\`\`\`bash
# Deploy to Vercel
vercel --prod

# Run database migrations
npm run db:migrate
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
\`\`\`

## 🔄 Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Pull Requests**: Submit PRs to `develop` branch
3. **Testing**: Automatic CI/CD testing on all PRs
4. **Staging**: Merge to `develop` for staging deployment
5. **Production**: Merge to `main` for production deployment

## 🙏 Acknowledgments

- Grammy-winning producers and industry legends
- The music community for their support
- Open source contributors

---

**Built with ❤️ by the TMBM Team**
