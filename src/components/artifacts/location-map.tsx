"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  height?: number;
}

/** 当地点变化时把地图视图平滑移动到新坐标 */
function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), 13));
  }, [latitude, longitude, map]);
  return null;
}

/**
 * 轻量地图预览：使用 OpenStreetMap 瓦片 + Leaflet CircleMarker 标注选点。
 * 仅用于在表单中直观展示所选位置，不参与坐标计算。
 */
export default function LocationMap({
  latitude,
  longitude,
  locationName,
  height = 220,
}: LocationMapProps) {
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
      <CircleMarker
        center={[latitude, longitude]}
        radius={8}
        pathOptions={{
          color: "#8C6D46",
          fillColor: "#8C6D46",
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        {locationName ? <Popup>{locationName}</Popup> : null}
      </CircleMarker>
      <Recenter latitude={latitude} longitude={longitude} />
    </MapContainer>
  );
}
