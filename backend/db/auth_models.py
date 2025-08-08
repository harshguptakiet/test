from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PATIENT)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    profile = relationship("PatientProfile", back_populates="user", uselist=False)
    # Note: GenomicData relationship defined in models.py to avoid circular imports
    reports = relationship("MedicalReport", back_populates="user")

class PatientProfile(Base):
    __tablename__ = 'patient_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    
    # Personal Information
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime)
    gender = Column(String)
    phone = Column(String)
    address = Column(Text)
    
    # Medical Information
    blood_type = Column(String)
    allergies = Column(Text)
    current_medications = Column(Text)
    medical_history = Column(Text)
    emergency_contact = Column(String)
    
    # Profile metadata
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")

class MedicalReport(Base):
    __tablename__ = 'medical_reports'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    genomic_data_id = Column(Integer, ForeignKey('genomic_data.id'), nullable=True)
    
    # Report Details
    report_title = Column(String, nullable=False)
    report_type = Column(String, nullable=False)  # "genomic", "prs", "ml_prediction"
    report_data = Column(Text)  # JSON data
    summary = Column(Text)
    recommendations = Column(Text)
    
    # Status and metadata
    status = Column(String, default="processing")  # processing, completed, failed
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reports")
    # genomic_data relationship removed to avoid circular imports
