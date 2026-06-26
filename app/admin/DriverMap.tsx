'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from 'react-leaflet';
import { Maximize, Minimize, Circle as CircleIcon, Tag, Truck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js/Webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Region Coordinate Dictionary [lat, lng, radiusInMeters]
const REGION_MAP: Record<string, [number, number, number]> = {
  'Manhattan': [40.7831, -73.9712, 8000],
  'Downtown': [39.2904, -76.6122, 5000],
  'Northside': [39.3604, -76.6122, 6000],
  'Southside': [39.2304, -76.6122, 6000],
  'Eastside': [39.2904, -76.5422, 6000],
  'Westside': [39.2904, -76.6822, 6000],
  'Metro': [39.2904, -76.6122, 25000],
};

const defaultPosition: [number, number] = [40.7128, -74.0060]; // NYC center

// Colors for different drivers
const DRIVER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

function MapUpdater({ selectedDriver }: { selectedDriver: any }) {
  const map = useMap();
  useEffect(() => {
    if (selectedDriver && selectedDriver.lat && selectedDriver.lng) {
      map.flyTo([selectedDriver.lat, selectedDriver.lng], 12, { animate: true, duration: 1 });
    }
  }, [selectedDriver, map]);
  return null;
}

// Toggle button component
function ToggleButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        borderRadius: '6px',
        border: `1px solid ${active ? '#3b82f6' : 'var(--glass-border)'}`,
        background: active ? 'rgba(59,130,246,0.15)' : 'var(--control-bg)',
        color: active ? '#3b82f6' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.72rem',
        fontWeight: active ? 700 : 400,
        transition: 'all 0.2s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function DriverMap({ activeDrivers }: { activeDrivers: any[] }) {
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [isExpanded, setIsExpanded] = useState(false);

  // Overlay toggles
  const [showCircles, setShowCircles] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [showVehicles, setShowVehicles] = useState(false);

  const [geocodedLocations, setGeocodedLocations] = useState<Record<string, [number, number]>>({});

  // Derive unique options from data
  const areas = ['All', ...Array.from(new Set(activeDrivers.map(d => {
    const docs = d.documents?.find((doc: any) => doc.name === 'Onboarding Material');
    const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
    return esignData.coverageAddress || esignData.coverageArea || 'Not specified';
  })))];

  const vehicles = ['All', ...Array.from(new Set(activeDrivers.map(d => {
    const docs = d.documents?.find((doc: any) => doc.name === 'Onboarding Material');
    const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
    return esignData.vehicleType || 'Unknown';
  })))];

  const filteredDrivers = activeDrivers.filter(driver => {
    const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
    const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
    const coverage = esignData.coverageAddress || esignData.coverageArea || 'Not specified';
    const vehicle = esignData.vehicleType || 'Unknown';

    if (areaFilter !== 'All' && coverage !== areaFilter) return false;
    if (vehicleFilter !== 'All' && vehicle !== vehicleFilter) return false;
    return true;
  });

  useEffect(() => {
    const geocode = async () => {
      const newLocs = { ...geocodedLocations };
      let changed = false;
      for (const d of filteredDrivers) {
        const docs = d.documents?.find((doc: any) => doc.name === 'Onboarding Material');
        const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
        const rawAddress = esignData.coverageAddress || esignData.coverageArea;
        if (!rawAddress || newLocs[rawAddress] || REGION_MAP[rawAddress]) continue;

        try {
          // Detect if it's a zip code (5 digits) and append USA for precision
          const isZip = /^\d{5}(-\d{4})?$/.test(rawAddress.trim());
          const cleanQuery = rawAddress.trim().toLowerCase();
          const query = isZip
            ? `${rawAddress.trim()}`
            : cleanQuery.endsWith('usa') || cleanQuery.endsWith('us')
              ? rawAddress.trim()
              : `${rawAddress.trim()}, USA`;

          // countrycodes=us forces results to the United States only
          // viewbox biases toward NYC/East Coast (most drivers) — bounded=0 allows fallback outside box
          const nycViewbox = '-74.26,40.49,-73.70,40.92'; // NYC bounding box
          const url = isZip 
            ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query)}&countrycodes=us&format=json&limit=1`
            : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&countrycodes=us&viewbox=${nycViewbox}&bounded=0&addressdetails=1`;
          const res = await fetch(url, { headers: { 'Accept-Language': 'en-US' } });
          const data = await res.json();

          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            // Sanity check: must be within rough continental US / territories bounding box
            if (lat >= 17 && lat <= 72 && lon >= -180 && lon <= -65) {
              newLocs[rawAddress] = [lat, lon];
            } else {
              // Result outside US bounds — try fallback query without the address detail
              console.warn(`Geocode result for "${rawAddress}" was outside US bounds (${lat}, ${lon}). Trying fallback.`);
              newLocs[rawAddress] = [40.7128, -74.0060]; // Default to NYC
            }
          } else {
            // No result — default to geographic center of US
            newLocs[rawAddress] = [39.8283, -98.5795];
          }
          changed = true;
        } catch(e) {
          console.error('Geocode error', e);
        }
      }
      if (changed) setGeocodedLocations(newLocs);
    };
    geocode();
  }, [filteredDrivers]);


  return (
    <div style={{ 
      ...(isExpanded ? {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'var(--bg-color)'
      } : {
        height: '100%', width: '100%', minHeight: '600px'
      }),
      display: 'flex', border: isExpanded ? 'none' : '1px solid var(--border-color)', borderRadius: isExpanded ? '0' : '8px', overflow: 'hidden' 
    }}>
      
      {/* Sidebar */}
      <div style={{ width: '280px', background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', zIndex: 1000, flexShrink: 0 }}>
        <div style={{ padding: '14px', background: 'var(--glass-bg)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Driver Coverage Overview</h3>
          <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Applicant coverage regions</p>
          
          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            <select 
              value={areaFilter} 
              onChange={e => setAreaFilter(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', background: 'var(--control-bg)', color: 'var(--text-primary)', border: '1px solid var(--control-border)', fontSize: '0.78rem' }}
            >
              {areas.map(a => <option key={a} value={a}>{a === 'All' ? 'All Areas' : a}</option>)}
            </select>
            <select 
              value={vehicleFilter} 
              onChange={e => setVehicleFilter(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', background: 'var(--control-bg)', color: 'var(--text-primary)', border: '1px solid var(--control-border)', fontSize: '0.78rem' }}
            >
              {vehicles.map(v => <option key={v} value={v}>{v === 'All' ? 'All Vehicles' : v}</option>)}
            </select>
          </div>

          {/* Map Overlay Toggles */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '8px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Map Overlays</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              <ToggleButton
                active={showCircles}
                onClick={() => setShowCircles(v => !v)}
                icon={<CircleIcon size={11} />}
                label="Radius"
              />
              <ToggleButton
                active={showNames}
                onClick={() => setShowNames(v => !v)}
                icon={<Tag size={11} />}
                label="Names"
              />
              <ToggleButton
                active={showVehicles}
                onClick={() => setShowVehicles(v => !v)}
                icon={<Truck size={11} />}
                label="Vehicle"
              />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {filteredDrivers.map((driver, i) => {
            const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
            const coverage = esignData.coverageAddress || esignData.coverageArea || 'Not specified';
            const radius = esignData.coverageRadius ? `${esignData.coverageRadius} mi` : '';
            const color = DRIVER_COLORS[i % DRIVER_COLORS.length];
            
            return (
              <div 
                key={driver.id} 
                onClick={() => {
                  const lat = driver.lat || defaultPosition[0];
                  const lng = driver.lng || defaultPosition[1];
                  setSelectedDriver({ ...driver, lat, lng });
                }}
                style={{ 
                  padding: '10px', 
                  background: selectedDriver?.id === driver.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--control-bg)', 
                  borderRadius: '8px', 
                  marginBottom: '6px', 
                  border: selectedDriver?.id === driver.id ? '1px solid #3b82f6' : '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold', flexShrink: 0 }}>
                    {driver.name.charAt(0)}
                  </div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{driver.name}</strong>
                </div>
                <div style={{ paddingLeft: '27px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <strong>Area:</strong> {coverage} {radius && `(${radius})`}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    🚗 {esignData.vehicleType || 'Unknown'}
                  </p>
                </div>
              </div>
            );
          })}
          {filteredDrivers.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No drivers match filters.</p>
          )}
        </div>
      </div>

      {/* The actual Map */}
      <div style={{ flex: 1, position: 'relative', minHeight: '100%' }}>
        <MapContainer 
          center={[40.7128, -74.0060]} 
          zoom={11} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          />
          <MapUpdater selectedDriver={selectedDriver} />
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 1000,
              background: '#fff',
              border: '2px solid rgba(0,0,0,0.2)',
              borderRadius: '4px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#333',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
            title={isExpanded ? "Collapse Map" : "Expand Fullscreen"}
          >
            {isExpanded ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          
          {filteredDrivers.map((driver, i) => {
            const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
            const coverage = esignData.coverageAddress || esignData.coverageArea || 'Not specified';
            const radiusStr = esignData.coverageRadius || '25';
            const color = DRIVER_COLORS[i % DRIVER_COLORS.length];

            let lat = defaultPosition[0] + (Math.sin(i * 1.5) * 0.05);
            let lng = defaultPosition[1] + (Math.cos(i * 1.5) * 0.05);
            
            let radius = 2000;
            if (radiusStr === 'Anywhere') {
              radius = 500000;
            } else {
              radius = parseInt(radiusStr) * 1609.34;
            }

            if (geocodedLocations[coverage]) {
              lat = geocodedLocations[coverage][0] + (Math.sin(i * 10) * 0.01);
              lng = geocodedLocations[coverage][1] + (Math.cos(i * 10) * 0.01);
            } else if (REGION_MAP[coverage]) {
              const [rLat, rLng, rRadius] = REGION_MAP[coverage];
              lat = rLat + (Math.sin(i * 10) * 0.01);
              lng = rLng + (Math.cos(i * 10) * 0.01);
              if (!esignData.coverageRadius) radius = rRadius;
            }

            driver.lat = lat;
            driver.lng = lng;

            // Build tooltip content based on toggle state
            const tooltipParts = [];
            if (showNames) tooltipParts.push(driver.name);
            if (showVehicles) tooltipParts.push(`🚗 ${esignData.vehicleType || 'Unknown'}`);
            const tooltipContent = tooltipParts.join(' · ');

            return (
              <div key={driver.id}>
                <Marker 
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => setSelectedDriver({ ...driver, lat, lng, coverage }),
                  }}
                >
                  <Popup>
                    <div style={{ color: '#000', padding: '4px', minWidth: '140px' }}>
                      <strong style={{ display: 'block', marginBottom: '4px', fontSize: '1em' }}>{driver.name}</strong>
                      <span style={{ fontSize: '0.85rem', display: 'block' }}>📍 {coverage} {radiusStr !== 'Anywhere' && `(${radiusStr} mi)`}</span>
                      <span style={{ fontSize: '0.85rem', color: '#444', display: 'block' }}>🚗 {esignData.vehicleType || 'Unknown'}</span>
                      <span style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginTop: '3px' }}>📞 {driver.phone}</span>
                    </div>
                  </Popup>

                  {/* Persistent label tooltip */}
                  {(showNames || showVehicles) && tooltipContent && (
                    <Tooltip permanent direction="top" offset={[0, -30]} opacity={0.92}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {tooltipContent}
                      </span>
                    </Tooltip>
                  )}
                </Marker>
                
                {showCircles && (
                  <Circle 
                    center={[lat, lng]} 
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.08, weight: 1.5 }} 
                    radius={radius} 
                  />
                )}
              </div>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
