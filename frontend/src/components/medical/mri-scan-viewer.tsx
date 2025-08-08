'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Zap, 
  Eye, 
  Download, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Play,
  Pause,
  Volume2,
  Settings,
  Info,
  AlertTriangle,
  Activity,
  Target,
  Layers,
  Maximize,
  Minimize
} from 'lucide-react';

interface MRIScanViewerProps {
  userId: string;
  width?: number;
  height?: number;
  showControls?: boolean;
}

interface TumorRegion {
  id: string;
  label: string;
  confidence: number;
  size: string;
  location: string;
  riskLevel: 'low' | 'moderate' | 'high';
  color: string;
}

export function MRIScanViewer({ 
  userId, 
  width = 600, 
  height = 600, 
  showControls = true 
}: MRIScanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSlice, setCurrentSlice] = useState(50);
  const [zoom, setZoom] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedView, setSelectedView] = useState<'axial' | 'sagittal' | 'coronal'>('axial');
  const [fullscreen, setFullscreen] = useState(false);

  // Mock tumor detection results
  const tumorRegions: TumorRegion[] = [
    {
      id: 'region_1',
      label: 'Suspected Mass',
      confidence: 87.5,
      size: '2.3 cm × 1.8 cm',
      location: 'Left Frontal Lobe',
      riskLevel: 'high',
      color: '#ef4444'
    },
    {
      id: 'region_2',
      label: 'Possible Lesion',
      confidence: 65.2,
      size: '0.8 cm × 0.6 cm',
      location: 'Right Parietal',
      riskLevel: 'moderate',
      color: '#f59e0b'
    }
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    drawMRIScan(ctx);
  }, [currentSlice, zoom, brightness, contrast, selectedView, showAnnotations, width, height]);

  const drawMRIScan = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Apply brightness and contrast filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw mock brain outline
    drawBrainOutline(ctx);
    
    // Draw tumor regions
    if (showAnnotations) {
      drawTumorRegions(ctx);
    }
    
    // Draw crosshairs
    drawCrosshairs(ctx);

    // Reset filter
    ctx.filter = 'none';
  };

  const drawBrainOutline = (ctx: CanvasRenderingContext2D) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = zoom;

    // Draw brain tissue (gray matter)
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 20 * scale, 180 * scale, 200 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw white matter (lighter gray)
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 20 * scale, 140 * scale, 160 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw ventricles (dark)
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(centerX - 30 * scale, centerY - 10 * scale, 20 * scale, 40 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 30 * scale, centerY - 10 * scale, 20 * scale, 40 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Add some texture/noise for realism
    for (let i = 0; i < 200; i++) {
      const x = centerX + (Math.random() - 0.5) * 300 * scale;
      const y = centerY + (Math.random() - 0.5) * 320 * scale;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (dist < 180 * scale) {
        ctx.fillStyle = `rgba(${100 + Math.random() * 50}, ${100 + Math.random() * 50}, ${100 + Math.random() * 50}, 0.3)`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  };

  const drawTumorRegions = (ctx: CanvasRenderingContext2D) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = zoom;

    tumorRegions.forEach((region, index) => {
      // Position tumors at different locations
      let tumorX, tumorY, tumorSize;
      
      if (region.id === 'region_1') {
        tumorX = centerX - 60 * scale;
        tumorY = centerY - 40 * scale;
        tumorSize = 25 * scale;
      } else {
        tumorX = centerX + 40 * scale;
        tumorY = centerY + 20 * scale;
        tumorSize = 15 * scale;
      }

      // Draw tumor with glow effect
      ctx.shadowColor = region.color;
      ctx.shadowBlur = 15;
      
      // Main tumor mass
      ctx.fillStyle = region.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(tumorX, tumorY, tumorSize, tumorSize * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tumor border
      ctx.strokeStyle = region.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Draw annotation label
      if (showAnnotations) {
        const labelX = tumorX + tumorSize + 10;
        const labelY = tumorY - tumorSize;
        
        // Label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(labelX, labelY - 20, 120, 40);
        
        // Label text
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(region.label, labelX + 5, labelY - 5);
        ctx.fillText(`${region.confidence}%`, labelX + 5, labelY + 10);
        
        // Connecting line
        ctx.strokeStyle = region.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tumorX + tumorSize, tumorY);
        ctx.lineTo(labelX, labelY);
        ctx.stroke();
      }
    });
  };

  const drawCrosshairs = (ctx: CanvasRenderingContext2D) => {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    ctx.setLineDash([]);
  };

  const handleSliceChange = (value: number[]) => {
    setCurrentSlice(value[0]);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Animation would be implemented here
  };

  return (
    <Card className={`w-full ${fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>MRI Brain Scan Analysis</CardTitle>
              <p className="text-sm text-gray-600">AI-Powered Tumor Detection</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              <Activity className="h-3 w-3 mr-1" />
              Live Analysis
            </Badge>
            
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
        {/* Scan Display */}
        <div className="flex gap-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded-lg bg-black cursor-crosshair"
              style={{
                width: fullscreen ? '70vw' : `${width}px`,
                height: fullscreen ? '70vh' : `${height}px`
              }}
            />
            
            {/* Overlay Information */}
            <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-xs">
              <div>Patient ID: {userId}</div>
              <div>Slice: {currentSlice}/100</div>
              <div>View: {selectedView.toUpperCase()}</div>
              <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
            </div>

            {/* Detected Regions Overlay */}
            <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded text-xs max-w-xs">
              <div className="font-semibold mb-2">Detected Regions:</div>
              {tumorRegions.map(region => (
                <div key={region.id} className="mb-1 flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: region.color }}
                  ></div>
                  <span>{region.label}: {region.confidence}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Results Panel */}
          <div className="flex-1 space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Analysis Results:</strong> {tumorRegions.length} suspicious region(s) detected. 
                Please consult with a medical professional for proper diagnosis.
              </AlertDescription>
            </Alert>

            {/* Tumor Regions Details */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" />
                Detected Regions
              </h4>
              
              {tumorRegions.map(region => (
                <Card key={region.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: region.color }}
                      ></div>
                      <span className="font-medium">{region.label}</span>
                    </div>
                    <Badge 
                      variant={region.riskLevel === 'high' ? 'destructive' : 
                              region.riskLevel === 'moderate' ? 'default' : 'secondary'}
                    >
                      {region.confidence}% confidence
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Location:</strong> {region.location}</div>
                    <div><strong>Size:</strong> {region.size}</div>
                    <div><strong>Risk Level:</strong> {region.riskLevel.toUpperCase()}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="space-y-4 border-t pt-4">
            {/* View Selection */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">View:</span>
              {(['axial', 'sagittal', 'coronal'] as const).map(view => (
                <Button
                  key={view}
                  variant={selectedView === view ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedView(view)}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Button>
              ))}
            </div>

            {/* Slice Navigation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Slice Position:</span>
                <span className="text-sm text-gray-600">{currentSlice}/100</span>
              </div>
              <Slider
                value={[currentSlice]}
                onValueChange={handleSliceChange}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Image Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Zoom</label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[50px] text-center">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Options</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showAnnotations ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowAnnotations(!showAnnotations)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={togglePlayback}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export DICOM
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
