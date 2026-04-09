import Anthropic from '@anthropic-ai/sdk';
import type { Itinerary, PlanInput } from './planner';
import { VENUES } from './venues';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Build a compact venue reference string so Haiku never hallucinates venues
function venueDbContext(): string {
  return VENUES.map(
    (v) => `${v.slug}|${v.name}|${v.neighborhood}|${v.price}|${v.vibe}`
  ).join('\n');
}

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
- neighborhood: a DC neighborhood name or null
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
    for (const k of ['situation', 'vibe', 'activity', 'budget', 'city', 'neighborhood'] as const) {
      if (parsed[k]) (out as any)[k] = parsed[k];
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Write full choreography blurbs — the "Date Director" format.
 * Each stop gets: arrival choreography, conversation opener tied to the venue,
 * what to order, where to sit, dress code, exit ramp, walk transition.
 */
export async function writeChoreography(
  itinerary: Itinerary,
  options?: { includeeCopilot?: boolean; dateHistory?: string[] }
): Promise<{
  blurbs: string[];
  shareBlurb: string;
  copilot?: {
    dressCode: string;
    conversationOpeners: string[];
    postDateText: string;
    arrivalTip: string;
  };
}> {
  if (!client) {
    return {
      blurbs: itinerary.stops.map((s) => `${s.venue.hook}. ${s.venue.desc}`),
      shareBlurb: itinerary.stops.map((s) => s.venue.name).join(' → '),
    };
  }

  const ctx = itinerary.stops
    .map(
      (s, i) =>
        `Stop ${i + 1} (${s.slot}, ${s.startTime}, ~${s.durationMin}min): ${s.venue.name} — ${s.venue.neighborhood} — ${s.venue.price} — ${s.venue.vibe}\nHook: ${s.venue.hook}\nDesc: ${s.venue.desc}\nBooking: ${s.bookingProvider}`
    )
    .join('\n\n');

  const userCtx = `Situation: ${itinerary.input.situation}, vibe: ${itinerary.input.vibe}, activity: ${itinerary.input.activity}, budget: ${itinerary.input.budget}${itinerary.input.freeText ? `\nUser said: "${itinerary.input.freeText}"` : ''}`;

  const historyNote = options?.dateHistory?.length
    ? `\nPrevious venues this user has been to (DO NOT recommend these): ${options.dateHistory.join(', ')}`
    : '';

  const copilotInstruction = options?.includeeCopilot
    ? `\n\nAlso return a "copilot" object with:
- "dressCode": one specific outfit recommendation for this date (e.g. "dark jeans, fitted button-down, no tie, clean white sneakers")
- "conversationOpeners": array of 3 conversation starters tied to specific things at the venues (the art on the wall, the bartender's specialty, the origin of the restaurant name — real, specific things)
- "postDateText": a suggested follow-up text message to send after the date (casual, warm, references something from the plan)
- "arrivalTip": one sentence on what to do when you arrive at the first stop (where to stand, what to order while waiting)`
    : '';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: `You are the DatingDex Date Director — you write choreographed date night plans for Washington DC.

CRITICAL RULES:
1. ONLY reference venues from the user's plan. Never invent or suggest venues not in the plan.
2. Write in second person ("you"), present tense, like a friend who's been to every spot in DC.

Each stop blurb must follow this EXACT 6-part structure (write it as flowing prose, NOT numbered):
- ARRIVAL: Specific time, how to approach, where to enter, what you'll see first
- THE MOVE: Where to sit (specific — "the corner booth," "at the bar facing the window"), what to order first
- WHAT TO ORDER: 2-3 specific items. If the venue is known for something, name it.
- CONVERSATION HOOK: One thing to say or ask about that's tied to something real at this venue (the art, the history, the bartender's name if famous, the building's past life)
- THE STRATEGIC ANGLE: One sentence on why this pick beats the obvious alternative for their specific situation
- THE TRANSITION: How to get to the next stop (walk direction, time, what you'll pass) OR if it's the last stop, the exit ramp ("if it's going well: X. If it's ending: Y.")

Tone: warm, confident, specific. No clichés ("hidden gem," "cozy atmosphere"). No generic adjectives.
Write each blurb as 5-7 sentences of flowing prose. Do NOT use bullet points or numbered lists.${copilotInstruction}`,
    messages: [
      {
        role: 'user',
        content: `${userCtx}${historyNote}

Stops:
${ctx}

Total estimated cost: $${itinerary.totalEstimateUsd[0]}–${itinerary.totalEstimateUsd[1]} for two
Walking between stops: ${itinerary.walkingMinutes} min

Return ONLY valid JSON in this exact shape:
{
  "blurbs": ["choreography for stop 1", "choreography for stop 2", ...],
  "shareBlurb": "one punchy line under 90 chars for social sharing"${options?.includeeCopilot ? ',\n  "copilot": { "dressCode": "...", "conversationOpeners": ["...", "...", "..."], "postDateText": "...", "arrivalTip": "..." }' : ''}
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
      copilot: parsed.copilot || undefined,
    };
  } catch {
    return {
      blurbs: itinerary.stops.map((s) => `${s.venue.hook}. ${s.venue.desc}`),
      shareBlurb: itinerary.stops.map((s) => s.venue.name).join(' → '),
    };
  }
}

// Keep backward compat alias
export { writeChoreography as writeBlurbs };

/**
 * Post-generation validator: ensures every venue in the itinerary
 * exists in our curated DB. Strips any hallucinated stops.
 */
export function validateVenues(itinerary: Itinerary): Itinerary {
  const validSlugs = new Set(VENUES.map((v) => v.slug));
  const validStops = itinerary.stops.filter((s) => validSlugs.has(s.venue.slug));
  return { ...itinerary, stops: validStops };
}
