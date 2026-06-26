'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
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

export default function MiniMap({ address, radiusStr }: { address: string, radiusStr: string }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  
  useEffect(() => {
    if (!address) return;
    
    let isMounted = true;
    const fetchGeocode = async () => {
      try {
        const isZip = /^\d{5}(-\d{4})?$/.test(address.trim());
        const cleanQuery = address.trim().toLowerCase();
        const query = isZip
          ? `${address.trim()}`
          : cleanQuery.endsWith('usa') || cleanQuery.endsWith('us')
            ? address.trim()
            : `${address.trim()}, USA`;
            
        const url = isZip 
            ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query)}&countrycodes=us&format=json&limit=1`
            : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
            
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && data && data.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (e) {
        console.error('MiniMap geocode error', e);
      }
    };
    
    // Simple debounce/delay
    const timeoutId = setTimeout(fetchGeocode, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [address]);

  if (!position) {
    return (
      <div style={{ height: '200px', width: '100%', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        {address ? 'Locating address on map...' : 'Enter a coverage address to see it on the map'}
      </div>
    );
  }

  let radiusMeters = 2000;
  if (radiusStr === 'Anywhere') {
    radiusMeters = 500000;
  } else if (radiusStr) {
    radiusMeters = parseInt(radiusStr) * 1609.34;
  }

  // Calculate an appropriate zoom level based on radius
  // 50 miles ~ 80km -> zoom 8 or 9
  let zoom = 10;
  if (radiusStr === '10') zoom = 11;
  if (radiusStr === '25') zoom = 10;
  if (radiusStr === '50') zoom = 9;
  if (radiusStr === '100') zoom = 8;
  if (radiusStr === '250') zoom = 6;
  if (radiusStr === 'Anywhere') zoom = 4;

  return (
    <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
      <MapContainer 
        key={`${position[0]}-${position[1]}-${zoom}`} // Force re-render on position change to update center
        center={position} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        />
        <Marker position={position} />
        <Circle 
          center={position} 
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 }} 
          radius={radiusMeters} 
        />
      </MapContainer>
    </div>
  );
}
