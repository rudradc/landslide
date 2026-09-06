import React, { useEffect, useState } from 'react';
import { mlService } from '../services/api';
import { BrainCircuit, Play, CheckCircle2, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const MlStudioPage: React.FC = () => {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const data = await mlService.getPerformance();
      setPerformance(data);
    } catch (err) {
      console.error("Failed to load ML metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      await mlService.train();
      await fetchPerformance();
    } catch (err) {
      alert("Failed to train ML models.");
    } finally {
      setTraining(false);
    }
  };

  const featureImportanceData = performance?.feature_importance || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">AI/ML Model Studio & Explainability (XAI)</h2>
          <p className="text-xs text-slate-400">Train supervised classifiers (Random Forest, XGBoost, Logistic Regression) & evaluate SHAP feature importances</p>
        </div>
        <button
          onClick={handleTrain}
          disabled={training}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          <span>{training ? "Training ML Pipeline..." : "Train ML Models"}</span>
        </button>
      </div>

      {/* Model Performance Comparison Cards */}
      {performance?.models && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(performance.models).map(([key, model]: [string, any]) => (
            <div key={key} className="glass-card p-5 border-l-4 border-l-blue-500 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{model.model_name}</h3>
                <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-mono text-blue-300 border border-blue-800">
                  F1: {(model.f1_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Accuracy</span>
                  <span className="font-bold text-emerald-400">{(model.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Precision</span>
                  <span className="font-bold text-white">{(model.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Recall</span>
                  <span className="font-bold text-white">{(model.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">F1-Score</span>
                  <span className="font-bold text-blue-400">{(model.f1_score * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SHAP Feature Importance Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-400" />
          <span>Global Feature Importance Attributions (XGBoost SHAP Metrics)</span>
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={130} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="importance" fill="#2563EB" radius={[0, 4, 4, 0]}>
                {featureImportanceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#2563EB' : '#3B82F6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
