import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import { relocationService } from '../services/api';
import { RelocationSite } from '../types';
import { MapPin, Plus, ShieldCheck, Compass, Layers, Navigation, ArrowUpRight, LayoutGrid, Map as MapIcon, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet Default Marker Icon Patch
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Relocation Map Controller for programmatic flyTo and fitBounds
const RelocationMapController: React.FC<{
  selectedSite: RelocationSite | null;
  sites: RelocationSite[];
}> = ({ selectedSite, sites }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedSite && selectedSite.latitude && selectedSite.longitude) {
      map.flyTo([selectedSite.latitude, selectedSite.longitude], 12, { duration: 1.5 });
    }
  }, [selectedSite, map]);

  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      const valid = sites.filter((s) => s.latitude && s.longitude);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((s) => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
      }
    }
  }, [sites, map]);

  return null;
};

export const RelocationPage: React.FC = () => {
  const [sites, setSites] = useState<RelocationSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<RelocationSite | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'grid'>('split');
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'topo' | 'dark'>('osm');
  const { hasRole } = useAuth();

  const [formData, setFormData] = useState({
    site_code: '',
    name: '',
    district: 'Chamoli',
    latitude: 30.3,
    longitude: 79.2,
    available_land_sq_km: 5.0,
    target_population_capacity: 5000,
    water_availability_index: 85.0,
    road_connectivity_index: 80.0,
    distance_from_hazard_zone_m: 10000.0,
    environmental_suitability_index: 85.0
  });

  const fetchSites = async () => {
    setLoading(true);
    try {
      const data = await relocationService.getSites();
      // Ensure sensible coordinates for demo sites if needed
      const sanitized = data.map((site) => {
        let lat = site.latitude;
        let lng = site.longitude;
        if (!lat || !lng || (lat === 0 && lng === 0)) {
          if (site.name.includes('Gauchar')) { lat = 30.2831; lng = 79.1558; }
          else if (site.name.includes('Karnaprayag')) { lat = 30.2612; lng = 79.2198; }
          else if (site.name.includes('Pipalkoti')) { lat = 30.4312; lng = 79.4310; }
          else { lat = 30.3300; lng = 79.2500; }
        }
        return { ...site, latitude: lat, longitude: lng };
      });
      setSites(sanitized);
      if (sanitized.length > 0 && !selectedSite) {
        setSelectedSite(sanitized[0]);
      }
    } catch (err) {
      console.error("Failed to load relocation sites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await relocationService.createSite(formData);
      setShowModal(false);
      fetchSites();
    } catch (err) {
      alert("Failed to create relocation site.");
    }
  };

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

  const totalCapacity = useMemo(() => {
    return sites.reduce((sum, s) => sum + (s.target_population_capacity || 0), 0);
  }, [sites]);

  const totalLand = useMemo(() => {
    return sites.reduce((sum, s) => sum + (s.available_land_sq_km || 0), 0);
  }, [sites]);

  return (
    <div className="space-y-6 p-6">
      {/* Page Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Relocation Candidate Target Sites</h2>
            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
              Interactive GIS Map Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage safe candidate relocation zones, available land, spatial carrying capacity, and GIS map locations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle Controls */}
          <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold transition-all ${
                viewMode === 'split' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold transition-all ${
                viewMode === 'map' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold transition-all ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards Only</span>
            </button>
          </div>

          {hasRole(['ADMIN', 'ANALYST']) && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Candidate Target Site</span>
            </button>
          )}
        </div>
      </div>

      {/* Relocation Summary Telemetry Banner */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="glass-card p-3.5 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered Sites</span>
            <p className="text-xl font-black text-white">{sites.length} Candidate Zones</p>
          </div>
          <Compass className="h-6 w-6 text-blue-400" />
        </div>
        <div className="glass-card p-3.5 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Carrying Capacity</span>
            <p className="text-xl font-black text-emerald-400">{totalCapacity.toLocaleString()} Persons</p>
          </div>
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="glass-card p-3.5 border-l-4 border-l-cyan-500 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Safe Land</span>
            <p className="text-xl font-black text-cyan-400">{totalLand.toFixed(1)} sq km</p>
          </div>
          <MapPin className="h-6 w-6 text-cyan-400" />
        </div>
        <div className="glass-card p-3.5 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Map Mode</span>
            <p className="text-xl font-black text-purple-300 capitalize">{mapStyle} Layer</p>
          </div>
          <Layers className="h-6 w-6 text-purple-400" />
        </div>
      </div>

      {/* Main Relocation Content Container (Split View / Map Only / Grid Only) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Interactive Relocation GIS Map Container */}
        {viewMode !== 'grid' && (
          <div
            className={`glass-panel overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 ${
              viewMode === 'map' ? 'lg:col-span-12 h-[calc(100vh-16rem)]' : 'lg:col-span-7 h-[580px]'
            }`}
          >
            {/* Map Top Control Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Relocation Candidate GIS Map Location Viewer</span>
                {selectedSite && (
                  <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-800 truncate">
                    Focused: {selectedSite.name}
                  </span>
                )}
              </div>

              {/* Map Tile Style Switcher */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'osm', label: 'White Map' },
                  { id: 'satellite', label: 'Satellite' },
                  { id: 'topo', label: 'Topo' },
                  { id: 'dark', label: 'Dark GIS' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setMapStyle(st.id as any)}
                    className={`rounded px-2 py-1 text-[10px] font-bold border transition-colors ${
                      mapStyle === st.id
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="relative h-[calc(100%-42px)] w-full">
              <MapContainer
                center={[30.33, 79.25]}
                zoom={10}
                scrollWheelZoom={true}
                className="h-full w-full bg-slate-950"
              >
                <TileLayer url={getTileUrl()} />
                <RelocationMapController selectedSite={selectedSite} sites={sites} />

                {/* Render 5km Safe Zone Buffer Circles */}
                {sites.map((site) => (
                  <Circle
                    key={`buffer-${site.id}`}
                    center={[site.latitude, site.longitude]}
                    radius={5000} // 5km safe buffer
                    pathOptions={{
                      color: selectedSite?.id === site.id ? '#60A5FA' : '#3B82F6',
                      fillColor: '#3B82F6',
                      fillOpacity: selectedSite?.id === site.id ? 0.2 : 0.08,
                      weight: selectedSite?.id === site.id ? 2.5 : 1.5,
                      dashArray: '6, 6'
                    }}
                  />
                ))}

                {/* Render Relocation Target Site Markers */}
                {sites.map((site) => {
                  const isSelected = selectedSite?.id === site.id;
                  return (
                    <CircleMarker
                      key={site.id}
                      center={[site.latitude, site.longitude]}
                      radius={isSelected ? 14 : 10}
                      eventHandlers={{
                        click: () => setSelectedSite(site)
                      }}
                      pathOptions={{
                        fillColor: isSelected ? '#3B82F6' : '#2563EB',
                        color: isSelected ? '#FFFFFF' : '#93C5FD',
                        weight: isSelected ? 3 : 2,
                        fillOpacity: 0.95
                      }}
                    >
                      <Popup>
                        <div className="p-1 text-xs min-w-[220px]">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-blue-400 text-sm truncate">{site.name}</p>
                            <span className="rounded bg-blue-950 border border-blue-800 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                              {site.site_code}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[10px] mt-0.5">{site.district} District | GPS: {site.latitude.toFixed(4)}° N, {site.longitude.toFixed(4)}° E</p>

                          <div className="mt-2.5 border-t border-slate-700/80 pt-2 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Available Safe Land:</span>
                              <span className="font-bold text-white">{site.available_land_sq_km} sq km</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Target Carrying Capacity:</span>
                              <span className="font-bold text-emerald-400">{site.target_population_capacity.toLocaleString()} persons</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Water Index:</span>
                              <span className="font-bold text-white">{site.water_availability_index} / 100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Road Transit Index:</span>
                              <span className="font-bold text-white">{site.road_connectivity_index} / 100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Distance to Hazard Zone:</span>
                              <span className="font-bold text-cyan-400 font-mono">{(site.distance_from_hazard_zone_m / 1000).toFixed(1)} km</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedSite(site)}
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-blue-600 py-1.5 text-[10px] font-bold text-white hover:bg-blue-500 transition-colors"
                          >
                            <MapPin className="h-3 w-3" />
                            <span>Select & Highlight Site</span>
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* Candidate Target Sites List / Grid Cards */}
        {viewMode !== 'map' && (
          <div
            className={`space-y-4 ${
              viewMode === 'split'
                ? 'lg:col-span-5 h-[580px] overflow-y-auto pr-1'
                : 'lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 space-y-0'
            }`}
          >
            {sites.map((site) => {
              const isSelected = selectedSite?.id === site.id;
              return (
                <div
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  className={`glass-card p-5 border-l-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                    isSelected
                      ? 'border-l-blue-400 border-blue-500/50 bg-slate-900/95 shadow-2xl ring-1 ring-blue-500/30'
                      : 'border-l-blue-600/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-blue-400 font-semibold">{site.site_code}</span>
                        {isSelected && (
                          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-300 border border-blue-400/30">
                            Map Focused
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{site.name}</h3>
                      <span className="text-xs text-slate-400">{site.district} District</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSite(site);
                      }}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-blue-950/80 border-blue-800/80 text-blue-400 hover:bg-blue-900 hover:text-white'
                      }`}
                      title="View relocation site location on map"
                    >
                      <MapPin className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* GPS Coordinates Badge */}
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-950/90 px-2.5 py-1.5 text-[11px] font-mono text-slate-300 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">GPS Coordinates:</span>
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-cyan-400" />
                      {site.latitude.toFixed(4)}° N, {site.longitude.toFixed(4)}° E
                    </span>
                  </div>

                  {/* Parameter Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 mt-3 border-t border-slate-800">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Available Safe Land</span>
                      <span className="font-bold text-white">{site.available_land_sq_km} sq km</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Target Capacity</span>
                      <span className="font-bold text-emerald-400">{site.target_population_capacity.toLocaleString()} persons</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Water Availability</span>
                      <span className="font-bold text-white">{site.water_availability_index} / 100</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Road Connectivity</span>
                      <span className="font-bold text-white">{site.road_connectivity_index} / 100</span>
                    </div>
                  </div>

                  {/* Interactive Map Focus Action Bar */}
                  <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400">
                      Hazard Buffer Distance: <strong className="text-cyan-400 font-mono">{(site.distance_from_hazard_zone_m / 1000).toFixed(1)} km</strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSite(site);
                        if (viewMode === 'grid') setViewMode('split');
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>Fly to Map Location</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Candidate Relocation Site Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg p-6 border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Register New Candidate Relocation Target Site</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Code</label>
                  <input
                    type="text"
                    required
                    value={formData.site_code}
                    onChange={(e) => setFormData({ ...formData, site_code: e.target.value })}
                    placeholder="SITE_DELTA_04"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Chamoli High Terrace"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Available Safe Land (sq km)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.available_land_sq_km}
                    onChange={(e) => setFormData({ ...formData, available_land_sq_km: parseFloat(e.target.value) })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Capacity (Persons)</label>
                  <input
                    type="number"
                    value={formData.target_population_capacity}
                    onChange={(e) => setFormData({ ...formData, target_population_capacity: parseInt(e.target.value) })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                >
                  Save Candidate Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
