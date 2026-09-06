import React, { useState } from 'react';
import { dataService } from '../services/api';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';

export const DataUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setReport(null);
    try {
      const res = await dataService.uploadCsv(file);
      setReport(res.summary);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload and validate CSV file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Habitation Data Ingestion & Quality Validation</h2>
        <p className="text-xs text-slate-400">Upload CSV datasets, validate missing values & spatial coordinates, and inspect quality metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CSV Dropzone Card */}
        <div className="glass-card p-6 border-2 border-dashed border-slate-800 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950/60 border border-blue-800 text-blue-400">
            <UploadCloud className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Select Habitation CSV File</h3>
            <p className="text-xs text-slate-400 mt-1">Supports standard schema with 22+ spatial, topographical & demographic fields</p>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:py-2 file:px-4 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700"
          />

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {uploading ? "Validating & Ingesting Data..." : "Upload & Run Validation Pipeline"}
          </button>

          {error && (
            <div className="rounded-lg bg-red-950/80 p-3 border border-red-800 text-xs text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Validation Summary Card */}
        {report && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Data Quality Report Summary
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Processed</span>
                <span className="text-2xl font-black text-white">{report.total_rows}</span>
              </div>
              <div className="rounded-lg bg-slate-950 p-3 border border-emerald-900/50">
                <span className="text-[10px] text-emerald-400 block font-semibold uppercase">Valid Ingested</span>
                <span className="text-2xl font-black text-emerald-400">{report.valid_rows}</span>
              </div>
              <div className="rounded-lg bg-slate-950 p-3 border border-red-900/50">
                <span className="text-[10px] text-red-400 block font-semibold uppercase">Invalid Flagged</span>
                <span className="text-2xl font-black text-red-400">{report.invalid_rows}</span>
              </div>
            </div>

            {report.reasons && report.reasons.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-300 mb-2">Flagged Validation Errors:</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {report.reasons.map((err: any, idx: number) => (
                    <div key={idx} className="rounded bg-red-950/40 p-2.5 border border-red-900/50 text-[11px]">
                      <span className="font-bold text-red-400">Row #{err.row} (Code: {err.habitation_code}):</span>
                      <ul className="mt-1 list-disc list-inside text-red-300 space-y-0.5">
                        {err.reasons.map((r: string, rIdx: number) => (
                          <li key={rIdx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
