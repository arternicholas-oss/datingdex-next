/**
 * Post-generation calibration. LLMs drift toward score inflation no matter
 * how clear the rubric is. This script enforces the distribution curve
 * mechanically per-city by sorting venues and mapping to target buckets.
 *
 * Target (per 200 venues): 2% >=9.5, 8% 9.0-9.4, 15% 8.5-8.9, 25% 8.0-8.4,
 * 25% 7.5-7.9, 20% 7.0-7.4, 5% <7.0
 */
import * as fs from 'fs';
import * as path from 'path';

type V = { city: string; score: number | null; slug: string; name: string };

function calibrate(all: V[], city: string): number {
  const list = all.filter((v) => v.city === city && v.score != null).sort((a, b) => (b.score! - a.score!));
  if (!list.length) return 0;
  const n = list.length;
  const buckets = [
    { pct: 0.02, min: 9.5, max: 10.0 },
    { pct: 0.08, min: 9.0, max: 9.4 },
    { pct: 0.15, min: 8.5, max: 8.9 },
    { pct: 0.25, min: 8.0, max: 8.4 },
    { pct: 0.25, min: 7.5, max: 7.9 },
    { pct: 0.20, min: 7.0, max: 7.4 },
    { pct: 0.05, min: 6.5, max: 6.9 },
  ];
  let idx = 0;
  for (const b of buckets) {
    const count = Math.max(1, Math.round(n * b.pct));
    for (let i = 0; i < count && idx < n; i++, idx++) {
      // Spread scores within the bucket so we don't get 20 venues all at 8.5
      const step = (b.max - b.min) / Math.max(1, count - 1 || 1);
      const newScore = +(b.max - (step * i)).toFixed(1);
      list[idx].score = newScore;
    }
  }
  return list.length;
}

const venuesPath = path.join(process.cwd(), 'data/venues.json');
const all = JSON.parse(fs.readFileSync(venuesPath, 'utf8')) as V[];
for (const city of ['nyc', 'atlanta', 'miami', 'philly']) {
  const n = calibrate(all, city);
  console.log(`  ${city}: calibrated ${n} venues`);
}
fs.writeFileSync(venuesPath, JSON.stringify(all, null, 2));
console.log('Score calibration done.');
