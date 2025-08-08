# 🚀 CuraGenie - Railway + Vercel Deployment Guide

Complete step-by-step instructions to deploy CuraGenie using Railway (backend) and Vercel (frontend).

## 📋 Prerequisites

- GitHub account
- Railway account (free tier available)
- Vercel account (free tier available)
- Git installed locally
- Node.js 20+ installed locally

## 🎯 Deployment Overview

**Architecture:**
- **Backend**: Railway (FastAPI + SQLite)
- **Frontend**: Vercel (Next.js)
- **Database**: SQLite on Railway persistent volume
- **File Storage**: Railway persistent volume

---

## 🚂 PART 1: Backend Deployment on Railway

### Step 1: Prepare Repository for Railway

First, ensure your code is pushed to GitHub:

```powershell
# Navigate to project root
cd C:\Users\xhgme\curagenie-cleaned

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - production ready"

# Push to GitHub (replace with your repository URL)
git remote add origin https://github.com/yourusername/curagenie.git
git push -u origin main
```

### Step 2: Create Railway Account & Project

1. **Sign up for Railway**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Authorize Railway to access your GitHub repositories
3. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"
4. **Select Repository**: Choose your `curagenie` repository

### Step 3: Configure Railway Backend Service

1. **Select Backend Directory**:
   - In Railway dashboard, click on your service
   - Go to "Settings" → "General"
   - Set **Root Directory**: `backend`
   - Set **Start Command**: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --host 0.0.0.0 --port $PORT`

2. **Configure Environment Variables**:
   Go to "Variables" tab and add these variables:

```env
# Required Environment Variables
DATABASE_PATH=/app/data/curagenie_real.db
PORT=8000
DEBUG=false
ENVIRONMENT=production
SECRET_KEY=your-super-secret-production-key-32chars-minimum

# CORS - Update with your Vercel domain later
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true

# File Upload Configuration
MAX_FILE_SIZE_MB=100
UPLOADS_DIR=/app/data/uploads
ALLOWED_FILE_TYPES=.vcf,.vcf.gz,.fastq,.fq,.fastq.gz,.fq.gz

# Genomic Processing
ENABLE_REAL_GENOMIC_ANALYSIS=true
PRS_DISEASES=diabetes,alzheimer,heart_disease
MAX_VARIANTS_STORE=1000

# Optional OpenAI (recommended for production chatbot)
OPENAI_API_KEY=your-openai-api-key-here
USE_OPENAI_CHATBOT=true

# Logging
LOG_LEVEL=INFO

# Railway-specific
PYTHONPATH=/app
```

### Step 4: Add Persistent Volume for Database

1. **Create Volume**:
   - In Railway dashboard, click "New" → "Volume"
   - Name: `curagenie-data`
   - Size: `1GB` (free tier limit)
   - Mount Path: `/app/data`

2. **Connect Volume to Service**:
   - Go to your backend service
   - Click "Settings" → "Volumes"
   - Connect the `curagenie-data` volume

### Step 5: Create Railway-Specific Files

Create a Railway-specific Dockerfile in the backend directory:

```dockerfile
# Railway Dockerfile for backend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for persistent volume
RUN mkdir -p /app/data /app/data/uploads

# Initialize database if it doesn't exist
RUN python -c "
import sqlite3
import os
db_path = '/app/data/curagenie_real.db'
if not os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    conn.execute('''CREATE TABLE IF NOT EXISTS genomic_variants (
        id INTEGER PRIMARY KEY,
        chromosome TEXT,
        position INTEGER,
        ref_allele TEXT,
        alt_allele TEXT,
        quality REAL,
        info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY,
        event_type TEXT,
        description TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS prs_scores (
        id INTEGER PRIMARY KEY,
        disease TEXT,
        score REAL,
        risk_category TEXT,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit()
    conn.close()
    print('Database initialized successfully')
"

# Expose port
EXPOSE $PORT

# Start command (Railway will override this)
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--host", "0.0.0.0", "--port", "$PORT"]
```

### Step 6: Deploy Backend

1. **Commit Railway Configuration**:

```powershell
# Add the Railway Dockerfile
git add backend/Dockerfile
git commit -m "Add Railway Dockerfile for backend"
git push origin main
```

2. **Deploy**:
   - Railway will automatically detect changes and deploy
   - Monitor deployment in Railway dashboard
   - Check logs for any errors

3. **Get Backend URL**:
   - Once deployed, copy your Railway backend URL
   - Format: `https://your-project-name.up.railway.app`

### Step 7: Test Backend Deployment

```powershell
# Test health endpoint (replace with your Railway URL)
curl https://your-project-name.up.railway.app/health

# Expected response:
# {"status":"healthy","service":"curagenie-api","version":"2.0.0-production"}
```

---

## ▲ PART 2: Frontend Deployment on Vercel

### Step 1: Update Frontend Environment

1. **Update CORS in Railway**:
   - Go back to Railway dashboard
   - Update `CORS_ORIGINS` variable to include your Vercel domain
   - You'll get this URL after Step 3 below

### Step 2: Create Vercel Account & Connect GitHub

1. **Sign up for Vercel**: Go to [vercel.com](https://vercel.com)
2. **Connect GitHub**: Authorize Vercel to access your repositories
3. **Import Project**: Click "New Project" → Select your `curagenie` repository

### Step 3: Configure Vercel Project

1. **Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

2. **Environment Variables**:
   In Vercel dashboard, go to "Settings" → "Environment Variables" and add:

```env
# Backend API (replace with your Railway URL)
NEXT_PUBLIC_API_URL=https://your-railway-project.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-railway-project.up.railway.app

# Application Info
NEXT_PUBLIC_APP_VERSION=2.0.0-production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_DEBUG=false

# Feature Flags
NEXT_PUBLIC_ENABLE_GENOMICS=true
NEXT_PUBLIC_ENABLE_MRI_ANALYSIS=true
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true

# File Upload Settings
NEXT_PUBLIC_MAX_FILE_SIZE=104857600
NEXT_PUBLIC_ALLOWED_FILE_TYPES=.vcf,.vcf.gz,.fastq,.fq,.fastq.gz,.fq.gz

# Performance
NEXT_PUBLIC_CACHE_TTL=300000
NEXT_PUBLIC_RETRY_ATTEMPTS=3

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Step 4: Deploy Frontend

1. **Deploy**:
   - Click "Deploy" in Vercel dashboard
   - Vercel will automatically build and deploy
   - Monitor build logs for any issues

2. **Get Frontend URL**:
   - Once deployed, copy your Vercel frontend URL
   - Format: `https://your-app-name.vercel.app`

### Step 5: Update CORS Settings

1. **Update Railway Backend**:
   - Go to Railway dashboard
   - Update `CORS_ORIGINS` environment variable:
   ```env
   CORS_ORIGINS=https://your-app-name.vercel.app,http://localhost:3000
   ```
   - Redeploy backend service

### Step 6: Test Full Application

```powershell
# Test frontend
curl https://your-app-name.vercel.app/api/health

# Test backend via frontend
curl https://your-app-name.vercel.app/

# Test full integration in browser
# Visit: https://your-app-name.vercel.app
```

---

## 🔧 Configuration Updates

### Custom Domain Setup (Optional)

**For Vercel Frontend:**
1. Go to Vercel project → "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS records as instructed

**For Railway Backend:**
1. Go to Railway project → "Settings" → "Domains"
2. Add custom domain
3. Configure DNS records

### Environment Variable Updates

After getting your URLs, update these variables:

**Railway Backend:**
```env
CORS_ORIGINS=https://your-custom-domain.com,https://your-app.vercel.app
```

**Vercel Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-railway-api.railway.app
```

---

## 🚀 Post-Deployment Steps

### 1. Verify All Endpoints

**Backend Health:**
```bash
curl https://your-railway-project.up.railway.app/health
curl https://your-railway-project.up.railway.app/api/features
```

**Frontend Health:**
```bash
curl https://your-vercel-app.vercel.app/api/health
```

### 2. Test Core Features

1. **File Upload**: Visit your app and test VCF/FASTQ upload
2. **Genome Browser**: Check variant visualization
3. **PRS Calculator**: Test polygenic risk score calculation
4. **AI Chatbot**: Test medical AI assistant
5. **Timeline**: Verify activity tracking

### 3. Performance Monitoring

**Railway Metrics:**
- Monitor CPU, memory, and network usage
- Check database size and query performance
- Monitor response times

**Vercel Analytics:**
- Enable Vercel Analytics in project settings
- Monitor Core Web Vitals
- Track user engagement

### 4. Set Up Monitoring Alerts

**Railway:**
1. Go to project → "Settings" → "Usage"
2. Set up usage alerts
3. Monitor deployment logs

**Vercel:**
1. Go to project → "Settings" → "Functions"
2. Monitor function execution
3. Set up error tracking

---

## 💾 Database Management

### Backup Your Data

```bash
# Connect to Railway container and backup database
railway login
railway link your-project-id
railway run sqlite3 /app/data/curagenie_real.db ".dump" > backup.sql
```

### Database Monitoring

1. **Size Monitoring**:
   - Check Railway volume usage regularly
   - Monitor database growth

2. **Performance**:
   - Monitor query execution times
   - Check for database locks

---

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**:
   ```bash
   # Check Railway CORS_ORIGINS setting
   # Ensure Vercel domain is included
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```

2. **File Upload Issues**:
   ```bash
   # Check Railway volume mount
   # Verify UPLOADS_DIR=/app/data/uploads
   # Check MAX_FILE_SIZE_MB setting
   ```

3. **Database Connection Errors**:
   ```bash
   # Check Railway volume is properly mounted
   # Verify DATABASE_PATH=/app/data/curagenie_real.db
   ```

4. **Build Failures**:
   ```bash
   # For Railway: Check build logs in dashboard
   # For Vercel: Check build logs in Functions tab
   ```

### Debug Commands

```bash
# Railway debugging
railway logs
railway shell

# Local testing
npm run dev  # Frontend
python main.py  # Backend
```

---

## 📊 Cost Estimates

### Railway (Backend)
- **Hobby Plan**: $5/month
  - 512 MB RAM, 1 GB disk
  - $0.000463/GB-hour for usage

### Vercel (Frontend)
- **Hobby Plan**: Free
  - 100 GB bandwidth
  - Unlimited static deployments

### Total Monthly Cost
- **Starter Setup**: ~$5/month
- **Production Setup**: ~$20-50/month (with custom domains, more resources)

---

## ✅ Deployment Checklist

Before going live:

- [ ] GitHub repository created and code pushed
- [ ] Railway project created and configured
- [ ] Railway persistent volume attached
- [ ] Railway environment variables set
- [ ] Railway backend deployed and healthy
- [ ] Vercel project created and configured  
- [ ] Vercel environment variables set
- [ ] Vercel frontend deployed successfully
- [ ] CORS settings updated between services
- [ ] Custom domains configured (if applicable)
- [ ] All health endpoints responding
- [ ] File upload functionality tested
- [ ] Database operations working
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented

---

## 🎉 Success!

Your CuraGenie application is now deployed on Railway + Vercel!

**Your Application URLs:**
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-project.up.railway.app
- **API Docs**: https://your-project.up.railway.app/docs

**Key Features Now Live:**
- 🧬 Real genomic data processing (VCF/FASTQ files)
- 📊 Interactive genome browser with variant visualization
- 🔬 Polygenic Risk Score calculations
- 🤖 AI-powered medical chatbot
- 📈 Patient timeline tracking
- 🖼️ MRI brain imaging analysis
- 🔒 Secure authentication and file handling

**Next Steps:**
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure custom domains
4. Implement regular backups
5. Monitor usage and scale as needed

Happy deploying! 🚀
