import React, { useEffect, useState } from 'react';
import { configService } from '../services/api';
import { RiskConfig } from '../types';
import { Sliders, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<RiskConfig>({
    weight_hazard: 0.30,
    weight_vulnerability: 0.25,
    weight_capacity: 0.20,
    weight_infrastructure: 0.15,
    weight_history: 0.10,
    threshold_moderate: 25.0,
    threshold_high: 50.0,
    threshold_critical: 75.0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { hasRole } = useAuth();

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const data = await configService.getWeights();
        setConfig(data);
      } catch (err) {
        console.error("Failed to load MCDA config:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const totalWeight = Number(
    (config.weight_hazard +
    config.weight_vulnerability +
    config.weight_capacity +
    config.weight_infrastructure +
    config.weight_history).toFixed(2)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setError(`Sum of MCDA weights must equal exactly 1.00 (Current sum: ${totalWeight})`);
      return;
    }

    setSaving(true);
    try {
      await configService.updateWeights(config);
      setMessage("System MCDA risk configuration saved successfully.");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">System Risk Model Configuration</h2>
        <p className="text-xs text-slate-400">Configure MCDA weights & risk category classification thresholds (Admin Access Required)</p>
      </div>

      {message && (
        <div className="rounded-lg bg-emerald-950/80 p-3 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-950/80 p-3 border border-red-800 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* MCDA Weights Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <span>Multi-Criteria Decision Analysis (MCDA) Weights</span>
            </h3>
            <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded ${totalWeight === 1.0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
              Sum: {totalWeight.toFixed(2)} / 1.00
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">1. Hazard Exposure Weight ($w_H$)</span>
                <span className="text-blue-400 font-bold">{(config.weight_hazard * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.weight_hazard}
                onChange={(e) => setConfig({ ...config, weight_hazard: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">2. Vulnerability Index Weight ($w_V$)</span>
                <span className="text-blue-400 font-bold">{(config.weight_vulnerability * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.weight_vulnerability}
                onChange={(e) => setConfig({ ...config, weight_vulnerability: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">3. Capacity Pressure Weight ($w_{`{CP}`}$)</span>
                <span className="text-blue-400 font-bold">{(config.weight_capacity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.weight_capacity}
                onChange={(e) => setConfig({ ...config, weight_capacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">4. Infrastructure Accessibility Weight ($w_{`{IR}`}$)</span>
                <span className="text-blue-400 font-bold">{(config.weight_infrastructure * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.weight_infrastructure}
                onChange={(e) => setConfig({ ...config, weight_infrastructure: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">5. Historical Disaster Exposure Weight ($w_{`{Hist}`}$)</span>
                <span className="text-blue-400 font-bold">{(config.weight_history * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.weight_history}
                onChange={(e) => setConfig({ ...config, weight_history: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Risk Thresholds Card */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Risk Category Classification Thresholds (0-100 Score Range)
          </h3>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-amber-400 font-semibold mb-1">Moderate Risk Cutoff</label>
              <input
                type="number"
                value={config.threshold_moderate}
                onChange={(e) => setConfig({ ...config, threshold_moderate: parseFloat(e.target.value) })}
                className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-orange-400 font-semibold mb-1">High Risk Cutoff</label>
              <input
                type="number"
                value={config.threshold_high}
                onChange={(e) => setConfig({ ...config, threshold_high: parseFloat(e.target.value) })}
                className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-red-400 font-semibold mb-1">Critical Red-Zone Cutoff</label>
              <input
                type="number"
                value={config.threshold_critical}
                onChange={(e) => setConfig({ ...config, threshold_critical: parseFloat(e.target.value) })}
                className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {hasRole(['ADMIN']) && (
          <button
            type="submit"
            disabled={saving || totalWeight !== 1.0}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Configuration..." : "Save Configuration"}</span>
          </button>
        )}
      </form>
    </div>
  );
};
