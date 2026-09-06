import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Building2, Eye, Cpu, Sparkles } from 'lucide-react';

type PlanetKey = 'earth' | 'venus' | 'mars';

interface PlanetData {
  name: string;
  clip: string;
  still: string;
  cutout: string;
  lede: string;
}

const PLANETS: Record<PlanetKey, PlanetData> = {
  earth: {
    name: 'DISASTER RISK DSS',
    clip: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4',
    still: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png',
    cutout: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202005_3346cc4d-ec3b-44ab-825c-b18e49f5021a.png',
    lede: "Intelligent Red-Zone Identification, Safe Carrying Capacity Assessment & Relocation Support. <br>AI-driven geospatial monitoring & disaster analytics for high-vulnerability hazard zones."
  },
  venus: {
    name: 'VENUS CLIMATE',
    clip: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_b211cd74-013b-4dd3-bfd0-64491d8696fa.mp4',
    still: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_cf55d1d8-7b59-4a64-80da-d72052ae974e.png',
    cutout: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202012_640b239a-d08a-4200-adb2-741bbe129ac8.png',
    lede: "Extreme atmospheric thermal risk modeling and high-pressure greenhouse environmental dynamics. <br>Simulating thermal runaway disaster scenarios and atmospheric resilience limits."
  },
  mars: {
    name: 'MARS TERRAIN',
    clip: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_51eae59a-2459-4c84-907c-cc5edfe5fea7.mp4',
    still: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_0ba6de7c-285d-43dc-b7ab-8c54c73707cb.png',
    cutout: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202018_3d559490-f613-4ed7-a3bb-3b7e9fc90fb8.png',
    lede: "Planetary terrain stability evaluation, regolith slope erosion modeling, and carrying capacity <br>assessment for high-vulnerability settlement risk mapping."
  }
};

const ORDER: PlanetKey[] = ['earth', 'venus', 'mars'];

export const LoginPage: React.FC = () => {
  const [featured, setFeatured] = useState<PlanetKey>('earth');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadedVideos, setLoadedVideos] = useState<Record<PlanetKey, boolean>>({
    earth: true,
    venus: false,
    mars: false
  });

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const videoRefs = {
    earth: useRef<HTMLVideoElement | null>(null),
    venus: useRef<HTMLVideoElement | null>(null),
    mars: useRef<HTMLVideoElement | null>(null)
  };

  // Remaining 2 planets for side slots
  const remaining = ORDER.filter((p) => p !== featured);
  const slotL = remaining[0];
  const slotR = remaining[1];

  // Warm up video lazy loading
  const warm = (key: PlanetKey) => {
    if (!loadedVideos[key]) {
      setLoadedVideos((prev) => ({ ...prev, [key]: true }));
    }
  };

  // Play/Pause active background video
  useEffect(() => {
    ORDER.forEach((key) => {
      const vid = videoRefs[key].current;
      if (vid) {
        if (key === featured) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      }
    });
  }, [featured, loadedVideos]);

  // Handle Entrance Animations once on mount
  useEffect(() => {
    // Blocking check for reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const docEl = document.documentElement;

    if (!prefersReducedMotion) {
      docEl.classList.add('anim');
      
      const startAnim = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            docEl.classList.add('play');
          });
        });
      };

      if (document.fonts && document.fonts.ready) {
        let fontTimer: ReturnType<typeof setTimeout>;
        const fontPromise = document.fonts.ready;
        const timeoutPromise = new Promise((resolve) => {
          fontTimer = setTimeout(resolve, 500);
        });

        Promise.race([fontPromise, timeoutPromise]).then(() => {
          clearTimeout(fontTimer);
          startAnim();
        });
      } else {
        startAnim();
      }

      const cleanupTimer = setTimeout(() => {
        docEl.classList.remove('anim', 'play');
      }, 2150);

      return () => {
        clearTimeout(cleanupTimer);
        docEl.classList.remove('anim', 'play');
      };
    }
  }, []);

  // Idle background preloading for remaining videos
  useEffect(() => {
    const idleTimer = setTimeout(() => {
      setLoadedVideos({ earth: true, venus: true, mars: true });
    }, 2500);

    return () => clearTimeout(idleTimer);
  }, []);

  const handlePlanetSelect = (next: PlanetKey) => {
    if (next === featured) return;
    warm(next);
    setFeatured(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, rolePwd: string) => {
    setEmail(roleEmail);
    setPassword(rolePwd);
  };

  return (
    <div className="stage">
      {/* 1. Viewport Planet Backdrop */}
      <div className="sky" style={{ backgroundImage: `url(${PLANETS[featured].still})` }}>
        {ORDER.map((key) => {
          const isEarth = key === 'earth';
          const isLoaded = loadedVideos[key];
          return (
            <video
              key={key}
              ref={videoRefs[key]}
              data-planet={key}
              className={featured === key ? 'is-active' : ''}
              autoPlay={isEarth || featured === key}
              muted
              loop
              playsInline
              preload={isEarth ? 'auto' : isLoaded ? 'auto' : 'none'}
              src={isEarth || isLoaded ? PLANETS[key].clip : undefined}
              poster={PLANETS[key].still}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* 2. UI Overlay */}
      <div className="ui">
        {/* Navigation Bar */}
        <header className="navbar">
          <div className="navrow" data-open={menuOpen ? 'true' : 'false'}>
            <a className="logo" href="#">
              disaster<i>dss</i>
            </a>
            <nav className="links" id="site-nav">
              <a href="#" aria-current="page">
                Risk Map
              </a>
              <a href="#login-card" onClick={(e) => { e.preventDefault(); document.getElementById('login-card')?.scrollIntoView({ behavior: 'smooth' }); }}>Red-Zones</a>
              <a href="#login-card" onClick={(e) => { e.preventDefault(); document.getElementById('login-card')?.scrollIntoView({ behavior: 'smooth' }); }}>Capacity</a>
              <a href="#login-card" onClick={(e) => { e.preventDefault(); document.getElementById('login-card')?.scrollIntoView({ behavior: 'smooth' }); }}>Relocation</a>
              <a
                className="enroll"
                href="#login-card"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('login-card')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Sign In
              </a>
            </nav>
            <button
              className="burger"
              type="button"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              aria-controls="site-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </header>

        {/* Hero Content & Login Overlay */}
        <div className="copy">
          {/* Eyebrow */}
          <div className="col eyebrow">
            <span className="ent-mask">
              <span className="ent-line">DECISION SUPPORT SYSTEM</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="col title">
            <span className="ent-mask">
              <span className="ent-line">{PLANETS[featured].name}</span>
            </span>
          </h1>

          {/* Cyan Rule */}
          <div className="col rule">
            <span></span>
          </div>

          {/* Lede Paragraph */}
          <p className="col lede" dangerouslySetInnerHTML={{ __html: PLANETS[featured].lede }} />

          {/* Interactive CTA Row & Flanking Planet Cutout Buttons */}
          <div className="col cta">
            {/* Slot Left Planet Button */}
            <button
              className="planet planet-l"
              type="button"
              data-slot="l"
              data-planet={slotL}
              onClick={() => handlePlanetSelect(slotL)}
              onPointerEnter={() => warm(slotL)}
              onFocus={() => warm(slotL)}
              aria-label={`Show ${PLANETS[slotL].name}`}
            >
              {ORDER.map((key) => (
                <img
                  key={key}
                  data-planet={key}
                  className={slotL === key ? 'is-shown' : ''}
                  alt=""
                  src={PLANETS[key].cutout}
                />
              ))}
            </button>

            {/* Slot Right Planet Button */}
            <button
              className="planet planet-r"
              type="button"
              data-slot="r"
              data-planet={slotR}
              onClick={() => handlePlanetSelect(slotR)}
              onPointerEnter={() => warm(slotR)}
              onFocus={() => warm(slotR)}
              aria-label={`Show ${PLANETS[slotR].name}`}
            >
              {ORDER.map((key) => (
                <img
                  key={key}
                  data-planet={key}
                  className={slotR === key ? 'is-shown' : ''}
                  alt=""
                  src={PLANETS[key].cutout}
                />
              ))}
            </button>

            {/* Main Action Pill */}
            <a
              href="#login-card"
              className="btn-cta"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('login-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              ACCESS PORTAL
            </a>

            {/* Side Planet Labels */}
            <span className="label label-l">{PLANETS[slotL].name}</span>
            <span className="label label-r">{PLANETS[slotR].name}</span>
          </div>

          {/* Disaster Risk DSS Executive Portal Login Card */}
          <div
            id="login-card"
            className="login-card-box"
            style={{
              position: 'relative',
              top: 'calc(455 * var(--u))',
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'auto',
              paddingBottom: 'calc(140 * var(--u))',
              width: '100%'
            }}
          >
            <div className="w-full max-w-lg rounded-3xl border border-slate-700/60 bg-slate-900/85 p-7 shadow-2xl backdrop-blur-xl glow-blue transition-all duration-300 hover:border-blue-500/40">
              {/* Header */}
              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-xl shadow-blue-500/30 ring-1 ring-white/20 animate-pulse-subtle">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-white">Disaster Risk DSS</h2>
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-400/30">
                    v2.4 Enterprise
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Intelligent Red-Zone Identification, Safe Carrying Capacity Assessment & Relocation Support
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-950/90 p-3 border border-red-800 text-xs text-red-300 text-center font-medium shadow-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-200">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="authority@disaster.gov.in"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-200">
                    Portal Access Key / Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating Secure Token...</span>
                  ) : (
                    <>
                      <span>Sign In to Executive Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Live DSS Telemetry Status Ticker */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/70 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-md">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span>DSS Engine: ONLINE</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                  <span>Red-Zones: <strong className="text-red-400">42 Monitored</strong></span>
                  <span>Cap: <strong className="text-cyan-400">14.2k Safe</strong></span>
                </div>
              </div>

              {/* Quick Role Shortcuts */}
              <div className="mt-4 border-t border-slate-700/60 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                    Quick Role Portal Login Shortcuts:
                  </p>
                  <span className="text-[10px] text-cyan-400 font-medium">Click role to auto-fill</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. System Admin */}
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('admin@disaster.gov.in', 'admin123')}
                    className={`group relative rounded-xl border p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                      email === 'admin@disaster.gov.in'
                        ? 'border-purple-400 bg-purple-950/60 shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/50'
                        : 'border-purple-800/40 bg-purple-950/25 text-purple-200 hover:border-purple-500/60 hover:bg-purple-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs text-purple-300">
                        <Cpu className="h-4 w-4 text-purple-400 transition-transform group-hover:scale-110" />
                        <span>System Admin</span>
                      </div>
                      <span className="rounded bg-purple-900/60 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-700/40">
                        L4 Admin
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-purple-300/80 font-mono truncate">admin@disaster.gov.in</div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-purple-400/80 font-medium">
                      <span className="rounded bg-purple-950/80 px-1 py-0.5 border border-purple-800/40">System Overrides</span>
                      <span className="rounded bg-purple-950/80 px-1 py-0.5 border border-purple-800/40">User Keys</span>
                    </div>
                  </button>

                  {/* 2. Disaster Authority */}
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('authority@disaster.gov.in', 'authority123')}
                    className={`group relative rounded-xl border p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                      email === 'authority@disaster.gov.in'
                        ? 'border-amber-400 bg-amber-950/60 shadow-lg shadow-amber-900/40 ring-1 ring-amber-400/50'
                        : 'border-amber-800/40 bg-amber-950/25 text-amber-200 hover:border-amber-500/60 hover:bg-amber-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-300">
                        <Building2 className="h-4 w-4 text-amber-400 transition-transform group-hover:scale-110" />
                        <span>Disaster Authority</span>
                      </div>
                      <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-700/40">
                        L3 Exec
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-amber-300/80 font-mono truncate">authority@disaster.gov.in</div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-amber-400/80 font-medium">
                      <span className="rounded bg-amber-950/80 px-1 py-0.5 border border-amber-800/40">Red-Zone Mandate</span>
                      <span className="rounded bg-amber-950/80 px-1 py-0.5 border border-amber-800/40">Relocation</span>
                    </div>
                  </button>

                  {/* 3. Risk Analyst */}
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('analyst@disaster.gov.in', 'analyst123')}
                    className={`group relative rounded-xl border p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                      email === 'analyst@disaster.gov.in'
                        ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-900/40 ring-1 ring-cyan-400/50'
                        : 'border-blue-800/40 bg-blue-950/25 text-blue-200 hover:border-blue-500/60 hover:bg-blue-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs text-cyan-300">
                        <Sparkles className="h-4 w-4 text-cyan-400 transition-transform group-hover:scale-110" />
                        <span>Risk Analyst</span>
                      </div>
                      <span className="rounded bg-blue-900/60 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 border border-blue-700/40">
                        L2 Analyst
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-cyan-300/80 font-mono truncate">analyst@disaster.gov.in</div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-cyan-400/80 font-medium">
                      <span className="rounded bg-blue-950/80 px-1 py-0.5 border border-blue-800/40">Slope Stability</span>
                      <span className="rounded bg-blue-950/80 px-1 py-0.5 border border-blue-800/40">AI Models</span>
                    </div>
                  </button>

                  {/* 4. Public Viewer */}
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('viewer@disaster.gov.in', 'viewer123')}
                    className={`group relative rounded-xl border p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                      email === 'viewer@disaster.gov.in'
                        ? 'border-emerald-400 bg-emerald-950/60 shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/50'
                        : 'border-slate-700 bg-slate-800/40 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-300">
                        <Eye className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" />
                        <span>Public Viewer</span>
                      </div>
                      <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-700/40">
                        L1 Public
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">viewer@disaster.gov.in</div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-emerald-400/80 font-medium">
                      <span className="rounded bg-slate-900 px-1 py-0.5 border border-slate-700">Live Risk Map</span>
                      <span className="rounded bg-slate-900 px-1 py-0.5 border border-slate-700">Advisories</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Scroll Down Arrow Indicator */}
      <button
        className="scroll"
        type="button"
        aria-label="Scroll to login form"
        onClick={() => {
          document.getElementById('login-card')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <svg viewBox="0 0 26 33" fill="none" aria-hidden="true">
          <path
            d="M13 1.5 V31.5 M1.9 20.4 L13 31.5 L24.1 20.4"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </button>
    </div>
  );
};
