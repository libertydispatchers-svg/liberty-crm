'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon paths since they sometimes break in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function DriverMap({ activeDrivers }: { activeDrivers: any[] }) {
  // Center roughly on Baltimore since that's where the app is based
  const defaultPosition: [number, number] = [39.2904, -76.6122];

  return (
    <div style={{ height: '600px', width: '100%', display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* Sidebar for driver list */}
      <div style={{ width: '300px', background: 'var(--panel-bg)', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Active Drivers Coverage</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overview of driver regions</p>
        </div>
        <div style={{ padding: '12px' }}>
          {activeDrivers.map((driver, idx) => {
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
          {activeDrivers.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No active drivers yet.</p>
          )}
        </div>
      </div>

      {/* The actual Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={defaultPosition} zoom={11} style={{ height: '100%', width: '100%', zIndex: 1 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {activeDrivers.map((driver, i) => {
            // Scatter slightly based on index since we don't have real coordinates for "Downtown"
            const lat = defaultPosition[0] + (Math.sin(i * 1.5) * 0.05);
            const lng = defaultPosition[1] + (Math.cos(i * 1.5) * 0.05);
            
            const docs = driver.documents?.find((d: any) => d.name === 'Onboarding Material');
            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
            const coverage = esignData.coverageArea || 'Not specified';

            return (
              <Marker key={driver.id} position={[lat, lng]}>
                <Popup>
                  <div style={{ color: '#000' }}>
                    <strong>{driver.name}</strong><br/>
                    <span style={{ fontSize: '0.85rem' }}>Area: {coverage}</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

    </div>
  );
}
