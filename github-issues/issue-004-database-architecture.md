# Issue #004: Fix Database Architecture and Resolve Duplicate Data Issues

## 📋 **Issue Type**
- [x] Bug Fix
- [x] Enhancement
- [ ] Feature Request
- [ ] Documentation

## 🎯 **Priority**
**High** - Data integrity and performance issues

## 📝 **Description**
The CuraGenie platform has significant database architecture issues including multiple competing database systems, duplicate data, missing constraints, and inconsistent schemas. This leads to data integrity problems, performance issues, and maintenance difficulties.

## 🔍 **Current Problems**

### 1. **Multiple Database Systems**
Found evidence of at least 3 different database approaches:
- **SQLite with raw SQL** in `main.py` (lines 53-140)
- **SQLAlchemy ORM** in `db/models.py` and `core/auth.py`  
- **Celery worker database** in `worker/tasks.py`

### 2. **Schema Inconsistencies**
```python
# Raw SQL schema in main.py (lines 58-68)
cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,  # ❌ Plain text password field
        role TEXT DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
    )
""")

# vs SQLAlchemy User model in auth_models.py
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)  # ❌ Different field name
    # Missing other fields from raw SQL schema
```

### 3. **Duplicate Data Issues**
From `FIXED_ISSUES_SUMMARY.md`:
- **Dashboard PRS Duplicates**: Multiple entries for same disease types
- **Genomic Browser Duplicates**: Variants may have duplicates 
- **Timeline Events**: Potential duplicate events from file uploads

### 4. **Missing Database Constraints**
- No foreign key constraints properly enforced
- Missing unique constraints on business logic
- No check constraints for data validation
- Missing indexes for performance-critical queries

### 5. **Database Connection Issues**
```python
# Inconsistent connection handling
def get_db_connection():
    return sqlite3.connect(DATABASE_PATH)  # ❌ No connection pooling

# vs SQLAlchemy session management
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 6. **Data Migration Problems**
- No proper migration system
- Schema changes done with raw DDL
- No rollback capability
- Missing data validation during migrations

## 🎯 **Proposed Solution**

### 1. **Unified Database Architecture**
Standardize on SQLAlchemy ORM with Alembic migrations:

```python
# Unified database configuration
class DatabaseManager:
    def __init__(self, database_url: str):
        self.engine = create_engine(database_url, pool_pre_ping=True)
        self.SessionLocal = sessionmaker(bind=self.engine)
        
    def get_session(self) -> Session:
        return self.SessionLocal()
        
    def init_db(self) -> None:
        # Use Alembic for migrations instead of raw DDL
        from alembic.config import Config
        from alembic import command
        
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
```

### 2. **Proper Database Schema Design**
```python
# Enhanced User model with proper relationships
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    genomic_data = relationship("GenomicData", back_populates="user")
    prs_scores = relationship("PRSScore", back_populates="user")
    timeline_events = relationship("TimelineEvent", back_populates="user")

# Fix duplicate PRS scores with unique constraint
class PRSScore(Base):
    __tablename__ = "prs_scores"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    genomic_data_id = Column(Integer, ForeignKey("genomic_data.id"), nullable=False)
    disease_type = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    percentile = Column(Float)
    variants_used = Column(Integer)
    confidence = Column(Float)
    calculated_at = Column(DateTime, nullable=False, default=func.now())
    
    # Prevent duplicate scores for same user/disease/genomic_data combination
    __table_args__ = (
        UniqueConstraint('user_id', 'disease_type', 'genomic_data_id', 
                        name='unique_prs_per_user_disease_file'),
    )
    
    user = relationship("User", back_populates="prs_scores")
    genomic_data = relationship("GenomicData", back_populates="prs_scores")
```

### 3. **Data Deduplication Strategy**
```python
# Service to handle PRS score deduplication  
class PRSScoreService:
    def create_or_update_score(self, user_id: int, disease_type: str, 
                              genomic_data_id: int, score_data: dict) -> PRSScore:
        # Check for existing score
        existing_score = self.session.query(PRSScore).filter(
            PRSScore.user_id == user_id,
            PRSScore.disease_type == disease_type,
            PRSScore.genomic_data_id == genomic_data_id
        ).first()
        
        if existing_score:
            # Update existing score
            for key, value in score_data.items():
                setattr(existing_score, key, value)
            existing_score.calculated_at = func.now()
            return existing_score
        else:
            # Create new score
            new_score = PRSScore(
                user_id=user_id,
                disease_type=disease_type,
                genomic_data_id=genomic_data_id,
                **score_data
            )
            self.session.add(new_score)
            return new_score
```

## 🛠️ **Implementation Tasks**

### Phase 1: Database Cleanup and Standardization
- [ ] Audit current database usage across all modules
- [ ] Create comprehensive SQLAlchemy models for all entities
- [ ] Remove raw SQL queries and replace with ORM calls
- [ ] Standardize database connection handling
- [ ] Set up proper connection pooling

### Phase 2: Schema Migration System  
- [ ] Set up Alembic for database migrations
- [ ] Create initial migration from current schema
- [ ] Add proper foreign key constraints
- [ ] Add unique constraints to prevent duplicates
- [ ] Create database indexes for performance

### Phase 3: Data Integrity Fixes
- [ ] Implement deduplication logic for PRS scores
- [ ] Fix genomic variant duplicates with unique constraints
- [ ] Clean up duplicate timeline events
- [ ] Add data validation at model level
- [ ] Implement cascade delete rules

### Phase 4: Performance Optimization
- [ ] Add database indexes for common queries
- [ ] Implement query optimization for large datasets
- [ ] Add database connection pooling
- [ ] Implement database query monitoring
- [ ] Optimize N+1 query problems with proper eager loading

### Phase 5: Data Migration and Cleanup
- [ ] Create migration script for existing data
- [ ] Backup existing data before migration
- [ ] Migrate plain text passwords to hashed passwords
- [ ] Clean up duplicate records
- [ ] Validate data integrity after migration

## 🗄️ **Database Schema Fixes**

### User Management
```sql
-- Enhanced users table with proper constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'patient',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NULL,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT username_length CHECK (length(username) >= 3)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
```

### Genomic Data Management
```sql
-- Improved genomic_data table with proper relationships
CREATE TABLE genomic_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type file_type_enum NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    status processing_status_enum NOT NULL DEFAULT 'pending',
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP,
    metadata_json JSONB,
    
    CONSTRAINT positive_file_size CHECK (file_size_bytes > 0)
);

CREATE INDEX idx_genomic_data_user ON genomic_data(user_id);
CREATE INDEX idx_genomic_data_status ON genomic_data(status);
CREATE INDEX idx_genomic_data_uploaded ON genomic_data(uploaded_at);
```

### PRS Scores with Duplicate Prevention
```sql
-- PRS scores table with proper constraints
CREATE TABLE prs_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genomic_data_id INTEGER NOT NULL REFERENCES genomic_data(id) ON DELETE CASCADE,
    disease_type VARCHAR(100) NOT NULL,
    score DECIMAL(10,8) NOT NULL,
    risk_level risk_level_enum NOT NULL,
    percentile DECIMAL(5,2),
    variants_used INTEGER,
    confidence DECIMAL(5,4),
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_prs_per_user_disease_file 
        UNIQUE(user_id, disease_type, genomic_data_id),
    CONSTRAINT score_range CHECK (score >= 0.0 AND score <= 1.0),
    CONSTRAINT percentile_range CHECK (percentile >= 0.0 AND percentile <= 100.0),
    CONSTRAINT confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0)
);
```

## 🔧 **Database Utilities**

### Migration Tools
```python
# Database migration utilities
class DatabaseMigrator:
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        
    def migrate_plain_text_passwords(self) -> int:
        """Migrate plain text passwords to hashed passwords"""
        migrated_count = 0
        with self.db_manager.get_session() as session:
            users_with_plain_passwords = session.execute(
                text("SELECT id, password FROM users WHERE hashed_password IS NULL")
            ).fetchall()
            
            for user_id, plain_password in users_with_plain_passwords:
                hashed_password = hash_password(plain_password)
                session.execute(
                    text("UPDATE users SET hashed_password = :hash WHERE id = :id"),
                    {"hash": hashed_password, "id": user_id}
                )
                migrated_count += 1
                
            session.commit()
        return migrated_count
        
    def deduplicate_prs_scores(self) -> int:
        """Remove duplicate PRS scores, keeping the most recent"""
        deduped_count = 0
        with self.db_manager.get_session() as session:
            # Find and remove duplicates
            duplicates = session.execute(text("""
                DELETE FROM prs_scores 
                WHERE id NOT IN (
                    SELECT DISTINCT ON (user_id, disease_type, genomic_data_id) id
                    FROM prs_scores 
                    ORDER BY user_id, disease_type, genomic_data_id, calculated_at DESC
                )
            """))
            deduped_count = duplicates.rowcount
            session.commit()
        return deduped_count
```

## 🧪 **Testing Strategy**

### Database Testing
- [ ] Unit tests for all database models and relationships
- [ ] Integration tests for complex queries
- [ ] Migration testing with test datasets  
- [ ] Performance testing with large datasets
- [ ] Data integrity validation tests

### Migration Testing
- [ ] Test migration scripts with various data scenarios
- [ ] Rollback testing for failed migrations
- [ ] Data validation before and after migrations
- [ ] Performance impact testing of migrations
- [ ] Backup and restore testing

## 📊 **Success Metrics**
- **Data Integrity**: Zero duplicate records in production
- **Performance**: Query response times under 200ms for 95th percentile
- **Consistency**: Single database system across all modules
- **Reliability**: Zero data corruption incidents
- **Maintainability**: All schema changes done through migrations

## 🔗 **Related Files**
- `backend/main.py` - Remove raw SQL queries (lines 53-140, 184-190)
- `backend/db/models.py` - Enhance with proper relationships and constraints
- `backend/db/database.py` - Unified database connection management
- `backend/core/auth.py` - Use unified User model
- `backend/worker/tasks.py` - Use ORM instead of raw SQL
- `backend/alembic/` - New migration system

## 🎯 **Acceptance Criteria**
- [ ] Single database system (SQLAlchemy ORM) used throughout
- [ ] No raw SQL queries in application code  
- [ ] All duplicate data issues resolved with constraints
- [ ] Proper foreign key relationships established
- [ ] Migration system works for schema changes
- [ ] Database performance meets benchmarks
- [ ] Data integrity constraints prevent bad data
- [ ] All tests pass with new database architecture

## ⚠️ **Migration Risks**
- **Data Loss**: Improper migration could lose user data
- **Downtime**: Schema changes may require maintenance window  
- **Performance Impact**: New constraints may slow down queries temporarily
- **Application Breaking**: ORM changes may break existing code
- **Rollback Complexity**: Complex migrations may be hard to reverse

## 🚨 **Critical Dependencies**
This issue should be completed before:
- Issue #002 (Authentication fixes) - needs consistent User model
- Major feature development - to avoid technical debt
- Production deployment - to ensure data integrity

**Estimated Effort**: 2-3 weeks
**Dependencies**: Issue #003 (Environment configuration for database URLs)
**Risk Level**: High (involves data migration)
