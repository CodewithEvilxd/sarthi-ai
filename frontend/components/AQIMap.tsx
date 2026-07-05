"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CityAQI {
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  category: string;
}

interface AQIMapProps {
  cities: CityAQI[];
  selectedCity: string;
  onSelectCity: (name: string) => void;
}

function MapCenterController({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView([lat, lon], map.getZoom());
    }
  }, [lat, lon, map]);
  return null;
}

export default function AQIMap({ cities, selectedCity, onSelectCity }: AQIMapProps) {
  const activeCity = cities.find(c => c.name === selectedCity) || cities[0];

  const getColor = (aqi: number) => {
    if (aqi <= 50) return '#10B981'; // Green - Good
    if (aqi <= 100) return '#14B8A6'; // Teal - Satisfactory
    if (aqi <= 200) return '#F59E0B'; // Orange/Yellow - Moderate
    if (aqi <= 300) return '#EF4444'; // Red - Poor
    if (aqi <= 400) return '#A855F7'; // Purple - Very Poor
    return '#7F1D1D'; // Dark Red - Severe
  };

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      <MapContainer
        center={[activeCity?.lat || 20.5937, activeCity?.lon || 78.9629]}
        zoom={6}
        zoomControl={true}
        style={{ width: '100%', height: '100%', background: '#090d16' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {cities.map(city => (
          <CircleMarker
            key={city.name}
            center={[city.lat, city.lon]}
            radius={city.name === selectedCity ? 22 : 16}
            fillColor={getColor(city.aqi)}
            color={city.name === selectedCity ? '#ffffff' : '#475569'}
            weight={city.name === selectedCity ? 3 : 1.5}
            opacity={1}
            fillOpacity={0.8}
            eventHandlers={{
              click: () => {
                onSelectCity(city.name);
              }
            }}
          >
            <Popup>
              <div className="text-slate-900 font-sans p-1">
                <h3 className="font-bold text-lg border-b border-slate-200 pb-1 mb-1">{city.name}</h3>
                <p className="text-sm">AQI: <span className="font-bold text-base" style={{ color: getColor(city.aqi) }}>{city.aqi}</span></p>
                <p className="text-sm">Category: <span className="font-semibold">{city.category}</span></p>
                <button 
                  onClick={() => onSelectCity(city.name)}
                  className="mt-2 w-full text-center text-xs bg-slate-900 text-white py-1 px-2 rounded hover:bg-slate-800 transition"
                >
                  Select City
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {activeCity && <MapCenterController lat={activeCity.lat} lon={activeCity.lon} />}
      </MapContainer>
    </div>
  );
}
