# Issue #002: Fix Inconsistent Authentication and Authorization System

## 📋 **Issue Type**
- [x] Bug Fix
- [x] Enhancement
- [ ] Feature Request
- [ ] Documentation

## 🎯 **Priority**
**Critical** - Security vulnerability and user experience issue

## 📝 **Description**
The CuraGenie platform has inconsistent authentication implementation across different parts of the system. There are multiple authentication approaches being used simultaneously, creating security vulnerabilities, poor user experience, and maintenance challenges.

## 🔍 **Current Problems**

### 1. **Multiple Authentication Systems**
- Simple email/password matching in `main.py` (line 184-190)
- JWT-based authentication in `core/auth.py`
- Manual authentication bypass in debug components
- Session-based auth store in frontend

### 2. **Security Vulnerabilities**
```python
# FOUND IN: backend/main.py line 184-190
def authenticate_user(email: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
    # ❌ Plain text password comparison - MAJOR SECURITY ISSUE
    user = cursor.fetchone()
    conn.close()
    return user
```

### 3. **Inconsistent User Models**
- `main.py` uses raw SQL with simple user structure
- `core/auth.py` references `User` model from ORM
- Frontend expects different user object structure
- Database schema mismatch between models

### 4. **Missing Password Security**
- Passwords stored in plain text in main authentication
- No password hashing in simple auth flow
- No password complexity requirements
- No password reset functionality

### 5. **Session Management Issues**
- JWT tokens not consistently validated
- No token refresh mechanism
- Manual demo authentication bypasses security
- Session persistence inconsistencies

## 🎯 **Proposed Solution**

### 1. **Unify Authentication System**
Remove the simple auth system and standardize on JWT + proper password hashing:

```python
# Standardized authentication flow
class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.jwt_handler = JWTHandler()
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = await self.get_user_by_email(email)
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        return user
    
    def create_tokens(self, user: User) -> TokenResponse:
        access_token = self.jwt_handler.create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role}
        )
        refresh_token = self.jwt_handler.create_refresh_token(
            data={"sub": user.email, "user_id": user.id}
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=3600
        )
```

### 2. **Database Migration**
Migrate existing plain text passwords to hashed passwords:

```python
# Migration script
async def migrate_plain_text_passwords():
    users_with_plain_passwords = await get_users_with_plain_passwords()
    for user in users_with_plain_passwords:
        hashed_password = hash_password(user.password)
        await update_user_password_hash(user.id, hashed_password)
        logger.info(f"Migrated password for user {user.email}")
```

### 3. **Frontend Authentication Standardization**
```typescript
// Unified auth store
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async refreshToken(): Promise<void> {
    if (!this.refreshToken) throw new Error('No refresh token');
    const response = await api.post('/auth/refresh', { 
      refresh_token: this.refreshToken 
    });
    this.setTokens(response.data.access_token, response.data.refresh_token);
  }
}
```

## 🛠️ **Implementation Tasks**

### Phase 1: Backend Authentication Cleanup
- [ ] Remove plain text authentication from `main.py`
- [ ] Standardize on JWT authentication system
- [ ] Implement proper password hashing for existing auth
- [ ] Create migration script for existing plain text passwords
- [ ] Add password complexity validation
- [ ] Implement token refresh endpoint

### Phase 2: Database Schema Fixes
- [ ] Ensure user table has `hashed_password` column
- [ ] Add indexes for authentication queries
- [ ] Add `password_reset_token` and `email_verification` fields
- [ ] Create proper foreign key constraints
- [ ] Add user role and permission management

### Phase 3: Frontend Authentication
- [ ] Remove manual demo authentication bypasses
- [ ] Implement proper JWT token storage and management
- [ ] Add automatic token refresh logic
- [ ] Create proper authentication error handling
- [ ] Implement password reset flow
- [ ] Add email verification process

### Phase 4: Security Enhancements
- [ ] Add rate limiting for authentication endpoints
- [ ] Implement account lockout after failed attempts
- [ ] Add two-factor authentication support
- [ ] Create audit logging for authentication events
- [ ] Implement proper session timeout handling

### Phase 5: User Management Features
- [ ] Add password reset functionality
- [ ] Implement email verification
- [ ] Create user profile management
- [ ] Add role-based access control (RBAC)
- [ ] Implement user deactivation/deletion

## 🔒 **Security Improvements**

### Password Security
- [ ] BCrypt hashing with proper salt rounds (12+)
- [ ] Password complexity requirements (8+ chars, mixed case, numbers, symbols)
- [ ] Password history to prevent reuse
- [ ] Secure password reset with time-limited tokens

### Token Security  
- [ ] Short-lived access tokens (15 minutes)
- [ ] Long-lived refresh tokens (7 days) with rotation
- [ ] Proper token validation and error handling
- [ ] Token blacklisting for logout/security events

### API Security
- [ ] Rate limiting on authentication endpoints
- [ ] CORS configuration for production domains only
- [ ] SQL injection prevention (prepared statements)
- [ ] Input validation and sanitization

## 🧪 **Testing Strategy**

### Unit Tests
- [ ] Authentication service methods
- [ ] Password hashing and verification
- [ ] JWT token creation and validation
- [ ] Database migration scripts

### Integration Tests
- [ ] Complete authentication flow
- [ ] Token refresh mechanism
- [ ] Password reset process
- [ ] Role-based access control

### Security Tests
- [ ] SQL injection attempts
- [ ] Password brute force attacks
- [ ] Token manipulation attempts
- [ ] CORS policy validation
- [ ] Rate limiting verification

## 📊 **Success Metrics**
- **Security**: Zero plain text passwords in database
- **Consistency**: Single authentication system across all components
- **Performance**: Authentication response time under 200ms
- **User Experience**: Seamless login/logout with proper error messages
- **Reliability**: Token refresh success rate above 99%

## 🔗 **Related Files**
- `backend/main.py` - Remove simple auth, lines 184-190
- `backend/core/auth.py` - Enhance JWT authentication
- `backend/db/auth_models.py` - User model standardization
- `frontend/src/store/auth-store.ts` - Frontend auth state
- `frontend/src/components/auth/` - Authentication components
- `backend/alembic/` - Database migration files

## 🎯 **Acceptance Criteria**
- [ ] No plain text passwords in the system
- [ ] Single, consistent authentication mechanism
- [ ] Proper JWT token handling with refresh
- [ ] Password security follows industry standards
- [ ] Authentication errors are handled gracefully
- [ ] All authentication flows work end-to-end
- [ ] Security tests pass with no vulnerabilities
- [ ] Performance benchmarks are met

## ⚠️ **Migration Risks**
- **Data Loss**: Existing user passwords need careful migration
- **Downtime**: Database schema changes may require maintenance window
- **User Impact**: Users may need to reset passwords if migration fails
- **Token Invalidation**: Existing sessions will be invalidated

## 🚨 **Critical Security Note**
This issue addresses a **critical security vulnerability** where passwords are stored and compared in plain text. This should be treated as the highest priority security fix.

**Estimated Effort**: 2-3 weeks  
**Dependencies**: Database migration planning
**Risk Level**: Medium (careful migration required)
