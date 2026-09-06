import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Circle, useMap, Tooltip } from 'react-leaflet';
import { habitationService, relocationService } from '../services/api';
import { Habitation, RelocationSite } from '../types';
import { Search, Filter, Layers, MapPin, ShieldAlert, ArrowRight, X, Compass, Activity, Navigation2, CheckCircle2, Eye, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet Default Icon Fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Haversine distance calculator in kilometers
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Map controller for programmatic flyTo and fitBounds
const MapController: React.FC<{
  centerTarget: [number, number] | null;
  habitations: Habitation[];
}> = ({ centerTarget, habitations }) => {
  const map = useMap();

  useEffect(() => {
    if (centerTarget) {
      map.flyTo(centerTarget, 13, { duration: 1.5 });
    }
  }, [centerTarget, map]);

  useEffect(() => {
    if (habitations.length > 0 && !centerTarget) {
      const valid = habitations.filter((h) => h.latitude && h.longitude);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((h) => [h.latitude, h.longitude]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
      }
    }
  }, [habitations, map]);

  return null;
};

export const GisMapPage: React.FC = () => {
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [relocationSites, setRelocationSites] = useState<RelocationSite[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Toggles
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState('All');
  const [mapStyle, setMapStyle] = useState<'osm' | 'dark' | 'satellite' | 'topo'>('osm');

  // Layer Visibility
  const [showRelocationSites, setShowRelocationSites] = useState(true);
  const [showRelocationVectors, setShowRelocationVectors] = useState(true);
  const [showDangerBuffers, setShowDangerBuffers] = useState(true);
  const [showSafeBuffers, setShowSafeBuffers] = useState(true);

  // Selection & Focus
  const [selectedHabitation, setSelectedHabitation] = useState<Habitation | null>(null);
  const [selectedSite, setSelectedSite] = useState<RelocationSite | null>(null);
  const [centerTarget, setCenterTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    const loadMapData = async () => {
      setLoading(true);
      try {
        const [habRes, siteRes] = await Promise.all([
          habitationService.getAll({ limit: 500 }),
          relocationService.getSites()
        ]);
        setHabitations(habRes);
        setRelocationSites(siteRes);
      } catch (err) {
        console.error("Failed to load GIS map layers:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMapData();
  }, []);

  const getRiskColor = (cat?: string) => {
    switch (cat) {
      case 'Critical': return '#EF4444'; // Red
      case 'High': return '#F97316';     // Orange
      case 'Moderate': return '#F59E0B'; // Yellow
      default: return '#10B981';         // Green
    }
  };

  const filteredHabitations = useMemo(() => {
    return habitations.filter((hab) => {
      const matchesSearch =
        hab.name.toLowerCase().includes(search.toLowerCase()) ||
        hab.habitation_code.toLowerCase().includes(search.toLowerCase());
      const matchesDistrict = selectedDistrict === 'All' || hab.district === selectedDistrict;
      const matchesRisk = selectedRiskCategory === 'All' || hab.risk?.risk_category === selectedRiskCategory;
      return matchesSearch && matchesDistrict && matchesRisk;
    });
  }, [habitations, search, selectedDistrict, selectedRiskCategory]);

  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const lower = search.toLowerCase();
    const habMatches = habitations
      .filter((h) => h.name.toLowerCase().includes(lower) || h.habitation_code.toLowerCase().includes(lower))
      .slice(0, 5)
      .map((h) => ({ type: 'habitation' as const, item: h }));

    const siteMatches = relocationSites
      .filter((s) => s.name.toLowerCase().includes(lower) || s.site_code.toLowerCase().includes(lower))
      .slice(0, 3)
      .map((s) => ({ type: 'site' as const, item: s }));

    return [...habMatches, ...siteMatches];
  }, [search, habitations, relocationSites]);

  // Compute relocation vectors (Critical red-zone habitations -> nearest relocation site)
  const relocationVectors = useMemo(() => {
    if (!showRelocationVectors || relocationSites.length === 0) return [];
    return filteredHabitations
      .filter((h) => h.risk?.risk_category === 'Critical')
      .map((hab) => {
        let minDistance = Infinity;
        let closestSite: RelocationSite | null = null;

        relocationSites.forEach((site) => {
          const dist = calculateDistanceKm(hab.latitude, hab.longitude, site.latitude, site.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closestSite = site;
          }
        });

        return {
          habitation: hab,
          targetSite: closestSite,
          distanceKm: minDistance
        };
      })
      .filter((v) => v.targetSite !== null);
  }, [filteredHabitations, relocationSites, showRelocationVectors]);

  const districts = ['All', ...Array.from(new Set(habitations.map((h) => h.district)))];

  // Tile Layer URLs
  const getTileUrl = () => {
    switch (mapStyle) {
      case 'dark':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileAttribution = () => {
    switch (mapStyle) {
      case 'dark':
        return 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
      case 'satellite':
        return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'topo':
        return 'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap (CC-BY-SA)';
      default:
        return '&copy; OpenStreetMap contributors';
    }
  };

  const stats = useMemo(() => {
    const critical = filteredHabitations.filter((h) => h.risk?.risk_category === 'Critical').length;
    const high = filteredHabitations.filter((h) => h.risk?.risk_category === 'High').length;
    const totalPop = filteredHabitations.reduce((acc, h) => acc + (h.population || 0), 0);
    return { critical, high, totalPop };
  }, [filteredHabitations]);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      {/* Top Header Summary Stats Counter */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-3 rounded-xl bg-slate-900/90 p-2.5 px-4 backdrop-blur-md border border-slate-800 shadow-2xl text-xs">
        <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-slate-400">Critical Red-Zones:</span>
          <span className="font-bold text-red-400 text-sm">{stats.critical}</span>
        </div>
        <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
          <span className="text-slate-400">High Risk Zones:</span>
          <span className="font-bold text-orange-400 text-sm">{stats.high}</span>
        </div>
        <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
          <span className="text-slate-400">Candidate Target Sites:</span>
          <span className="font-bold text-blue-400 text-sm">{relocationSites.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span className="text-slate-400">Visible Habitations:</span>
          <span className="font-bold text-slate-100">{filteredHabitations.length}</span>
        </div>
      </div>

      {/* GIS Control Overlay Panel (Left Drawer) */}
      <div className="absolute left-4 top-4 z-20 w-84 rounded-xl bg-slate-900/95 p-4 backdrop-blur-md border border-slate-800 shadow-2xl space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Compass className="h-4 w-4 text-blue-400" />
            <span>Interactive GIS Map Controls</span>
          </h3>
          <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-400 border border-blue-800">
            v2.4 GIS
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Search Box with Autocomplete Dropdown */}
          <div className="relative">
            <label className="mb-1 block font-semibold text-slate-300">Search Habitation / Site</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search village name or code..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950/90 py-1.5 pl-8 pr-3 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Suggestions Dropdown */}
            {searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-2xl space-y-0.5">
                {searchSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (s.type === 'habitation') {
                        const hab = s.item as Habitation;
                        setSelectedHabitation(hab);
                        setSelectedSite(null);
                        setCenterTarget([hab.latitude, hab.longitude]);
                      } else {
                        const site = s.item as RelocationSite;
                        setSelectedSite(site);
                        setSelectedHabitation(null);
                        setCenterTarget([site.latitude, site.longitude]);
                      }
                      setSearch('');
                    }}
                    className="flex w-full items-center justify-between rounded p-2 text-left hover:bg-slate-800 text-xs"
                  >
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{s.item.name}</p>
                      <p className="text-[10px] text-slate-400">{s.item.district} District</p>
                    </div>
                    {s.type === 'habitation' ? (
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ backgroundColor: getRiskColor((s.item as Habitation).risk?.risk_category) }}
                      >
                        {(s.item as Habitation).risk?.risk_category || 'Low'}
                      </span>
                    ) : (
                      <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Target Site
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Base Tile Style Selector */}
          <div>
            <label className="mb-1 block font-semibold text-slate-300">Base Map Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'dark', label: 'Dark GIS' },
                { id: 'osm', label: 'Street Map' },
                { id: 'satellite', label: 'Satellite' },
                { id: 'topo', label: 'Topography' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setMapStyle(style.id as any)}
                  className={`rounded-lg py-1.5 px-2 text-[11px] font-medium border transition-colors ${
                    mapStyle === style.id
                      ? 'bg-blue-600 text-white border-blue-500 font-bold shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* District & Risk Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block font-semibold text-slate-300">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-300">Risk Tier</label>
              <select
                value={selectedRiskCategory}
                onChange={(e) => setSelectedRiskCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Tiers</option>
                <option value="Critical">Red-Zone</option>
                <option value="High">Orange-Zone</option>
                <option value="Moderate">Yellow-Zone</option>
                <option value="Low">Green-Zone</option>
              </select>
            </div>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Spatial Layer Toggles</p>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showRelocationSites}
                onChange={(e) => setShowRelocationSites(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Candidate Relocation Sites</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showRelocationVectors}
                onChange={(e) => setShowRelocationVectors(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Evacuation Target Vectors</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showDangerBuffers}
                onChange={(e) => setShowDangerBuffers(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Critical Hazard Danger Buffers (2km)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showSafeBuffers}
                onChange={(e) => setShowSafeBuffers(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Target Site Safe Capacity Zones (5km)</span>
            </label>
          </div>
        </div>

        {/* Map Risk Legend */}
        <div className="border-t border-slate-800 pt-3">
          <p className="mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Map Symbology Legend</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500 border border-red-300"></span>
              <span className="text-slate-300 font-medium">Critical (75-100)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-orange-500 border border-orange-300"></span>
              <span className="text-slate-300 font-medium">High (50-74)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500 border border-amber-300"></span>
              <span className="text-slate-300 font-medium">Moderate (25-49)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 border border-emerald-300"></span>
              <span className="text-slate-300 font-medium">Low (0-24)</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="h-3 w-3 rounded-full bg-blue-600 border border-blue-300"></span>
              <span className="text-slate-300 font-medium">Candidate Relocation Target Site</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="h-4 border-b-2 border-dashed border-red-400 w-4"></span>
              <span className="text-slate-300 font-medium">Evacuation Allocation Vector</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Fullscreen Leaflet Canvas */}
      <div className="h-full w-full">
        <MapContainer
          center={[30.3753, 79.3312]}
          zoom={9}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          {/* Active Map Tile Layer */}
          <TileLayer
            url={getTileUrl()}
            attribution={getTileAttribution()}
          />

          {/* Programmatic map camera controller */}
          <MapController centerTarget={centerTarget} habitations={filteredHabitations} />

          {/* Render 2km Red Danger Buffers around Critical Habitations */}
          {showDangerBuffers &&
            filteredHabitations
              .filter((h) => h.risk?.risk_category === 'Critical')
              .map((hab) => (
                <Circle
                  key={`danger-buf-${hab.id}`}
                  center={[hab.latitude, hab.longitude]}
                  radius={2000} // 2km radius
                  pathOptions={{
                    color: '#EF4444',
                    fillColor: '#EF4444',
                    fillOpacity: 0.12,
                    weight: 1.5,
                    dashArray: '4, 4'
                  }}
                />
              ))}

          {/* Render 5km Safe Target Site Buffer Zones */}
          {showRelocationSites &&
            showSafeBuffers &&
            relocationSites.map((site) => (
              <Circle
                key={`safe-buf-${site.id}`}
                center={[site.latitude, site.longitude]}
                radius={5000} // 5km radius
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '6, 6'
                }}
              />
            ))}

          {/* Render Dashed Polyline Allocation Vectors from Red Zones to Nearest Candidate Site */}
          {relocationVectors.map((vec, idx) => (
            <React.Fragment key={`vec-${idx}`}>
              <Polyline
                positions={[
                  [vec.habitation.latitude, vec.habitation.longitude],
                  [vec.targetSite!.latitude, vec.targetSite!.longitude]
                ]}
                pathOptions={{
                  color: '#F87171',
                  weight: 2,
                  dashArray: '6, 8',
                  opacity: 0.85
                }}
              >
                <Tooltip sticky permanent={false}>
                  <span className="text-[10px] font-bold text-slate-100">
                    Evacuation Route: {vec.distanceKm} km to {vec.targetSite!.name}
                  </span>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          ))}

          {/* Render Habitation Circle Markers */}
          {filteredHabitations.map((hab) => {
            const riskCat = hab.risk?.risk_category || 'Low';
            const riskScore = hab.risk?.overall_risk_score || 0;
            const isCritical = riskCat === 'Critical';

            return (
              <CircleMarker
                key={hab.id}
                center={[hab.latitude, hab.longitude]}
                radius={isCritical ? 11 : 8}
                eventHandlers={{
                  click: () => {
                    setSelectedHabitation(hab);
                    setSelectedSite(null);
                  }
                }}
                pathOptions={{
                  fillColor: getRiskColor(riskCat),
                  color: isCritical ? '#FFFFFF' : '#0F172A',
                  weight: isCritical ? 2.5 : 1.5,
                  fillOpacity: 0.95
                }}
              >
                <Popup>
                  <div className="p-1 text-xs min-w-[220px]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-white text-sm truncate">{hab.name}</p>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ backgroundColor: getRiskColor(riskCat) }}
                      >
                        {riskCat}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{hab.habitation_code} | {hab.district} District</p>

                    <div className="mt-2 border-t border-slate-700/80 pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Overall Risk Score:</span>
                        <span className="font-bold" style={{ color: getRiskColor(riskCat) }}>
                          {riskScore} / 100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Population:</span>
                        <span className="font-bold text-slate-200">{hab.population}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Safe Capacity Limit:</span>
                        <span className="font-bold text-slate-200">{hab.capacity?.safe_estimated_capacity || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Relocation Priority:</span>
                        <span className="font-bold text-amber-400">{hab.priority?.priority_score || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedHabitation(hab);
                          setSelectedSite(null);
                        }}
                        className="flex items-center justify-center gap-1 rounded bg-blue-600 py-1.5 text-[10px] font-bold text-white hover:bg-blue-500 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect Drawer</span>
                      </button>
                      <Link
                        to={`/habitations/${hab.id}`}
                        className="flex items-center justify-center gap-1 rounded bg-slate-800 py-1.5 text-[10px] font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                      >
                        <span>Full Dossier</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Render Relocation Candidate Target Sites Markers */}
          {showRelocationSites &&
            relocationSites.map((site) => (
              <CircleMarker
                key={site.id}
                center={[site.latitude, site.longitude]}
                radius={10}
                eventHandlers={{
                  click: () => {
                    setSelectedSite(site);
                    setSelectedHabitation(null);
                  }
                }}
                pathOptions={{
                  fillColor: '#2563EB',
                  color: '#93C5FD',
                  weight: 2.5,
                  fillOpacity: 0.95
                }}
              >
                <Popup>
                  <div className="p-1 text-xs min-w-[220px]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-blue-400 text-sm truncate">{site.name}</p>
                      <span className="rounded bg-blue-950 border border-blue-800 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">
                        Target Site
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px]">Code: {site.site_code} | {site.district}</p>

                    <div className="mt-2 border-t border-slate-700/80 pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Available Safe Land:</span>
                        <span className="font-bold text-slate-200">{site.available_land_sq_km} sq km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Capacity:</span>
                        <span className="font-bold text-emerald-400">{site.target_population_capacity.toLocaleString()} persons</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Water Availability Index:</span>
                        <span className="font-bold text-slate-200">{site.water_availability_index} / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Road Transit Index:</span>
                        <span className="font-bold text-slate-200">{site.road_connectivity_index} / 100</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSite(site);
                        setSelectedHabitation(null);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-blue-600 py-1.5 text-[10px] font-bold text-white hover:bg-blue-500 transition-colors"
                    >
                      <MapPin className="h-3 w-3" />
                      <span>View Target Site Specification</span>
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>

      {/* Selected Habitation Analytical Quick Drawer (Right Panel) */}
      {selectedHabitation && (
        <div className="absolute right-4 top-4 z-20 w-96 rounded-xl bg-slate-900/95 p-5 backdrop-blur-md border border-slate-800 shadow-2xl space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Habitation Analytical Profile</span>
              <h3 className="text-base font-bold text-white">{selectedHabitation.name}</h3>
            </div>
            <button
              onClick={() => setSelectedHabitation(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">District / State</span>
              <span className="font-bold text-white">{selectedHabitation.district}, {selectedHabitation.state}</span>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Population / HH</span>
              <span className="font-bold text-white">{selectedHabitation.population} / {selectedHabitation.households}</span>
            </div>
          </div>

          {/* Composite Risk Score Hero Badge */}
          <div
            className="rounded-xl p-4 border text-center relative overflow-hidden"
            style={{
              borderColor: getRiskColor(selectedHabitation.risk?.risk_category),
              backgroundColor: `${getRiskColor(selectedHabitation.risk?.risk_category)}15`
            }}
          >
            <span className="text-xs font-semibold text-slate-300 block">Composite Disaster Risk Score</span>
            <span className="text-3xl font-black tracking-tight" style={{ color: getRiskColor(selectedHabitation.risk?.risk_category) }}>
              {selectedHabitation.risk?.overall_risk_score} <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </span>
            <span className="block mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: getRiskColor(selectedHabitation.risk?.risk_category) }}>
              {selectedHabitation.risk?.risk_category} Risk Zone
            </span>
          </div>

          {/* Analytical Sub-Scores Breakdown */}
          <div className="space-y-2 text-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sub-Score Metrics</p>

            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Hazard Sub-Score:</span>
              <span className="font-bold text-white">{selectedHabitation.hazard?.composite_hazard_score || 0} / 100</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Vulnerability Sub-Score:</span>
              <span className="font-bold text-white">{selectedHabitation.vulnerability?.composite_vulnerability_score || 0} / 100</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Carrying Capacity Pressure:</span>
              <span className="font-bold text-white">{selectedHabitation.capacity?.capacity_pressure_score || 0} / 100</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Relocation Priority (RPS):</span>
              <span className="font-bold text-amber-400">{selectedHabitation.priority?.priority_score || 'N/A'}</span>
            </div>
          </div>

          {/* Allocation Vector Rationale */}
          {selectedHabitation.risk?.risk_category === 'Critical' && (
            <div className="rounded-lg bg-red-950/40 p-3 border border-red-900/60 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <ShieldAlert className="h-4 w-4" />
                <span>Urgent Authority Action Required</span>
              </div>
              <p className="text-[11px] text-red-200">
                Habitation exceeds environmental carrying capacity thresholds. Recommended immediate field assessment for relocation.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Link
              to={`/habitations/${selectedHabitation.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-colors"
            >
              <span>View Detailed Dossier & PDF Report</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Selected Relocation Site Drawer (Right Panel) */}
      {selectedSite && (
        <div className="absolute right-4 top-4 z-20 w-96 rounded-xl bg-slate-900/95 p-5 backdrop-blur-md border border-slate-800 shadow-2xl space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Relocation Target Site Spec</span>
              <h3 className="text-base font-bold text-white">{selectedSite.name}</h3>
            </div>
            <button
              onClick={() => setSelectedSite(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl bg-blue-950/40 p-4 border border-blue-800 text-center space-y-1">
            <span className="text-xs font-semibold text-blue-300 block">Available Safe Land Area</span>
            <span className="text-3xl font-black text-blue-400">{selectedSite.available_land_sq_km} sq km</span>
            <span className="block text-xs font-medium text-slate-300">
              Safe Target Capacity: <strong className="text-emerald-400">{selectedSite.target_population_capacity.toLocaleString()} persons</strong>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Water Availability Index:</span>
              <span className="font-bold text-white">{selectedSite.water_availability_index} / 100</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Road Transit Index:</span>
              <span className="font-bold text-white">{selectedSite.road_connectivity_index} / 100</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Environmental Suitability:</span>
              <span className="font-bold text-emerald-400">{selectedSite.environmental_suitability_index} / 100</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Distance to Hazard Zone:</span>
              <span className="font-bold text-white font-mono">{(selectedSite.distance_from_hazard_zone_m / 1000).toFixed(1)} km</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/relocation"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-colors"
            >
              <span>Manage Candidate Relocation Sites</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
