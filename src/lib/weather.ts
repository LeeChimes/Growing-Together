import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WeatherSnapshot {
  temperatureC: number;
  condition: string;
  humidityPct?: number;
  windKph?: number;
  updatedAt: string;
}

const WEATHER_CACHE_KEY = 'weather_snapshot_cache_v1';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getCachedWeather(): Promise<WeatherSnapshot | null> {
  try {
    const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as WeatherSnapshot;
  } catch {
    return null;
  }
}

export async function setCachedWeather(snapshot: WeatherSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export async function fetchWeatherSnapshot(options?: {
  latitude?: number;
  longitude?: number;
  ttlMs?: number;
}): Promise<WeatherSnapshot> {
  const { latitude = 52.676, longitude = -2.105, ttlMs = DEFAULT_TTL_MS } = options || {};

  const cached = await getCachedWeather();
  if (cached) {
    const ageMs = Date.now() - new Date(cached.updatedAt).getTime();
    if (ageMs < ttlMs) {
      return cached;
    }
  }

  // Use Open-Meteo (no key) for a simple snapshot
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    const json = await res.json();

    const snapshot: WeatherSnapshot = {
      temperatureC: json?.current?.temperature_2m ?? 0,
      condition: 'Weather',
      humidityPct: json?.current?.relative_humidity_2m ?? undefined,
      windKph: json?.current?.wind_speed_10m ? Number(json.current.wind_speed_10m) : undefined,
      updatedAt: new Date().toISOString(),
    };

    await setCachedWeather(snapshot);
    return snapshot;
  } catch {
    // Fallback to cached if available
    if (cached) return cached;
    return {
      temperatureC: 0,
      condition: 'Unknown',
      updatedAt: new Date().toISOString(),
    };
  }
}


