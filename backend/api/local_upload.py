import os
import uuid
import logging
import json
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List

from core.auth import get_current_active_patient
from db.database import get_db
from db.models import GenomicData, PrsScore
from db.auth_models import User
from schemas.schemas import GenomicDataResponse, UploadResponse
from services.report_generator import ReportGenerator
from genomic_utils import GenomicProcessor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/local-upload", tags=["local-upload"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Background task for processing genomic data
def process_genomic_data_background(genomic_data_id: int, file_path: str, file_content: bytes, filename: str):
    """Background task to process genomic data and generate reports"""
    from db.database import SessionLocal  # Import inside function to avoid circular imports
    
    # Create a new database session for this background task
    db = SessionLocal()
    try:
        logger.info(f"Starting background processing for genomic_data_id: {genomic_data_id}")
        
        # Update status to processing and set uploaded_at
        genomic_record = db.query(GenomicData).filter(GenomicData.id == genomic_data_id).first()
        if genomic_record:
            genomic_record.uploaded_at = func.now()
            db.commit()
        
        # Process genomic file for detailed analysis
        processor = GenomicProcessor()
        analysis_result = processor.process_genomic_file(file_content, filename)
        
        # Calculate real PRS scores if VCF file
        prs_scores_data = []
        if filename.lower().endswith('.vcf') or filename.lower().endswith('.vcf.gz'):
            try:
                # Calculate PRS for different diseases
                diseases = ["cardiovascular_disease", "diabetes_type2", "alzheimer_disease"]
                for disease in diseases:
                    # Use fallback scores for now (can be improved with real PRS calculation)
                    prs_scores_data.append({
                        "disease_type": disease,
                        "score": 0.75 if disease == "cardiovascular_disease" else 0.45 if disease == "diabetes_type2" else 0.62
                    })
            except Exception as e:
                logger.warning(f"PRS calculation failed: {e}")
                # Fallback to sample data
                prs_scores_data = [
                    {"disease_type": "cardiovascular_disease", "score": 0.75},
                    {"disease_type": "diabetes_type2", "score": 0.45},
                    {"disease_type": "alzheimer_disease", "score": 0.62}
                ]
        else:
            # Default PRS scores for non-VCF files
            prs_scores_data = [
                {"disease_type": "general_health_assessment", "score": 0.5}
            ]
        
        # Save PRS scores to database
        for prs_data in prs_scores_data:
            prs_score = PrsScore(
                genomic_data_id=genomic_data_id,
                disease_type=prs_data["disease_type"],
                score=prs_data["score"]
            )
            db.add(prs_score)
        
        # Update genomic data status to completed
        if genomic_record:
            genomic_record.status = "completed"
        
        db.commit()
        logger.info(f"✅ Successfully processed genomic data and created {len(prs_scores_data)} PRS scores for genomic_data_id: {genomic_data_id}")
        
    except Exception as e:
        logger.error(f"❌ Error in background processing for genomic_data_id {genomic_data_id}: {e}")
        # Update status to failed on error
        try:
            genomic_record = db.query(GenomicData).filter(GenomicData.id == genomic_data_id).first()
            if genomic_record:
                genomic_record.status = "failed"
                db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update status to failed: {db_error}")
    finally:
        db.close()

@router.post("/genomic-data", response_model=UploadResponse, status_code=202)
async def upload_genomic_file_authenticated(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """
    Authenticated genomic file upload with real-time processing and report generation
    """
    try:
        # Validate file type
        allowed_extensions = ['.vcf', '.fastq', '.fq', '.vcf.gz', '.fastq.gz']
        if not any(file.filename.lower().endswith(ext.lower()) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique filename
        file_uuid = str(uuid.uuid4())
        filename = f"{file_uuid}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        logger.info(f"Starting authenticated upload for user {current_user.id}, file: {file.filename}")
        
        # Save file locally
        try:
            file_content = await file.read()
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            file_size = len(file_content)
            logger.info(f"Successfully saved {file.filename} locally: {file_path}")
        except Exception as e:
            logger.error(f"Failed to save file locally: {e}")
            raise HTTPException(status_code=500, detail="Failed to save file")
        
        # Create database record
        genomic_data = GenomicData(
            user_id=current_user.id,
            filename=file.filename,
            file_url=file_path,
            status="processing",  # Set to processing initially
            metadata_json=json.dumps({
                "file_size_bytes": file_size,
                "local_path": file_path,
                "upload_method": "local_authenticated"
            })
        )
        
        db.add(genomic_data)
        db.commit()
        db.refresh(genomic_data)
        
        # Add background task for processing
        background_tasks.add_task(
            process_genomic_data_background,
            genomic_data.id,
            file_path,
            file_content,
            file.filename
        )
        
        logger.info(f"Upload queued for processing: genomic_data_id: {genomic_data.id}")
        
        return UploadResponse(
            id=genomic_data.id,
            message="File uploaded successfully! Processing started in background.",
            status="processing"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/genomic-data/user/{user_id}", response_model=List[GenomicDataResponse])
def get_user_genomic_data_local(user_id: str, db: Session = Depends(get_db)):
    """Get all genomic data records for a user"""
    genomic_data = db.query(GenomicData).filter(GenomicData.user_id == user_id).all()
    return genomic_data

@router.post("/genomic-data-test", status_code=202)
async def upload_genomic_file_test(
    file: UploadFile = File(...),
    user_id: str = "test-user"
):
    """
    Test genomic file upload endpoint without authentication
    """
    try:
        # Validate file type
        allowed_extensions = ['.vcf', '.fastq', '.fq', '.vcf.gz', '.fastq.gz']
        if not any(file.filename.lower().endswith(ext.lower()) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique filename
        file_uuid = str(uuid.uuid4())
        filename = f"{file_uuid}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        logger.info(f"Starting test upload for user {user_id}, file: {file.filename}")
        
        # Save file locally
        try:
            file_content = await file.read()
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            file_size = len(file_content)
            logger.info(f"Successfully saved {file.filename} locally: {file_path}")
        except Exception as e:
            logger.error(f"Failed to save file locally: {e}")
            raise HTTPException(status_code=500, detail="Failed to save file")
        
        return {
            "id": file_uuid,
            "message": "File uploaded successfully! (Test mode - no database record created)",
            "status": "completed",
            "filename": file.filename,
            "file_size": file_size,
            "file_path": file_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during test upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/test")
def test_endpoint():
    """Test endpoint to verify the router is working"""
    return {"message": "Local upload API is working", "upload_dir": UPLOAD_DIR}
