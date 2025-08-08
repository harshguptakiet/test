'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Filter, Eye, RefreshCw } from 'lucide-react';

interface GenomicVariantsVizProps {
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

const GenomicVariantsViz: React.FC<GenomicVariantsVizProps> = ({ 
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
  const [currentView, setCurrentView] = useState<'genome' | 'chromosome'>('genome');
  const [selectedChromosome, setSelectedChromosome] = useState<string>('');
  const [filterVariantType, setFilterVariantType] = useState<string>('ALL');
  const [showImpactColors, setShowImpactColors] = useState(true);

  // Generate realistic VCF-based data (this would normally come from your backend API)
  const generateVCFData = (): ChromosomeData[] => {
    const chromosomes: ChromosomeData[] = [];
    
    // Realistic chromosome lengths (in base pairs, simplified)
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
      // Generate realistic variants for each chromosome
      const variants: Variant[] = [];
      const numVariants = Math.floor(Math.random() * 50) + 20; // 20-70 variants per chromosome
      
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

    const animate = () => {
      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      timeRef.current += 0.005 * animationSpeed;
      
      // Clear canvas
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      // Background gradient
      const gradient = ctx.createRadialGradient(
        containerWidth / 2, containerHeight / 2, 0,
        containerWidth / 2, containerHeight / 2, containerWidth / 2
      );
      gradient.addColorStop(0, 'rgba(15, 15, 25, 0.9)');
      gradient.addColorStop(1, 'rgba(5, 5, 10, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      if (currentView === 'genome') {
        drawGenomeView(ctx, containerWidth, containerHeight);
      } else {
        drawChromosomeView(ctx, containerWidth, containerHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const drawGenomeView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Draw chromosomes in a circular karyotype view
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;
      
      chromosomeData.forEach((chr, index) => {
        const angle = (index / chromosomeData.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Chromosome arc
        const arcRadius = 50 + (chr.variants.length * 0.5);
        const startAngle = angle - 0.1;
        const endAngle = angle + 0.1;
        
        // Draw chromosome
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.lineWidth = 20;
        ctx.strokeStyle = chr.color;
        ctx.stroke();
        
        // Draw variants as dots
        const filteredVariants = chr.variants.filter(v => 
          filterVariantType === 'ALL' || v.type === filterVariantType
        );
        
        filteredVariants.forEach((variant, vIndex) => {
          const variantAngle = startAngle + (vIndex / filteredVariants.length) * (endAngle - startAngle);
          const vx = centerX + Math.cos(variantAngle) * (radius + 15 + Math.sin(timeRef.current + vIndex * 0.1) * 5);
          const vy = centerY + Math.sin(variantAngle) * (radius + 15 + Math.sin(timeRef.current + vIndex * 0.1) * 5);
          
          const variantColor = showImpactColors ? getImpactColor(variant.impact) : getVariantTypeColor(variant.type);
          
          // Variant glow
          const glowGradient = ctx.createRadialGradient(vx, vy, 0, vx, vy, 8);
          glowGradient.addColorStop(0, variantColor + 'AA');
          glowGradient.addColorStop(1, variantColor + '00');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(vx, vy, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Variant dot
          ctx.fillStyle = variantColor;
          ctx.beginPath();
          ctx.arc(vx, vy, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Chromosome labels
        const labelX = centerX + Math.cos(angle) * (radius + 40);
        const labelY = centerY + Math.sin(angle) * (radius + 40);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chr.name, labelX, labelY);
        
        // Variant count
        ctx.font = '10px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText(`${filteredVariants.length}`, labelX, labelY + 15);
      });
      
      // Center info
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Human Genome', centerX, centerY - 10);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#AAAAAA';
      const totalVariants = chromosomeData.reduce((total, chr) => {
        const filtered = chr.variants.filter(v => filterVariantType === 'ALL' || v.type === filterVariantType);
        return total + filtered.length;
      }, 0);
      ctx.fillText(`${totalVariants} Variants`, centerX, centerY + 10);
    };

    const drawChromosomeView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const selectedChr = chromosomeData.find(chr => chr.name === selectedChromosome);
      if (!selectedChr) return;
      
      const margin = 60;
      const chrWidth = width - margin * 2;
      const chrHeight = 40;
      const chrY = height / 2 - chrHeight / 2;
      
      // Draw chromosome
      ctx.fillStyle = selectedChr.color;
      ctx.fillRect(margin, chrY, chrWidth, chrHeight);
      
      // Draw variants
      const filteredVariants = selectedChr.variants.filter(v => 
        filterVariantType === 'ALL' || v.type === filterVariantType
      );
      
      filteredVariants.forEach((variant, index) => {
        const x = margin + (variant.position / selectedChr.length) * chrWidth;
        const y = chrY + chrHeight / 2 + Math.sin(timeRef.current + index * 0.2) * 20;
        
        const variantColor = showImpactColors ? getImpactColor(variant.impact) : getVariantTypeColor(variant.type);
        
        // Variant line
        ctx.strokeStyle = variantColor + '80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, chrY);
        ctx.lineTo(x, chrY + chrHeight);
        ctx.stroke();
        
        // Variant dot
        ctx.fillStyle = variantColor;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Variant type
        if (index % 5 === 0) { // Only show every 5th label to avoid clutter
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(variant.type, x, y - 10);
        }
      });
      
      // Chromosome label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Chromosome ${selectedChr.name}`, width / 2, margin - 20);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#AAAAAA';
      ctx.fillText(`${filteredVariants.length} variants | ${selectedChr.length.toLocaleString()} bp`, width / 2, margin);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chromosomeData, currentView, selectedChromosome, filterVariantType, showImpactColors, isPlaying, animationSpeed, width, height]);

  const resetAnimation = () => {
    timeRef.current = 0;
  };

  const switchView = () => {
    if (currentView === 'genome') {
      setCurrentView('chromosome');
      setSelectedChromosome(chromosomeData[0]?.name || '1');
    } else {
      setCurrentView('genome');
    }
  };

  const nextChromosome = () => {
    if (chromosomeData.length === 0) return;
    const currentIndex = chromosomeData.findIndex(chr => chr.name === selectedChromosome);
    const nextIndex = (currentIndex + 1) % chromosomeData.length;
    setSelectedChromosome(chromosomeData[nextIndex].name);
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
      
      <CardContent className="space-y-4">
        {showControls && (
          <div className="space-y-3 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={isPlaying ? "secondary" : "default"}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={resetAnimation}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={switchView}>
                <Eye className="w-4 h-4" />
              </Button>
              {currentView === 'chromosome' && (
                <Button size="sm" variant="outline" onClick={nextChromosome}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-xs">
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
                <div className="flex items-center gap-1 text-white">
                  <span>View: {currentView === 'genome' ? 'Genome' : `Chr ${selectedChromosome}`}</span>
                </div>
                <Button
                  size="sm"
                  variant={showImpactColors ? 'default' : 'outline'}
                  onClick={() => setShowImpactColors(!showImpactColors)}
                  className="w-full h-6 text-xs"
                >
                  Impact Colors
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
        )}
        
        <div className="relative flex justify-center items-center min-h-[400px]">
          <canvas 
            ref={canvasRef}
            className="w-full h-full rounded-lg border-2 border-green-500/30 shadow-2xl"
            style={{ 
              background: 'radial-gradient(ellipse at center, #0f1419 0%, #1a2332 50%, #000000 100%)',
              minHeight: '400px',
              maxWidth: '100%',
              aspectRatio: '4/3'
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
          
          <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-60 rounded-lg p-3 backdrop-blur-sm">
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

export default GenomicVariantsViz;
