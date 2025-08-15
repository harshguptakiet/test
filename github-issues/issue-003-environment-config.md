# Issue #003: Implement Proper Environment Configuration and Secrets Management

## 📋 **Issue Type**
- [x] Enhancement  
- [x] Bug Fix
- [ ] Feature Request
- [ ] Documentation

## 🎯 **Priority**
**High** - Security and deployment reliability

## 📝 **Description**
The CuraGenie platform currently has inconsistent environment configuration management, hardcoded values, and insecure secrets handling. This creates security risks, deployment difficulties, and maintenance challenges across different environments (development, staging, production).

## 🔍 **Current Problems**

### 1. **Hardcoded Configuration Values**
```python
# Found in backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # ❌ Hardcoded
    allow_credentials=True,
    allow_methods=["*"],  # ❌ Too permissive
    allow_headers=["*"],  # ❌ Too permissive
)

DATABASE_PATH = "curagenie_real.db"  # ❌ Hardcoded
```

### 2. **Inconsistent Environment Variables**
- Backend uses different patterns (`DATABASE_URL` vs `DATABASE_PATH`)
- Frontend and backend have different API URL configurations
- Missing environment-specific configurations
- No validation of required environment variables

### 3. **Insecure Secrets Management**
```python
# Found in backend/core/config.py
class Settings(BaseSettings):
    secret_key: str = "your-super-secret-key-here"  # ❌ Default secret in code
    openai_api_key: str = ""  # ❌ Empty default
    aws_access_key_id: str = ""  # ❌ No validation
```

### 4. **Missing Environment Separation**
- No clear distinction between dev/staging/production configs
- Database configuration not environment-aware  
- CORS origins not properly configured for production
- Debug settings not environment-specific

### 5. **Deployment Configuration Issues**
- Docker configurations missing environment variable support
- Railway and Vercel configurations incomplete
- No configuration validation on startup
- Missing health check configurations

## 🎯 **Proposed Solution**

### 1. **Structured Configuration System**
```python
# New configuration structure
class BaseConfig:
    """Base configuration with common settings"""
    APP_NAME: str = "CuraGenie"
    API_VERSION: str = "v1"
    
class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./curagenie_dev.db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    LOG_LEVEL: str = "DEBUG"
    
class ProductionConfig(BaseConfig):
    DEBUG: bool = False
    DATABASE_URL: str  # Required from environment
    CORS_ORIGINS: List[str]  # Required from environment
    LOG_LEVEL: str = "INFO"
    FORCE_HTTPS: bool = True
    
class StagingConfig(ProductionConfig):
    LOG_LEVEL: str = "DEBUG"
```

### 2. **Secrets Management**
```python
# Secure secrets handling
class SecretsManager:
    def __init__(self, environment: str):
        self.environment = environment
        self._secrets = {}
    
    def get_secret(self, key: str, required: bool = True) -> Optional[str]:
        # Try environment variables first
        value = os.getenv(key)
        if value:
            return value
            
        # For production, integrate with AWS Secrets Manager, Azure Key Vault, etc.
        if self.environment == "production":
            return self._get_from_secrets_service(key)
        
        if required:
            raise ConfigurationError(f"Required secret {key} not found")
        return None
```

### 3. **Environment-Specific Docker Configuration**
```dockerfile
# Multi-stage Dockerfile with environment support
FROM python:3.9-slim as base
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
WORKDIR /app

FROM base as development
ENV DEBUG=true
ENV LOG_LEVEL=DEBUG
COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt

FROM base as production  
ENV DEBUG=false
ENV LOG_LEVEL=INFO
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

## 🛠️ **Implementation Tasks**

### Phase 1: Configuration Refactoring
- [ ] Create environment-specific configuration classes
- [ ] Move all hardcoded values to configuration files
- [ ] Implement configuration validation on startup
- [ ] Add environment variable schema validation
- [ ] Create configuration factory pattern

### Phase 2: Secrets Management
- [ ] Implement secure secrets loading system
- [ ] Remove default secrets from code
- [ ] Add secrets validation and rotation support
- [ ] Integrate with cloud secrets services (AWS/Azure)
- [ ] Create local development secrets workflow

### Phase 3: Environment Detection
- [ ] Implement automatic environment detection
- [ ] Add environment-specific logging configuration
- [ ] Configure CORS based on environment
- [ ] Set up database connections per environment
- [ ] Add feature flags for environment-specific features

### Phase 4: Docker and Deployment
- [ ] Create multi-stage Dockerfiles for each environment
- [ ] Update docker-compose with environment variables
- [ ] Configure Railway deployment with proper environments
- [ ] Set up Vercel environment configuration
- [ ] Add health check endpoints with config validation

### Phase 5: Documentation and Tooling
- [ ] Create environment setup documentation
- [ ] Add configuration validation CLI tool
- [ ] Create environment template files
- [ ] Add configuration testing utilities
- [ ] Document secrets management workflow

## 🔧 **Configuration Structure**

### Backend Environment Variables
```bash
# Core Application
ENVIRONMENT=production  # development | staging | production
DEBUG=false
LOG_LEVEL=INFO
SECRET_KEY=<generated-secret-key>

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port/db

# External Services
OPENAI_API_KEY=<secret>
AWS_ACCESS_KEY_ID=<secret>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET_NAME=curagenie-genomic-data

# Security
CORS_ORIGINS=https://app.curagenie.com,https://www.curagenie.com
JWT_SECRET_KEY=<generated-secret-key>
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Features
ENABLE_GENOMIC_ANALYSIS=true
ENABLE_MRI_ANALYSIS=true
ENABLE_AI_CHATBOT=true
MAX_FILE_SIZE_MB=100
```

### Frontend Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.curagenie.com
NEXT_PUBLIC_WS_URL=wss://api.curagenie.com
NEXT_PUBLIC_ENVIRONMENT=production

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true

# External Services
NEXT_PUBLIC_ANALYTICS_ID=<public-key>
SENTRY_DSN=<secret-key>
```

### Docker Environment Support
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      target: ${ENVIRONMENT:-development}
    environment:
      - ENVIRONMENT=${ENVIRONMENT:-development}
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
    env_file:
      - .env.${ENVIRONMENT:-development}
```

## 🔒 **Security Improvements**

### Secrets Security
- [ ] Generate strong random secrets for JWT and encryption
- [ ] Implement secret rotation mechanism
- [ ] Remove all default/example secrets from codebase
- [ ] Add secrets scanning to CI/CD pipeline
- [ ] Encrypt secrets in configuration files

### Environment Isolation
- [ ] Separate databases for each environment
- [ ] Different CORS origins for each environment
- [ ] Environment-specific API keys and secrets
- [ ] Isolated file storage buckets
- [ ] Separate monitoring and logging systems

## 🧪 **Testing Strategy**

### Configuration Testing
- [ ] Unit tests for configuration loading
- [ ] Validation tests for required variables
- [ ] Environment-specific configuration tests
- [ ] Secrets loading and rotation tests
- [ ] Docker build tests for all environments

### Integration Testing
- [ ] End-to-end tests for each environment
- [ ] CORS policy testing
- [ ] Database connection testing
- [ ] External service integration tests
- [ ] Health check validation tests

## 📊 **Success Metrics**
- **Security**: Zero hardcoded secrets in codebase
- **Reliability**: 100% successful deployments across environments  
- **Maintainability**: Configuration changes require no code changes
- **Performance**: Configuration loading time under 100ms
- **Compliance**: Pass security audits for secrets management

## 🔗 **Related Files**
- `backend/core/config.py` - Main configuration refactoring
- `backend/main.py` - Remove hardcoded values
- `frontend/.env.example` - Environment templates  
- `docker-compose.yml` - Container environment support
- `Dockerfile` - Multi-stage environment builds
- `railway.toml` - Railway deployment configuration

## 🎯 **Acceptance Criteria**
- [ ] No hardcoded configuration values in source code
- [ ] All secrets properly managed and secure
- [ ] Environment-specific configurations work correctly
- [ ] Docker builds succeed for all environments
- [ ] Configuration validation prevents startup with invalid config
- [ ] Documentation covers all configuration options
- [ ] CI/CD pipeline validates configuration
- [ ] Health checks include configuration validation

## 🚨 **Migration Plan**

### Phase 1: Non-Breaking Changes
1. Add environment variable support alongside existing hardcoded values
2. Create configuration validation system
3. Add logging for configuration loading

### Phase 2: Gradual Migration  
1. Replace hardcoded CORS with environment variables
2. Move database configuration to environment variables
3. Implement secrets management system

### Phase 3: Complete Migration
1. Remove all hardcoded values
2. Enforce configuration validation
3. Update all deployment configurations

## ⚠️ **Risks and Considerations**
- **Deployment Breakage**: Invalid configuration could prevent startup
- **Secret Exposure**: Migration process must handle secrets securely  
- **Environment Complexity**: Too many environment variables can be hard to manage
- **Backward Compatibility**: Existing deployments may break during transition

**Estimated Effort**: 1-2 weeks
**Dependencies**: None (can be done incrementally)
**Risk Level**: Low-Medium (careful migration required)
