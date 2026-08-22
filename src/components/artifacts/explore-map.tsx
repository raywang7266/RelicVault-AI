"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Artifact } from "@/lib/types/artifact";
import SmartImage from "./smart-image";
import { useTranslation } from "@/lib/i18n/i18n-provider";

interface ExploreMapProps {
  artifacts: Artifact[];
  height?: number;
}

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

/** 把所有带坐标的文物一次性缩放到视野内 */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

export default function ExploreMap({
  artifacts,
  height = 520,
}: ExploreMapProps) {
  const { t } = useTranslation();
  const geo = useMemo(
    () =>
      artifacts.filter(
        (a): a is Artifact =>
          typeof a.latitude === "number" && typeof a.longitude === "number"
      ),
    [artifacts]
  );

  const points = useMemo(
    () => geo.map((a) => [a.latitude as number, a.longitude as number]) as [number, number][],
    [geo]
  );

  // 单点时给个默认中心，避免地图无中心报错
  const center: [number, number] = points[0] ?? [35.0, 105.0];

  if (geo.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D6CBBA] bg-white/50 text-sm text-[#9C8E80]"
        style={{ height }}
      >
        <p>{t("explore.mapEmpty")}</p>
        <p className="mt-1 text-xs">{t("explore.mapEmptyHint")}</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={false}
      style={{ height, width: "100%" }}
      className="rounded-2xl overflow-hidden z-0 border border-[#E6DFC6]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geo.map((a) => (
        <Marker
          key={a.id}
          position={[a.latitude as number, a.longitude as number]}
          icon={pinIcon}
        >
          <Popup>
            <div className="w-44">
              <a
                href={`/artifacts/${a.id}`}
                className="block overflow-hidden rounded-md bg-[#EFE6D5]"
                style={{ aspectRatio: "3 / 2" }}
              >
                <SmartImage
                  src={a.imageUrl}
                  alt={a.title}
                  fallbackLabel={a.title.slice(0, 1)}
                  className="h-full w-full object-cover"
                />
              </a>
              <a
                href={`/artifacts/${a.id}`}
                className="mt-1.5 block font-serif text-sm font-bold leading-snug text-[#2C221E] hover:text-[#8C6D46]"
              >
                {a.title}
              </a>
              <p className="text-[11px] text-[#7A6B5D]">
                {a.era} · {a.category}
              </p>
              {a.locationName && (
                <p className="mt-0.5 truncate text-[11px] text-[#9C8E80]">
                  📍 {a.locationName}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}
