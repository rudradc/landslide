import React, { useEffect, useState } from 'react';
import { habitationService } from '../services/api';
import { Habitation } from '../types';
import { Search, Plus, Trash2, Eye, MapPin, Filter, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const HabitationsPage: React.FC = () => {
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState('All');
  const { hasRole } = useAuth();

  const fetchHabitations = async () => {
    setLoading(true);
    try {
      const data = await habitationService.getAll({ limit: 500 });
      setHabitations(data);
    } catch (err) {
      console.error("Failed to load habitations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitations();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete habitation record '${name}'?`)) {
      try {
        await habitationService.delete(id);
        fetchHabitations();
      } catch (err) {
        alert("Failed to delete habitation record.");
      }
    }
  };

  const getRiskBadgeClass = (cat?: string) => {
    switch (cat) {
      case 'Critical': return 'bg-red-950/80 text-red-300 border-red-800';
      case 'High': return 'bg-orange-950/80 text-orange-300 border-orange-800';
      case 'Moderate': return 'bg-amber-950/80 text-amber-300 border-amber-800';
      default: return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
  };

  const filteredHabitations = habitations.filter((hab) => {
    const matchesSearch = hab.name.toLowerCase().includes(search.toLowerCase()) || hab.habitation_code.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || hab.district === selectedDistrict;
    const matchesRisk = selectedRiskCategory === 'All' || hab.risk?.risk_category === selectedRiskCategory;
    return matchesSearch && matchesDistrict && matchesRisk;
  });

  const districts = ['All', ...Array.from(new Set(habitations.map((h) => h.district)))];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Habitation Management Registry</h2>
          <p className="text-xs text-slate-400">View, search, filter, and manage habitation spatial profiles and risk assessments</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by habitation name or code..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-3 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Risk Category:</span>
            <select
              value={selectedRiskCategory}
              onChange={(e) => setSelectedRiskCategory(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-3 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Critical">Critical (Red)</option>
              <option value="High">High (Orange)</option>
              <option value="Moderate">Moderate (Yellow)</option>
              <option value="Low">Low (Green)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold">Code / Name</th>
                <th className="p-3.5 font-semibold">District</th>
                <th className="p-3.5 font-semibold">Coordinates</th>
                <th className="p-3.5 font-semibold">Population</th>
                <th className="p-3.5 font-semibold">Slope / Rainfall</th>
                <th className="p-3.5 font-semibold">Hazard</th>
                <th className="p-3.5 font-semibold">Capacity</th>
                <th className="p-3.5 font-semibold">Risk Category</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">Loading registry habitations...</td>
                </tr>
              ) : filteredHabitations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">No habitations match search criteria.</td>
                </tr>
              ) : (
                filteredHabitations.map((hab) => (
                  <tr key={hab.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{hab.name}</div>
                      <div className="text-[10px] text-slate-500">{hab.habitation_code}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">{hab.district}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[10px]">
                      {hab.latitude.toFixed(3)}°N, {hab.longitude.toFixed(3)}°E
                    </td>
                    <td className="p-3.5 text-slate-200">{hab.population.toLocaleString()}</td>
                    <td className="p-3.5 text-slate-300">
                      <div>{hab.slope_deg}° slope</div>
                      <div className="text-[10px] text-slate-500">{hab.annual_rainfall_mm} mm</div>
                    </td>
                    <td className="p-3.5 font-semibold text-amber-400">
                      {hab.hazard?.composite_hazard_score || 0}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {hab.capacity?.safe_estimated_capacity || 0}
                      {hab.capacity?.overcapacity_count ? (
                        <span className="ml-1 text-[10px] text-red-400 font-bold">(+{hab.capacity.overcapacity_count})</span>
                      ) : null}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRiskBadgeClass(hab.risk?.risk_category)}`}>
                        {hab.risk?.risk_category || 'Low'} ({hab.risk?.overall_risk_score || 0})
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/habitations/${hab.id}`}
                          className="rounded p-1.5 text-blue-400 hover:bg-blue-950/50 hover:text-blue-300"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {hasRole(['ADMIN']) && (
                          <button
                            onClick={() => handleDelete(hab.id, hab.name)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-950/50 hover:text-red-400"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
