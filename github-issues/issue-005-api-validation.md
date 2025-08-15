# Issue #005: Add Comprehensive API Validation and Input Sanitization

## 📋 **Issue Type**
- [x] Enhancement
- [x] Bug Fix
- [ ] Feature Request
- [ ] Documentation

## 🎯 **Priority**
**High** - Security vulnerability and data quality issue

## 📝 **Description**
The CuraGenie API currently has insufficient input validation and sanitization, leading to potential security vulnerabilities, data quality issues, and poor user experience. Many endpoints accept input without proper validation, type checking, or sanitization.

## 🔍 **Current Problems**

### 1. **Missing Input Validation**
```python
# Found in backend/main.py - No validation on file uploads
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = Form(...)):
    # ❌ No validation on user_id format/existence
    # ❌ No file type validation beyond filename
    # ❌ No file size validation
    # ❌ No content validation for genomic files
    pass
```

### 2. **SQL Injection Vulnerabilities**
```python
# Found in main.py line 184-190
def authenticate_user(email: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
    # ✅ Using parameterized queries (good)
    # ❌ But no input validation on email format, password requirements
```

### 3. **Inconsistent Data Models**
- Some endpoints use Pydantic models, others accept raw form data
- Missing validation for genomic file formats (VCF, FASTQ)
- No validation for MRI image formats and sizes
- Inconsistent error responses for validation failures

### 4. **File Upload Security Issues**
```python
# File upload without proper validation
ALLOWED_FILE_TYPES = ['.vcf', '.fastq', '.fq', '.vcf.gz', '.fastq.gz']
# ❌ Only checks filename extension, not actual file content
# ❌ No MIME type validation
# ❌ No file size limits enforced
# ❌ No malware scanning
```

### 5. **Missing Rate Limiting and DoS Protection**
- No rate limiting on API endpoints
- No request size limits
- No protection against file upload abuse
- Missing authentication rate limiting

### 6. **Data Sanitization Issues**
- User input not sanitized for XSS prevention
- File names not sanitized before storage
- No validation of genomic data before processing
- Missing input length validation

## 🎯 **Proposed Solution**

### 1. **Comprehensive Input Validation System**
```python
# Enhanced validation models
from pydantic import BaseModel, validator, Field
from typing import Optional, List
import re

class UserRegistrationRequest(BaseModel):
    email: str = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=8, description="Password")
    role: str = Field(default="patient", description="User role")
    
    @validator('email')
    def validate_email(cls, v):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain number')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v
```

### 2. **File Upload Validation**
```python
class FileUploadValidator:
    ALLOWED_GENOMIC_EXTENSIONS = {'.vcf', '.vcf.gz', '.fastq', '.fastq.gz', '.fq', '.fq.gz'}
    ALLOWED_MRI_EXTENSIONS = {'.dcm', '.nii', '.nii.gz', '.jpg', '.jpeg', '.png'}
    MAX_GENOMIC_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    MAX_MRI_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    
    @staticmethod
    def validate_genomic_file(file: UploadFile) -> dict:
        # Validate file extension
        file_ext = Path(file.filename).suffixes
        ext = ''.join(file_ext).lower()
        if ext not in FileUploadValidator.ALLOWED_GENOMIC_EXTENSIONS:
            raise ValueError(f"Invalid file type. Allowed: {', '.join(FileUploadValidator.ALLOWED_GENOMIC_EXTENSIONS)}")
        
        # Validate file size
        if file.size > FileUploadValidator.MAX_GENOMIC_FILE_SIZE:
            raise ValueError(f"File too large. Maximum size: {FileUploadValidator.MAX_GENOMIC_FILE_SIZE // (1024*1024)}MB")
        
        # Validate MIME type
        allowed_mimes = ['text/plain', 'application/gzip', 'application/x-gzip']
        if file.content_type not in allowed_mimes:
            raise ValueError(f"Invalid MIME type: {file.content_type}")
        
        # Validate file content (basic check)
        FileUploadValidator._validate_genomic_content(file, ext)
        
        return {
            "filename": secure_filename(file.filename),
            "size": file.size,
            "type": ext,
            "mime_type": file.content_type
        }
    
    @staticmethod
    def _validate_genomic_content(file: UploadFile, extension: str):
        # Read first few lines to validate format
        content = file.file.read(1024).decode('utf-8', errors='ignore')
        file.file.seek(0)  # Reset file pointer
        
        if extension.startswith('.vcf'):
            if not content.startswith('##fileformat=VCF'):
                raise ValueError("Invalid VCF file format")
        elif extension.startswith('.fastq') or extension.startswith('.fq'):
            if not content.startswith('@'):
                raise ValueError("Invalid FASTQ file format")
```

### 3. **Enhanced API Endpoints with Validation**
```python
@app.post("/api/genomic-data/upload", response_model=UploadResponse)
async def upload_genomic_file(
    file: UploadFile = File(...),
    user_id: int = Form(..., description="User ID"),
    file_type: str = Form(..., description="File type (vcf, fastq)"),
    description: Optional[str] = Form(None, max_length=500),
    current_user: User = Depends(get_current_user)
):
    """Upload genomic data file with comprehensive validation"""
    
    # Validate user authorization
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to upload for this user")
    
    # Validate file
    try:
        file_info = FileUploadValidator.validate_genomic_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Sanitize description
    if description:
        description = sanitize_html(description.strip())
    
    # Process upload...
```

### 4. **Request Rate Limiting**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login(request: Request, login_data: UserLoginRequest):
    # Authentication logic
    pass

@app.post("/api/genomic-data/upload")
@limiter.limit("10/hour")  # 10 file uploads per hour
async def upload_file(request: Request, ...):
    # Upload logic
    pass
```

## 🛠️ **Implementation Tasks**

### Phase 1: Input Validation Framework
- [ ] Create comprehensive Pydantic models for all API endpoints
- [ ] Implement custom validators for domain-specific data (emails, genomic files, etc.)
- [ ] Add input sanitization utilities (HTML, SQL, file names)
- [ ] Create validation error handling middleware
- [ ] Add request size limits

### Phase 2: File Upload Security
- [ ] Implement secure file upload validation
- [ ] Add MIME type checking beyond filename extensions
- [ ] Create file content validation for genomic formats
- [ ] Add virus scanning integration (ClamAV)
- [ ] Implement secure file naming and storage

### Phase 3: API Security Enhancements
- [ ] Add rate limiting to all public endpoints
- [ ] Implement request throttling for heavy operations
- [ ] Add CSRF protection for state-changing operations
- [ ] Create input length validation for all text fields
- [ ] Add IP-based blocking for malicious activity

### Phase 4: Authentication & Authorization Validation
- [ ] Enhance password complexity requirements
- [ ] Add account lockout after failed login attempts
- [ ] Implement proper session validation
- [ ] Add role-based permission checking
- [ ] Create audit logging for security events

### Phase 5: Data Quality Validation
- [ ] Add genomic data format validation (VCF, FASTQ standards)
- [ ] Implement MRI image validation (DICOM standards)
- [ ] Create data integrity checks
- [ ] Add biological data range validation
- [ ] Implement checksum validation for file integrity

## 🔒 **Security Enhancements**

### Input Sanitization
```python
import html
import re
from typing import Any

class InputSanitizer:
    @staticmethod
    def sanitize_html(text: str) -> str:
        """Remove HTML tags and escape special characters"""
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Escape HTML entities
        return html.escape(text)
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Create safe filename for storage"""
        # Remove path traversal attempts
        filename = os.path.basename(filename)
        # Remove dangerous characters
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        # Limit length
        return filename[:255]
    
    @staticmethod
    def validate_genomic_coordinates(chrom: str, pos: int) -> bool:
        """Validate genomic coordinates are within reasonable ranges"""
        valid_chroms = [str(i) for i in range(1, 23)] + ['X', 'Y', 'MT']
        return chrom in valid_chroms and 1 <= pos <= 300_000_000
```

### Request Validation Middleware
```python
async def request_validation_middleware(request: Request, call_next):
    """Middleware to validate all incoming requests"""
    
    # Check request size
    content_length = request.headers.get('content-length')
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        raise HTTPException(status_code=413, detail="Request too large")
    
    # Check for suspicious patterns
    user_agent = request.headers.get('user-agent', '')
    if 'sqlmap' in user_agent.lower() or 'nikto' in user_agent.lower():
        raise HTTPException(status_code=403, detail="Suspicious activity detected")
    
    response = await call_next(request)
    return response
```

## 🧪 **Testing Strategy**

### Validation Testing
```python
# Test cases for input validation
class TestInputValidation:
    def test_email_validation(self):
        # Valid emails
        assert validate_email("user@example.com") == "user@example.com"
        assert validate_email("User@Example.COM") == "user@example.com"
        
        # Invalid emails
        with pytest.raises(ValueError):
            validate_email("invalid-email")
        with pytest.raises(ValueError):
            validate_email("user@")
        with pytest.raises(ValueError):
            validate_email("@example.com")
    
    def test_password_validation(self):
        # Valid passwords
        assert validate_password("StrongP@ss123")
        
        # Invalid passwords
        with pytest.raises(ValueError):
            validate_password("weak")  # Too short
        with pytest.raises(ValueError):
            validate_password("alllowercase123")  # No uppercase
    
    def test_file_upload_validation(self):
        # Valid file uploads
        mock_vcf_file = create_mock_vcf_file()
        result = FileUploadValidator.validate_genomic_file(mock_vcf_file)
        assert result["type"] == ".vcf"
        
        # Invalid file uploads
        mock_exe_file = create_mock_exe_file()
        with pytest.raises(ValueError):
            FileUploadValidator.validate_genomic_file(mock_exe_file)
```

### Security Testing
- [ ] SQL injection testing on all endpoints
- [ ] XSS testing on input fields
- [ ] File upload security testing (malicious files)
- [ ] Rate limiting verification
- [ ] Authentication bypass testing

### Performance Testing
- [ ] Load testing with validation overhead
- [ ] File upload performance with large files
- [ ] Rate limiting behavior under load
- [ ] Validation performance benchmarks

## 📊 **Success Metrics**
- **Security**: Zero successful injection attacks in testing
- **Data Quality**: 100% of uploaded files meet format standards
- **User Experience**: Clear validation error messages with <200ms response
- **Performance**: Validation adds <50ms overhead per request
- **Reliability**: Rate limiting prevents DoS attacks

## 🔗 **Related Files**
- `backend/main.py` - Add validation to all endpoints
- `backend/api/` - Enhance all API modules with validation
- `backend/schemas/` - Create comprehensive validation schemas
- `backend/core/validation.py` - New validation utilities module
- `backend/core/security.py` - Security middleware and rate limiting
- `frontend/src/lib/validation.ts` - Client-side validation

## 🎯 **Acceptance Criteria**
- [ ] All API endpoints have proper input validation
- [ ] File uploads are secure and validated
- [ ] Rate limiting prevents abuse
- [ ] Input sanitization prevents XSS and injection attacks
- [ ] Validation errors provide clear, helpful messages
- [ ] Performance impact of validation is minimal
- [ ] Security testing passes all vulnerability checks
- [ ] Documentation covers all validation rules

## ⚠️ **Implementation Considerations**
- **Backward Compatibility**: Ensure existing clients continue to work
- **Performance**: Validation should not significantly impact response times
- **User Experience**: Validation errors should be helpful, not frustrating
- **Security**: Balance security with usability

## 🚨 **Security Priority**
This issue addresses critical security vulnerabilities including:
- File upload attacks
- Input injection vulnerabilities  
- DoS through resource exhaustion
- Data quality and integrity issues

**Estimated Effort**: 2-3 weeks
**Dependencies**: Issue #001 (Error handling for validation errors)
**Risk Level**: Medium (security improvements, minimal breaking changes)
