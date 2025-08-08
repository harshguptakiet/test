# 🧪 CuraGenie Local Testing Guide

## 🚀 Quick Start

### Method 1: Automated Startup (Recommended)
```bash
# Double-click this file to start both services
start-all.bat
```

### Method 2: Manual Startup

#### Step 1: Start Backend
```bash
# Open terminal 1
cd C:\Users\xhgme\curagenie-cleaned
.\start-backend.bat
```

#### Step 2: Start Frontend
```bash
# Open terminal 2
cd C:\Users\xhgme\curagenie-cleaned  
.\start-frontend.bat
```

## 🔗 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:8000 | API endpoints |
| **API Documentation** | http://localhost:8000/docs | Interactive API docs |
| **Health Check** | http://localhost:8000/health | Backend status |

## ✅ Testing Checklist

### 1. Backend Testing

#### Basic API Health
- [ ] Visit http://localhost:8000 - Should show API info
- [ ] Visit http://localhost:8000/health - Should show "healthy" status  
- [ ] Visit http://localhost:8000/docs - Should show Swagger documentation

#### Test API Endpoints
```bash
# Test root endpoint
curl http://localhost:8000/

# Test health check  
curl http://localhost:8000/health

# Test auth endpoint
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### 2. Frontend Testing

#### Application Load
- [ ] Visit http://localhost:3000 - Should show CuraGenie homepage
- [ ] Navigation works (header, sidebar, pages)
- [ ] No console errors in browser DevTools
- [ ] Responsive design works on different screen sizes

#### Core Features
- [ ] **Authentication**: Login/Register pages load
- [ ] **Dashboard**: Main dashboard displays correctly
- [ ] **File Upload**: Upload components render
- [ ] **Visualizations**: Charts and graphs load
- [ ] **Chatbot**: Chat interface is accessible
- [ ] **Doctor Portal**: Healthcare provider views work

### 3. Integration Testing

#### API Communication
- [ ] Frontend successfully connects to backend
- [ ] API calls return expected responses
- [ ] CORS is configured correctly
- [ ] Real-time features (WebSocket) work

#### Database
- [ ] SQLite database is created (curagenie.db)
- [ ] Tables are created successfully
- [ ] User registration creates database entries
- [ ] Data persistence works across restarts

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Backend Won't Start
```
Error: Module not found
```
**Solution**: Activate virtual environment and install dependencies:
```bash
cd C:\Users\xhgme\curagenie-cleaned\backend
.\venv\Scripts\Activate.ps1
pip install -r requirements-test.txt
```

#### Frontend Build Errors
```
Error: Cannot resolve module
```
**Solution**: Clear cache and reinstall:
```bash
cd C:\Users\xhgme\curagenie-cleaned\frontend
rm -rf node_modules package-lock.json
npm install
```

#### CORS Errors
```
Access to fetch at 'http://localhost:8000' blocked by CORS policy
```
**Solution**: Check backend CORS configuration in `.env`:
```bash
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Database Issues
```
SQLAlchemy error: no such table
```
**Solution**: Delete database and restart backend:
```bash
cd C:\Users\xhgme\curagenie-cleaned\backend
del curagenie.db
# Restart backend - tables will be recreated
```

#### Port Already in Use
```
Error: Port 8000 is already in use
```
**Solution**: Kill existing processes:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Or use different ports in startup scripts
```

## 📊 What to Expect

### Backend (Minimal Mode)
Since some ML dependencies aren't installed, the backend will run in "minimal mode":
- ✅ Core API endpoints work
- ✅ Authentication and user management
- ✅ Database operations
- ✅ File upload endpoints
- ⚠️ ML features may show placeholder responses
- ⚠️ Some advanced features may be limited

This is **expected** for local testing - the cleaned structure ensures deployment-ready code!

### Frontend (Full Features)
All UI components should work normally:
- ✅ Complete dashboard interface
- ✅ All page routes and navigation
- ✅ Responsive design
- ✅ Interactive components
- ✅ Form submissions and validations

## 🎯 Test Scenarios

### User Journey Testing

#### 1. New User Registration
1. Go to http://localhost:3000
2. Click "Sign Up" or navigate to registration
3. Fill out registration form
4. Verify user is created in database
5. Test login with new credentials

#### 2. File Upload Workflow  
1. Login to dashboard
2. Navigate to upload section
3. Try uploading a test file
4. Verify upload progress and completion
5. Check if file appears in dashboard

#### 3. Dashboard Navigation
1. Login to application
2. Test all main navigation items:
   - Dashboard home
   - Visualizations
   - Reports
   - Chatbot
   - Settings
3. Verify each page loads without errors

#### 4. Doctor Portal
1. Access doctor dashboard
2. Test patient management features
3. Verify different role permissions

## 📝 Testing Notes

### Performance
- Frontend should load within 3-5 seconds
- API responses should be under 1 second
- No memory leaks during extended use

### Browser Compatibility
Test on:
- [ ] Chrome (recommended for development)
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if on Mac)

### Mobile Responsiveness
Test viewport sizes:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024) 
- [ ] Mobile (375x667)

## 🎉 Success Criteria

Your local setup is working correctly if:

1. ✅ **Backend starts** without critical errors
2. ✅ **Frontend loads** and displays properly  
3. ✅ **API documentation** is accessible
4. ✅ **Basic navigation** works in the frontend
5. ✅ **Database connection** is established
6. ✅ **No CORS errors** in browser console

## 📞 Next Steps

Once local testing is successful:

1. **Deploy to staging** environment using deployment guide
2. **Test with real data** and API keys
3. **Load testing** for production readiness
4. **Security review** of all endpoints
5. **User acceptance testing** with stakeholders

---

## 🆘 Need Help?

If you encounter issues:

1. Check the console logs (both terminal and browser)
2. Verify all services are running on correct ports  
3. Ensure environment files are configured properly
4. Try restarting services in clean terminals
5. Check the troubleshooting section above

**Your cleaned CuraGenie project is ready for local testing! 🎯**
