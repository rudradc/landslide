import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { habitationService, relocationService, reportService } from '../services/api';
import { Habitation, RelocationRecommendation } from '../types';
import { 
  ArrowLeft, 
  FileText, 
  ShieldAlert, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Download,
  Info,
  CheckCircle2
} from 'lucide-react';

export const HabitationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [habitation, setHabitation] = useState<Habitation | null>(null);
  const [recommendations, setRecommendations] = useState<RelocationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadHabitationDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [habData, recoData] = await Promise.all([
          habitationService.getById(id),
          relocationService.getRecommendations(id)
        ]);
        setHabitation(habData);
        setRecommendations(recoData);
      } catch (err) {
        console.error("Failed to load habitation details:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHabitationDetails();
  }, [id]);

  const handleDownloadReport = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      await reportService.downloadPdfReport(id);
    } catch (err) {
      alert("Failed to download PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !habitation) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-xs">Loading Habitation Profile & Analytical Models...</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (cat?: string) => {
    switch (cat) {
      case 'Critical': return '#EF4444';
      case 'High': return '#F97316';
      case 'Moderate': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Back Header & PDF Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/habitations" className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400">{habitation.habitation_code}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">{habitation.district}, {habitation.state}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{habitation.name}</h2>
          </div>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{downloading ? "Generating PDF..." : "Export Official PDF Risk Report"}</span>
        </button>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Overall Risk Card */}
        <div
          className="glass-card p-5 border-2 text-center"
          style={{ borderColor: getRiskColor(habitation.risk?.risk_category) }}
        >
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Overall Risk Score</span>
          <span className="mt-2 text-3xl font-black block" style={{ color: getRiskColor(habitation.risk?.risk_category) }}>
            {habitation.risk?.overall_risk_score} / 100
          </span>
          <span
            className="inline-block mt-2 rounded-full px-3 py-0.5 text-xs font-bold text-white uppercase"
            style={{ backgroundColor: getRiskColor(habitation.risk?.risk_category) }}
          >
            {habitation.risk?.risk_category} Zone
          </span>
        </div>

        {/* Hazard Score Card */}
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Composite Hazard</span>
          <span className="mt-2 text-2xl font-black text-amber-400 block">
            {habitation.hazard?.composite_hazard_score} / 100
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Landslide ({habitation.hazard?.landslide_score}) | Flood ({habitation.hazard?.flood_score})
          </p>
        </div>

        {/* Vulnerability Score Card */}
        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Vulnerability Index</span>
          <span className="mt-2 text-2xl font-black text-blue-400 block">
            {habitation.vulnerability?.composite_vulnerability_score} / 100
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Social Density & Emergency Isolation
          </p>
        </div>

        {/* Relocation Priority Card */}
        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Relocation Priority</span>
          <span className="mt-2 text-2xl font-black text-purple-400 block">
            {habitation.priority?.priority_score} / 100
          </span>
          <p className="mt-1 text-[10px] font-semibold text-purple-300">
            {habitation.priority?.priority_category}
          </p>
        </div>
      </div>

      {/* 2-Column Detailed Analytical Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Geographic Profile & Carrying Capacity */}
        <div className="space-y-6">
          {/* Habitation Profile */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-2">
              Geographic & Demographic Profile
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Latitude / Longitude</span>
                <span className="font-bold text-white">{habitation.latitude}° N, {habitation.longitude}° E</span>
              </div>
              <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Population / Households</span>
                <span className="font-bold text-white">{habitation.population.toLocaleString()} persons ({habitation.households} HH)</span>
              </div>
              <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Terrain Elevation / Slope</span>
                <span className="font-bold text-white">{habitation.elevation_m} m elev | {habitation.slope_deg}° slope</span>
              </div>
              <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Annual Rainfall / River Dist</span>
                <span className="font-bold text-white">{habitation.annual_rainfall_mm} mm | {habitation.distance_to_river_m} m river</span>
              </div>
            </div>
          </div>

          {/* Carrying Capacity Assessment */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>Carrying Capacity Assessment Engine</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-300 font-semibold">Current Population</span>
                <span className="font-bold text-white text-sm">{habitation.population.toLocaleString()} Persons</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-300 font-semibold">Safe Estimated Capacity (C<sub>safe</sub>)</span>
                <span className="font-bold text-emerald-400 text-sm">{habitation.capacity?.safe_estimated_capacity.toLocaleString()} Persons</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-300 font-semibold">Overcapacity Population</span>
                <span className={`font-bold text-sm ${habitation.capacity?.overcapacity_count ? 'text-red-400' : 'text-emerald-400'}`}>
                  +{habitation.capacity?.overcapacity_count.toLocaleString()} Persons
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-300 font-semibold">Primary Resource Bottleneck</span>
                <span className="font-bold text-amber-400">{habitation.capacity?.bottleneck_resource}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Explainable AI (XAI) Contributing Factors */}
        <div className="glass-card p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-400" />
            <span>Explainable AI (XAI) Risk Contributing Factors</span>
          </h3>

          <div className="space-y-4 flex-1">
            <p className="text-xs text-slate-400">
              Composite risk scores are deconstructed into transparent factor attributions based on weighted feature impacts:
            </p>

            {habitation.risk?.contributing_factors.map((factor, idx) => (
              <div key={idx} className="space-y-1.5 rounded-lg bg-slate-950 p-3 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{factor.factor}</span>
                  <span className="font-bold text-blue-400">{factor.impact_pct}% Impact</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                    style={{ width: `${factor.impact_pct}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-400">Raw Indicator Value: {factor.raw_score} / 100</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Relocation Target Sites Table */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-400" />
          <span>Ranked Candidate Relocation Target Sites</span>
        </h3>

        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-400">No registered candidate relocation target sites available in system database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Rank Order</th>
                  <th className="p-3 font-semibold">Candidate Site Name</th>
                  <th className="p-3 font-semibold">District</th>
                  <th className="p-3 font-semibold">Distance</th>
                  <th className="p-3 font-semibold">Capacity Fit</th>
                  <th className="p-3 font-semibold">Suitability Score</th>
                  <th className="p-3 font-semibold">Suitability Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recommendations.map((reco) => (
                  <tr key={reco.site.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-blue-400">#{reco.rank_order}</td>
                    <td className="p-3 font-bold text-white">{reco.site.name}</td>
                    <td className="p-3 text-slate-300">{reco.site.district}</td>
                    <td className="p-3 text-slate-300">{reco.rationale.distance_km} km</td>
                    <td className="p-3 text-slate-300">{reco.rationale.capacity_fit}</td>
                    <td className="p-3 font-bold text-emerald-400">{reco.suitability_score} / 100</td>
                    <td className="p-3">
                      <span className="inline-block rounded-full bg-blue-950 border border-blue-800 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                        {reco.suitability_tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
