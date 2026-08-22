"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Search,
  LocateFixed,
  Loader2,
  X,
  Navigation,
} from "lucide-react";
import { searchPlaces, reverseGeocode, type Place } from "@/lib/geocoding";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { localeToAcceptLanguage } from "@/lib/i18n/locales";

// Leaflet 依赖 window，必须仅在客户端加载，避免 SSR 报错。
const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => {
    const { t } = useTranslation();
    return (
      <div className="h-[220px] rounded-lg bg-[#F5F0E6] animate-pulse flex items-center justify-center text-xs text-[#9C8E80]">
        {t("loc.mapLoading")}
      </div>
    );
  },
});

export interface LocationValue {
  locationName: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  value?: LocationValue | null;
  onChange?: (value: LocationValue | null) => void;
  disabled?: boolean;
  id?: string;
}

export default function LocationPicker({
  value,
  onChange,
  disabled = false,
  id = "location",
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.locationName ?? "");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const { t, locale } = useTranslation();
  const acceptLanguage = localeToAcceptLanguage(locale);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value;

  // 防抖 + 调用 Nominatim 联想搜索
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || disabled) {
      setSuggestions([]);
      setShowList(false);
      return;
    }

    const handler = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setIsSearching(true);
      try {
        const results = await searchPlaces(q, ac.signal, acceptLanguage);
        if (!ac.signal.aborted) {
          setSuggestions(results);
          setShowList(true);
        }
      } catch (err) {
        if (!ac.signal.aborted) {
          setSuggestions([]);
          // 静默失败：联想列表清空即可，不打断用户打字
          if (err instanceof Error && !String(err.message).includes("abort")) {
            console.error("POI 搜索失败:", err);
          }
        }
      } finally {
        if (!ac.signal.aborted) setIsSearching(false);
      }
    }, 550);

    return () => clearTimeout(handler);
  }, [query, disabled]);

  // 点击组件外部时收起联想列表
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectPlace = (place: Place) => {
    setQuery(place.name);
    setShowList(false);
    setSuggestions([]);
    setGeoError(null);
    onChange?.({
      locationName: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError(t("loc.geoUnsupported"));
      return;
    }
    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const place = await reverseGeocode(latitude, longitude, undefined, acceptLanguage);
          if (place) {
            setQuery(place.name);
            onChange?.({
              locationName: place.displayName,
              latitude: place.latitude,
              longitude: place.longitude,
            });
          } else {
            const label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setQuery(label);
            onChange?.({ locationName: label, latitude, longitude });
          }
        } catch (err) {
          const label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setQuery(label);
          onChange?.({ locationName: label, latitude, longitude });
          setGeoError(
            err instanceof Error ? `${t("loc.geoReverseFailed")}：${err.message}` : t("loc.geoReverseFailed")
          );
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        const msg =
          err.code === 1
            ? t("loc.geoDenied")
            : err.code === 2
              ? t("loc.geoUnavailable")
              : t("loc.geoTimeout");
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const clearLocation = () => {
    setQuery("");
    setSuggestions([]);
    setShowList(false);
    setGeoError(null);
    onChange?.(null);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#3E3228]"
      >
        {t("loc.label")}
      </label>

      {/* 搜索框 + 定位按钮 */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C8E80] pointer-events-none" />
          <input
            id={id}
            type="text"
            autoComplete="off"
            disabled={disabled}
            placeholder={t("loc.placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setGeoError(null);
            }}
            onFocus={() => suggestions.length > 0 && setShowList(true)}
            className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm disabled:opacity-60"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D46] animate-spin" />
          )}
          {!isSearching && query && (
            <button
              type="button"
              onClick={() => clearLocation()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C8E80] hover:text-[#5C4831]"
              title={t("common.clear")}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* POI 联想下拉 */}
          {showList && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-[#D6CBBA] bg-white shadow-lg divide-y divide-[#EFE6D5]">
              {suggestions.map((place) => (
                <li key={place.placeId}>
                  <button
                    type="button"
                    onClick={() => selectPlace(place)}
                    className="w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 hover:bg-[#F5F0E6] transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#8C6D46] mt-0.5 flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#2C221E] truncate">
                        {place.name}
                      </span>
                      <span className="block text-xs text-[#8C7E72] truncate">
                        {place.displayName}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleLocate}
          disabled={disabled || isLocating}
          className="px-3.5 py-2.5 rounded-lg border border-[#8C6D46] text-[#8C6D46] hover:bg-[#EFE6D5] disabled:opacity-60 flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
          title={t("loc.locateTitle")}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
          {t("loc.locate")}
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X className="w-3.5 h-3.5" />
          {geoError}
        </p>
      )}

      {/* 已选位置确认卡片 + 地图预览 */}
      {selected && (
        <div className="mt-3 rounded-xl border border-[#D6CBBA] bg-[#F5F0E6]/50 p-3.5 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#8C6D46] mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#2C221E] break-words">
                {selected.locationName}
              </p>
              <p className="text-xs text-[#8C7E72] mt-0.5 tabular-nums">
                经纬度：{selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
              </p>
            </div>
            <button
              type="button"
              onClick={clearLocation}
              className="text-[#9C8E80] hover:text-red-600 transition-colors flex-shrink-0"
              title={t("loc.clearSelected")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#D6CBBA]">
            <LocationMap
              latitude={selected.latitude}
              longitude={selected.longitude}
              locationName={selected.locationName}
            />
          </div>

          <a
            href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=13/${selected.latitude}/${selected.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#8C6D46] hover:underline"
          >
            <Navigation className="w-3.5 h-3.5" />
            {t("loc.openOsm")}
          </a>
        </div>
      )}

      <p className="text-xs text-[#9C8E80]">
        {t("loc.hint")}
      </p>
    </div>
  );
}
