# Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- GitHub account
- Vercel account
- Supabase project

### 1. GitHub Setup
\`\`\`bash
# Connect your repository to GitHub
git remote add origin https://github.com/your-username/tmbm-platform.git
git branch -M main
git push -u origin main
\`\`\`

### 2. Vercel Deployment
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MASTER_DEV_KEY_HARRIS`
   - `MASTER_DEV_KEY_IPXS`

### 3. Database Setup
1. Run migration scripts in Supabase SQL editor
2. Configure Row Level Security
3. Set up storage buckets

## 🔄 CI/CD Pipeline

### Branch Strategy
- `main`: Production deployments
- `develop`: Staging deployments
- `feature/*`: Feature development

### Automatic Deployments
- **Push to `main`** → Production deployment
- **Push to `develop`** → Staging deployment
- **Pull Request** → Preview deployment

### GitHub Secrets Required
\`\`\`
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
SUPABASE_ACCESS_TOKEN=your_supabase_token
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_DB_PASSWORD=your_db_password
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

## 🗄️ Database Migrations

### Manual Migration
\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Run migrations
supabase db push --project-ref your-project-ref
\`\`\`

### Automatic Migration
Database migrations run automatically when:
- Files in `scripts/` folder are modified
- Push to `main` branch occurs

## 🔍 Health Checks

### Endpoint
\`\`\`
GET /api/health
\`\`\`

### Response
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "environment": "production"
}
\`\`\`

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify Supabase connection
   - Review build logs

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Ensure migrations are applied

3. **Authentication Problems**
   - Verify master dev keys
   - Check session configuration
   - Review CORS settings

### Debug Commands
\`\`\`bash
# Check build locally
npm run build

# Type checking
npm run type-check

# Database connection test
curl https://your-domain.vercel.app/api/health
\`\`\`

## 📊 Monitoring

### Vercel Analytics
- Automatic performance monitoring
- Error tracking
- Usage analytics

### Custom Monitoring
- Health check endpoint
- Database connection status
- Authentication metrics

## 🔐 Security

### Environment Variables
- Never commit `.env` files
- Use Vercel environment variables
- Rotate keys regularly

### Database Security
- Row Level Security enabled
- Secure storage policies
- Regular security audits

---

**For support, contact the development team or create an issue.**
