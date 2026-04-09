import Anthropic from '@anthropic-ai/sdk';
import type { Itinerary, PlanInput } from './planner';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function parseFreeText(freeText: string): Promise<Partial<PlanInput>> {
  if (!client || !freeText.trim()) return {};
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system:
      'You extract structured date-night planning fields from a user description. Return ONLY valid JSON, no prose.',
    messages: [
      {
        role: 'user',
        content: `Extract these fields from the description. Use null for unknowns.
Fields:
- situation: one of "first-date","second-date","anniversary","casual-hang","make-it-up"
- vibe: one of "low-pressure","romantic","fun-playful","impressive","sexy"
- activity: one of "dinner","drinks-only","coffee","activity","full-evening"
- budget: one of "under-30","30-60","60-100","no-limit"
- city: e.g. "Washington, DC"

Description: "${freeText.replace(/"/g, '\\"')}"

Return JSON only.`,
      },
    ],
  });
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    const parsed = JSON.parse(match[0]);
    const out: Partial<PlanInput> = {};
    for (const k of ['situation', 'vibe', 'activity', 'budget', 'city'] as const) {
      if (parsed[k]) out[k] = parsed[k];
    }
    return out;
  } catch {
    return {};
  }
}

export async function writeBlurbs(itinerary: Itinerary): Promise<{ blurbs: string[]; shareBlurb: string }> {
  if (!client) {
    return {
      blurbs: itinerary.stops.map((s) => `${s.venue.hook}. ${s.venue.desc}`),
      shareBlurb: itinerary.stops.map((s) => s.venue.name).join(' → '),
    };
  }
  const ctx = itinerary.stops
    .map(
      (s, i) =>
        `Stop ${i + 1} (${s.slot}, ${s.startTime}): ${s.venue.name} — ${s.venue.neighborhood} — ${s.venue.price} — ${s.venue.vibe}\nHook: ${s.venue.hook}\nDesc: ${s.venue.desc}`
    )
    .join('\n\n');
  const userCtx = `Situation: ${itinerary.input.situation}, vibe: ${itinerary.input.vibe}, activity: ${itinerary.input.activity}, budget: ${itinerary.input.budget}${itinerary.input.freeText ? `\nUser said: "${itinerary.input.freeText}"` : ''}`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    system: `You write personalized 4-sentence venue blurbs for a date planner. Each blurb has exactly 4 sentences:
1) Tie to the user's specific situation, echoing what they said
2) A concrete sensory detail (lighting, noise level, room layout, crowd)
3) The strategic angle - why this beats the obvious alternative
4) A small insider tip - where to sit, what to order first, when to arrive

Tone: warm, confident, like a friend who's been there. No clichés. No generic adjectives.`,
    messages: [
      {
        role: 'user',
        content: `${userCtx}

Stops:
${ctx}

Return ONLY valid JSON in this exact shape:
{
  "blurbs": ["4-sentence blurb for stop 1", "4-sentence blurb for stop 2", ...],
  "shareBlurb": "one short line (under 90 chars) for an OG card preview"
}`,
      },
    ],
  });
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no json');
    const parsed = JSON.parse(match[0]);
    return {
      blurbs: Array.isArray(parsed.blurbs) ? parsed.blurbs : [],
      shareBlurb: parsed.shareBlurb || itinerary.stops.map((s) => s.venue.name).join(' → '),
    };
  } catch {
    return {
      blurbs: itinerary.stops.map((s) => `${s.venue.hook}. ${s.venue.desc}`),
      shareBlurb: itinerary.stops.map((s) => s.venue.name).join(' → '),
    };
  }
}
