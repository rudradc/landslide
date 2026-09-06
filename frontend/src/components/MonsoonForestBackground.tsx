import React, { useEffect, useRef, useState } from 'react';
import { CloudRain, Trees, Wind, Sparkles, Eye, EyeOff } from 'lucide-react';

interface MonsoonForestBackgroundProps {
  intensity?: 'light' | 'moderate' | 'heavy';
  showControls?: boolean;
}

export const MonsoonForestBackground: React.FC<MonsoonForestBackgroundProps> = ({
  intensity = 'moderate',
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rainMode, setRainMode] = useState<'off' | 'light' | 'moderate' | 'heavy'>(intensity);
  const [showForest, setShowForest] = useState(true);
  const [showMist, setShowMist] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  // Animated canvas for realistic falling rain drops and splash particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Rain drop properties based on mode
    const getDropCount = () => {
      switch (rainMode) {
        case 'light': return 120;
        case 'moderate': return 260;
        case 'heavy': return 480;
        default: return 0;
      }
    };

    interface Drop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      thickness: number;
    }

    const dropCount = getDropCount();
    const drops: Drop[] = [];

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 12 + 10,
        opacity: Math.random() * 0.4 + 0.15,
        thickness: Math.random() * 1.5 + 0.5,
      });
    }

    // Wind vector (slight tilt)
    const windAngle = -0.18; // radians tilt to left/down

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (rainMode !== 'off') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
        ctx.lineCap = 'round';

        drops.forEach((drop) => {
          ctx.beginPath();
          ctx.lineWidth = drop.thickness;
          ctx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity})`;
          
          const endX = drop.x + Math.sin(windAngle) * drop.length;
          const endY = drop.y + Math.cos(windAngle) * drop.length;

          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Move rain drop down & sideways
          drop.y += drop.speed;
          drop.x += Math.sin(windAngle) * drop.speed;

          // Reset drop when hitting screen bottom
          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * (width + 200) - 100;
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [rainMode]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-slate-950">
      {/* 1. Deep Monsoon Atmospheric Gradient Background */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(circle at 20% 15%, rgba(6, 78, 59, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 25%, rgba(14, 116, 144, 0.2) 0%, transparent 45%),
            radial-gradient(circle at 50% 80%, rgba(15, 23, 42, 0.95) 0%, #020617 100%),
            linear-gradient(180deg, #020617 0%, #051923 40%, #02111b 70%, #020617 100%)
          `
        }}
      />

      {/* 2. Soft Ambient Monsoon Storm Cloud Glow Effects */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-subtle" />
      <div className="absolute top-1/3 right-10 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[150px]" />
      <div className="absolute bottom-10 left-10 h-[400px] w-[400px] rounded-full bg-teal-600/10 blur-[130px]" />

      {/* 3. Drifting Monsoon Mist & Fog Layers */}
      {showMist && (
        <>
          <div 
            className="monsoon-mist-layer absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(ellipse at 30% 40%, rgba(20, 184, 166, 0.12) 0%, transparent 70%),
                                radial-gradient(ellipse at 70% 60%, rgba(56, 189, 248, 0.1) 0%, transparent 65%)`,
            }}
          />
          {/* Animated SVG Fog Wave */}
          <div className="absolute bottom-0 left-0 right-0 h-96 opacity-25 mix-blend-screen animate-pulse-subtle">
            <svg viewBox="0 0 1440 320" className="h-full w-full object-cover">
              <path
                fill="url(#mistGradient)"
                d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,165.3C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
              <defs>
                <linearGradient id="mistGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </>
      )}

      {/* 4. Layered Pine & Dense Forest Mountain Ridge Silhouettes */}
      {showForest && (
        <div className="absolute bottom-0 left-0 right-0 h-64 md:h-80 w-full overflow-hidden opacity-30 mix-blend-luminosity pointer-events-none">
          {/* Back Mountain Ridge */}
          <svg className="absolute bottom-0 left-0 w-full h-full text-emerald-950/80" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path
              fill="currentColor"
              d="M0,224L60,202.7C120,181,240,139,360,149.3C480,160,600,224,720,213.3C840,203,960,117,1080,106.7C1200,96,1320,160,1380,192L1440,224L1440,320L0,320Z"
            />
          </svg>

          {/* Middle Dense Forest Silhouettes (Pine Trees Vectors) */}
          <svg className="absolute bottom-0 left-0 w-full h-48 md:h-60 text-emerald-900/60" viewBox="0 0 1200 200" preserveAspectRatio="none">
            {/* Repeated Pine Tree Clusters */}
            <path
              fill="currentColor"
              d="M10,200 L25,120 L30,130 L40,90 L45,100 L55,50 L65,100 L70,90 L80,130 L85,120 L100,200 Z
                 M120,200 L135,110 L140,120 L150,80 L155,90 L165,40 L175,90 L180,80 L190,120 L195,110 L210,200 Z
                 M240,200 L255,130 L260,140 L270,100 L275,110 L285,60 L295,110 L300,100 L310,140 L315,130 L330,200 Z
                 M360,200 L375,100 L380,110 L390,70 L395,80 L405,30 L415,80 L420,70 L430,110 L435,100 L450,200 Z
                 M480,200 L495,125 L500,135 L510,95 L515,105 L525,55 L535,105 L540,95 L550,135 L555,125 L570,200 Z
                 M600,200 L615,115 L620,125 L630,85 L635,95 L645,45 L655,95 L660,85 L670,125 L675,115 L690,200 Z
                 M720,200 L735,140 L740,150 L750,110 L755,120 L765,70 L775,120 L780,110 L790,150 L795,140 L810,200 Z
                 M840,200 L855,105 L860,115 L870,75 L875,85 L885,35 L895,85 L900,75 L910,115 L915,105 L930,200 Z
                 M960,200 L975,130 L980,140 L990,100 L995,110 L1005,60 L1015,110 L1020,100 L1030,140 L1035,130 L1050,200 Z
                 M1080,200 L1095,110 L1100,120 L1110,80 L1115,90 L1125,40 L1135,90 L1140,80 L1150,120 L1155,110 L1170,200 Z"
            />
          </svg>

          {/* Front Deep Canopy Mist Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>
      )}

      {/* 5. Canvas Rain Drops Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none z-10" />

      {/* 6. Interactive Monsoon Environment Controls Panel */}
      {showControls && (
        <div className="pointer-events-auto fixed bottom-4 right-4 z-40">
          <div className="relative">
            {!panelOpen ? (
              <button
                onClick={() => setPanelOpen(true)}
                className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-xl transition-all hover:bg-slate-800 hover:border-emerald-400 hover:scale-105"
                title="Monsoon Environment Controls"
              >
                <CloudRain className="h-4 w-4 animate-bounce text-cyan-400" />
                <span className="hidden sm:inline">Monsoon FX</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-300">
                  {rainMode}
                </span>
              </button>
            ) : (
              <div className="w-72 rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-4 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Trees className="h-4 w-4" />
                    <span className="text-xs font-bold text-white">Monsoon & Forest Atmosphere</span>
                  </div>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {/* Rain Mode Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Rain Intensity</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['off', 'light', 'moderate', 'heavy'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setRainMode(mode)}
                          className={`rounded-lg py-1 text-[11px] font-extrabold capitalize transition-all ${
                            rainMode === mode
                              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                              : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Forest & Mist */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Trees className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Forest Canopy Layer</span>
                    </span>
                    <button
                      onClick={() => setShowForest(!showForest)}
                      className={`rounded-lg p-1.5 transition-colors ${
                        showForest ? 'text-emerald-400 bg-emerald-950/50' : 'text-slate-500 bg-slate-950'
                      }`}
                    >
                      {showForest ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Wind className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Atmospheric Monsoon Mist</span>
                    </span>
                    <button
                      onClick={() => setShowMist(!showMist)}
                      className={`rounded-lg p-1.5 transition-colors ${
                        showMist ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-500 bg-slate-950'
                      }`}
                    >
                      {showMist ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
