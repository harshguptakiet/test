# 🚀 CuraGenie - Production Ready Deployment Guide

Complete deployment guide for CuraGenie - AI-Powered Healthcare Platform with Real Genomic Processing

## 📋 Project Overview

CuraGenie is a production-ready healthcare platform featuring:
- **Backend**: FastAPI with real VCF/FASTQ genomic processing
- **Frontend**: Next.js 15 with modern React components and TypeScript
- **Database**: SQLite (production-ready) with real genomic data storage
- **Features**: PRS calculations, genome browser, AI chatbot, MRI analysis, file upload

## ✅ Production Features

- ✅ **Real Genomic Processing**: VCF and FASTQ file analysis
- ✅ **PRS Calculations**: Polygenic Risk Score calculations
- ✅ **Interactive Genome Browser**: Chart-based variant visualization 
- ✅ **AI Medical Chatbot**: Context-aware medical assistance
- ✅ **MRI Analysis**: Brain imaging analysis capabilities
- ✅ **Timeline Events**: Real user activity tracking
- ✅ **Production Containers**: Optimized Docker configurations
- ✅ **Health Checks**: Built-in monitoring endpoints
- ✅ **Security Headers**: Production security configurations
- ✅ **Error Handling**: Comprehensive error management

## 🏗️ Project Structure

```
curagenie-cleaned/
├── backend/                  # FastAPI backend
│   ├── main.py              # Main application entry
│   ├── genomic_utils.py     # Real genomic processing
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Production container
│   └── .env.example        # Environment template
├── frontend/                # Next.js frontend
│   ├── src/                 # Application source
│   ├── package.json         # Node dependencies
│   ├── Dockerfile          # Production container
│   ├── next.config.js       # Production config
│   └── .env.example        # Environment template
├── docker-compose.yml       # Production orchestration
└── DEPLOYMENT_GUIDE.md     # This file
```

## 🐳 Quick Production Deployment

### 1. Prerequisites
- Docker & Docker Compose
- Git
- Domain name (optional)

### 2. Deploy with Docker Compose

```bash
# Clone repository
git clone <your-repo-url>
cd curagenie-cleaned

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit environment files with your settings
# (see configuration sections below)

# Deploy
docker-compose up --build -d

# Check health
docker-compose ps
curl http://localhost:8000/health
curl http://localhost:3000/api/health
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration

### Backend Environment (`backend/.env`)

```env
# Database
DATABASE_PATH=curagenie_real.db

# API Configuration  
PORT=8000
DEBUG=false
ENVIRONMENT=production
SECRET_KEY=your-super-secret-key-minimum-32-characters

# CORS Settings
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
CORS_ALLOW_CREDENTIALS=true

# File Upload
MAX_FILE_SIZE_MB=100
UPLOADS_DIR=uploads
ALLOWED_FILE_TYPES=.vcf,.vcf.gz,.fastq,.fq,.fastq.gz,.fq.gz

# Genomic Processing
ENABLE_REAL_GENOMIC_ANALYSIS=true
PRS_DISEASES=diabetes,alzheimer,heart_disease
MAX_VARIANTS_STORE=1000

# Optional OpenAI (for enhanced chatbot)
OPENAI_API_KEY=your-openai-key-optional
USE_OPENAI_CHATBOT=false

# Logging
LOG_LEVEL=INFO
```

### Frontend Environment (`frontend/.env.local`)

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

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
```

## ☁️ Cloud Deployment Options

### Option 1: Railway (Recommended)

**Backend on Railway:**
1. Connect GitHub repository to Railway
2. Select `backend` folder as root directory  
3. Set environment variables in Railway dashboard
4. Deploy automatically

**Frontend on Vercel:**
1. Connect GitHub repository to Vercel
2. Select `frontend` folder as root directory
3. Set `NEXT_PUBLIC_API_URL` to Railway backend URL
4. Deploy automatically

### Option 2: DigitalOcean App Platform

1. Create new App on DigitalOcean
2. Connect GitHub repository
3. Configure two services:
   - Backend: Python service with Dockerfile
   - Frontend: Static site with Node.js build

### Option 3: AWS ECS/Fargate

1. Push Docker images to ECR
2. Create ECS task definitions
3. Set up Application Load Balancer
4. Deploy with Fargate serverless containers

## 🔐 Security Configuration

### Production Security Checklist

- [ ] **Change all default secrets and keys**
- [ ] **Configure HTTPS/SSL certificates**
- [ ] **Set strict CORS origins (no wildcards)**
- [ ] **Use environment variables for sensitive data**
- [ ] **Enable security headers**
- [ ] **Configure firewall rules**
- [ ] **Use non-root containers**
- [ ] **Regular dependency updates**

### SSL/HTTPS with Nginx

```nginx
# /etc/nginx/sites-available/curagenie
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API (FastAPI)  
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 📊 Monitoring & Health Checks

### Built-in Health Endpoints

- **Backend Health**: `GET /health`
- **Frontend Health**: `GET /api/health`
- **Backend API Features**: `GET /api/features`

### Health Check Response Example

```json
{
  "status": "healthy",
  "service": "curagenie-api",
  "version": "2.0.0-production",
  "database": "connected",
  "genomic_processing": "active",
  "active_connections": 0
}
```

### Docker Health Checks

```bash
# Check container health
docker-compose ps

# View health check logs
docker inspect <container_name> | jq '.[0].State.Health'

# Manual health checks
curl -f http://localhost:8000/health
curl -f http://localhost:3000/api/health
```

## 📈 Performance Optimization

### Backend Optimization

1. **Gunicorn Configuration** (included in Dockerfile):
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Database Optimization**:
   - SQLite WAL mode for better concurrency
   - Regular VACUUM operations
   - Proper indexing on genomic variants

3. **Caching**:
   - Response caching for static data
   - File upload result caching

### Frontend Optimization

1. **Next.js Production Build**:
   ```bash
   npm run build
   npm start
   ```

2. **Bundle Optimization**:
   - Code splitting
   - Tree shaking
   - Image optimization
   - Static asset compression

3. **Performance Monitoring**:
   - Built-in Next.js analytics
   - Core Web Vitals tracking

## 🗄️ Database Management

### SQLite Production Setup

```bash
# Initialize database
docker-compose exec backend python init_db.py

# Backup database
docker-compose exec backend sqlite3 curagenie_real.db ".backup backup_$(date +%Y%m%d).db"

# Optimize database
docker-compose exec backend sqlite3 curagenie_real.db "VACUUM; REINDEX;"
```

### PostgreSQL Migration (Optional)

For high-traffic production, migrate to PostgreSQL:

```python
# In backend/main.py, update database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/curagenie")
```

## 🔄 Updates & Maintenance

### Rolling Updates

```bash
# 1. Backup data
docker-compose exec backend sqlite3 curagenie_real.db ".backup backup_pre_update.db"

# 2. Pull latest changes
git pull origin main

# 3. Rebuild and restart with zero-downtime
docker-compose up --build --force-recreate --no-deps backend
docker-compose up --build --force-recreate --no-deps frontend

# 4. Verify health
curl http://localhost:8000/health
curl http://localhost:3000/api/health
```

### Automated Deployments

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Your deployment commands here
          ssh user@server 'cd /app && git pull && docker-compose up --build -d'
```

## 🐛 Troubleshooting

### Common Issues

1. **Container won't start**:
   ```bash
   # Check logs
   docker-compose logs -f backend
   docker-compose logs -f frontend
   
   # Rebuild from scratch
   docker-compose down -v
   docker system prune -a
   docker-compose up --build
   ```

2. **Database connection errors**:
   ```bash
   # Check database file
   docker-compose exec backend ls -la curagenie_real.db
   
   # Reinitialize if needed
   docker-compose exec backend python init_db.py
   ```

3. **CORS errors**:
   - Verify `CORS_ORIGINS` in backend environment
   - Check frontend `NEXT_PUBLIC_API_URL` configuration

4. **File upload issues**:
   - Check uploads directory permissions
   - Verify `MAX_FILE_SIZE_MB` setting
   - Monitor disk space

### Debug Mode

```bash
# Enable debug logging temporarily
docker-compose exec backend env DEBUG=true LOG_LEVEL=DEBUG python main.py

# Check resource usage
docker stats
```

## 📋 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] SSL certificates installed and configured
- [ ] Database backups automated
- [ ] Monitoring and alerting set up
- [ ] Security headers configured
- [ ] Error handling tested
- [ ] Load testing completed
- [ ] Domain name configured
- [ ] CDN configured (optional)
- [ ] Log rotation configured
- [ ] Firewall rules applied
- [ ] Health checks working
- [ ] Documentation updated

## 🎯 Testing Your Deployment

### Functionality Tests

```bash
# Backend API tests
curl http://localhost:8000/health
curl http://localhost:8000/api/features

# Upload test (with actual VCF file)
curl -X POST -F "file=@test.vcf" http://localhost:8000/api/upload/genomic

# Frontend tests
curl http://localhost:3000/api/health
curl -I http://localhost:3000/ | grep "200 OK"
```

### Load Testing

```bash
# Install hey for load testing
go install github.com/rakyll/hey@latest

# Test backend API
hey -n 1000 -c 10 http://localhost:8000/health

# Test frontend
hey -n 1000 -c 10 http://localhost:3000/
```

## 📞 Support & Maintenance

### Log Monitoring

```bash
# Real-time log monitoring
docker-compose logs -f --tail=100

# Search logs
docker-compose logs | grep ERROR
docker-compose logs | grep "genomic variants"
```

### Performance Monitoring

```bash
# Container resource usage
docker stats curagenie-backend curagenie-frontend

# Database size monitoring  
docker-compose exec backend ls -lh curagenie_real.db
```

## 🏷️ Version Information

- **CuraGenie**: 2.0.0-production
- **Backend**: FastAPI 0.104.1, Python 3.11+
- **Frontend**: Next.js 15.4.5, Node.js 20+
- **Database**: SQLite (production) / PostgreSQL (optional)
- **Containerization**: Docker, Docker Compose

---

## 🎉 You're Ready for Production!

Your CuraGenie platform is now production-ready with:
- Real genomic data processing (VCF/FASTQ)
- Interactive genome browser with chart visualization
- Polygenic Risk Score calculations
- AI-powered medical chatbot
- Secure containerized deployment
- Comprehensive health monitoring
- Production-grade security configurations

**Access your deployed application:**
- **Frontend**: http://localhost:3000 (or your domain)
- **Backend API**: http://localhost:8000 (or your domain)
- **API Documentation**: http://localhost:8000/docs

Happy deploying! 🚀
