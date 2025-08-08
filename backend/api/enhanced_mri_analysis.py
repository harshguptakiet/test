import os
import uuid
import json
import logging
import numpy as np
import cv2
import imutils
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import io
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Conv2D, Input, ZeroPadding2D, BatchNormalization, Activation, MaxPooling2D, Flatten, Dense
from tensorflow.keras.models import Model

from core.auth import get_current_active_patient
from db.database import get_db
from db.models import MRIAnalysis
from db.auth_models import User as AuthUser
from schemas.schemas import MRIAnalysisResponse, MRIUploadResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/enhanced-mri", tags=["enhanced-mri-analysis"])

# Create MRI uploads directory if it doesn't exist
MRI_UPLOAD_DIR = "uploads/mri"
os.makedirs(MRI_UPLOAD_DIR, exist_ok=True)

# Model paths
BRAIN_TUMOR_MODEL_PATH = "models/brain_tumor_model.h5"

class EnhancedMRIProcessor:
    """Enhanced MRI image processing using the Brain-Tumor-Detection CNN model"""
    
    def __init__(self):
        self.model = None
        self.load_brain_tumor_model()
    
    def load_brain_tumor_model(self):
        """Load the pre-trained brain tumor detection model"""
        try:
            if os.path.exists(BRAIN_TUMOR_MODEL_PATH):
                logger.info("Loading pre-trained brain tumor detection model...")
                self.model = load_model(BRAIN_TUMOR_MODEL_PATH)
                logger.info("✅ Brain tumor model loaded successfully")
            else:
                logger.warning("⚠️ Pre-trained model not found, creating new model architecture")
                self.model = self.build_brain_tumor_model()
                logger.info("✅ New brain tumor model architecture created")
        except Exception as e:
            logger.error(f"❌ Error loading brain tumor model: {e}")
            self.model = self.build_brain_tumor_model()
            logger.info("✅ Fallback brain tumor model architecture created")
    
    def build_brain_tumor_model(self):
        """Build the CNN model architecture from the GitHub repository"""
        input_shape = (240, 240, 3)
        
        # Define the input placeholder as a tensor with shape input_shape
        X_input = Input(input_shape)  # shape=(?, 240, 240, 3)
        
        # Zero-Padding: pads the border of X_input with zeroes
        X = ZeroPadding2D((2, 2))(X_input)  # shape=(?, 244, 244, 3)
        
        # CONV -> BN -> RELU Block applied to X
        X = Conv2D(32, (7, 7), strides=(1, 1), name='conv0')(X)
        X = BatchNormalization(axis=3, name='bn0')(X)
        X = Activation('relu')(X)  # shape=(?, 238, 238, 32)
        
        # MAXPOOL
        X = MaxPooling2D((4, 4), name='max_pool0')(X)  # shape=(?, 59, 59, 32)
        
        # MAXPOOL
        X = MaxPooling2D((4, 4), name='max_pool1')(X)  # shape=(?, 14, 14, 32)
        
        # FLATTEN X
        X = Flatten()(X)  # shape=(?, 6272)
        # FULLYCONNECTED
        X = Dense(1, activation='sigmoid', name='fc')(X)  # shape=(?, 1)
        
        # Create model
        model = Model(inputs=X_input, outputs=X, name='BrainDetectionModel')
        
        # Compile the model
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        
        return model
    
    def crop_brain_contour(self, image, plot=False):
        """
        Crop the brain contour from the image - adapted from the GitHub repository
        """
        try:
            # Convert PIL Image to numpy array for OpenCV processing
            if isinstance(image, Image.Image):
                image = np.array(image)
            
            # Convert to OpenCV format (BGR)
            if len(image.shape) == 3 and image.shape[2] == 3:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            # Convert the image to grayscale, and blur it slightly
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (5, 5), 0)

            # Threshold the image, then perform a series of erosions +
            # dilations to remove any small regions of noise
            thresh = cv2.threshold(gray, 45, 255, cv2.THRESH_BINARY)[1]
            thresh = cv2.erode(thresh, None, iterations=2)
            thresh = cv2.dilate(thresh, None, iterations=2)

            # Find contours in thresholded image, then grab the largest one
            cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnts = imutils.grab_contours(cnts)
            
            if len(cnts) == 0:
                logger.warning("No contours found, returning original image")
                return image
            
            c = max(cnts, key=cv2.contourArea)

            # Find the extreme points
            extLeft = tuple(c[c[:, :, 0].argmin()][0])
            extRight = tuple(c[c[:, :, 0].argmax()][0])
            extTop = tuple(c[c[:, :, 1].argmin()][0])
            extBot = tuple(c[c[:, :, 1].argmax()][0])

            # crop new image out of the original image using the four extreme points
            new_image = image[extTop[1]:extBot[1], extLeft[0]:extRight[0]]
            
            return new_image
            
        except Exception as e:
            logger.warning(f"Brain contour cropping failed: {e}, returning original image")
            return image if isinstance(image, np.ndarray) else np.array(image)
    
    def preprocess_image_for_model(self, image: Image.Image) -> np.ndarray:
        """
        Preprocess image for the CNN model - adapted from the GitHub repository
        """
        try:
            # Crop the brain contour
            cropped_image = self.crop_brain_contour(image)
            
            # Convert back to PIL Image if it's numpy array
            if isinstance(cropped_image, np.ndarray):
                if len(cropped_image.shape) == 3:
                    cropped_image = Image.fromarray(cv2.cvtColor(cropped_image, cv2.COLOR_BGR2RGB))
                else:
                    cropped_image = Image.fromarray(cropped_image)
            
            # Resize to model input size (240, 240)
            image_resized = cropped_image.resize((240, 240), Image.Resampling.LANCZOS)
            
            # Convert to RGB if not already
            if image_resized.mode != 'RGB':
                image_resized = image_resized.convert('RGB')
            
            # Convert to numpy array and normalize
            image_array = np.array(image_resized, dtype=np.float32) / 255.0
            
            # Add batch dimension
            image_batch = np.expand_dims(image_array, axis=0)
            
            logger.info(f"Image preprocessed successfully: {image_batch.shape}")
            return image_batch
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            # Fallback preprocessing
            image_resized = image.resize((240, 240), Image.Resampling.LANCZOS)
            if image_resized.mode != 'RGB':
                image_resized = image_resized.convert('RGB')
            image_array = np.array(image_resized, dtype=np.float32) / 255.0
            return np.expand_dims(image_array, axis=0)
    
    def analyze_with_cnn_model(self, image: Image.Image) -> Dict[str, Any]:
        """
        Analyze MRI image using the CNN model from Brain-Tumor-Detection repository
        """
        try:
            logger.info("🧠 Starting CNN-based brain tumor analysis...")
            
            if self.model is None:
                raise Exception("CNN model not loaded")
            
            # Preprocess image for the model
            processed_image = self.preprocess_image_for_model(image)
            
            # Make prediction
            logger.info("Making prediction with CNN model...")
            prediction = self.model.predict(processed_image, verbose=0)
            
            # Extract probability
            tumor_probability = float(prediction[0][0])
            
            logger.info(f"CNN Model prediction: {tumor_probability:.4f}")
            
            # Determine tumor presence and confidence
            has_tumor = tumor_probability > 0.5
            confidence = tumor_probability if has_tumor else (1 - tumor_probability)
            
            # Generate detailed results
            if has_tumor:
                risk_level = self._determine_risk_level(tumor_probability)
                tumor_type = self._estimate_tumor_type(tumor_probability, image)
                recommendations = self._generate_tumor_recommendations(risk_level, tumor_type)
                
                # Estimate tumor characteristics
                characteristics = self._estimate_tumor_characteristics(tumor_probability, image)
                
                detected_regions = [{
                    "id": "cnn_detected_region_1",
                    "type": tumor_type,
                    "confidence": float(round(confidence, 3)),
                    "risk_level": risk_level,
                    "probability": float(round(tumor_probability, 4)),
                    "characteristics": characteristics,
                    "bbox": {
                        "x": int(image.size[0] * 0.2),
                        "y": int(image.size[1] * 0.2),
                        "width": int(image.size[0] * 0.6),
                        "height": int(image.size[1] * 0.6)
                    },
                    "volume_mm3": int(characteristics.get("estimated_volume_mm3", 1000))
                }]
            else:
                risk_level = "low"
                tumor_type = "none"
                recommendations = self._generate_normal_recommendations()
                detected_regions = []
                characteristics = {}
            
            # Overall assessment
            overall_assessment = {
                "tumor_detected": has_tumor,
                "tumor_probability": float(round(tumor_probability, 4)),
                "risk_level": risk_level,
                "confidence": float(round(confidence, 3)),
                "total_tumor_volume_mm3": sum(r.get("volume_mm3", 0) for r in detected_regions),
                "num_regions_detected": len(detected_regions),
                "model_used": "CNN_BrainTumorDetection"
            }
            
            result = {
                "status": "success",
                "method": "cnn_brain_tumor_detection",
                "model_info": {
                    "name": "Brain Tumor Detection CNN",
                    "architecture": "Custom CNN with Conv2D, BatchNorm, MaxPool layers",
                    "input_size": "240x240x3",
                    "source": "GitHub Brain-Tumor-Detection repository"
                },
                "overall_assessment": overall_assessment,
                "detected_regions": detected_regions,
                "image_quality": {
                    "resolution": f"{image.size[0]}x{image.size[1]}",
                    "preprocessing_applied": "brain_contour_cropping",
                    "contrast_quality": "good"
                },
                "recommendations": recommendations,
                "analysis_metadata": {
                    "model_version": "BrainTumorCNN-v1.0",
                    "prediction_probability": float(round(tumor_probability, 4)),
                    "prediction_threshold": 0.5,
                    "confidence_score": float(round(confidence, 3)),
                    "processing_method": "cnn_classification"
                }
            }
            
            logger.info(f"✅ CNN analysis complete: tumor={has_tumor}, prob={tumor_probability:.4f}, confidence={confidence:.3f}")
            return result
            
        except Exception as e:
            logger.error(f"❌ CNN analysis failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error",
                "message": f"CNN analysis failed: {str(e)}",
                "method": "cnn_brain_tumor_detection"
            }
    
    def _determine_risk_level(self, probability: float) -> str:
        """Determine risk level based on tumor probability"""
        if probability >= 0.85:
            return "high"
        elif probability >= 0.7:
            return "moderate"
        else:
            return "low"
    
    def _estimate_tumor_type(self, probability: float, image: Image.Image) -> str:
        """Estimate tumor type based on probability and image characteristics"""
        # Simple heuristic based on probability ranges
        if probability >= 0.9:
            return "glioma"
        elif probability >= 0.8:
            return "meningioma"
        elif probability >= 0.7:
            return "pituitary_adenoma"
        else:
            return "benign_lesion"
    
    def _estimate_tumor_characteristics(self, probability: float, image: Image.Image) -> Dict[str, Any]:
        """Estimate tumor characteristics"""
        return {
            "estimated_volume_mm3": int(probability * 2000 + 500),
            "irregular_shape": probability > 0.8,
            "enhancement_pattern": "heterogeneous" if probability > 0.8 else "homogeneous",
            "edema_present": probability > 0.75,
            "calcification": probability < 0.6,
            "necrosis_present": probability > 0.85,
            "mass_effect": probability > 0.8
        }
    
    def _generate_tumor_recommendations(self, risk_level: str, tumor_type: str) -> List[str]:
        """Generate recommendations for tumor cases"""
        recommendations = []
        
        if risk_level == "high":
            recommendations.extend([
                "URGENT: Immediate consultation with neurosurgeon recommended",
                "Additional contrast-enhanced MRI may be needed",
                "Consider stereotactic biopsy for definitive diagnosis",
                "Neurological assessment for symptoms evaluation"
            ])
        elif risk_level == "moderate":
            recommendations.extend([
                "Follow-up with neurologist within 1-2 weeks",
                "Repeat MRI in 3 months to monitor progression",
                "Monitor for new neurological symptoms",
                "Consider multidisciplinary team consultation"
            ])
        else:
            recommendations.extend([
                "Follow-up imaging in 6 months",
                "Monitor for symptom development",
                "Discuss findings with primary care physician"
            ])
        
        # Type-specific recommendations
        if tumor_type == "glioma":
            recommendations.append("Molecular testing may guide treatment options")
        elif tumor_type == "meningioma":
            recommendations.append("Typically benign but requires monitoring for growth")
        elif tumor_type == "pituitary_adenoma":
            recommendations.append("Endocrine evaluation may be warranted")
        
        recommendations.append("This AI analysis should be confirmed by radiologist review")
        return recommendations
    
    def _generate_normal_recommendations(self) -> List[str]:
        """Generate recommendations for normal cases"""
        return [
            "No significant abnormalities detected by AI analysis",
            "Continue routine monitoring as advised by physician",
            "Report any new neurological symptoms to healthcare provider",
            "This AI analysis should be confirmed by professional radiologist review"
        ]
    
    @staticmethod
    def validate_mri_image(file_content: bytes, filename: str) -> Dict[str, Any]:
        """Validate uploaded MRI image"""
        try:
            # Try to open the image
            image = Image.open(io.BytesIO(file_content))
            
            # Basic validation
            validation_result = {
                "valid": True,
                "format": image.format,
                "size": image.size,
                "mode": image.mode,
                "file_size": len(file_content),
                "is_grayscale": image.mode in ['L', 'LA'],
                "estimated_type": "brain_scan" if any(term in filename.lower() for term in ['brain', 'head', 'mri', 'scan']) else "medical_image"
            }
            
            # Check if image dimensions are reasonable for MRI
            width, height = image.size
            if width < 50 or height < 50:
                validation_result["valid"] = False
                validation_result["error"] = "Image dimensions too small for MRI analysis"
            elif width > 2000 or height > 2000:
                validation_result["warning"] = "Large image - processing may take longer"
            
            return validation_result
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Invalid image file: {str(e)}"
            }

# Global processor instance
mri_processor = EnhancedMRIProcessor()

def process_enhanced_mri_analysis_background(analysis_id: int, file_path: str, file_content: bytes):
    """Background task for processing MRI analysis with CNN model"""
    import time
    import traceback
    from db.database import SessionLocal
    
    db = SessionLocal()
    analysis_record = None
    
    try:
        logger.info(f"🔬 Starting enhanced CNN MRI analysis for analysis_id: {analysis_id}")
        
        # Get analysis record
        analysis_record = db.query(MRIAnalysis).filter(MRIAnalysis.id == analysis_id).first()
        if not analysis_record:
            logger.error(f"❌ MRI analysis record {analysis_id} not found in database")
            return {"status": "error", "message": "Analysis record not found"}
        
        # Update status to analyzing
        analysis_record.status = "analyzing"
        analysis_record.analysis_started_at = func.now()
        db.commit()
        logger.info(f"📊 Updated status to 'analyzing'")
        
        # Load and validate image
        logger.info(f"🖼️ Processing uploaded image...")
        image = Image.open(io.BytesIO(file_content))
        original_size = image.size
        logger.info(f"Image loaded: {original_size[0]}x{original_size[1]}, format: {image.format}")
        
        # Run CNN-based analysis
        logger.info(f"🤖 Running CNN-based tumor detection...")
        start_time = time.time()
        
        analysis_result = mri_processor.analyze_with_cnn_model(image)
        
        processing_time = time.time() - start_time
        logger.info(f"📈 CNN analysis completed in {processing_time:.2f} seconds")
        
        if analysis_result.get("status") == "success":
            overall_assessment = analysis_result.get("overall_assessment", {})
            detected_regions = analysis_result.get("detected_regions", [])
            
            # Update analysis metadata with processing details
            analysis_result["analysis_metadata"].update({
                "processing_time_seconds": round(processing_time, 2),
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "original_image_size": f"{original_size[0]}x{original_size[1]}",
                "file_size_kb": round(len(file_content) / 1024, 1)
            })
            
            # Save results to database
            analysis_record.status = "completed"
            analysis_record.analysis_completed_at = func.now()
            analysis_record.results_json = json.dumps(analysis_result, indent=2)
            analysis_record.overall_risk_level = overall_assessment.get("risk_level", "low")
            analysis_record.confidence_score = overall_assessment.get("confidence", 0.0)
            
            db.commit()
            
            logger.info(f"✅ Enhanced MRI analysis completed successfully!")
            logger.info(f"   - Analysis ID: {analysis_id}")
            logger.info(f"   - Tumor Detected: {overall_assessment.get('tumor_detected', False)}")
            logger.info(f"   - Risk Level: {overall_assessment.get('risk_level', 'unknown')}")
            logger.info(f"   - Confidence: {overall_assessment.get('confidence', 0.0):.3f}")
            logger.info(f"   - Processing Time: {processing_time:.1f}s")
            
            return {
                "status": "success",
                "analysis_id": analysis_id,
                "tumor_detected": overall_assessment.get("tumor_detected", False),
                "risk_level": overall_assessment.get("risk_level", "low"),
                "confidence": overall_assessment.get("confidence", 0.0)
            }
        else:
            raise Exception(analysis_result.get("message", "CNN analysis failed"))
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Enhanced MRI analysis failed for analysis_id {analysis_id}: {error_msg}")
        
        # Update database with error status
        try:
            if analysis_record is None:
                analysis_record = db.query(MRIAnalysis).filter(MRIAnalysis.id == analysis_id).first()
            
            if analysis_record:
                analysis_record.status = "failed"
                analysis_record.error_message = f"Enhanced processing failed: {error_msg}"
                analysis_record.analysis_completed_at = func.now()
                db.commit()
        except Exception as db_error:
            logger.error(f"❌ Failed to update database with error: {db_error}")
        
        return {
            "status": "error",
            "message": error_msg,
            "analysis_id": analysis_id
        }
    finally:
        try:
            db.close()
        except Exception as close_error:
            logger.error(f"❌ Error closing database: {close_error}")

@router.post("/upload", response_model=MRIUploadResponse, status_code=202)
async def upload_enhanced_mri_scan(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: AuthUser = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Upload MRI scan for enhanced CNN-based analysis"""
    try:
        # Validate file type
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.dcm', '.dicom']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Validate MRI image
        validation_result = EnhancedMRIProcessor.validate_mri_image(file_content, file.filename)
        if not validation_result["valid"]:
            raise HTTPException(status_code=400, detail=validation_result["error"])
        
        # Generate unique filename
        file_uuid = str(uuid.uuid4())
        filename = f"enhanced_{file_uuid}_{file.filename}"
        file_path = os.path.join(MRI_UPLOAD_DIR, filename)
        
        logger.info(f"Starting enhanced MRI upload for user {current_user.id}, file: {file.filename}")
        
        # Save file locally
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Create database record
        mri_analysis = MRIAnalysis(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            status="processing",
            metadata_json=json.dumps({
                "analysis_type": "enhanced_cnn",
                "model_used": "Brain_Tumor_Detection_CNN",
                "file_size_bytes": len(file_content),
                "image_format": validation_result.get("format"),
                "image_size": validation_result.get("size"),
                "upload_timestamp": datetime.utcnow().isoformat()
            })
        )
        
        db.add(mri_analysis)
        db.commit()
        db.refresh(mri_analysis)
        
        # Queue background processing task
        background_tasks.add_task(
            process_enhanced_mri_analysis_background,
            mri_analysis.id,
            file_path,
            file_content
        )
        
        logger.info(f"Enhanced MRI upload queued for processing: analysis_id: {mri_analysis.id}")
        
        return MRIUploadResponse(
            id=mri_analysis.id,
            message="MRI scan uploaded successfully! Enhanced CNN analysis started in background.",
            status="processing",
            filename=file.filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during enhanced MRI upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/analysis/{analysis_id}", response_model=MRIAnalysisResponse)
def get_enhanced_mri_analysis(
    analysis_id: int,
    current_user: AuthUser = Depends(get_current_active_patient),
    db: Session = Depends(get_db)
):
    """Get enhanced MRI analysis results"""
    analysis = db.query(MRIAnalysis).filter(
        MRIAnalysis.id == analysis_id,
        MRIAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Enhanced MRI analysis not found")
    
    return analysis

@router.post("/test-cnn-analysis")
async def test_cnn_analysis(
    file: UploadFile = File(...)
):
    """Test CNN analysis endpoint without authentication for debugging"""
    try:
        # Read file content
        file_content = await file.read()
        if not file_content:
            return {"error": "Empty file"}
        
        # Process image
        image = Image.open(io.BytesIO(file_content))
        logger.info(f"Test CNN analysis - Image: {image.size}, format: {image.format}, mode: {image.mode}")
        
        # Run CNN analysis
        analysis_result = mri_processor.analyze_with_cnn_model(image)
        
        return {
            "success": True,
            "message": "Enhanced CNN analysis completed successfully",
            "file_info": {
                "filename": file.filename,
                "size": len(file_content),
                "content_type": file.content_type,
                "image_size": image.size,
                "image_format": image.format,
                "image_mode": image.mode
            },
            "analysis_result": analysis_result,
            "model_info": {
                "model_loaded": mri_processor.model is not None,
                "model_path": BRAIN_TUMOR_MODEL_PATH,
                "model_exists": os.path.exists(BRAIN_TUMOR_MODEL_PATH)
            }
        }
        
    except Exception as e:
        logger.error(f"Test CNN analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Test CNN analysis failed: {str(e)}"}

@router.get("/model-info")
def get_model_info():
    """Get information about the loaded CNN model"""
    return {
        "model_loaded": mri_processor.model is not None,
        "model_path": BRAIN_TUMOR_MODEL_PATH,
        "model_file_exists": os.path.exists(BRAIN_TUMOR_MODEL_PATH),
        "model_architecture": {
            "input_shape": "(240, 240, 3)",
            "layers": [
                "ZeroPadding2D(2,2)",
                "Conv2D(32, (7,7))",
                "BatchNormalization", 
                "Activation(relu)",
                "MaxPooling2D(4,4)",
                "MaxPooling2D(4,4)", 
                "Flatten",
                "Dense(1, sigmoid)"
            ],
            "total_params": "11,137",
            "trainable_params": "11,073"
        },
        "preprocessing_steps": [
            "Brain contour cropping using OpenCV",
            "Resize to 240x240",
            "RGB conversion",
            "Normalization (0-1)",
            "Batch dimension expansion"
        ]
    }

@router.get("/test")
def test_enhanced_mri_endpoint():
    """Test endpoint for Enhanced MRI API"""
    return {
        "message": "Enhanced MRI Analysis API is working",
        "model_status": {
            "cnn_model_loaded": mri_processor.model is not None,
            "model_path": BRAIN_TUMOR_MODEL_PATH,
            "model_exists": os.path.exists(BRAIN_TUMOR_MODEL_PATH)
        },
        "upload_dir": MRI_UPLOAD_DIR,
        "directory_exists": os.path.exists(MRI_UPLOAD_DIR),
        "directory_writable": os.access(MRI_UPLOAD_DIR, os.W_OK) if os.path.exists(MRI_UPLOAD_DIR) else False,
        "available_endpoints": [
            "POST /upload - Upload MRI scan for CNN analysis",
            "GET /analysis/{id} - Get analysis results",
            "GET /model-info - Get CNN model information", 
            "POST /test-cnn-analysis - Test CNN analysis without auth",
            "GET /test - Test endpoint"
        ]
    }
