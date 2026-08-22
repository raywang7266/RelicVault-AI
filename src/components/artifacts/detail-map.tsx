"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DetailMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  height?: number;
}

/** 自定义 SVG 图钉，避免 Leaflet 默认 marker 图标在打包后路径丢失的问题 */
const pinIcon = L.divIcon({
  className: "rv-pin-wrapper",
  html: `
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C8.163 1 1 8.163 1 17c0 11.25 14.25 25.25 15.19 26.13a1.2 1.2 0 0 0 1.62 0C18.75 42.25 33 28.25 33 17 33 8.163 25.837 1 17 1Z" fill="#8C6D46" stroke="#5C4831" stroke-width="1.5"/>
      <circle cx="17" cy="17" r="6.5" fill="#FAF7F2"/>
    </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -40],
});

export default function DetailMap({
  latitude,
  longitude,
  locationName,
  height = 260,
}: DetailMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height, width: "100%" }}
      className="rounded-lg overflow-hidden z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={pinIcon}>
        {locationName ? <Popup>{locationName}</Popup> : null}
      </Marker>
    </MapContainer>
  );
}
