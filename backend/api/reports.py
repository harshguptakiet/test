from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import json

from core.auth import get_current_active_patient
from db.database import get_db
from db.auth_models import User, MedicalReport
from db.models import GenomicData
from services.report_generator import ReportGenerator

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/generate/{genomic_data_id}")
def generate_report(
    genomic_data_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Generate comprehensive medical report for genomic data"""
    
    # Verify genomic data belongs to current user
    genomic_data = db.query(GenomicData).filter(
        GenomicData.id == genomic_data_id,
        GenomicData.user_id == current_user.id
    ).first()
    
    if not genomic_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genomic data not found"
        )
    
    # Check if report already exists
    existing_report = db.query(MedicalReport).filter(
        MedicalReport.genomic_data_id == genomic_data_id,
        MedicalReport.user_id == current_user.id
    ).first()
    
    if existing_report:
        return {
            "message": "Report already exists",
            "report_id": existing_report.id,
            "status": existing_report.status
        }
    
    # Generate report in background
    def generate_report_task():
        report_generator = ReportGenerator()
        result = report_generator.generate_comprehensive_report(
            current_user.id, genomic_data_id, db
        )
        return result
    
    background_tasks.add_task(generate_report_task)
    
    return {
        "message": "Report generation started",
        "genomic_data_id": genomic_data_id,
        "status": "processing"
    }

@router.get("/my-reports")
def get_my_reports(
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Get all reports for current user"""
    
    reports = db.query(MedicalReport).filter(
        MedicalReport.user_id == current_user.id
    ).order_by(MedicalReport.generated_at.desc()).all()
    
    reports_data = []
    for report in reports:
        # Get associated genomic data
        genomic_data = db.query(GenomicData).filter(
            GenomicData.id == report.genomic_data_id
        ).first()
        
        report_info = {
            "id": report.id,
            "report_title": report.report_title,
            "report_type": report.report_type,
            "status": report.status,
            "summary": report.summary,
            "generated_at": report.generated_at.isoformat() if report.generated_at else None,
            "genomic_data": {
                "id": genomic_data.id if genomic_data else None,
                "filename": genomic_data.filename if genomic_data else None
            }
        }
        reports_data.append(report_info)
    
    return {
        "reports": reports_data,
        "total": len(reports_data)
    }

@router.get("/{report_id}")
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Get detailed report by ID"""
    
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Parse report data
    report_data = {}
    if report.report_data:
        try:
            report_data = json.loads(report.report_data)
        except:
            report_data = {"error": "Could not parse report data"}
    
    # Get associated genomic data
    genomic_data = db.query(GenomicData).filter(
        GenomicData.id == report.genomic_data_id
    ).first()
    
    return {
        "id": report.id,
        "report_title": report.report_title,
        "report_type": report.report_type,
        "status": report.status,
        "summary": report.summary,
        "recommendations": report.recommendations,
        "generated_at": report.generated_at.isoformat() if report.generated_at else None,
        "genomic_data": {
            "id": genomic_data.id if genomic_data else None,
            "filename": genomic_data.filename if genomic_data else None,
            "uploaded_at": genomic_data.uploaded_at.isoformat() if genomic_data and genomic_data.uploaded_at else None
        },
        "report_data": report_data
    }

@router.get("/download/{report_id}")
def download_report(
    report_id: int,
    format: str = "json",  # json, pdf, html
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Download report in specified format"""
    
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # For now, only support JSON format
    # In production, you would implement PDF/HTML generation
    if format.lower() == "json":
        report_data = {}
        if report.report_data:
            try:
                report_data = json.loads(report.report_data)
            except:
                report_data = {"error": "Could not parse report data"}
        
        return {
            "report_id": report.id,
            "format": "json",
            "data": report_data
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON format is currently supported"
        )

@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Delete a report"""
    
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    db.delete(report)
    db.commit()
    
    return {"message": "Report deleted successfully"}

@router.get("/generate-instant/{genomic_data_id}")
def generate_instant_report(
    genomic_data_id: int,
    current_user: User = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Generate and return report instantly (for real-time use)"""
    
    # Verify genomic data belongs to current user
    genomic_data = db.query(GenomicData).filter(
        GenomicData.id == genomic_data_id,
        GenomicData.user_id == current_user.id
    ).first()
    
    if not genomic_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genomic data not found"
        )
    
    # Generate report instantly
    report_generator = ReportGenerator()
    result = report_generator.generate_comprehensive_report(
        current_user.id, genomic_data_id, db
    )
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Report generation failed")
        )
    
    return {
        "message": "Report generated successfully",
        "report": result.get("report"),
        "status": "completed"
    }
