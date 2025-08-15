# Issue #006: Implement Proper Testing Infrastructure and CI/CD Pipeline

## 📋 **Issue Type**
- [x] Enhancement
- [ ] Bug Fix
- [ ] Feature Request
- [ ] Documentation

## 🎯 **Priority**
**Medium** - Infrastructure and quality assurance

## 📝 **Description**
The CuraGenie platform currently lacks a comprehensive testing infrastructure and automated CI/CD pipeline. This creates risks for deployment, makes refactoring difficult, and reduces confidence in code quality. While the project has some debug components, there are no formal tests or automated quality checks.

## 🔍 **Current Problems**

### 1. **No Automated Testing**
- No unit tests for backend Python code
- No integration tests for API endpoints  
- No frontend component tests
- No end-to-end testing for complete workflows
- No performance or load testing

### 2. **Missing CI/CD Pipeline**  
- No automated builds on code changes
- No automated deployment process
- No code quality checks (linting, formatting)
- No security scanning
- No dependency vulnerability checks

### 3. **Lack of Test Data Management**
- No test fixtures for genomic data
- No mock services for external dependencies (OpenAI, S3)
- No database seeding for testing
- Test data mixed with development data

### 4. **No Quality Gates**
- No code coverage requirements  
- No automated code review checks
- No performance regression detection
- No security vulnerability scanning

### 5. **Manual Testing Burden**
Debug components like `api-tester.tsx` and `backend-health-check.tsx` indicate manual testing is currently required, which is time-consuming and error-prone.

## 🎯 **Proposed Solution**

### 1. **Comprehensive Testing Framework**

#### Backend Testing (Python/FastAPI)
```python
# conftest.py - Test configuration
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from db.database import get_db, Base
from core.config import settings

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_curagenie.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(db):
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

#### Frontend Testing (React/Next.js)
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
}

// Component testing example
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthForm } from '@/components/auth/auth-form'

describe('AuthForm', () => {
  it('validates email input', async () => {
    render(<AuthForm mode="login" />)
    
    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
  })
})
```

### 2. **CI/CD Pipeline with GitHub Actions**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: curagenie_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install -r requirements-test.txt
        
    - name: Run linting
      run: |
        cd backend
        black --check .
        flake8 .
        isort --check-only .
        
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/curagenie_test
        ENVIRONMENT: testing
      run: |
        cd backend
        pytest --cov=. --cov-report=xml
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run linting
      run: |
        cd frontend
        npm run lint
        
    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
        
    - name: Build application
      run: |
        cd frontend
        npm run build

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security scan
      uses: securecodewarrior/github-action-add-sarif@v1
      with:
        sarif-file: 'security-scan-results.sarif'
        
    - name: Dependency vulnerability scan
      run: |
        cd backend && pip-audit
        cd frontend && npm audit --audit-level=high

  deploy-staging:
    needs: [backend-tests, frontend-tests, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
    - name: Deploy to staging
      run: |
        # Deploy to staging environment
        echo "Deploying to staging..."

  deploy-production:
    needs: [backend-tests, frontend-tests, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to production
      run: |
        # Deploy to production environment
        echo "Deploying to production..."
```

### 3. **Test Data Management**
```python
# tests/factories.py - Test data factories
import factory
from factory.alchemy import SQLAlchemyModelFactory
from db.models import User, GenomicData, PRSScore

class UserFactory(SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session_persistence = "commit"

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    hashed_password = factory.LazyAttribute(lambda o: hash_password("testpass123"))
    role = "patient"
    is_active = True

class GenomicDataFactory(SQLAlchemyModelFactory):
    class Meta:
        model = GenomicData
        sqlalchemy_session_persistence = "commit"

    user = factory.SubFactory(UserFactory)
    filename = "sample.vcf"
    file_type = "vcf"
    status = "completed"
    metadata_json = factory.LazyFunction(lambda: json.dumps({"variants": 100}))

# tests/fixtures/sample_data.py - Sample genomic data
SAMPLE_VCF_CONTENT = """##fileformat=VCFv4.2
##reference=GRCh38
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE1
chr1	1000	rs123	A	T	100	PASS	.	GT	0/1
chr2	2000	rs456	G	C	95	PASS	.	GT	1/1
"""

SAMPLE_FASTQ_CONTENT = """@SEQ_ID_1
GATTTGGGGTTCAAAGCAGTATCGATCAAATAGTAAATCCATTTGTTCAACTCACAGTTT
+
!''*((((***+))%%%++)(%%%%).1***-+*''))**55CCF>>>>>>CCCCCCC65
"""
```

## 🛠️ **Implementation Tasks**

### Phase 1: Backend Testing Infrastructure
- [ ] Set up pytest with fixtures and factories
- [ ] Create unit tests for all business logic modules  
- [ ] Add integration tests for API endpoints
- [ ] Create tests for database models and relationships
- [ ] Add tests for authentication and authorization
- [ ] Create mock services for external dependencies

### Phase 2: Frontend Testing Infrastructure  
- [ ] Set up Jest and React Testing Library
- [ ] Create unit tests for utility functions
- [ ] Add component tests for all UI components
- [ ] Create integration tests for user workflows
- [ ] Add tests for state management (Zustand)
- [ ] Create visual regression tests (Storybook)

### Phase 3: End-to-End Testing
- [ ] Set up Playwright for E2E testing
- [ ] Create tests for complete user journeys
- [ ] Add tests for file upload workflows
- [ ] Create tests for genomic analysis pipelines
- [ ] Add tests for real-time features (WebSockets)
- [ ] Create performance and load tests

### Phase 4: CI/CD Pipeline
- [ ] Set up GitHub Actions workflows
- [ ] Add automated code quality checks
- [ ] Implement security scanning
- [ ] Create automated deployment pipelines
- [ ] Add environment promotion workflows
- [ ] Create rollback procedures

### Phase 5: Quality Gates and Monitoring
- [ ] Set up code coverage requirements (80%+)
- [ ] Add performance benchmarking
- [ ] Create deployment health checks
- [ ] Add monitoring and alerting
- [ ] Create test result dashboards

## 🧪 **Test Categories and Examples**

### Backend Unit Tests
```python
# tests/test_prs_calculator.py
def test_prs_calculation():
    calculator = PolygeneticRiskCalculator()
    
    variants = [
        {"rsid": "rs7903146", "genotype": "0/1", "effect_size": 0.5},
        {"rsid": "rs1801282", "genotype": "1/1", "effect_size": -0.3}
    ]
    
    score = calculator.calculate_score(variants, "diabetes")
    
    assert 0.0 <= score <= 1.0
    assert isinstance(score, float)

# tests/test_auth_service.py
def test_user_registration(client, db_session):
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "TestPass123!",
        "role": "patient"
    }
    
    response = client.post("/api/auth/register", json=user_data)
    
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"
    
    # Verify user was created in database
    user = db_session.query(User).filter_by(email="test@example.com").first()
    assert user is not None
    assert user.hashed_password != "TestPass123!"  # Ensure password is hashed
```

### Frontend Component Tests
```typescript
// __tests__/components/genomic/genome-browser.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { GenomeBrowser } from '@/components/genomic/genome-browser'

const mockVariants = [
  { chromosome: '1', position: 1000, reference: 'A', alternative: 'T' }
]

jest.mock('@/lib/api', () => ({
  fetchGenomicVariants: jest.fn(() => Promise.resolve(mockVariants))
}))

describe('GenomeBrowser', () => {
  it('displays genomic variants correctly', async () => {
    render(<GenomeBrowser userId={1} />)
    
    await waitFor(() => {
      expect(screen.getByText('chr1:1000')).toBeInTheDocument()
      expect(screen.getByText('A→T')).toBeInTheDocument()
    })
  })
})
```

### End-to-End Tests
```typescript
// e2e/genomic-upload.spec.ts
import { test, expect } from '@playwright/test'

test('complete genomic file upload workflow', async ({ page }) => {
  // Login
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'demo@curagenie.com')
  await page.fill('[name="password"]', 'demo123')
  await page.click('button[type="submit"]')
  
  // Navigate to upload
  await page.goto('/dashboard')
  await page.click('text=Upload Genomic Data')
  
  // Upload file
  await page.setInputFiles('input[type="file"]', 'fixtures/sample.vcf')
  await page.click('button:has-text("Upload")')
  
  // Verify upload success
  await expect(page.locator('.upload-success')).toBeVisible()
  await expect(page.locator('text=Processing started')).toBeVisible()
})
```

## 📊 **Quality Metrics and Coverage Goals**

### Code Coverage Targets
- **Backend**: 85% line coverage, 80% branch coverage
- **Frontend**: 80% line coverage, 75% branch coverage  
- **Critical paths**: 95% coverage (authentication, file processing, PRS calculation)

### Performance Benchmarks
- **API Response Time**: 95th percentile under 500ms
- **File Upload**: Up to 100MB files processed within 60 seconds
- **Page Load Time**: First Contentful Paint under 2 seconds
- **Database Query Time**: 95th percentile under 100ms

### Quality Gates
- [ ] All tests must pass before deployment
- [ ] Code coverage must meet minimum thresholds
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks must be met
- [ ] No linting or formatting errors

## 🔧 **Testing Tools and Libraries**

### Backend Testing Stack
- **pytest**: Main testing framework
- **pytest-asyncio**: Async test support
- **factory-boy**: Test data generation
- **pytest-cov**: Code coverage
- **httpx**: HTTP client for testing
- **pytest-mock**: Mocking utilities

### Frontend Testing Stack
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **Playwright**: End-to-end testing
- **Storybook**: Component development and visual testing

### Quality Assurance Tools
- **Black**: Python code formatting
- **ESLint/Prettier**: JavaScript/TypeScript formatting
- **Bandit**: Python security linting
- **CodeQL**: Security vulnerability scanning
- **Lighthouse CI**: Performance monitoring

## 🎯 **Acceptance Criteria**
- [ ] Comprehensive test suite with 80%+ coverage
- [ ] Automated CI/CD pipeline running on all PRs
- [ ] All quality gates enforced automatically
- [ ] Deployment automation with rollback capability
- [ ] Performance monitoring and alerting
- [ ] Security scanning integrated into CI/CD
- [ ] Test results and coverage reports available
- [ ] Documentation for testing procedures

## 📊 **Success Metrics**
- **Reliability**: 99.9% test pass rate in CI/CD
- **Speed**: CI/CD pipeline completes in under 15 minutes
- **Coverage**: Code coverage maintained above target thresholds
- **Quality**: Zero critical bugs in production
- **Deployment**: 100% successful automated deployments

## 🔗 **Related Files**
- `backend/tests/` - New comprehensive test suite
- `frontend/__tests__/` - Frontend test suite
- `frontend/e2e/` - End-to-end tests
- `.github/workflows/` - CI/CD pipeline configuration
- `pytest.ini`, `jest.config.js` - Test configuration
- `requirements-test.txt` - Test dependencies

**Estimated Effort**: 3-4 weeks
**Dependencies**: Issue #004 (Database architecture for proper test isolation)
**Risk Level**: Low (improves quality, no breaking changes)
