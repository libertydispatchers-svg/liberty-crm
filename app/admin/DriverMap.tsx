'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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
  'Metro': [39.2904, -76.6122, 25000], // Huge radius for full metro
};

const defaultPosition: [number, number] = [39.2904, -76.6122];

export default function DriverMap({ activeDrivers }: { activeDrivers: any[] }) {
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [isExpanded, setIsExpanded] = useState(false);

  // Derive unique options from data
  const areas = ['All', ...Array.from(new Set(activeDrivers.map(d => {
    const docs = d.documents?.find((doc: any) => doc.name === 'Onboarding Material');
    const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
    return esignData.coverageArea || 'Not specified';
  })))];

  const vehicles = ['All', ...Array.from(new Set(activeDrivers.map(d => {
    const docs = d.documents?.find((doc: any) => doc.name === 'Onboarding Material');
    const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
    return esignData.vehicleType || 'Unknown';
  })))];

  const filteredDrivers = activeDrivers.filter(driver => {
    const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
    const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
    const coverage = esignData.coverageArea || 'Not specified';
    const vehicle = esignData.vehicleType || 'Unknown';

    if (areaFilter !== 'All' && coverage !== areaFilter) return false;
    if (vehicleFilter !== 'All' && vehicle !== vehicleFilter) return false;
    return true;
  });

  return (
    <div style={{ 
      ...(isExpanded ? {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#0f172a'
      } : {
        height: '100%', width: '100%', minHeight: '600px'
      }),
      display: 'flex', border: isExpanded ? 'none' : '1px solid var(--border-color)', borderRadius: isExpanded ? '0' : '8px', overflow: 'hidden' 
    }}>
      
      {/* Sidebar for driver list */}
      <div style={{ width: '300px', background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', zIndex: 1000, flexShrink: 0 }}>
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Driver Coverage Overview</h3>
          <p style={{ margin: '4px 0 12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overview of applicant regions</p>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ 
              marginBottom: '12px', 
              padding: '6px', 
              fontSize: '0.8rem', 
              background: 'var(--accent-color)', 
              border: 'none', 
              color: 'white', 
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {isExpanded ? 'Collapse Map' : 'Expand Fullscreen'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select 
              value={areaFilter} 
              onChange={e => setAreaFilter(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--control-border)', fontSize: '0.8rem' }}
            >
              {areas.map(a => <option key={a} value={a}>{a === 'All' ? 'All Areas' : a}</option>)}
            </select>
            <select 
              value={vehicleFilter} 
              onChange={e => setVehicleFilter(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--control-border)', fontSize: '0.8rem' }}
            >
              {vehicles.map(v => <option key={v} value={v}>{v === 'All' ? 'All Vehicles' : v}</option>)}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {filteredDrivers.map(driver => {
            const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
            const coverage = esignData.coverageArea || 'Not specified';
            
            return (
              <div key={driver.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {driver.name.charAt(0)}
                  </div>
                  <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{driver.name}</strong>
                </div>
                <div style={{ paddingLeft: '32px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <strong>Area:</strong> {coverage}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Vehicle: {esignData.vehicleType || 'Unknown'}
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
          center={defaultPosition} 
          zoom={10} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          />
          
          {filteredDrivers.map((driver, i) => {
            const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
            const coverage = esignData.coverageArea || 'Not specified';

            // Get exact coordinates or default to Baltimore with scatter
            let lat = defaultPosition[0] + (Math.sin(i * 1.5) * 0.05);
            let lng = defaultPosition[1] + (Math.cos(i * 1.5) * 0.05);
            let radius = 2000; // default 2km

            if (REGION_MAP[coverage]) {
              const [rLat, rLng, rRadius] = REGION_MAP[coverage];
              // Add slight scatter to prevent stacking on the exact same coordinate
              lat = rLat + (Math.sin(i * 10) * 0.01);
              lng = rLng + (Math.cos(i * 10) * 0.01);
              radius = rRadius;
            }

            return (
              <div key={driver.id}>
                <Marker 
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => {
                      setSelectedDriver({ ...driver, lat, lng, coverage });
                    },
                  }}
                >
                  <Popup>
                    <div style={{ color: '#000', padding: '4px' }}>
                      <strong style={{ display: 'block', marginBottom: '4px', fontSize: '1.1em' }}>{driver.name}</strong>
                      <span style={{ fontSize: '0.9rem', display: 'block' }}>Area: {coverage}</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>Vehicle: {esignData.vehicleType || 'Unknown'}</span>
                    </div>
                  </Popup>
                </Marker>
                
                <Circle 
                  center={[lat, lng]} 
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} 
                  radius={radius} 
                />
              </div>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
