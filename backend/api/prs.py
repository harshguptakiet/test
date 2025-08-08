import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from db.models import PrsScore, GenomicData
from schemas.schemas import PrsScoreResponse, PrsCalculationRequest
from worker.tasks import calculate_prs_score

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/prs", tags=["prs"])

@router.post("/calculate", status_code=202)
async def trigger_prs_calculation(
    request: PrsCalculationRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger PRS calculation for a genomic data record
    Returns immediately and processes in background
    """
    try:
        # Verify that the genomic data exists
        genomic_data = db.query(GenomicData).filter(
            GenomicData.id == request.genomic_data_id
        ).first()
        
        if not genomic_data:
            raise HTTPException(
                status_code=404,
                detail=f"Genomic data with id {request.genomic_data_id} not found"
            )
        
        if genomic_data.status != "completed":
            raise HTTPException(
                status_code=400,
                detail="Genomic data must be processed before PRS calculation"
            )
        
        # Check if PRS already exists for this combination
        existing_prs = db.query(PrsScore).filter(
            PrsScore.genomic_data_id == request.genomic_data_id,
            PrsScore.disease_type == request.disease_type
        ).first()
        
        if existing_prs:
            return {
                "message": f"PRS calculation already exists for {request.disease_type}",
                "status": "already_exists",
                "prs_id": existing_prs.id
            }
        
        # Queue PRS calculation task
        calculate_prs_score.delay(request.genomic_data_id, request.disease_type)
        
        logger.info(f"Queued PRS calculation for genomic_data_id: {request.genomic_data_id}, disease: {request.disease_type}")
        
        return {
            "message": "PRS calculation started",
            "status": "processing",
            "genomic_data_id": request.genomic_data_id,
            "disease_type": request.disease_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering PRS calculation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/scores/user/{user_id}", response_model=List[PrsScoreResponse])
def get_user_prs_scores(user_id: str, db: Session = Depends(get_db)):
    """Get all PRS scores for a user"""
    prs_scores = db.query(PrsScore).join(GenomicData).filter(
        GenomicData.user_id == user_id
    ).all()
    return prs_scores

@router.get("/scores/genomic-data/{genomic_data_id}", response_model=List[PrsScoreResponse])
def get_genomic_data_prs_scores(genomic_data_id: int, db: Session = Depends(get_db)):
    """Get all PRS scores for a specific genomic data record"""
    prs_scores = db.query(PrsScore).filter(
        PrsScore.genomic_data_id == genomic_data_id
    ).all()
    return prs_scores

@router.get("/scores/{prs_id}", response_model=PrsScoreResponse)
def get_prs_score(prs_id: int, db: Session = Depends(get_db)):
    """Get a specific PRS score"""
    prs_score = db.query(PrsScore).filter(PrsScore.id == prs_id).first()
    if not prs_score:
        raise HTTPException(status_code=404, detail="PRS score not found")
    return prs_score
