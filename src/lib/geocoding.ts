// 基于 OpenStreetMap Nominatim 的地理编码服务（无需 API Key）。
//
// 使用说明 / 限制：
// - 浏览器直接 fetch 即可（Nominatim 支持 CORS，返回 Access-Control-Allow-Origin: *）。
// - 公共实例限流为「每秒最多 1 次请求」，请勿高频刷接口；生产环境建议自托管
//   或使用带 Key 的商业服务（如 高德 / Mapbox / 腾讯位置服务）。
// - 需遵守 https://operations.osmfoundation.org/policies/nominatim/ 使用政策。

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export interface Place {
  /** Nominatim place_id，用于去重 / 调试 */
  placeId: string;
  /** 完整地址（逆地理编码后同样返回） */
  displayName: string;
  /** 简短名称（POI / 道路名），用于搜索框回显 */
  name: string;
  latitude: number;
  longitude: number;
  type?: string;
  category?: string;
  address?: Record<string, string>;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  category?: string;
  class?: string;
  address?: Record<string, string>;
}

function toPlace(r: NominatimResult): Place {
  return {
    placeId: String(r.place_id),
    displayName: r.display_name,
    name: r.name || r.display_name.split(",")[0],
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    type: r.type,
    category: r.category,
    address: r.address,
  };
}

/**
 * 前向地理编码：根据关键词模糊搜索地点（POI 联想）。
 * 仅在关键词长度 >= 2 时调用；调用方应做防抖处理。
 *
 * @param acceptLanguage 跟随用户当前语言（如 "zh-CN" / "zh-TW" / "en"），
 *   用于控制返回地点的显示名称语言。
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  acceptLanguage = "zh-CN,en"
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    format: "json",
    q,
    addressdetails: "1",
    limit: "6",
    "accept-language": acceptLanguage,
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    signal,
    headers: { "Accept-Language": acceptLanguage },
  });

  if (!res.ok) {
    throw new Error(`地理编码服务请求失败 (${res.status})`);
  }

  const data = (await res.json()) as NominatimResult[];
  return Array.isArray(data) ? data.map(toPlace) : [];
}

/**
 * 逆地理编码：根据经纬度解析出可读地址。
 * 找不到结果时返回 null（例如位于海洋 / 无人区）。
 *
 * @param acceptLanguage 跟随用户当前语言，控制返回地址的语言。
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
  acceptLanguage = "zh-CN,en"
): Promise<Place | null> {
  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    "accept-language": acceptLanguage,
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
    signal,
    headers: { "Accept-Language": acceptLanguage },
  });

  if (!res.ok) {
    throw new Error(`逆地理编码请求失败 (${res.status})`);
  }

  const r = (await res.json()) as NominatimResult & { error?: string };
  if (!r || r.error || !r.lat) return null;
  return toPlace(r);
}
