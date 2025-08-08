# 🧠 CuraGenie - AI-Powered Healthcare Platform

**Transform your healthcare experience with intelligent medical insights**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)

## 🌟 Features

### 🔬 Medical AI Analysis
- **Brain Tumor Detection** - Advanced CNN-based MRI scan analysis
- **Real-time Processing** - Instant medical image classification  
- **Multiple Tumor Types** - Detects Glioma, Meningioma, and other abnormalities
- **Confidence Scoring** - Provides accuracy metrics for each prediction

### 🧬 Genomic Analysis
- **VCF File Processing** - Comprehensive genetic variant analysis
- **PRS Calculations** - Polygenic Risk Score computation
- **Disease Prediction** - AI-powered health risk assessment
- **Personalized Reports** - Detailed genomic insights

### 💬 AI Healthcare Chatbot
- **Medical Queries** - Intelligent health-related Q&A
- **Symptom Analysis** - Preliminary health assessment
- **Treatment Suggestions** - Evidence-based recommendations
- **24/7 Availability** - Round-the-clock healthcare support

### 📊 Health Dashboard
- **Real-time Monitoring** - Live health metrics tracking
- **Interactive Visualizations** - Dynamic charts and graphs
- **Progress Tracking** - Historical health data analysis
- **Predictive Analytics** - Future health trend forecasting

## 🚀 Quick Start

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Backend (FastAPI)
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🎯 Deployment

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Backend (Railway/Render)
1. Connect your repository
2. Set Python environment
3. Use provided Dockerfile or auto-detection

## 📁 Project Structure

```
curagenie/
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   ├── public/            # Static assets
│   └── package.json
├── backend/               # FastAPI backend
│   ├── api/              # API routes
│   ├── core/             # Core functionality
│   ├── db/               # Database models
│   └── requirements.txt
└── README.md
```

## 🔧 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=sqlite:///./curagenie.db
JWT_SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
```

## 🏥 Medical Disclaimer

This platform is for educational and research purposes only. Always consult with qualified healthcare professionals for medical decisions.

---

Built with ❤️ for advancing personalized healthcare through AI and genomics.
