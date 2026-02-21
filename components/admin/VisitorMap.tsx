'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import map components (client-side only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface VisitorLocation {
  country: string;
  count: number;
  lat: number;
  lng: number;
}

// Country coordinates (major cities)
const countryCoordinates: Record<string, [number, number]> = {
  'Vietnam': [21.0285, 105.8542],
  'United States': [37.0902, -95.7129],
  'United Kingdom': [51.5074, -0.1278],
  'Germany': [52.5200, 13.4050],
  'France': [48.8566, 2.3522],
  'Japan': [35.6762, 139.6503],
  'China': [39.9042, 116.4074],
  'India': [28.6139, 77.2090],
  'Australia': [-33.8688, 151.2093],
  'Canada': [45.4215, -75.6972],
  'Brazil': [-23.5505, -46.6333],
  'Singapore': [1.3521, 103.8198],
  'Thailand': [13.7563, 100.5018],
  'South Korea': [37.5665, 126.9780],
  'Malaysia': [3.1390, 101.6869],
  'Indonesia': [-6.2088, 106.8456],
  'Philippines': [14.5995, 120.9842],
};

export default function VisitorMap({ visitors }: { visitors: Array<{ country: string; count: number }> }) {
  const [locations, setLocations] = useState<VisitorLocation[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Convert visitor data to locations with coordinates
    const locs = visitors
      .filter(v => countryCoordinates[v.country])
      .map(v => ({
        country: v.country,
        count: v.count,
        lat: countryCoordinates[v.country][0],
        lng: countryCoordinates[v.country][1],
      }));
    
    setLocations(locs);
  }, [visitors]);

  if (!mounted) {
    return (
      <div className="h-[400px] flex items-center justify-center border-2 border-border bg-muted">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center border-2 border-border bg-muted">
        <div className="text-muted-foreground">No visitor data to display</div>
      </div>
    );
  }

  return (
    <div className="h-[400px] border-2 border-border overflow-hidden">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc, index) => (
          <CircleMarker
            key={index}
            center={[loc.lat, loc.lng]}
            radius={Math.min(loc.count * 2 + 5, 30)}
            fillColor="#FF6B6B"
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.7}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold">{loc.country}</div>
                <div className="text-sm">{loc.count} visitors</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
