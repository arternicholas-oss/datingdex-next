/**
 * DatingDex content generator.
 * For each venue missing editorial fields (vibe/score/hook/desc/scores),
 * calls Claude with the master prompt + the venue's raw Google data, and
 * writes the structured editorial back to venues.json.
 *
 * Resumable: re-running skips venues that already have editorial content.
 * Rate limited: ~1 req/sec to stay well within API limits.
 *
 * Usage:
 *   CITY=atlanta npx tsx scripts/generate-content.ts
 *   CITY=all     npx tsx scripts/generate-content.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1); }

const CITY_FILTER = (process.env.CITY || 'all').toLowerCase();
const MAX_VENUES = parseInt(process.env.MAX || '9999', 10);
const MODEL = 'claude-sonnet-4-6';

const client = new Anthropic({ apiKey: KEY });

const MASTER_PROMPT = `You are the content engine for DatingDex. You write editorial venue profiles that feel curated by a well-connected friend with opinions — not scraped.

VOICE RULES:
- Confident, honest, slightly witty, never corporate
- No generic Yelp-speak ("hidden gem", "cozy atmosphere")
- Specific details: name dishes, describe lighting, mention parking, flag the parts that matter for a date
- Slightly opinionated — ok to call out overrated or overhyped
- Gender-neutral, inclusive — dates aren't just for straight couples

VIBE CATEGORIES (pick ONE primary):
- "Low Pressure First Date" — casual, easy, no commitment pressure
- "First Date" — solid pick, effort without overdoing it
- "Quiet & Intimate" — dim, private, deep conversation energy
- "Impress Them" — high-impact, wow-factor
- "Late Night" — open past 10pm, spontaneous energy
- "Activity Date" — bowling, museums, axe throwing, etc.
- "Coffee Date" — daytime, low-stakes

SCORING (two-layer system):
Return THREE descriptive scores, each with a label (2-4 words) and one-liner (witty, specific to THIS venue):
  1. "vibe" (ALWAYS) — overall atmosphere. Labels like "First-Class Energy", "Soft Life Energy", "High Value Date Spot", "Electric but Intimate", "Neighborhood Charm", "Adventure Mode"
  2. "convo" (ALWAYS) — conversation quality. Labels like "Deep Connection", "Easy Flow", "Background Buzz"
  3. THIRD SCORE — pick ONE of:
     - "privacy" (intimate/upscale): "High Privacy", "Very Intimate", "Cozy Not Cramped"
     - "kiss" (romantic): "Very Likely", "Possible", "Not the Vibe"
     - "exit" (first dates/low-pressure): "Easy Exit", "Good Pacing", "You're Committed"

Also return numeric sub-scores (0.0-10.0):
- convo_num (decimal)
- vibe_num (decimal)
- exit_desc: one of "easy exit" / "good pacing" / "memorable" / "impressive"

And an overall DatingDex score (0.0-10.0) following this distribution — DO NOT INFLATE:
- 9.5-10.0: top 2% — truly exceptional
- 9.0-9.4: top 10% — excellent
- 8.5-8.9: strong picks — reliably good
- 8.0-8.4: solid — good for right situation
- 7.5-7.9: decent — works with tradeoffs
- 7.0-7.4: baseline — meets criteria
- <7.0: only if unique niche

A 7.5 is a fine score. Reserve 9+ for truly exceptional.

Return a "hook" (one punchy line — the subtitle) and "desc" (1-2 sentences — specific, opinionated, useful).

RETURN RAW JSON ONLY, no markdown fences, no commentary. Schema:
{
  "vibe": "Low Pressure First Date" | "First Date" | "Quiet & Intimate" | "Impress Them" | "Late Night" | "Activity Date" | "Coffee Date",
  "score": 8.3,
  "hook": "Subtitle — one punchy line",
  "desc": "1-2 sentence editorial summary. Specific. Opinionated.",
  "scores": {
    "convo_label": "Easy Flow",
    "convo_oneliner": "Specific to this venue.",
    "vibe_label": "Neighborhood Charm",
    "vibe_oneliner": "Specific to this venue.",
    "third_type": "exit" | "privacy" | "kiss",
    "third_label": "Good Pacing",
    "third_oneliner": "Specific to this venue."
  },
  "convo_num": 8.5,
  "vibe_num": 8.7,
  "exit_desc": "good pacing"
}`;

type RawVenue = {
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  price: string;
  vibe: string | null;
  score: number | null;
  hook: string | null;
  desc: string | null;
  scores: { convo: string | null; vibe: string | null; exit: string | null };
  google?: {
    rating?: number;
    total_ratings?: number;
    address?: string;
    types?: string[];
  };
  // Fields populated here:
  convo_num?: number;
  vibe_num?: number;
  exit_desc?: string;
};

function userMessage(v: RawVenue): string {
  const g = v.google || {};
  return `Venue: ${v.name}
City: ${v.city.toUpperCase()}
Neighborhood: ${v.neighborhood}
Address: ${g.address || 'unknown'}
Price: ${v.price}
Google Rating: ${g.rating || 'n/a'} (${g.total_ratings || 0} reviews)
Google Types: ${(g.types || []).join(', ')}

Generate the DatingDex editorial profile for this venue. Return JSON only.`;
}

async function generateOne(v: RawVenue, attempt = 1): Promise<any> {
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: MASTER_PROMPT,
      messages: [{ role: 'user', content: userMessage(v) }],
    });
    const text = msg.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('');
    // Strip possible code fences
    const clean = text.replace(/^```(?:json)?\n?|```$/gm, '').trim();
    return JSON.parse(clean);
  } catch (e: any) {
    if (attempt < 3) {
      console.warn(`    retry ${attempt} for ${v.name}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return generateOne(v, attempt + 1);
    }
    throw e;
  }
}

async function main() {
  const venuesPath = path.join(process.cwd(), 'data/venues.json');
  const all = JSON.parse(fs.readFileSync(venuesPath, 'utf8')) as RawVenue[];

  const pending = all.filter((v) => {
    if (CITY_FILTER !== 'all' && v.city !== CITY_FILTER) return false;
    return !v.score || !v.hook || !v.desc || !v.vibe;
  }).slice(0, MAX_VENUES);

  console.log(`Generating editorial for ${pending.length} venues (city filter: ${CITY_FILTER})`);

  let done = 0;
  for (const v of pending) {
    try {
      const gen = await generateOne(v);
      v.vibe = gen.vibe;
      v.score = gen.score;
      v.hook = gen.hook;
      v.desc = gen.desc;
      v.scores = {
        convo: `${gen.scores.convo_label}: ${gen.scores.convo_oneliner}`,
        vibe:  `${gen.scores.vibe_label}: ${gen.scores.vibe_oneliner}`,
        exit:  `${gen.scores.third_label}: ${gen.scores.third_oneliner}`,
      };
      v.convo_num = gen.convo_num;
      v.vibe_num = gen.vibe_num;
      v.exit_desc = gen.exit_desc;
      done++;
      // Save every 5 venues so a crash doesn't lose work
      if (done % 5 === 0) {
        fs.writeFileSync(venuesPath, JSON.stringify(all, null, 2));
        console.log(`  [${done}/${pending.length}] saved. Latest: ${v.name} (${v.score}, ${v.vibe})`);
      }
    } catch (e: any) {
      console.error(`  FAIL ${v.name}: ${e.message}`);
    }
    // Rate limit — ~1 req/sec
    await new Promise((r) => setTimeout(r, 800));
  }
  fs.writeFileSync(venuesPath, JSON.stringify(all, null, 2));
  console.log(`\nDone. ${done} venues generated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
