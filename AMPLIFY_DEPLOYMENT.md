# AWS Amplify Deployment Guide

## 🚀 Quick Start

This guide will help you deploy the Project Management System to AWS Amplify.

## 📋 Prerequisites

- AWS Account
- GitHub repository connected to Amplify
- Node.js 16.x or 18.x

## 🔧 Deployment Steps

### 1. Connect to AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** as your repository provider
4. Authorize AWS Amplify to access your repository
5. Select your repository: `project-management-system`
6. Select branch: `main`

### 2. Configure Build Settings

Amplify will auto-detect the `amplify.yml` file. Verify the settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd client
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: client/build
    files:
      - '**/*'
  cache:
    paths:
      - client/node_modules/**/*
```

### 3. Environment Variables

Add these environment variables in Amplify Console → App Settings → Environment Variables:

```
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_SOCKET_URL=wss://your-api-domain.com
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
REACT_APP_VERSION=1.0.0
```

### 4. Advanced Settings

**Build Image**: `Amazon Linux:2023`
**Node Version**: `18`

Go to **App settings** → **Build settings** → **Build image settings**:
- Select **Amazon Linux:2023**
- Node.js version: **18**

### 5. Deploy

1. Click **"Save and deploy"**
2. Wait for the build to complete (5-10 minutes)
3. Your app will be available at: `https://[branch-name].[app-id].amplifyapp.com`

## 🔄 Automatic Deployments

Amplify automatically deploys when you push to the `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## 🌐 Custom Domain (Optional)

1. Go to **App settings** → **Domain management**
2. Click **"Add domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (15-30 minutes)

## 🔍 Monitoring

### Build Logs
- Go to your app in Amplify Console
- Click on the latest deployment
- View **Provision**, **Build**, and **Deploy** logs

### Performance
- Amplify provides built-in monitoring
- Check **Monitoring** tab for:
  - Traffic metrics
  - Error rates
  - Performance data

## 🐛 Troubleshooting

### Build Fails

**Issue**: `npm ci` fails
**Solution**: Delete `package-lock.json` and run `npm install` locally, then commit

**Issue**: Build timeout
**Solution**: Increase build timeout in App settings → Build settings

**Issue**: Out of memory
**Solution**: 
1. Go to App settings → Build settings
2. Increase build memory to 7GB
3. Add to amplify.yml:
```yaml
build:
  commands:
    - export NODE_OPTIONS=--max-old-space-size=4096
    - npm run build
```

### Deployment Issues

**Issue**: White screen after deployment
**Solution**: Check browser console for errors. Verify `REACT_APP_API_URL` is set correctly

**Issue**: 404 on refresh
**Solution**: Amplify automatically handles SPA routing. Verify `rewrites` in amplify.yml

**Issue**: Environment variables not working
**Solution**: 
1. Verify variables start with `REACT_APP_`
2. Redeploy after adding variables
3. Clear browser cache

## 📊 Performance Optimization

### Already Implemented
- ✅ Code splitting with React.lazy
- ✅ Lazy loading for routes
- ✅ Optimized bundle size
- ✅ No source maps in production
- ✅ Caching strategies

### Amplify Features
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Gzip compression
- ✅ Image optimization
- ✅ Caching headers

## 🔒 Security

### Implemented
- ✅ Environment variables for sensitive data
- ✅ HTTPS only
- ✅ Security headers configured
- ✅ No API keys in code

### Recommendations
1. Enable **Branch protection** in GitHub
2. Use **AWS Secrets Manager** for API keys
3. Enable **AWS WAF** for DDoS protection
4. Set up **CloudWatch** alerts

## 💰 Cost Estimation

### Free Tier (First 12 months)
- Build minutes: 1,000 minutes/month
- Hosting: 15 GB served/month
- Storage: 5 GB

### After Free Tier
- Build minutes: $0.01/minute
- Hosting: $0.15/GB served
- Storage: $0.023/GB/month

**Estimated monthly cost**: $5-20 for small to medium traffic

## 🔄 CI/CD Pipeline

Amplify provides automatic CI/CD:

```
Push to GitHub → Amplify detects change → Build → Test → Deploy → Live
```

### Branch Deployments
- `main` → Production
- `develop` → Staging (optional)
- Feature branches → Preview URLs

## 📱 Preview Deployments

Enable preview deployments for pull requests:
1. Go to **App settings** → **Previews**
2. Enable **Pull request previews**
3. Each PR gets a unique URL for testing

## 🎯 Post-Deployment Checklist

- [ ] Verify app loads correctly
- [ ] Test all major features
- [ ] Check responsive design on mobile
- [ ] Verify API connections
- [ ] Test authentication flow
- [ ] Check browser console for errors
- [ ] Test dark mode
- [ ] Verify all routes work
- [ ] Test file uploads (if applicable)
- [ ] Check performance metrics

## 📞 Support

### AWS Amplify Documentation
- [Official Docs](https://docs.amplify.aws/)
- [Troubleshooting Guide](https://docs.amplify.aws/guides/troubleshooting/)

### Project Issues
- GitHub Issues: [Your Repository]/issues
- Email: support@yourproject.com

## 🎉 Success!

Your Project Management System is now live on AWS Amplify!

**Production URL**: `https://[your-app].amplifyapp.com`

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
