# 🚀 Deploy AlloBricolage to Vercel

Complete step-by-step guide to deploy AlloBricolage on Vercel.

## 📋 Prerequisites

Before you start, you need:

1. **GitHub Account** - To connect your repository to Vercel
2. **Vercel Account** - Sign up at https://vercel.com (free)
3. **Neon Database** - PostgreSQL database from https://neon.tech (free)

---

## 🎯 Step-by-Step Deployment

### Step 1: Set Up Neon Database

1. Go to **https://neon.tech** and create a free account
2. Click **"Create Project"**
3. Choose a name (e.g., "allobricolage")
4. Select a region close to your users (e.g., EU for Europe, US for America)
5. Click **"Create Project"**
6. Copy your **connection string** from the dashboard
   - It looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb`
7. **Keep this connection string safe** - you'll need it in Step 4

### Step 2: Push Code to GitHub

If you haven't already:

```bash
cd ALLOBRICOLAGE
git init
git add .
git commit -m "Initial commit - Ready for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/allobricolage.git
git push -u origin main
```

### Step 3: Connect to Vercel

1. Go to **https://vercel.com** and sign in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your **allobricolage** repository
5. Click **"Import"**

### Step 4: Configure Environment Variables

Before deploying, add these environment variables in Vercel:

1. In the **"Configure Project"** screen, scroll to **"Environment Variables"**
2. Add the following variables:

#### Required Variables:

| Name | Value | Description |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Your Neon connection string |
| `SESSION_SECRET` | Generate a random string | Use: `openssl rand -base64 32` |
| `NODE_ENV` | `production` | Production environment |

#### Optional Variables (for full features):

| Name | Value | When to Add |
|------|-------|-------------|
| `OPENAI_API_KEY` | `sk-...` | For AI job analysis |
| `GEMINI_API_KEY` | `...` | For smart matching |
| `GOOGLE_MAPS_API_KEY` | `...` | For GPS tracking |
| `GOOGLE_CLIENT_ID` | `...` | For Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | `...` | For Google OAuth login |
| `STRIPE_SECRET_KEY` | `sk_live_...` | For Stripe payments |
| `CMI_API_KEY` | `...` | For CMI payments (Morocco) |
| `CASHPLUS_API_KEY` | `...` | For Cash Plus payments |

**Important**: Make sure to add these for **Production**, **Preview**, and **Development** environments.

### Step 5: Deploy

1. After adding environment variables, click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Run the build process
   - Deploy your application
3. Wait 2-5 minutes for the deployment to complete

### Step 6: Initialize Database

After the first deployment:

1. Go to your Vercel project dashboard
2. Click on the **"Deployments"** tab
3. Click on your latest deployment
4. Scroll down and click **"Functions"** → **"Logs"**
5. Or use Vercel CLI to initialize:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Run database initialization
vercel env pull .env.local
npm run db:init
```

Alternatively, you can initialize the database locally:

```bash
# Create .env.local with your DATABASE_URL
echo "DATABASE_URL=your-neon-connection-string" > .env.local

# Initialize database
npm run db:init
```

### Step 7: Access Your Application

1. Once deployed, Vercel will provide a URL like:
   - `https://allobricolage.vercel.app`
   - Or your custom domain if configured

2. Open the URL in your browser
3. You should see the AlloBricolage homepage! 🎉

---

## 🔧 Configuration Details

### Build Settings

Vercel automatically detects these settings from `vercel.json`:

- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`
- **Node.js Version**: 20.x

### Custom Domain (Optional)

To add a custom domain:

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `allobricolage.ma`)
4. Follow Vercel's instructions to update DNS records
5. Wait for DNS propagation (5-60 minutes)

---

## ✅ Post-Deployment Checklist

After deployment, verify these features work:

- [ ] Homepage loads correctly
- [ ] Technician directory shows 70+ technicians
- [ ] User registration works
- [ ] Login/logout works
- [ ] Job posting works
- [ ] Booking creation works
- [ ] Payment page loads
- [ ] Dashboards are accessible
- [ ] No console errors in browser
- [ ] Mobile responsive design works

---

## 🐛 Troubleshooting

### Issue: "DATABASE_URL is required"

**Solution**: 
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify `DATABASE_URL` is set correctly
- Redeploy the application

### Issue: "Failed to connect to PostgreSQL"

**Solution**:
- Check that your Neon database is active
- Verify the connection string is correct (copy it again from Neon)
- Ensure there are no extra spaces or quotes in the environment variable

### Issue: Build fails with "Module not found"

**Solution**:
- Check that all dependencies are in `package.json`
- Try redeploying (Vercel → Deployments → ... → Redeploy)

### Issue: "Function execution timed out"

**Solution**:
- This is normal for the first request (cold start)
- Subsequent requests will be faster
- Consider upgrading to Vercel Pro for better performance

### Issue: No technicians showing up

**Solution**:
- Database needs to be initialized
- Run `npm run db:init` locally with your DATABASE_URL
- Or use Vercel CLI: `vercel env pull && npm run db:init`

---

## 🔄 Updating Your Deployment

To update your application:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically:
- Detect the push
- Build the new version
- Deploy it
- Zero downtime deployment! 🚀

---

## 📊 Monitoring

### View Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click **"Deployments"** → Select a deployment
4. Click **"Functions"** to see server logs
5. Click **"Build Logs"** to see build process

### Analytics

Vercel provides free analytics:
- Page views
- Top pages
- Visitor locations
- Performance metrics

Access it: Vercel Dashboard → Your Project → Analytics

---

## 💰 Pricing

### Vercel Free Tier Includes:
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions
- ✅ Preview deployments
- ✅ Custom domains

### Neon Free Tier Includes:
- ✅ 0.5 GB storage
- ✅ 1 project
- ✅ Automatic backups
- ✅ 100 hours compute/month

**Perfect for production use!** 🎉

---

## 🔐 Security Best Practices

- ✅ Always use environment variables for secrets
- ✅ Never commit `.env` files to Git
- ✅ Use strong SESSION_SECRET (32+ characters)
- ✅ Enable Vercel's built-in DDoS protection
- ✅ Set up Neon's IP allowlist if needed
- ✅ Regularly update dependencies: `npm update`

---

## 🚀 Performance Optimization

### Enable Vercel Edge Functions (Optional)

For even better performance, consider:
- Edge caching for static assets (automatic)
- Edge middleware for authentication
- CDN distribution (automatic)

### Database Optimization

- Neon automatically scales with traffic
- Connection pooling is built-in
- Consider upgrading to Neon Pro for:
  - More compute hours
  - Larger storage
  - Better performance

---

## 🆘 Need Help?

### Resources:
- **Vercel Documentation**: https://vercel.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **Vercel Support**: https://vercel.com/support
- **GitHub Issues**: Create an issue in your repository

### Common Commands:

```bash
# View deployment logs
vercel logs

# Pull environment variables
vercel env pull

# Run production build locally
vercel dev

# Link local project to Vercel
vercel link

# Deploy manually
vercel --prod
```

---

## 🎉 Success!

Your AlloBricolage platform is now live on Vercel! 🚀

**Your application URL**: `https://your-project.vercel.app`

Share it with your users and start connecting Moroccan businesses with skilled technicians!

---

## 📝 Quick Reference

### Essential URLs:
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Dashboard**: https://console.neon.tech
- **Your Application**: https://your-project.vercel.app

### Essential Commands:
```bash
# Deploy to Vercel
git push origin main

# Initialize database
npm run db:init

# Check build locally
npm run build

# Test locally
npm run dev
```

---

**Deployment Date**: November 29, 2025  
**Status**: ✅ READY FOR VERCEL

**Built with ❤️ for AUI System Analysis and Design Course**

