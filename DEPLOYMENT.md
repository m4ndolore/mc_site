# Merge Combinator - Vercel Deployment Guide

## Project Status: Ready for Deployment

This project has been prepared for deployment to Vercel. All necessary configuration files have been created and the build process has been verified.

## Cloudflare Pages Deployment (Recommended)

This site is a static Vite build and works on Cloudflare Pages without feature loss.

### Quick Deploy (Dashboard)
1. Push the repo to GitHub (already assumed by this project).
2. In Cloudflare Dashboard → Pages → Create a project.
3. Select the GitHub repo and configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment: `Node 18+`
4. Save and deploy.

### CLI Deploy (Wrangler)
1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```
2. Login:
   ```bash
   wrangler login
   ```
3. Build locally:
   ```bash
   npm run build
   ```
4. Publish:
   ```bash
   wrangler pages deploy dist --project-name mc_site
   ```

### Routing + Headers
- `_headers` sets long-lived cache for assets and no-cache for HTML.
- `_redirects` provides clean URLs for `/about`, `/blog`, and `/portfolio`.
- `cloudflare/merge-router.js` can be deployed as a Worker to route `/combine`, `/builders`, `/opportunities`, `/knowledge`, and `/merch`.

## What Was Changed

### 1. Multi-Page Build Configuration
**File:** `vite.config.js`
- Updated to build all HTML pages (index, about, blog, portfolio)
- Added proper path resolution for multi-page app
- Configured for optimal static site generation

### 2. Script Module Loading
**Files:** `index.html`, `about.html`, `blog.html`, `portfolio.html`
- Changed `<script src="script.js">` to `<script type="module" src="/script.js">`
- This allows Vite to properly bundle and optimize the JavaScript
- Eliminates the build warning about unbundled scripts

### 3. Vercel Configuration
**File:** `vercel.json` (created)
- Configured build command and output directory
- Set up clean URLs (removes `.html` extension)
- Added caching headers for optimal performance:
  - Static assets: 1 year cache (immutable)
  - HTML files: No cache (always fresh)
- Created URL rewrites for clean URLs:
  - `/about` → `/about.html`
  - `/blog` → `/blog.html`
  - `/portfolio` → `/portfolio.html`

### 4. Node.js Version
**File:** `package.json`
- Added `engines` field to specify Node.js >= 18.0.0
- Ensures consistent builds on Vercel

## Build Verification

✅ Build command works: `npm run build`
✅ All pages generated successfully:
- `index.html` (53.95 KB)
- `about.html` (23.66 KB)
- `blog.html` (13.85 KB)
- `portfolio.html` (20.45 KB)

✅ Assets bundled and optimized:
- JavaScript: `script-CzM685Sm.js` (7.75 KB)
- CSS: `script-BlWCgebE.css` (47.87 KB)
- Images: `arrows-3L7DaibM.png` (151.61 KB)

✅ Total dist size: **324 KB**

## Deployment Steps

### Option 1: Vercel CLI (Recommended for first deployment)

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account/team
   - Link to existing project? **N** (for first deployment)
   - What's your project's name? **mc_site** (or your preferred name)
   - In which directory is your code located? **./**
   - Want to override settings? **N** (vercel.json will be used)

5. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Vercel Dashboard (Git Integration)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) and login

3. Click "Add New Project"

4. Import your GitHub repository (m4ndolore/mc_site)

5. Vercel will automatically detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Node.js Version: 18.x or higher

6. Click "Deploy"

### Option 3: GitHub Integration (Continuous Deployment)

After setting up via Option 2, every push to your main branch will automatically trigger a new deployment.

## Post-Deployment Checklist

After deployment, verify:
- [ ] Homepage loads correctly at your Vercel URL
- [ ] Navigation works between all pages (about, blog, portfolio)
- [ ] All images and assets load properly
- [ ] JavaScript interactions work (navigation, animations)
- [ ] Clean URLs work (e.g., `/about` instead of `/about.html`)
- [ ] Mobile responsiveness
- [ ] Browser console shows no errors

## Custom Domain (Optional)

To add a custom domain:

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `mergecombinator.com`)
4. Follow Vercel's DNS configuration instructions
5. Update DNS records at your domain registrar

## Environment Variables

This project currently has no environment variables. If you need to add any in the future:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables for Production, Preview, and/or Development
3. Redeploy for changes to take effect

## Troubleshooting

### Build Fails on Vercel
- Check the build logs in Vercel dashboard
- Verify Node.js version is compatible (>= 18.0.0)
- Ensure all dependencies are listed in `package.json`

### Pages Not Loading
- Check that `vercel.json` is properly formatted
- Verify `dist` folder contains all HTML files locally

### Clean URLs Not Working
- Ensure `vercel.json` is in the project root
- Check that rewrites are properly configured

### Assets Not Loading
- Verify asset paths in HTML use relative paths (not absolute)
- Check browser console for 404 errors

## Local Testing

Before deploying, you can test the production build locally:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

Visit `http://localhost:4173` to test the built site.

## Project Structure

```
mc_site/
├── dist/                 # Build output (generated)
├── content/             # Static assets (images)
├── src/                 # Source files (if any)
├── index.html           # Homepage
├── about.html           # About page
├── blog.html            # Blog page
├── portfolio.html       # Portfolio page
├── script.js            # Main JavaScript
├── styles.css           # Main stylesheet
├── vite.config.js       # Vite configuration
├── vercel.json          # Vercel deployment config
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS config
└── postcss.config.js    # PostCSS config
```

## Support

For issues with deployment:
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vite.dev/
- Contact: Check Vercel dashboard for build logs and error messages
