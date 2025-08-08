'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  Download,
  Maximize,
  Minimize,
  Target,
  AlertTriangle,
  Info,
  Activity,
  Settings
} from 'lucide-react';

interface RealMRIViewerProps {
  imageFile?: File;
  imageUrl?: string;
  analysisData?: {
    detected_regions?: Array<{
      id: string;
      type: string;
      confidence: number;
      coordinates: { x: number; y: number; width: number; height: number };
      location: string;
      risk_level: string;
    }>;
    overall_confidence?: number;
  };
  userId: string;
}

export function RealMRIViewer({ 
  imageFile, 
  imageUrl, 
  analysisData, 
  userId 
}: RealMRIViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageData, setImageData] = useState<string | null>(null);

  // Load image data when component mounts or props change
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageData(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else if (imageUrl) {
      setImageData(imageUrl);
    }
  }, [imageFile, imageUrl]);

  // Initialize canvas and image when image data is available
  useEffect(() => {
    if (!imageData) return;

    const img = new Image();
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current = img;
        setImageLoaded(true);
        drawImage();
      }
    };
    img.src = imageData;
    imageRef.current = img;
  }, [imageData]);

  // Redraw when parameters change
  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [imageLoaded, zoom, pan, brightness, contrast, showAnnotations]);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate image dimensions and positioning
    const canvasAspect = canvas.width / canvas.height;
    const imageAspect = img.width / img.height;

    let drawWidth, drawHeight;
    if (imageAspect > canvasAspect) {
      drawWidth = canvas.width * zoom;
      drawHeight = (canvas.width / imageAspect) * zoom;
    } else {
      drawWidth = (canvas.height * imageAspect) * zoom;
      drawHeight = canvas.height * zoom;
    }

    const drawX = (canvas.width - drawWidth) / 2 + pan.x;
    const drawY = (canvas.height - drawHeight) / 2 + pan.y;

    // Apply brightness and contrast filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw the image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Reset filter
    ctx.filter = 'none';

    // Draw analysis annotations if available and enabled
    if (showAnnotations && analysisData?.detected_regions) {
      drawAnalysisOverlay(ctx, drawX, drawY, drawWidth, drawHeight);
    }

    // Draw crosshairs
    drawCrosshairs(ctx);

  }, [zoom, pan, brightness, contrast, showAnnotations, analysisData]);

  const drawAnalysisOverlay = (
    ctx: CanvasRenderingContext2D, 
    imgX: number, 
    imgY: number, 
    imgWidth: number, 
    imgHeight: number
  ) => {
    if (!analysisData?.detected_regions) return;

    const img = imageRef.current;
    if (!img) return;

    const scaleX = imgWidth / img.width;
    const scaleY = imgHeight / img.height;

    analysisData.detected_regions.forEach((region) => {
      const x = imgX + region.coordinates.x * scaleX;
      const y = imgY + region.coordinates.y * scaleY;
      const width = region.coordinates.width * scaleX;
      const height = region.coordinates.height * scaleY;

      // Choose color based on risk level
      let color;
      switch (region.risk_level) {
        case 'high': color = '#ef4444'; break;
        case 'moderate': color = '#f59e0b'; break;
        case 'low': color = '#10b981'; break;
        default: color = '#6b7280'; break;
      }

      // Draw detection box with glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      // Draw label background
      const labelWidth = 120;
      const labelHeight = 50;
      const labelX = Math.min(x + width + 10, canvasRef.current!.width - labelWidth);
      const labelY = Math.max(y, labelHeight);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(labelX, labelY - labelHeight, labelWidth, labelHeight);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(region.type.replace('_', ' '), labelX + 5, labelY - 30);
      ctx.fillText(`${(region.confidence * 100).toFixed(1)}%`, labelX + 5, labelY - 15);
      ctx.fillText(region.location, labelX + 5, labelY - 5);

      // Draw connecting line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x + width, y + height/2);
      ctx.lineTo(labelX, labelY - labelHeight/2);
      ctx.stroke();
    });
  };

  const drawCrosshairs = (ctx: CanvasRenderingContext2D) => {
    const centerX = canvasRef.current!.width / 2;
    const centerY = canvasRef.current!.height / 2;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.7;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvasRef.current!.height);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvasRef.current!.width, centerY);
    ctx.stroke();
    
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(5.0, prev + delta)));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setBrightness(50);
    setContrast(50);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 5.0));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  if (!imageData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Brain className="h-12 w-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Image Loaded</h3>
              <p className="text-gray-600">Upload an MRI image to begin analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Real MRI Image Analysis</CardTitle>
              <p className="text-sm text-gray-600">
                {imageFile ? imageFile.name : 'Uploaded MRI Scan'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {analysisData && (
              <Badge variant="outline" className="text-green-700 border-green-300">
                <Target className="h-3 w-3 mr-1" />
                {analysisData.detected_regions?.length || 0} regions detected
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Analysis Alert */}
        {analysisData && analysisData.detected_regions && analysisData.detected_regions.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>AI Analysis:</strong> {analysisData.detected_regions.length} suspicious region(s) detected. 
              Confidence: {((analysisData.overall_confidence || 0) * 100).toFixed(1)}%
            </AlertDescription>
          </Alert>
        )}

        {/* Image Display */}
        <div className="flex gap-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded-lg bg-black cursor-move"
              style={{
                width: fullscreen ? '70vw' : '800px',
                height: fullscreen ? '70vh' : '600px'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
            
            {/* Overlay Information */}
            <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-xs">
              <div>Patient: {userId}</div>
              <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
              <div>Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</div>
              {analysisData && (
                <div>Confidence: {((analysisData.overall_confidence || 0) * 100).toFixed(1)}%</div>
              )}
            </div>

            {/* Loading State */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center">
                  <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <div>Loading MRI Image...</div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          {analysisData && (
            <div className="flex-1 space-y-4 max-w-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Detection Results
                </h4>
                
                {analysisData.detected_regions?.map((region, index) => (
                  <div key={region.id} className="mb-3 p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        Region #{index + 1}
                      </span>
                      <Badge 
                        variant={
                          region.risk_level === 'high' ? 'destructive' :
                          region.risk_level === 'moderate' ? 'default' : 'secondary'
                        }
                      >
                        {region.risk_level}
                      </Badge>
                    </div>
                    
                    <div className="text-xs space-y-1 text-gray-700">
                      <div><strong>Type:</strong> {region.type.replace('_', ' ')}</div>
                      <div><strong>Location:</strong> {region.location}</div>
                      <div><strong>Confidence:</strong> {(region.confidence * 100).toFixed(1)}%</div>
                      <div><strong>Size:</strong> {region.coordinates.width}×{region.coordinates.height}px</div>
                    </div>
                  </div>
                ))}

                {(!analysisData.detected_regions || analysisData.detected_regions.length === 0) && (
                  <div className="text-sm text-gray-600">
                    No suspicious regions detected in this image.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 border-t pt-4">
          {/* Zoom and Pan Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">
                {(zoom * 100).toFixed(0)}%
              </span>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset View
            </Button>

            <Button
              variant={showAnnotations ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Annotations
            </Button>
          </div>

          {/* Image Adjustment Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brightness</label>
              <Slider
                value={[brightness]}
                onValueChange={(value) => setBrightness(value[0])}
                max={200}
                min={10}
                step={5}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Contrast</label>
              <Slider
                value={[contrast]}
                onValueChange={(value) => setContrast(value[0])}
                max={200}
                min={10}
                step={5}
              />
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Analysis
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
