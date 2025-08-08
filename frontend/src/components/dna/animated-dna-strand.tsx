'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DNAStrandProps {
  height?: number;
  width?: number;
  speed?: number;
  showInfo?: boolean;
}

interface DNABase {
  x: number;
  y: number;
  z: number;
  type: 'A' | 'T' | 'G' | 'C';
  pair: 'A' | 'T' | 'G' | 'C';
  color: string;
  pairColor: string;
}

const AnimatedDNAStrand: React.FC<DNAStrandProps> = ({ 
  height = 400, 
  width = 600, 
  speed = 1,
  showInfo = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  // DNA base pair colors and properties - vibrant colors
  const baseColors = {
    A: '#FF3B30', // Adenine - Vibrant Red
    T: '#00E5FF', // Thymine - Electric Cyan
    G: '#FF6EC7', // Guanine - Vibrant Pink
    C: '#32D74B', // Cytosine - Vibrant Green
  };

  const basePairs = {
    A: 'T',
    T: 'A',
    G: 'C',
    C: 'G',
  };

  // Generate DNA sequence
  const generateDNASequence = (length: number): DNABase[] => {
    const bases: ('A' | 'T' | 'G' | 'C')[] = ['A', 'T', 'G', 'C'];
    const sequence: DNABase[] = [];
    
    for (let i = 0; i < length; i++) {
      const randomBase = bases[Math.floor(Math.random() * bases.length)];
      const pair = basePairs[randomBase] as 'A' | 'T' | 'G' | 'C';
      
      sequence.push({
        x: 0,
        y: i * 15, // Spacing between base pairs
        z: 0,
        type: randomBase,
        pair: pair,
        color: baseColors[randomBase],
        pairColor: baseColors[pair],
      });
    }
    
    return sequence;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enhanced responsive sizing
    const container = canvas.parentElement;
    const containerWidth = container ? container.clientWidth : width;
    const containerHeight = Math.max(height, 500);
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Generate more DNA sequence for better visibility
    const dnaLength = Math.floor(containerHeight / 12);
    const dnaSequence = generateDNASequence(dnaLength);

    // Enhanced animation parameters - larger and more visible
    const helixRadius = Math.min(containerWidth * 0.18, containerHeight * 0.12);
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    const animate = () => {
      timeRef.current += 0.02 * speed;
      
      // Clear canvas
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      // Add subtle background gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, containerWidth / 2);
      gradient.addColorStop(0, 'rgba(25, 25, 35, 0.8)');
      gradient.addColorStop(1, 'rgba(10, 10, 10, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      // Draw DNA double helix - FIXED POSITION
      dnaSequence.forEach((base, index) => {
        const y = centerY - (containerHeight * 0.4) + (index * (containerHeight * 0.8) / dnaLength); // FIXED Y POSITION
        const angle = (index * 0.3) + timeRef.current * 2; // Only rotation, no vertical movement
        
        // Calculate positions for both strands
        const x1 = centerX + Math.cos(angle) * helixRadius;
        const z1 = Math.sin(angle) * helixRadius;
        const x2 = centerX + Math.cos(angle + Math.PI) * helixRadius;
        const z2 = Math.sin(angle + Math.PI) * helixRadius;
        
        // Convert 3D to 2D (simple perspective)
        const perspective = 300;
        const scale1 = perspective / (perspective + z1);
        const scale2 = perspective / (perspective + z2);
        
        const screenX1 = x1 * scale1;
        const screenY1 = (y - centerY) * scale1 + centerY;
        const screenX2 = x2 * scale2;
        const screenY2 = (y - centerY) * scale2 + centerY;

        // Draw all bases since they're now in fixed positions
        if (screenY1 > -20 && screenY1 < containerHeight + 20) {
          // Draw connection line between base pairs
          ctx.strokeStyle = `rgba(100, 100, 150, ${0.3 * Math.min(scale1, scale2)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(screenX1, screenY1);
          ctx.lineTo(screenX2, screenY2);
          ctx.stroke();

          // Draw strand 1 base - larger and more visible
          const radius1 = 12 * scale1; // Increased size
          ctx.fillStyle = base.color;
          ctx.shadowColor = base.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(screenX1, screenY1, radius1, 0, Math.PI * 2);
          ctx.fill();

          // Draw base letter with better visibility
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${16 * scale1}px Arial`; // Larger and bold text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(base.type, screenX1, screenY1);

          // Draw strand 2 base - larger and more visible
          const radius2 = 12 * scale2; // Increased size
          ctx.fillStyle = base.pairColor;
          ctx.shadowColor = base.pairColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(screenX2, screenY2, radius2, 0, Math.PI * 2);
          ctx.fill();

          // Draw base letter with better visibility
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${16 * scale2}px Arial`; // Larger and bold text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(base.pair, screenX2, screenY2);
        }
      });

      // Draw helix backbone - FIXED POSITION
      for (let i = 0; i < containerHeight; i += 8) {
        const y = i; // FIXED Y POSITION
        const angle = (i * 0.02) + timeRef.current * 2; // Only rotation
        
        const x1 = centerX + Math.cos(angle) * helixRadius;
        const z1 = Math.sin(angle) * helixRadius;
        const x2 = centerX + Math.cos(angle + Math.PI) * helixRadius;
        const z2 = Math.sin(angle + Math.PI) * helixRadius;
        
        const perspective = 300;
        const scale1 = perspective / (perspective + z1);
        const scale2 = perspective / (perspective + z2);
        
        const screenX1 = x1 * scale1;
        const screenY1 = (y - centerY) * scale1 + centerY;
        const screenX2 = x2 * scale2;
        const screenY2 = (y - centerY) * scale2 + centerY;

        if (screenY1 > 0 && screenY1 < containerHeight) {
          // Strand 1 backbone
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * scale1})`;
          ctx.beginPath();
          ctx.arc(screenX1, screenY1, 2 * scale1, 0, Math.PI * 2);
          ctx.fill();

          // Strand 2 backbone
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * scale2})`;
          ctx.beginPath();
          ctx.arc(screenX2, screenY2, 2 * scale2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Add glowing effect around the DNA
      const glowGradient = ctx.createRadialGradient(centerX, centerY, helixRadius - 20, centerX, centerY, helixRadius + 40);
      glowGradient.addColorStop(0, 'rgba(64, 224, 255, 0.1)');
      glowGradient.addColorStop(1, 'rgba(64, 224, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, speed]);

  return (
    <Card className="bg-gray-900 border-gray-700 overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              DNA Double Helix
            </CardTitle>
            <CardDescription className="text-gray-300">
              Interactive 3D visualization of the DNA double helix structure
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-blue-900 text-blue-200">
            DNA Model
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative p-0">
        <div className="relative h-[600px] w-full">
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-lg border-2 border-blue-500/20 shadow-xl"
            style={{ 
              background: 'linear-gradient(45deg, #0a0a0a, #1a1a2e, #0f0f23)'
            }}
          />
          
          {showInfo && (
            <div className="absolute top-4 left-4 z-10 text-white text-sm space-y-2">
              <div className="bg-black bg-opacity-60 rounded-lg p-3 backdrop-blur-sm">
                <h4 className="font-semibold mb-2 text-blue-300">Base Pairs:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FF3B30'}}></div>
                    <span>A - Adenine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#00E5FF'}}></div>
                    <span>T - Thymine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FF6EC7'}}></div>
                    <span>G - Guanine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#32D74B'}}></div>
                    <span>C - Cytosine</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-50 rounded-lg p-2 backdrop-blur-sm">
            <div>🧬 3.4Å per turn</div>
            <div>⚡ {speed}x speed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimatedDNAStrand;
