from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid

from core.auth import get_current_user, get_current_active_patient
from db.database import get_db
from db.auth_models import User, PatientProfile
from db.models import GenomicData, PrsScore
from schemas.auth_schemas import (
    PatientProfile as PatientProfileSchema,
    PatientProfileCreate,
    PatientProfileUpdate,
    UserWithProfile,
    UserDashboard,
    MedicalReport
)

router = APIRouter(prefix="/api/profile", tags=["patient-profile"])

@router.get("/me", response_model=UserWithProfile)
def get_my_profile(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    """Get current user profile with patient details"""
    user_with_profile = db.query(User).filter(User.id == current_user.id).first()
    return user_with_profile

@router.put("/me", response_model=PatientProfileSchema)
def update_my_profile(
    profile_data: PatientProfileUpdate,
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Update current user's patient profile"""
    
    # Get or create patient profile
    patient_profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    
    if not patient_profile:
        # Create new profile if doesn't exist
        patient_profile = PatientProfile(user_id=current_user.id, first_name="", last_name="")
        db.add(patient_profile)
        db.commit()
        db.refresh(patient_profile)
    
    # Update profile fields
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(patient_profile, field):
            setattr(patient_profile, field, value)
    
    db.commit()
    db.refresh(patient_profile)
    
    return patient_profile

@router.post("/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Upload user avatar image"""
    
    # Validate file type
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create avatars directory
    avatar_dir = "uploads/avatars"
    os.makedirs(avatar_dir, exist_ok=True)
    
    # Generate unique filename
    file_uuid = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{file_uuid}_{current_user.id}{file_extension}"
    file_path = os.path.join(avatar_dir, filename)
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            content = file.file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save avatar"
        )
    
    # Update profile with avatar URL
    patient_profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if patient_profile:
        patient_profile.avatar_url = file_path
        db.commit()
    
    return {"message": "Avatar uploaded successfully", "avatar_url": file_path}

@router.get("/dashboard", response_model=UserDashboard)
def get_dashboard(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    """Get user dashboard with all relevant data"""
    
    # Get user with profile
    user_with_profile = db.query(User).filter(User.id == current_user.id).first()
    
    # Get genomic data statistics
    genomic_data = db.query(GenomicData).filter(GenomicData.user_id == current_user.id).all()
    total_uploads = len(genomic_data)
    
    # Get recent uploads (last 5)
    recent_uploads = []
    for data in genomic_data[-5:]:
        recent_uploads.append({
            "id": data.id,
            "filename": data.filename,
            "status": data.status,
            "uploaded_at": data.uploaded_at.isoformat() if data.uploaded_at else None
        })
    
    # Get PRS scores
    prs_scores = []
    for data in genomic_data:
        scores = db.query(PrsScore).filter(PrsScore.genomic_data_id == data.id).all()
        for score in scores:
            prs_scores.append({
                "disease_type": score.disease_type,
                "score": score.score,
                "genomic_data_id": data.id,
                "filename": data.filename,
                "calculated_at": score.calculated_at.isoformat() if score.calculated_at else None
            })
    
    # Get medical reports (placeholder - implement when reports are created)
    recent_reports = []
    total_reports = 0
    
    return UserDashboard(
        user=user_with_profile,
        total_uploads=total_uploads,
        total_reports=total_reports,
        recent_uploads=recent_uploads,
        recent_reports=recent_reports,
        prs_scores=prs_scores
    )

@router.get("/uploads")
def get_my_uploads(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    """Get all genomic uploads for current user"""
    
    genomic_data = db.query(GenomicData).filter(GenomicData.user_id == current_user.id).all()
    
    uploads = []
    for data in genomic_data:
        # Get associated PRS scores
        prs_scores = db.query(PrsScore).filter(PrsScore.genomic_data_id == data.id).all()
        
        uploads.append({
            "id": data.id,
            "filename": data.filename,
            "status": data.status,
            "uploaded_at": data.uploaded_at.isoformat() if data.uploaded_at else None,
            "metadata": data.metadata_json,
            "prs_scores": [
                {
                    "disease_type": score.disease_type,
                    "score": score.score,
                    "calculated_at": score.calculated_at.isoformat() if score.calculated_at else None
                }
                for score in prs_scores
            ]
        })
    
    return {"uploads": uploads, "total": len(uploads)}

@router.delete("/uploads/{upload_id}")
def delete_upload(
    upload_id: int,
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Delete a specific genomic upload"""
    
    # Check if upload belongs to current user
    upload = db.query(GenomicData).filter(
        GenomicData.id == upload_id,
        GenomicData.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Delete associated PRS scores
    db.query(PrsScore).filter(PrsScore.genomic_data_id == upload_id).delete()
    
    # Delete the file from disk if it exists
    if upload.file_url and os.path.exists(upload.file_url):
        try:
            os.remove(upload.file_url)
        except:
            pass  # File might not exist or be in use
    
    # Delete the upload record
    db.delete(upload)
    db.commit()
    
    return {"message": "Upload deleted successfully"}

@router.get("/medical-history")
def get_medical_history(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    """Get comprehensive medical history for the user"""
    
    # Get all genomic uploads with their analysis
    genomic_data = db.query(GenomicData).filter(GenomicData.user_id == current_user.id).all()
    
    medical_history = {
        "patient_info": {},
        "genomic_uploads": [],
        "prs_analysis": {},
        "timeline": []
    }
    
    # Get patient profile
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if profile:
        medical_history["patient_info"] = {
            "name": f"{profile.first_name} {profile.last_name}",
            "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            "blood_type": profile.blood_type,
            "allergies": profile.allergies,
            "current_medications": profile.current_medications,
            "medical_history": profile.medical_history
        }
    
    # Process each genomic upload
    disease_risks = {}
    for data in genomic_data:
        prs_scores = db.query(PrsScore).filter(PrsScore.genomic_data_id == data.id).all()
        
        upload_info = {
            "id": data.id,
            "filename": data.filename,
            "uploaded_at": data.uploaded_at.isoformat() if data.uploaded_at else None,
            "status": data.status,
            "prs_scores": []
        }
        
        for score in prs_scores:
            score_info = {
                "disease_type": score.disease_type,
                "score": score.score,
                "calculated_at": score.calculated_at.isoformat() if score.calculated_at else None
            }
            upload_info["prs_scores"].append(score_info)
            
            # Aggregate disease risks
            if score.disease_type not in disease_risks:
                disease_risks[score.disease_type] = []
            disease_risks[score.disease_type].append({
                "score": score.score,
                "date": score.calculated_at.isoformat() if score.calculated_at else None,
                "source_file": data.filename
            })
        
        medical_history["genomic_uploads"].append(upload_info)
        
        # Add to timeline
        medical_history["timeline"].append({
            "date": data.uploaded_at.isoformat() if data.uploaded_at else None,
            "event": f"Uploaded genomic data: {data.filename}",
            "type": "upload"
        })
    
    medical_history["prs_analysis"] = disease_risks
    
    # Sort timeline by date
    medical_history["timeline"].sort(key=lambda x: x["date"] or "", reverse=True)
    
    return medical_history
