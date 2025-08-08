import sqlite3
import json
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter(prefix="/api/direct", tags=["direct"])

def get_database_connection():
    """Get direct SQLite connection"""
    return sqlite3.connect('curagenie.db')

@router.get("/prs/user/{user_id}")
def get_user_prs_scores_direct(user_id: str) -> List[Dict[str, Any]]:
    """Get PRS scores for a user using direct SQL query"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Direct SQL query to get LATEST PRS scores for each disease (avoid duplicates)
        query = """
        SELECT 
            ps.id,
            ps.genomic_data_id,
            ps.disease_type,
            ps.score,
            ps.calculated_at,
            gd.filename,
            gd.status,
            gd.uploaded_at
        FROM prs_scores ps
        JOIN genomic_data gd ON ps.genomic_data_id = gd.id
        WHERE gd.user_id = ?
        AND ps.id IN (
            -- Get only the most recent PRS score for each disease type
            SELECT MAX(ps2.id)
            FROM prs_scores ps2
            JOIN genomic_data gd2 ON ps2.genomic_data_id = gd2.id
            WHERE gd2.user_id = ? AND ps2.disease_type = ps.disease_type
        )
        ORDER BY ps.disease_type ASC
        """
        
        cursor.execute(query, (user_id, user_id))
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        results = []
        for row in rows:
            results.append({
                "id": row[0],
                "genomic_data_id": row[1],
                "disease_type": row[2],
                "score": row[3],
                "calculated_at": row[4],
                "filename": row[5],
                "genomic_status": row[6],
                "uploaded_at": row[7]
            })
        
        conn.close()
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/genomic-data/user/{user_id}")
def get_user_genomic_data_direct(user_id: str) -> List[Dict[str, Any]]:
    """Get genomic data for a user using direct SQL query"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Direct SQL query to get genomic data
        query = """
        SELECT 
            id,
            user_id,
            filename,
            file_url,
            status,
            metadata_json,
            uploaded_at
        FROM genomic_data
        WHERE user_id = ?
        ORDER BY id DESC
        """
        
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        results = []
        for row in rows:
            metadata = {}
            try:
                metadata = json.loads(row[5]) if row[5] else {}
            except:
                metadata = {"raw": row[5]}
                
            results.append({
                "id": row[0],
                "user_id": row[1],
                "filename": row[2],
                "file_url": row[3],
                "status": row[4],
                "metadata": metadata,
                "uploaded_at": row[6]
            })
        
        conn.close()
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/dashboard-stats/user/{user_id}")
def get_dashboard_stats_direct(user_id: str) -> Dict[str, Any]:
    """Get dashboard statistics for a user"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Get unique diseases count
        diseases_query = "SELECT COUNT(DISTINCT ps.disease_type) FROM prs_scores ps JOIN genomic_data gd ON ps.genomic_data_id = gd.id WHERE gd.user_id = ?"
        cursor.execute(diseases_query, (user_id,))
        diseases_count = cursor.fetchone()[0] or 0
        
        # Get average score from latest upload only
        avg_query = """
        SELECT AVG(ps.score) 
        FROM prs_scores ps
        JOIN genomic_data gd ON ps.genomic_data_id = gd.id
        WHERE gd.user_id = ? AND gd.id = (SELECT MAX(gd2.id) FROM genomic_data gd2 WHERE gd2.user_id = ?)
        """
        cursor.execute(avg_query, (user_id, user_id))
        avg_score = cursor.fetchone()[0] or 0
        
        # Get files processed count
        files_query = "SELECT COUNT(*) FROM genomic_data WHERE user_id = ?"
        cursor.execute(files_query, (user_id,))
        files_count = cursor.fetchone()[0] or 0
        
        # Get latest genomic data status
        genomic_query = """
        SELECT status, uploaded_at
        FROM genomic_data 
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
        """
        cursor.execute(genomic_query, (user_id,))
        latest_genomic = cursor.fetchone()
        
        conn.close()
        
        return {
            "total_prs_scores": diseases_count,  # Use unique diseases count
            "average_risk_score": round(avg_score * 100, 1) if avg_score else 0,
            "diseases_analyzed": diseases_count,
            "files_processed": files_count,
            "latest_status": latest_genomic[0] if latest_genomic else "no_data",
            "latest_upload": latest_genomic[1] if latest_genomic else None,
            "has_data": diseases_count > 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
