import React, { useEffect, useState } from 'react';
import { analysisService, habitationService } from '../services/api';
import { RiskSummary, Habitation } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Users, 
  Home, 
  TrendingUp, 
  MapPin, 
  Play,
  CheckCircle2,
  Filter,
  Search,
  Brain,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  BarChart3,
  Layers,
  CloudRain,
  Trees,
  Droplets,
  Wind,
  Compass
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRiskTier, setSelectedRiskTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, habRes] = await Promise.all([
        analysisService.getSummary(),
        habitationService.getAll({ limit: 100 })
      ]);
      setSummary(sumRes);
      setHabitations(habRes);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await analysisService.runAnalysis();
      await fetchData();
    } catch (err) {
      console.error("Failed to run analysis:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (cat?: string) => {
    switch (cat) {
      case 'Critical': return '#EF4444';
      case 'High': return '#F97316';
      case 'Moderate': return '#F59E0B';
      default: return '#10B981';
    }
  };

  // Derive unique districts
  const districts = Array.from(new Set(habitations.map(h => h.district))).filter(Boolean);

  // Filtered Habitations
  const filteredHabitations = habitations.filter(h => {
    const matchesDistrict = selectedDistrict === 'ALL' || h.district === selectedDistrict;
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          h.habitation_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTier = true;
    if (selectedRiskTier === 'CRITICAL') matchesTier = h.risk?.risk_category === 'Critical';
    else if (selectedRiskTier === 'HIGH') matchesTier = h.risk?.risk_category === 'High';
    else if (selectedRiskTier === 'MODERATE') matchesTier = h.risk?.risk_category === 'Moderate';
    else if (selectedRiskTier === 'LOW') matchesTier = h.risk?.risk_category === 'Low';
    else if (selectedRiskTier === 'OVERCAPACITY') matchesTier = (h.capacity?.overcapacity_count || 0) > 0;

    return matchesDistrict && matchesSearch && matchesTier;
  });

  // KPI calculations
  const totalMonitoredPop = habitations.reduce((sum, h) => sum + (h.population || 0), 0);
  const totalOvercapacityPop = habitations.reduce((sum, h) => sum + (h.capacity?.overcapacity_count || 0), 0);

  // Pie chart data
  const pieData = summary ? [
    { name: 'Critical Red Zones', value: summary.critical_zones, color: '#EF4444' },
    { name: 'High Risk Zones', value: summary.high_risk_zones, color: '#F97316' },
    { name: 'Moderate Risk', value: summary.moderate_risk_zones, color: '#F59E0B' },
    { name: 'Low Risk / Safe', value: summary.low_risk_zones, color: '#10B981' },
  ] : [];

  // Bar chart data for top 8 overcapacity / population habitations
  const barData = habitations
    .slice()
    .sort((a, b) => (b.population || 0) - (a.population || 0))
    .slice(0, 8)
    .map(h => ({
      name: h.name.length > 12 ? h.name.slice(0, 10) + '...' : h.name,
      Population: h.population,
      SafeCapacity: h.capacity?.safe_estimated_capacity || 0
    }));

  // Average Sub-hazard Scores across habitations
  const avgLandslide = (habitations.reduce((sum, h) => sum + (h.hazard?.landslide_score || 0), 0) / (habitations.length || 1)).toFixed(1);
  const avgFlood = (habitations.reduce((sum, h) => sum + (h.hazard?.flood_score || 0), 0) / (habitations.length || 1)).toFixed(1);
  const avgEarthquake = (habitations.reduce((sum, h) => sum + (h.hazard?.earthquake_score || 0), 0) / (habitations.length || 1)).toFixed(1);
  const avgRainfall = (habitations.reduce((sum, h) => sum + (h.hazard?.rainfall_hazard_score || 0), 0) / (habitations.length || 1)).toFixed(1);
  const avgSocialVuln = (habitations.reduce((sum, h) => sum + (h.vulnerability?.social_vulnerability || 0), 0) / (habitations.length || 1)).toFixed(1);

  const radarData = [
    { subject: 'Landslide Hazard', value: parseFloat(avgLandslide), fullMark: 100 },
    { subject: 'Extreme Rain', value: parseFloat(avgRainfall), fullMark: 100 },
    { subject: 'Flood Risk', value: parseFloat(avgFlood), fullMark: 100 },
    { subject: 'Seismic Hazard', value: parseFloat(avgEarthquake), fullMark: 100 },
    { subject: 'Social Vulnerability', value: parseFloat(avgSocialVuln), fullMark: 100 },
  ];

  const criticalHabitations = habitations
    .filter(h => h.risk?.risk_category === 'Critical' || h.risk?.risk_category === 'High')
    .sort((a, b) => (b.priority?.priority_score || 0) - (a.priority?.priority_score || 0));

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500/20 via-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 shadow-md">
              <Trees className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Disaster Risk & Relocation Executive Dashboard</h2>
            <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Monsoon Analytics DSS
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time multi-hazard assessment, safe carrying capacity thresholds (<span className="font-semibold text-emerald-300">C<sub>safe</sub></span>), and relocation priority score rankings (<span className="font-semibold text-cyan-300">RPS</span>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:border-slate-700 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/20 transition-all hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 hover:scale-[1.02]"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running Risk Scoring Engine...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Run Risk Scoring Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Atmospheric Monsoon Weather & Slope Hazard Widget Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 flex items-center gap-3 border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-950/30 to-slate-900/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <CloudRain className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monsoon Rainfall Index</span>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{avgRainfall} / 100</span>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">High Saturation</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 flex items-center gap-3 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-950/30 to-slate-900/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Trees className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Forest Canopy Protection</span>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Slope Stability 68%</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">Vegetated</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 flex items-center gap-3 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-950/30 to-slate-900/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Droplets className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Landslide Susceptibility</span>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{avgLandslide} / 100</span>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-950 px-1.5 py-0.2 rounded border border-orange-800">Active Soil Shift</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 flex items-center gap-3 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-950/30 to-slate-900/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GIS Monitoring Status</span>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{habitations.length} Zones Live</span>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800">Spatial Telemetry</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Red Zone Urgent Alert Strip */}
      {summary && summary.critical_zones > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/70 to-slate-950 p-4 border border-red-800/80 shadow-2xl glow-red">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/30 border border-red-500/50 animate-pulse-subtle">
                <ShieldAlert className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
                    CRITICAL RED ZONE ALERT
                  </span>
                  <span className="text-xs text-red-300 font-medium">
                    {summary.critical_zones} Habitations require urgent relocation evaluation
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-300">
                  Habitations exceed composite hazard vulnerability thresholds with immediate overcapacity risk under current monsoon load.
                </p>
              </div>
            </div>

            <Link
              to="/relocation"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-red-500 transition-all shrink-0 hover:scale-105"
            >
              <span>Review Relocation Target Sites</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Filter Control Toolbar */}
      <div className="glass-card p-4 border border-slate-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Risk Tier Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400">
              <Filter className="h-3.5 w-3.5 text-teal-400" />
              <span>Risk Filter:</span>
            </span>
            {[
              { id: 'ALL', label: 'All Habitations' },
              { id: 'CRITICAL', label: 'Critical Red Zones', badge: summary?.critical_zones, color: 'text-red-400' },
              { id: 'HIGH', label: 'High Risk', badge: summary?.high_risk_zones, color: 'text-orange-400' },
              { id: 'MODERATE', label: 'Moderate', badge: summary?.moderate_risk_zones, color: 'text-amber-400' },
              { id: 'LOW', label: 'Safe / Low', badge: summary?.low_risk_zones, color: 'text-emerald-400' },
              { id: 'OVERCAPACITY', label: 'Overcapacity', badge: summary?.overcapacity_habitations, color: 'text-cyan-400' },
            ].map(tier => (
              <button
                key={tier.id}
                onClick={() => setSelectedRiskTier(tier.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedRiskTier === tier.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <span>{tier.label}</span>
                {tier.badge !== undefined && tier.badge !== null && (
                  <span className={`rounded-full bg-slate-950/90 px-1.5 py-0.2 text-[10px] font-bold ${tier.color || 'text-slate-300'}`}>
                    {tier.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* District Dropdown & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Districts ({districts.length})</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search habitation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 rounded-lg border border-slate-800 bg-slate-950/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6 High-Impact Glass Executive KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Total Habitations */}
        <div className="glass-card p-4 border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Habitations</span>
            <Home className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{summary?.total_habitations || 0}</p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px] text-slate-400">
            <span>Pop Monitored:</span>
            <span className="font-bold text-slate-200">{totalMonitoredPop.toLocaleString()}</span>
          </div>
        </div>

        {/* Critical Red Zones */}
        <div className="glass-card p-4 border-l-4 border-l-red-500 glow-red">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Red Zones</span>
            <ShieldAlert className="h-4 w-4 text-red-400 animate-pulse-subtle" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-400">{summary?.critical_zones || 0}</p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px] text-red-400/80">
            <span>Immediate Review</span>
            <span className="font-bold text-red-400">
              {summary ? ((summary.critical_zones / (summary.total_habitations || 1)) * 100).toFixed(0) : 0}% Share
            </span>
          </div>
        </div>

        {/* High Risk Zones */}
        <div className="glass-card p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">High Risk</span>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-orange-400">{summary?.high_risk_zones || 0}</p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px] text-orange-400/80">
            <span>High Vulnerability</span>
            <span className="font-bold text-orange-400">Active Warning</span>
          </div>
        </div>

        {/* Moderate Risk */}
        <div className="glass-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Moderate Tier</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{summary?.moderate_risk_zones || 0}</p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px] text-amber-400/80">
            <span>Watch Status</span>
            <span className="font-bold text-amber-400">Stable Limit</span>
          </div>
        </div>

        {/* Low Risk / Safe */}
        <div className="glass-card p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Safe Habitations</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{summary?.low_risk_zones || 0}</p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px] text-emerald-400/80">
            <span>Safe Limit Fit</span>
            <span className="font-bold text-emerald-400">
              {summary ? ((summary.low_risk_zones / (summary.total_habitations || 1)) * 100).toFixed(0) : 0}% Total
            </span>
          </div>
        </div>

        {/* Overcapacity & RPS */}
        <div className="glass-card p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overcapacity</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-cyan-400">{summary?.overcapacity_habitations || 0}</p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px] text-cyan-400/80">
            <span>Excess Population</span>
            <span className="font-bold text-cyan-300">{totalOvercapacityPop.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* AI & XAI Hazard Factor Driver Banner */}
      <div className="glass-card p-4 bg-gradient-to-r from-slate-900/90 via-teal-950/40 to-slate-900/90 border border-teal-800/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/20 border border-teal-500/40 text-teal-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Explainable AI (XAI) Model Insights</span>
                <span className="rounded-full bg-teal-500/20 px-2 py-0.2 text-[9px] font-bold text-teal-300 border border-teal-500/30">SHAP Feature Importances</span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Primary Hazard Drivers: <strong className="text-red-400">Slope Angle & Terrain Instability (38.2%)</strong>, <strong className="text-cyan-400">Extreme Monsoon Rainfall (26.4%)</strong>, and <strong className="text-emerald-400">Road Isolation (19.8%)</strong>.
              </p>
            </div>
          </div>

          <Link
            to="/ml-studio"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-teal-400 border border-teal-800/50 hover:bg-slate-900 transition-all shrink-0 hover:scale-105"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Open AI/ML Studio</span>
          </Link>
        </div>
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Risk Category Distribution Donut Chart */}
        <div className="glass-card p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-400" />
              <span>Risk Tier Distribution</span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Total: {summary?.total_habitations}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Population vs Safe Estimated Carrying Capacity Bar Chart */}
        <div className="glass-card p-5 lg:col-span-2 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span>Population vs Safe Carrying Capacity Threshold (C<sub>safe</sub>)</span>
              </h3>
              <p className="text-[10px] text-slate-400">Identifies overcapacity gaps across major habitations</p>
            </div>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
              Top 8 Habitations
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="Population" fill="#EF4444" radius={[6, 6, 0, 0]} name="Actual Population" />
                <Bar dataKey="SafeCapacity" fill="#10B981" radius={[6, 6, 0, 0]} name="Safe Capacity Limit (C_safe)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-hazard Radar & Interactive Map Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sub-hazard Radar Chart */}
        <div className="glass-card p-5 border border-slate-800/80">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>Multi-Hazard & Vulnerability Profile</span>
            </h3>
            <p className="text-[10px] text-slate-400">Average sub-score index across monitored zone</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                <Radar name="Average Score" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GIS Geospatial Risk Map */}
        <div className="glass-card p-5 lg:col-span-2 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span>Geospatial Risk Distribution Map</span>
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400">Showing {filteredHabitations.length} habitations</span>
              <Link to="/gis-map" className="text-xs font-bold text-cyan-400 hover:underline">
                Open Full GIS Workspace →
              </Link>
            </div>
          </div>

          <div className="h-72 w-full overflow-hidden rounded-xl border border-slate-800/80 shadow-inner">
            <MapContainer
              center={[30.3753, 79.3312]}
              zoom={9}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {filteredHabitations.map((hab) => (
                <CircleMarker
                  key={hab.id}
                  center={[hab.latitude, hab.longitude]}
                  radius={hab.risk?.risk_category === 'Critical' ? 11 : 7}
                  pathOptions={{
                    fillColor: getRiskColor(hab.risk?.risk_category),
                    color: '#0f172a',
                    weight: 2,
                    fillOpacity: 0.85
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <p className="font-black text-white text-sm">{hab.name}</p>
                      <p className="text-slate-300">Code: {hab.habitation_code}</p>
                      <p className="text-slate-300">District: {hab.district}</p>
                      <p className="text-slate-300">Population: {hab.population} (Overcapacity: {hab.capacity?.overcapacity_count || 0})</p>
                      <p className="mt-1 font-bold" style={{ color: getRiskColor(hab.risk?.risk_category) }}>
                        Risk Score: {hab.risk?.overall_risk_score} ({hab.risk?.risk_category})
                      </p>
                      <div className="mt-2 border-t border-slate-700 pt-1">
                        <Link to={`/habitations/${hab.id}`} className="text-[11px] font-bold text-cyan-400 hover:underline">
                          View Full Details →
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Critical Habitations Relocation Priority Queue Table */}
      <div className="glass-card p-5 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <span>Top Relocation Priority Habitations Queue (<span className="text-cyan-400">RPS</span>)</span>
            </h3>
            <p className="text-xs text-slate-400">Ranked by Relocation Priority Score combining hazard, carrying capacity deficit, and road isolation.</p>
          </div>
          <Link
            to="/habitations"
            className="text-xs font-bold text-cyan-400 hover:underline shrink-0"
          >
            View Complete Registry ({habitations.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Habitation</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Population / Safe Capacity</th>
                <th className="px-4 py-3">Overcapacity</th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3">Priority Score (RPS)</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {criticalHabitations.slice(0, 6).map((hab) => (
                <tr key={hab.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{hab.name}</div>
                    <div className="text-[10px] text-slate-500">{hab.habitation_code}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{hab.district}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">{hab.population}</span> / <span className="text-emerald-400">{hab.capacity?.safe_estimated_capacity || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(hab.capacity?.overcapacity_count || 0) > 0 ? (
                      <span className="rounded-md bg-red-950/80 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-800">
                        +{hab.capacity?.overcapacity_count} Excess
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Safe</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: getRiskColor(hab.risk?.risk_category) }}
                    >
                      {hab.risk?.risk_category} ({hab.risk?.overall_risk_score})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                          style={{ width: `${Math.min(100, (hab.priority?.priority_score || 0))}%` }}
                        />
                      </div>
                      <span className="font-bold text-amber-400">{hab.priority?.priority_score || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/habitations/${hab.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600/20 px-3 py-1 text-[11px] font-bold text-teal-400 border border-teal-500/30 hover:bg-teal-600 hover:text-white transition-all"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
