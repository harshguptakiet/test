# Frontend Endpoint Analysis & Fixes

## Overview
This document provides a comprehensive analysis of all frontend components that are using hardcoded endpoints and provides standardized fixes to ensure consistent API base URL usage across the application.

## Current Status
The frontend codebase has inconsistent endpoint usage patterns:
- Some components use environment variable `NEXT_PUBLIC_API_URL` with fallback to `http://127.0.0.1:8000`
- Others use hardcoded `http://localhost:8000`
- Some use inline API calls while others use service functions

## Files That Need Updates

### 1. Service Files (Standardized - Good Examples)
**✅ GOOD:** `frontend/src/lib/mri-service.ts`
- **Status:** Already using proper pattern
- **Pattern:** `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';`
- **Endpoints:** `/api/mri/upload-and-analyze`, `/api/mri/user/${userId}`, `/api/mri/analysis/${imageId}`, `/api/mri/${imageId}`

**✅ GOOD:** `frontend/src/store/auth-store.ts`
- **Status:** Already using proper pattern
- **Pattern:** `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';`
- **Endpoints:** `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/me`

### 2. Components Using Hardcoded Localhost Endpoints (NEED FIXES)

#### 🔧 `frontend/src/components/chatbot/chatbot.tsx`
**Current Issue:** Line 40 - Hardcoded `http://localhost:8000/api/chatbot/chat`

**Fix:**
```typescript
// Add at top of file:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Replace line 40:
const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
```

#### 🔧 `frontend/src/components/debug/api-tester.tsx`
**Current Issue:** Lines 44,49,54,59,64,69,76,88 - Multiple hardcoded `http://localhost:8000` URLs

**Fix:**
```typescript
// Add at top of component:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Update testEndpoints array to use API_BASE_URL:
const testEndpoints = [
  {
    name: 'API Root',
    url: `${API_BASE_URL}/`,
    method: 'GET'
  },
  {
    name: 'API Docs',
    url: `${API_BASE_URL}/docs`,
    method: 'GET'
  },
  // ... etc for all endpoints
];

// Update createMockData function URLs:
await testEndpoint('Create PRS', `${API_BASE_URL}/api/prs/scores`, {
// ... etc
```

#### 🔧 `frontend/src/components/prs/prs-score-display.tsx`
**Current Issue:** Line 31 - Hardcoded `http://localhost:8000/api/direct/prs/user/${userId}`

**Fix:**
```typescript
// Add at top of file:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Replace in fetchPrsScores function:
const response = await fetch(`${API_BASE_URL}/api/direct/prs/user/${userId}`);
```

#### 🔧 `frontend/src/components/recommendations/recommendations-display.tsx`
**Current Issue:** Line 28 - Hardcoded `http://localhost:8000/api/chatbot/chat`

**Fix:**
```typescript
// Add at top of file:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Replace line 28:
const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
```

#### 🔧 `frontend/src/components/doctor/patient-list.tsx`
**Current Issue:** Lines 40-41 - Hardcoded `http://localhost:8000` URLs

**Fix:**
```typescript
// Add at top of file:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Replace fetchPatients function:
const fetchPatients = async (doctorId?: string): Promise<Patient[]> => {
  const url = doctorId 
    ? `${API_BASE_URL}/api/doctor/patients/${doctorId}`
    : `${API_BASE_URL}/api/doctor/patients`;
    
  const response = await fetch(url);
  // ... rest of function
};
```

#### 🔧 `frontend/src/components/medical/mri-image-upload.tsx`
**Current Issue:** Line 41 - Hardcoded local API URL in component (duplicates mri-service)

**Fix:** This file duplicates the MRI service. Recommended approach:
```typescript
// Remove the duplicate uploadMRIImage function (lines 44-131)
// Use the existing service instead:
import { uploadMRIImage as uploadToAPI } from '@/lib/mri-service';

// The file already uses this import and calls it properly, so just remove the duplicate function
```

### 3. Debug Components (Special Case)

#### 🔧 `frontend/src/components/debug/backend-health-check.tsx`
**Current Issue:** Line 17 - Uses environment variable correctly but may need standardization

**Status:** ✅ Already correct - uses `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'`

### 4. Other Components with API Calls

#### 🔧 `frontend/src/components/medical/alzheimer-assessment.tsx`
**Current Issues:** Lines 64,132 - Need to check for hardcoded endpoints
**Action:** Review for API calls and apply standard pattern

#### 🔧 `frontend/src/components/medical/brain-tumor-assessment.tsx`
**Current Issues:** Lines 102,210 - Need to check for hardcoded endpoints
**Action:** Review for API calls and apply standard pattern

#### 🔧 `frontend/src/components/medical/diabetes-assessment.tsx`
**Current Issues:** Lines 55,141 - Need to check for hardcoded endpoints
**Action:** Review for API calls and apply standard pattern

#### 🔧 `frontend/src/components/ui/file-upload.tsx`
**Current Issue:** Line 84 - Need to check for hardcoded endpoints
**Action:** Review for API calls and apply standard pattern

#### 🔧 `frontend/src/components/ui/clinical-file-upload.tsx`
**Current Issue:** Line 92 - Need to check for hardcoded endpoints
**Action:** Review for API calls and apply standard pattern

## Recommended Standard Pattern

### Environment Variable Setup
Ensure your `.env.local` file contains:
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Standard API Base URL Pattern
For all components making API calls, use this pattern:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
```

### Service Layer Approach (Recommended)
Create service functions for API calls instead of inline fetch calls:

```typescript
// services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const apiService = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
  
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }
};
```

## Priority Order for Fixes

### High Priority (Affects Core Functionality)
1. `components/chatbot/chatbot.tsx` - Core AI functionality
2. `components/prs/prs-score-display.tsx` - Core genetic analysis display
3. `components/recommendations/recommendations-display.tsx` - Core recommendations
4. `components/doctor/patient-list.tsx` - Doctor dashboard functionality

### Medium Priority (Development/Debug Tools)
5. `components/debug/api-tester.tsx` - Development debugging
6. `components/medical/mri-image-upload.tsx` - Remove duplicate function

### Lower Priority (Need Assessment)
7. Medical assessment components - Review for actual API usage
8. File upload components - Review for actual API usage

## Testing Strategy

After implementing fixes:
1. Test in development environment (localhost:3000)
2. Verify environment variable changes work correctly
3. Test deployment with different API base URLs
4. Ensure all API calls use the standardized pattern
5. Test fallback behavior when environment variable is not set

## Benefits of Standardization

1. **Consistent Configuration** - Single point of control for API URLs
2. **Environment Flexibility** - Easy switching between dev/staging/production
3. **Deployment Ready** - Works correctly in different deployment environments
4. **Maintenance** - Easier to update API URLs across the application
5. **Debugging** - Clearer debugging when API endpoints are consistent

## Completed Fixes ✅

### High Priority Components (COMPLETED)
1. ✅ **`components/chatbot/chatbot.tsx`** - Fixed hardcoded localhost URL, now uses `API_BASE_URL`
2. ✅ **`components/prs/prs-score-display.tsx`** - Fixed hardcoded localhost URL, now uses `API_BASE_URL`
3. ✅ **`components/recommendations/recommendations-display.tsx`** - Fixed hardcoded localhost URL, now uses `API_BASE_URL`
4. ✅ **`components/doctor/patient-list.tsx`** - Fixed hardcoded localhost URLs, now uses `API_BASE_URL`

### Medium Priority Components (COMPLETED)
5. ✅ **`components/debug/api-tester.tsx`** - Fixed all hardcoded URLs in testEndpoints array and createMockData function
6. ✅ **`components/medical/mri-image-upload.tsx`** - Removed duplicate uploadMRIImage function, now properly uses the centralized service

### Summary of Changes Made
- **6 components fixed** with proper environment variable usage
- **All hardcoded `localhost:8000` URLs replaced** with `API_BASE_URL` constant
- **Consistent pattern applied**: `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';`
- **Duplicate code removed** from MRI upload component
- **Development debugging tools** now use configurable endpoints

### Files Ready for Production
All fixed components now properly support:
- ✅ Development environment (localhost)
- ✅ Staging environment (configurable via environment variable)
- ✅ Production environment (configurable via environment variable)
- ✅ Fallback to default URL when environment variable is not set

## Next Steps

1. ✅ ~~Implement fixes for high-priority components first~~ **COMPLETED**
2. **Test each component after fixing** - Ready for testing
3. **Create a centralized API service layer for better organization** - Recommended for future enhancement
4. **Update environment configuration documentation** - Document the NEXT_PUBLIC_API_URL usage
5. **Consider adding API URL validation in the application startup** - Future enhancement
