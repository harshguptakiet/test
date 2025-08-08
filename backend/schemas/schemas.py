from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class GenomicDataBase(BaseModel):
    user_id: str
    filename: str

class GenomicDataCreate(GenomicDataBase):
    pass

class GenomicDataResponse(GenomicDataBase):
    id: int
    file_url: str
    status: str
    metadata_json: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

class UploadResponse(BaseModel):
    id: int
    message: str
    status: str

class PrsScoreBase(BaseModel):
    genomic_data_id: int
    disease_type: str

class PrsScoreCreate(PrsScoreBase):
    pass

class PrsScoreResponse(PrsScoreBase):
    id: int
    score: float
    
    class Config:
        from_attributes = True

class PrsCalculationRequest(BaseModel):
    genomic_data_id: int
    disease_type: str

class MlPredictionBase(BaseModel):
    user_id: str

class MlPredictionCreate(MlPredictionBase):
    prediction: str
    confidence: float

class MlPredictionResponse(MlPredictionBase):
    id: int
    prediction: str
    confidence: float
    
    class Config:
        from_attributes = True

class MlInferenceRequest(BaseModel):
    user_id: str
    clinical_data: Dict[str, Any]

class WebSocketMessage(BaseModel):
    event: str
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    status: Optional[str] = None

# MRI Analysis Schemas
class MRIAnalysisBase(BaseModel):
    user_id: str
    filename: str

class MRIAnalysisCreate(MRIAnalysisBase):
    pass

class MRIAnalysisResponse(MRIAnalysisBase):
    id: int
    file_path: str
    status: str
    metadata_json: Optional[str] = None
    results_json: Optional[str] = None
    overall_risk_level: Optional[str] = None
    confidence_score: Optional[float] = None
    error_message: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    analysis_started_at: Optional[datetime] = None
    analysis_completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MRIUploadResponse(BaseModel):
    id: int
    message: str
    status: str
    filename: str
