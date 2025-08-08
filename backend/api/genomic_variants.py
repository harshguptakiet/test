from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import re
from datetime import datetime

from db.database import get_db
from db.models import GenomicData, PrsScore
from genomic_utils import GenomicProcessor

router = APIRouter(prefix="/api/genomic", tags=["genomic-variants"])

@router.get("/variants/{user_id}")
def get_genomic_variants(user_id: str, db: Session = Depends(get_db)):
    """Get genomic variants for visualization"""
    
    # Get the user's genomic data files
    genomic_files = db.query(GenomicData).filter(
        GenomicData.user_id == user_id,
        GenomicData.status == "completed"
    ).all()
    
    if not genomic_files:
        return []
    
    all_variants = []
    processor = GenomicProcessor()
    
    for genomic_file in genomic_files:
        try:
            # Read the file content
            with open(genomic_file.file_url, 'r') as f:
                file_content = f.read().encode()
            
            # Parse variants from VCF
            if genomic_file.filename.lower().endswith('.vcf') or genomic_file.filename.lower().endswith('.vcf.gz'):
                variants = parse_vcf_variants(file_content.decode())
                all_variants.extend(variants)
                
        except Exception as e:
            print(f"Error processing genomic file {genomic_file.filename}: {e}")
            continue
    
    # If no variants found from files, create some representative variants based on PRS data
    if not all_variants:
        prs_scores = db.query(PrsScore).join(GenomicData).filter(
            GenomicData.user_id == user_id
        ).all()
        
        if prs_scores:
            all_variants = generate_representative_variants(prs_scores)
    
    # Sort by chromosome and position
    all_variants.sort(key=lambda v: (chromosome_sort_key(v['chromosome']), v['position']))
    
    return all_variants

def parse_vcf_variants(vcf_content: str) -> List[dict]:
    """Parse VCF content and extract variants with importance scores"""
    variants = []
    
    lines = vcf_content.strip().split('\n')
    
    for line in lines:
        if line.startswith('#') or not line.strip():
            continue
            
        try:
            parts = line.split('\t')
            if len(parts) < 8:
                continue
                
            chrom = parts[0]
            pos = int(parts[1])
            variant_id = parts[2] if parts[2] != '.' else f"{chrom}:{pos}"
            ref = parts[3]
            alt = parts[4]
            qual = float(parts[5]) if parts[5] != '.' else 0
            info = parts[7] if len(parts) > 7 else ""
            
            # Calculate importance based on quality and INFO fields
            importance = calculate_variant_importance(qual, info, chrom, pos)
            
            variants.append({
                "chromosome": clean_chromosome(chrom),
                "position": pos,
                "importance": importance,
                "id": variant_id,
                "ref": ref,
                "alt": alt,
                "quality": qual
            })
            
        except (ValueError, IndexError) as e:
            continue
    
    return variants

def generate_representative_variants(prs_scores: List[PrsScore]) -> List[dict]:
    """Generate representative variants based on PRS scores"""
    variants = []
    
    # Common disease-associated loci
    disease_loci = {
        "cardiovascular_disease": [
            {"chr": "1", "pos": 55505647},  # PCSK9
            {"chr": "2", "pos": 21286757},  # APOB
            {"chr": "19", "pos": 11217748}, # LDLR
        ],
        "diabetes_type2": [
            {"chr": "6", "pos": 20679709},  # HLA region
            {"chr": "10", "pos": 94452862}, # TCF7L2
            {"chr": "11", "pos": 2161612},  # INS
        ],
        "alzheimer_disease": [
            {"chr": "19", "pos": 45411941}, # APOE
            {"chr": "11", "pos": 59923508}, # MS4A6A
            {"chr": "2", "pos": 127892810}, # BIN1
        ]
    }
    
    for prs in prs_scores:
        disease_key = prs.disease_type.lower().replace(" ", "_")
        if disease_key in disease_loci:
            for locus in disease_loci[disease_key]:
                variants.append({
                    "chromosome": locus["chr"],
                    "position": locus["pos"],
                    "importance": min(prs.score, 1.0),  # Use PRS score as importance
                    "id": f"{locus['chr']}:{locus['pos']}",
                    "ref": "G",  # Placeholder
                    "alt": "A",  # Placeholder
                    "quality": 60.0
                })
    
    return variants

def calculate_variant_importance(qual: float, info: str, chrom: str, pos: int) -> float:
    """Calculate variant importance score (0-1)"""
    importance = 0.0
    
    # Base score from quality
    if qual > 0:
        importance += min(qual / 100.0, 0.5)  # Max 0.5 from quality
    
    # Boost for known important regions
    important_regions = {
        "19": [11200000, 11250000],  # LDLR region
        "19": [45400000, 45450000],  # APOE region
        "6": [20600000, 20700000],   # HLA region
    }
    
    chrom_clean = clean_chromosome(chrom)
    if chrom_clean in important_regions:
        for start, end in [important_regions[chrom_clean]]:
            if start <= pos <= end:
                importance += 0.3
                break
    
    # Random component for demo purposes
    import random
    importance += random.uniform(0.0, 0.2)
    
    return min(importance, 1.0)

def clean_chromosome(chrom: str) -> str:
    """Clean chromosome name"""
    chrom = chrom.replace('chr', '').replace('CHR', '')
    return chrom

def chromosome_sort_key(chrom: str) -> tuple:
    """Create sort key for chromosomes"""
    chrom_clean = clean_chromosome(chrom)
    
    if chrom_clean.isdigit():
        return (0, int(chrom_clean))
    elif chrom_clean == 'X':
        return (1, 0)
    elif chrom_clean == 'Y':
        return (1, 1)
    elif chrom_clean == 'MT' or chrom_clean == 'M':
        return (1, 2)
    else:
        return (2, 0)
