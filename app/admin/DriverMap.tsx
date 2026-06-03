'use client';
import { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Center roughly on Baltimore since that's where the app is based
const defaultPosition = {
  lat: 39.2904,
  lng: -76.6122
};

// Custom dark theme for the Google Map
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

export default function DriverMap({ activeDrivers }: { activeDrivers: any[] }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');

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
    <div style={{ height: '600px', width: '100%', display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* Sidebar for driver list */}
      <div style={{ width: '300px', background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Active Drivers Coverage</h3>
          <p style={{ margin: '4px 0 12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overview of driver regions</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select 
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              style={{ padding: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
            >
              {areas.map(a => <option key={a} value={a}>{a} Area</option>)}
            </select>
            
            <select 
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              style={{ padding: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
            >
              {vehicles.map(v => <option key={v} value={v}>{v} Vehicle</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
          {filteredDrivers.map((driver, idx) => {
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
      <div style={{ flex: 1, position: 'relative' }}>
        {loadError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f172a', padding: '20px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>Google Maps Failed to Load</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
              Please ensure your <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is correctly set in your Vercel Environment Variables and that the key has the correct permissions.
            </p>
          </div>
        ) : isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultPosition}
            zoom={11}
            options={{
              styles: darkMapStyle,
              disableDefaultUI: false,
            }}
          >
            {filteredDrivers.map((driver, i) => {
              // Scatter slightly based on index since we don't have real coordinates for "Downtown"
              const lat = defaultPosition.lat + (Math.sin(i * 1.5) * 0.05);
              const lng = defaultPosition.lng + (Math.cos(i * 1.5) * 0.05);
              
              const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
              const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
              const coverage = esignData.coverageArea || 'Not specified';

              return (
                <Marker
                  key={driver.id}
                  position={{ lat, lng }}
                  onClick={() => setSelectedDriver({ ...driver, lat, lng, coverage })}
                />
              );
            })}

            {selectedDriver && (
              <InfoWindow
                position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
                onCloseClick={() => setSelectedDriver(null)}
              >
                <div style={{ color: '#000', padding: '4px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{selectedDriver.name}</strong>
                  <span style={{ fontSize: '0.85rem' }}>Area: {selectedDriver.coverage}</span>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f172a' }}>
            <div className="spin-anim" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-color)', borderRadius: '50%' }} />
          </div>
        )}
      </div>

      <style jsx global>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
