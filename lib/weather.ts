/**
 * Weather fetcher \u2014 OpenWeatherMap free tier.
 * If OPENWEATHER_API_KEY is missing, returns null and the plan
 * still renders fine (weather block hidden).
 *
 * To enable: add OPENWEATHER_API_KEY to your Vercel env vars.
 * Get a free key at https://openweathermap.org/api
 */

import type { CitySlug } from './planner';

const CITY_COORDS: Record<CitySlug, { lat: number; lon: number; label: string }> = {
  dc: { lat: 38.9072, lon: -77.0369, label: 'Washington, DC' },
  nyc: { lat: 40.7128, lon: -74.006, label: 'New York, NY' },
  atlanta: { lat: 33.749, lon: -84.388, label: 'Atlanta, GA' },
  miami: { lat: 25.7617, lon: -80.1918, label: 'Miami, FL' },
  philly: { lat: 39.9526, lon: -75.1652, label: 'Philadelphia, PA' },
};

export type WeatherRead = {
  tempF: number;
  forecast: string; // 'clear', 'rain', 'cloudy', etc
  description: string; // user-facing, already voice-written
  note: string; // actionable line for the plan
  iconEmoji: string;
  raw?: { main: string; description: string };
};

function voiceFor(tempF: number, main: string): { description: string; note: string; iconEmoji: string } {
  const hot = tempF >= 82;
  const warm = tempF >= 68 && tempF < 82;
  const cool = tempF >= 52 && tempF < 68;
  const cold = tempF < 52;

  const rainy = /rain|drizzle|thunder/i.test(main);
  const snow = /snow/i.test(main);
  const clear = /clear/i.test(main);
  const cloudy = /cloud/i.test(main);

  let icon = '\u2600\ufe0f';
  if (rainy) icon = '\ud83c\udf27\ufe0f';
  else if (snow) icon = '\u2744\ufe0f';
  else if (cloudy) icon = '\u26c5';

  let description = `${Math.round(tempF)}\u00b0F${rainy ? ', rain' : snow ? ', snow' : cloudy ? ', cloudy' : clear ? ', clear' : ''}`;
  let note = '';

  if (rainy) {
    note = 'Rain in the forecast. Budget an extra 5 min for the walk or just cab it. Keep the plan tight.';
  } else if (snow) {
    note = 'Snow out. Shorter walks, warmer stops. The cold-weather backup list kicks in automatically.';
  } else if (cold) {
    note = 'Coat weather. The walk between stops will feel long \u2014 consider an Uber for the longer leg.';
  } else if (cool) {
    note = 'Coat, not jacket. The walk between spots will feel good \u2014 don\u2019t Uber it.';
  } else if (warm) {
    note = 'Mild. The walk is part of the plan. Light jacket, optional.';
  } else if (hot) {
    note = 'Hot. Move slower. Water before cocktails. Pick the short walks.';
  }

  return { description, note, iconEmoji: icon };
}

export async function getWeather(city: CitySlug, dateAt?: string): Promise<WeatherRead | null> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;
  const coords = CITY_COORDS[city];
  if (!coords) return null;

  try {
    const when = dateAt ? new Date(dateAt).getTime() : Date.now();
    const hoursFromNow = Math.max(0, Math.floor((when - Date.now()) / 3600000));

    // Free tier: /data/2.5/weather (current) or /data/2.5/forecast (5d/3h).
    // If the date is within 5 days, use forecast; else fall back to current.
    let url: string;
    if (hoursFromNow > 0 && hoursFromNow < 120) {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=imperial&appid=${key}`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=imperial&appid=${key}`;
    }

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();

    let tempF: number;
    let main: string;
    let description: string;

    if (data.list && Array.isArray(data.list)) {
      // forecast \u2014 find closest slot
      const target = when;
      const best = data.list.reduce(
        (a: any, b: any) => (Math.abs(b.dt * 1000 - target) < Math.abs(a.dt * 1000 - target) ? b : a),
        data.list[0]
      );
      tempF = best.main.temp;
      main = best.weather?.[0]?.main || 'Clear';
      description = best.weather?.[0]?.description || '';
    } else {
      tempF = data.main.temp;
      main = data.weather?.[0]?.main || 'Clear';
      description = data.weather?.[0]?.description || '';
    }

    const voice = voiceFor(tempF, main);
    return {
      tempF: Math.round(tempF),
      forecast: main.toLowerCase(),
      description: voice.description,
      note: voice.note,
      iconEmoji: voice.iconEmoji,
      raw: { main, description },
    };
  } catch (e) {
    console.error('getWeather failed', e);
    return null;
  }
}
