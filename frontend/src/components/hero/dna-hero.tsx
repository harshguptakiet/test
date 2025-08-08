'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Dna, Zap, Eye, RotateCw } from 'lucide-react';
import Link from 'next/link';

interface DNAHeroProps {
  onGetStarted?: () => void;
}

const DNAHero: React.FC<DNAHeroProps> = ({ onGetStarted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  // Enhanced DNA colors for hero effect
  const baseColors = {
    A: { main: '#FF6B6B', glow: '#FF9999', particle: '#FFCCCC' },
    T: { main: '#4ECDC4', glow: '#7EFFF6', particle: '#CCFFFF' },
    G: { main: '#45B7D1', glow: '#78D4F7', particle: '#CCE6FF' },
    C: { main: '#96CEB4', glow: '#C4E8D1', particle: '#E6F7EC' },
  };

  const basePairs = { A: 'T', T: 'A', G: 'C', C: 'G' };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive canvas sizing
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = Math.min(600, container.clientHeight || 600);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Generate hero DNA sequence with meaningful pattern
    const generateHeroDNA = (length: number) => {
      const sequence = [];
      const heroPattern = 'ATGCGATCGATGCATGCGATCGATGC'; // Meaningful start codon pattern
      
      for (let i = 0; i < length; i++) {
        const baseType = heroPattern[i % heroPattern.length];
        sequence.push({
          x: 0,
          y: i * 18, // Slightly more spacing for hero effect
          z: 0,
          type: baseType,
          pair: basePairs[baseType as keyof typeof basePairs],
          phase: Math.random() * Math.PI * 2, // Random phase for stagger effect
          intensity: 0.8 + Math.random() * 0.4, // Brightness variation
        });
      }
      
      return sequence;
    };

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const dnaLength = Math.floor(height / 15);
    const dnaSequence = generateHeroDNA(dnaLength);

    const animate = () => {
      timeRef.current += 0.012; // Smooth, slow rotation for hero effect
      
      // Dynamic gradient background
      const bgGradient = ctx.createRadialGradient(
        centerX, centerY, 0, 
        centerX, centerY, Math.max(width, height) * 0.7
      );
      bgGradient.addColorStop(0, 'rgba(15, 15, 30, 0.95)');
      bgGradient.addColorStop(0.4, 'rgba(25, 25, 45, 0.98)');
      bgGradient.addColorStop(0.8, 'rgba(10, 10, 25, 0.99)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 5, 1)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Add subtle moving particles in background
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(timeRef.current * 0.3 + i) * width * 0.4 + centerX);
        const y = (Math.cos(timeRef.current * 0.2 + i * 1.5) * height * 0.3 + centerY);
        const alpha = Math.sin(timeRef.current + i) * 0.1 + 0.1;
        
        ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      const helixRadius = Math.min(width * 0.15, height * 0.2);
      
      // Draw DNA double helix with enhanced hero effects
      dnaSequence.forEach((base, index) => {
        const progress = (timeRef.current * 20) % (dnaLength * 18);
        const y = base.y - progress + height * 1.2;
        const angle = (y / 18) + timeRef.current * 1.5 + base.phase * 0.1;
        
        // 3D helix positions
        const x1 = centerX + Math.cos(angle) * helixRadius;
        const z1 = Math.sin(angle) * helixRadius;
        const x2 = centerX + Math.cos(angle + Math.PI) * helixRadius;
        const z2 = Math.sin(angle + Math.PI) * helixRadius;
        
        // Advanced perspective with depth
        const perspective = 500;
        const scale1 = perspective / (perspective + z1 + 200);
        const scale2 = perspective / (perspective + z2 + 200);
        
        const screenX1 = x1 * scale1 + centerX * (1 - scale1);
        const screenY1 = y * scale1;
        const screenX2 = x2 * scale2 + centerX * (1 - scale2);
        const screenY2 = y * scale2;

        // Only draw visible bases
        if (screenY1 > -50 && screenY1 < height + 50) {
          // Enhanced connection with pulsing effect
          const pulseIntensity = Math.sin(timeRef.current * 3 + index * 0.2) * 0.3 + 0.7;
          const connectionGradient = ctx.createLinearGradient(screenX1, screenY1, screenX2, screenY2);
          connectionGradient.addColorStop(0, `rgba(150, 200, 255, ${0.5 * scale1 * pulseIntensity})`);
          connectionGradient.addColorStop(0.5, `rgba(200, 220, 255, ${0.8 * Math.min(scale1, scale2) * pulseIntensity})`);
          connectionGradient.addColorStop(1, `rgba(150, 200, 255, ${0.5 * scale2 * pulseIntensity})`);
          
          ctx.strokeStyle = connectionGradient;
          ctx.lineWidth = 4 * Math.min(scale1, scale2) * pulseIntensity;
          ctx.beginPath();
          ctx.moveTo(screenX1, screenY1);
          ctx.lineTo(screenX2, screenY2);
          ctx.stroke();

          // Draw enhanced bases with hero glow
          const drawHeroBase = (x: number, y: number, baseType: string, scale: number) => {
            const colors = baseColors[baseType as keyof typeof baseColors];
            const baseRadius = 12 * scale * base.intensity;
            const glowRadius = baseRadius * 3;
            
            // Multi-layer glow effect
            for (let i = 3; i >= 0; i--) {
              const glowGradient = ctx.createRadialGradient(
                x, y, 0, 
                x, y, glowRadius * (i + 1) * 0.3
              );
              const intensity = Math.max(0, 0.4 - i * 0.1) * pulseIntensity;
              glowGradient.addColorStop(0, colors.glow + Math.floor(intensity * 255).toString(16).padStart(2, '0'));
              glowGradient.addColorStop(0.6, colors.glow + Math.floor(intensity * 100).toString(16).padStart(2, '0'));
              glowGradient.addColorStop(1, 'transparent');
              
              ctx.fillStyle = glowGradient;
              ctx.beginPath();
              ctx.arc(x, y, glowRadius * (i + 1) * 0.3, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Main base with gradient
            const baseGradient = ctx.createRadialGradient(
              x - baseRadius * 0.4, y - baseRadius * 0.4, 0, 
              x, y, baseRadius
            );
            baseGradient.addColorStop(0, colors.glow);
            baseGradient.addColorStop(0.3, colors.main);
            baseGradient.addColorStop(1, colors.main + 'DD');
            
            ctx.fillStyle = baseGradient;
            ctx.beginPath();
            ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
            ctx.fill();

            // Base letter with enhanced shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.floor(16 * scale)}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(baseType, x, y);
            ctx.shadowBlur = 0;
            
            // Add sparkle effect occasionally
            if (Math.random() < 0.05) {
              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.arc(x + (Math.random() - 0.5) * baseRadius * 2, y + (Math.random() - 0.5) * baseRadius * 2, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          };

          drawHeroBase(screenX1, screenY1, base.type, scale1);
          drawHeroBase(screenX2, screenY2, base.pair, scale2);
        }
      });

      // Draw animated helix backbone
      for (let i = 0; i < height + 200; i += 4) {
        const y = i + (timeRef.current * 20) % (height + 200);
        const angle = (y / 18) + timeRef.current * 1.5;
        
        const x1 = centerX + Math.cos(angle) * helixRadius;
        const z1 = Math.sin(angle) * helixRadius;
        const x2 = centerX + Math.cos(angle + Math.PI) * helixRadius;
        const z2 = Math.sin(angle + Math.PI) * helixRadius;
        
        const perspective = 500;
        const scale1 = perspective / (perspective + z1 + 200);
        const scale2 = perspective / (perspective + z2 + 200);
        
        const screenX1 = x1 * scale1 + centerX * (1 - scale1);
        const screenY1 = (y - (timeRef.current * 20) % (height + 200)) * scale1;
        const screenX2 = x2 * scale2 + centerX * (1 - scale2);
        const screenY2 = (y - (timeRef.current * 20) % (height + 200)) * scale2;

        if (screenY1 > -20 && screenY1 < height + 20) {
          const fadeAlpha = Math.max(0, Math.min(1, 1 - Math.abs(screenY1 - centerY) / (centerY * 0.8)));
          
          ctx.fillStyle = `rgba(150, 200, 255, ${0.2 * scale1 * fadeAlpha})`;
          ctx.beginPath();
          ctx.arc(screenX1, screenY1, 2.5 * scale1, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(150, 200, 255, ${0.2 * scale2 * fadeAlpha})`;
          ctx.beginPath();
          ctx.arc(screenX2, screenY2, 2.5 * scale2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black overflow-hidden">
      {/* Animated DNA Background */}
      <div className="absolute inset-0">
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'transparent' }}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className={`text-white space-y-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-blue-900/50 text-blue-200 border-blue-700">
                  <Dna className="w-4 h-4 mr-2" />
                  Advanced Genomic Analysis
                </Badge>
                
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Decode Your 
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {' '}DNA
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
                  Experience the future of genomics with AI-powered analysis, 
                  real-time visualization, and personalized health insights.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-red-400" />
                  </div>
                  <span>Real-time Analysis</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>3D Visualization</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <RotateCw className="w-4 h-4 text-green-400" />
                  </div>
                  <span>Interactive</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                    onClick={onGetStarted}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link href="/dashboard/visualizations">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats/Features Panel */}
            <div className={`${isVisible ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Platform Features</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Genomic Analysis</h4>
                      <p className="text-gray-300 text-sm">Upload VCF files and get instant AI-powered analysis</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">3D Visualization</h4>
                      <p className="text-gray-300 text-sm">Interactive DNA strand animation with real data</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Risk Scoring</h4>
                      <p className="text-gray-300 text-sm">Polygenic risk scores for multiple diseases</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Personalized Reports</h4>
                      <p className="text-gray-300 text-sm">Comprehensive genomic health insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 animate-bounce">
        <div className="text-sm">Scroll to explore</div>
        <div className="w-px h-8 bg-white/30 mx-auto mt-2"></div>
      </div>
    </div>
  );
};

export default DNAHero;
