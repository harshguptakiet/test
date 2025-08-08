'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Filter } from 'lucide-react';

interface MolecularStructureProps {
  height?: number;
  width?: number;
  showControls?: boolean;
  userId?: string;
}

interface Variant {
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  quality: number;
  type: 'SNP' | 'INSERTION' | 'DELETION' | 'INDEL';
  impact: 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER';
  gene?: string;
  consequence?: string;
}

interface ChromosomeData {
  name: string;
  length: number;
  variants: Variant[];
  color: string;
}

const MolecularStructure: React.FC<MolecularStructureProps> = ({
  height = 500, 
  width = 600,
  showControls = true,
  userId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);
  
  // Animation controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [filterVariantType, setFilterVariantType] = useState<string>('ALL');
  const [showImpactColors, setShowImpactColors] = useState(true);

  // Generate optimized VCF-based data (reduced for performance)
  const generateVCFData = (): ChromosomeData[] => {
    const chromosomes: ChromosomeData[] = [];
    
    // Simplified chromosome data for better performance
    const chromosomeLengths = {
      '1': 249250621, '2': 242193529, '3': 198295559, '4': 190214555,
      '5': 181538259, '6': 170805979, '7': 159345973, '8': 145138636,
      '9': 138394717, '10': 133797422, '11': 135086622, '12': 133275309,
      '13': 114364328, '14': 107043718, '15': 101991189, '16': 90338345,
      '17': 83257441, '18': 80373285, '19': 58617616, '20': 64444167,
      '21': 48129895, '22': 51304566, 'X': 155270560, 'Y': 59373566
    };

    const chromosomeColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0984E3', '#A29BFE', '#FD79A8',
      '#E17055', '#81ECEC', '#74B9FF', '#A29BFE', '#FD79A8',
      '#E84393', '#00B894', '#FDCB6E', '#6C5CE7'
    ];

    Object.entries(chromosomeLengths).forEach(([chrName, length], index) => {
      // Generate fewer variants for better performance (15-25 instead of 20-70)
      const variants: Variant[] = [];
      const numVariants = Math.floor(Math.random() * 10) + 15; // 15-25 variants per chromosome
      
      for (let i = 0; i < numVariants; i++) {
        const position = Math.floor(Math.random() * length);
        const variantTypes = ['SNP', 'INSERTION', 'DELETION', 'INDEL'] as const;
        const impacts = ['HIGH', 'MODERATE', 'LOW', 'MODIFIER'] as const;
        const bases = ['A', 'T', 'G', 'C'];
        
        const type = variantTypes[Math.floor(Math.random() * variantTypes.length)];
        const impact = impacts[Math.floor(Math.random() * impacts.length)];
        const ref = bases[Math.floor(Math.random() * bases.length)];
        const alt = bases[Math.floor(Math.random() * bases.length)];
        
        variants.push({
          chromosome: chrName,
          position: position,
          ref: ref,
          alt: alt,
          quality: Math.floor(Math.random() * 1000) + 100,
          type: type,
          impact: impact,
          gene: `GENE_${Math.floor(Math.random() * 1000) + 1}`,
          consequence: type === 'SNP' ? 'missense_variant' : `${type.toLowerCase()}_variant`
        });
      }
      
      // Sort variants by position
      variants.sort((a, b) => a.position - b.position);
      
      chromosomes.push({
        name: chrName,
        length: length,
        variants: variants,
        color: chromosomeColors[index % chromosomeColors.length]
      });
    });
    
    return chromosomes;
  };

  const [chromosomeData, setChromosomeData] = useState<ChromosomeData[]>([]);

  useEffect(() => {
    // In a real application, this would fetch from your VCF processing API
    setChromosomeData(generateVCFData());
  }, [userId]);

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'HIGH': return '#E74C3C';
      case 'MODERATE': return '#F39C12';
      case 'LOW': return '#F1C40F';
      case 'MODIFIER': return '#95A5A6';
      default: return '#BDC3C7';
    }
  };

  const getVariantTypeColor = (type: string): string => {
    switch (type) {
      case 'SNP': return '#3498DB';
      case 'INSERTION': return '#2ECC71';
      case 'DELETION': return '#E74C3C';
      case 'INDEL': return '#9B59B6';
      default: return '#95A5A6';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chromosomeData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    const containerWidth = container ? container.clientWidth : width;
    const containerHeight = Math.max(height, 400);
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    let lastFrameTime = 0;
    const targetFPS = 30; // Limit to 30 FPS for better performance
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Throttle animation to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      timeRef.current += 0.008 * animationSpeed; // Slightly faster increment
      
      // Clear canvas efficiently
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      // Simplified background (remove gradient for better performance)
      ctx.fillStyle = '#0F0F19';
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      // Always draw genome view (circular karyotype)
      drawGenomeView(ctx, containerWidth, containerHeight);

      animationRef.current = requestAnimationFrame(animate);
    };

    const drawGenomeView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Draw chromosomes in a circular karyotype view with better visibility
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.32;
      
      // Draw background circle for context
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      chromosomeData.forEach((chr, index) => {
        const angle = (index / chromosomeData.length) * Math.PI * 2 - Math.PI / 2;
        
        // Enhanced chromosome arc with better visibility
        const startAngle = angle - 0.12;
        const endAngle = angle + 0.12;
        
        // Draw chromosome background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.lineWidth = 25;
        ctx.strokeStyle = 'rgba(60, 60, 80, 0.8)';
        ctx.stroke();
        
        // Draw chromosome foreground with gradient effect
        const gradient = ctx.createLinearGradient(
          centerX + Math.cos(startAngle) * radius,
          centerY + Math.sin(startAngle) * radius,
          centerX + Math.cos(endAngle) * radius,
          centerY + Math.sin(endAngle) * radius
        );
        gradient.addColorStop(0, chr.color + '60');
        gradient.addColorStop(0.5, chr.color);
        gradient.addColorStop(1, chr.color + '60');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.lineWidth = 20;
        ctx.strokeStyle = gradient;
        ctx.stroke();
        
        // Draw variants with better visibility
        const filteredVariants = chr.variants.filter(v => 
          filterVariantType === 'ALL' || v.type === filterVariantType
        );
        
        filteredVariants.forEach((variant, vIndex) => {
          const variantAngle = startAngle + (vIndex / Math.max(filteredVariants.length - 1, 1)) * (endAngle - startAngle);
          const pulseOffset = Math.sin(timeRef.current * 3 + vIndex * 0.5) * 4;
          const baseDistance = radius + 25;
          const vx = centerX + Math.cos(variantAngle) * (baseDistance + pulseOffset);
          const vy = centerY + Math.sin(variantAngle) * (baseDistance + pulseOffset);
          
          const variantColor = showImpactColors ? getImpactColor(variant.impact) : getVariantTypeColor(variant.type);
          
          // Draw variant with glow effect
          ctx.shadowColor = variantColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = variantColor;
          ctx.beginPath();
          ctx.arc(vx, vy, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner highlight
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(vx - 1, vy - 1, 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Connection line to chromosome
          ctx.strokeStyle = variantColor + '40';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(variantAngle) * (radius + 10), centerY + Math.sin(variantAngle) * (radius + 10));
          ctx.lineTo(vx, vy);
          ctx.stroke();
        });
        
        // Enhanced chromosome labels with background
        const labelDistance = radius + 60;
        const labelX = centerX + Math.cos(angle) * labelDistance;
        const labelY = centerY + Math.sin(angle) * labelDistance;
        
        // Label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(labelX, labelY, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Chromosome name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chr.name, labelX, labelY - 3);
        
        // Variant count
        ctx.font = '9px Arial';
        ctx.fillStyle = chr.color;
        ctx.fillText(`${filteredVariants.length}`, labelX, labelY + 8);
      });
      
      // Enhanced center info with background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Human Genome', centerX, centerY - 8);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#00FF88';
      const totalVariants = chromosomeData.reduce((total, chr) => {
        const filtered = chr.variants.filter(v => filterVariantType === 'ALL' || v.type === filterVariantType);
        return total + filtered.length;
      }, 0);
      ctx.fillText(`${totalVariants} Variants`, centerX, centerY + 8);
      
      // Add decorative elements
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
      ctx.stroke();
    };


    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chromosomeData, filterVariantType, showImpactColors, isPlaying, animationSpeed, width, height]);

  const resetAnimation = () => {
    timeRef.current = 0;
  };

  return (
    <Card className="bg-gray-900 border-gray-700 overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              Genomic Variants from VCF
            </CardTitle>
            <CardDescription className="text-gray-300">
              Interactive visualization of your genetic variants from VCF data
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-green-900 text-green-200">
            VCF Data
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative p-0">
        <div className="relative h-[600px] w-full">
          {showControls && (
            <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-80 rounded-lg p-3 backdrop-blur-sm max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={isPlaying ? "secondary" : "default"}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetAnimation}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-white">
                      <Filter className="w-3 h-3" />
                      <span>Filter: {filterVariantType}</span>
                    </div>
                    <select
                      value={filterVariantType}
                      onChange={(e) => setFilterVariantType(e.target.value)}
                      className="w-full p-1 bg-gray-700 text-white rounded text-xs"
                    >
                      <option value="ALL">All Types</option>
                      <option value="SNP">SNPs</option>
                      <option value="INSERTION">Insertions</option>
                      <option value="DELETION">Deletions</option>
                      <option value="INDEL">InDels</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <Button
                      size="sm"
                      variant={showImpactColors ? 'default' : 'outline'}
                      onClick={() => setShowImpactColors(!showImpactColors)}
                      className="w-full h-6 text-xs"
                    >
                      {showImpactColors ? 'Impact Colors' : 'Type Colors'}
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-white">
                      <span>Speed: {animationSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-lg border-2 border-green-500/30 shadow-2xl"
            style={{ 
              background: 'radial-gradient(ellipse at center, #0f1419 0%, #1a2332 50%, #000000 100%)'
            }}
          />
          
          {/* Legend */}
          <div className="absolute top-4 left-4 text-white text-xs space-y-2">
            <div className="bg-black bg-opacity-60 rounded-lg p-3 backdrop-blur-sm">
              <h4 className="font-semibold mb-2 text-green-300">
                {showImpactColors ? 'Variant Impact' : 'Variant Types'}
              </h4>
              <div className="space-y-1">
                {showImpactColors ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>High Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Low Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span>Modifier</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>SNP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Insertion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Deletion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span>InDel</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-50 rounded-lg p-2 backdrop-blur-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>VCF-based Data</span>
              </div>
              <div>🧬 {chromosomeData.length} Chromosomes</div>
              <div>⚡ Real-time filtering</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MolecularStructure;
