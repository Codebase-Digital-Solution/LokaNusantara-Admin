"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

const BALI_CENTER: [number, number] = [-8.4095, 115.1889];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))),
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) map.panTo([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

// Click the map to set coordinates. Loaded with ssr: false because Leaflet
// touches window on import.
export default function LocationPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const hasPoint = !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
  return (
    <div className="h-64 overflow-hidden rounded-lg border border-gray-200">
      <MapContainer center={hasPoint ? [lat, lng] : BALI_CENTER} zoom={hasPoint ? 14 : 9} className="h-full w-full">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          referrerPolicy="strict-origin-when-cross-origin"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onPick={onPick} />
        {hasPoint && (
          <>
            <CircleMarker
              center={[lat, lng]}
              radius={8}
              pathOptions={{ color: "#fff", weight: 2, fillColor: "#047857", fillOpacity: 1 }}
            />
            <Recenter lat={lat} lng={lng} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
