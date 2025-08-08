from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from db.database import get_db
from db.models import GenomicData, PrsScore, MlPrediction
from db.auth_models import User

router = APIRouter(prefix="/api/timeline", tags=["timeline"])

@router.get("/{user_id}")
def get_user_timeline(user_id: str, db: Session = Depends(get_db)):
    """Get timeline events for a specific user"""
    
    timeline_events = []
    
    # Get genomic data uploads
    genomic_uploads = db.query(GenomicData).filter(
        GenomicData.user_id == user_id
    ).order_by(desc(GenomicData.uploaded_at)).all()
    
    for upload in genomic_uploads:
        if upload.uploaded_at:
            timeline_events.append({
                "id": f"upload_{upload.id}",
                "event_type": "upload",
                "title": f"Genomic Data Upload",
                "description": f"Uploaded {upload.filename}",
                "timestamp": upload.uploaded_at.isoformat() if upload.uploaded_at else datetime.now().isoformat(),
                "status": "completed" if upload.status == "completed" else "in-progress",
                "metadata": {
                    "file_type": "VCF" if upload.filename.endswith('.vcf') else "FASTQ",
                    "file_size": upload.metadata_json,
                    "file_id": upload.id
                }
            })
    
    # Get PRS scores (analysis events)
    prs_scores = db.query(PrsScore).join(GenomicData).filter(
        GenomicData.user_id == user_id
    ).order_by(desc(PrsScore.calculated_at)).all()
    
    for prs in prs_scores:
        timeline_events.append({
            "id": f"prs_{prs.id}",
            "event_type": "analysis",
            "title": f"PRS Analysis Complete",
            "description": f"Polygenic Risk Score calculated for {prs.disease_type}",
            "timestamp": prs.calculated_at.isoformat() if prs.calculated_at else datetime.now().isoformat(),
            "status": "completed",
            "metadata": {
                "analysis_type": "PRS",
                "disease": prs.disease_type,
                "score": prs.score,
                "severity": "high" if prs.score > 0.7 else "medium" if prs.score > 0.4 else "low"
            }
        })
    
    # Get ML predictions
    ml_predictions = db.query(MlPrediction).filter(
        MlPrediction.user_id == user_id
    ).all()
    
    for ml in ml_predictions:
        timeline_events.append({
            "id": f"ml_{ml.id}",
            "event_type": "analysis", 
            "title": "ML Prediction Analysis",
            "description": f"Machine learning analysis: {ml.prediction}",
            "timestamp": datetime.now().isoformat(),  # ML predictions don't have timestamp yet
            "status": "completed",
            "metadata": {
                "analysis_type": "ML",
                "prediction": ml.prediction,
                "confidence": ml.confidence
            }
        })
    
    # Sort events by timestamp (newest first)
    timeline_events.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # If no events found, add a welcome milestone
    if not timeline_events:
        timeline_events.append({
            "id": "welcome",
            "event_type": "milestone",
            "title": "Welcome to CuraGenie",
            "description": "Your personalized genomics journey starts here. Upload your first genomic file to begin analysis.",
            "timestamp": datetime.now().isoformat(),
            "status": "completed",
            "metadata": {
                "milestone_type": "onboarding"
            }
        })
    
    return timeline_events
