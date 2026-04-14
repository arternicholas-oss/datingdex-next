import Anthropic from '@anthropic-ai/sdk';
import type { Itinerary, PlanInput, PlanPayload } from './planner';
import { VENUES } from './venues';
import { dedupeLeadingSentence } from './format';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

if (!client && typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Surface this clearly in Vercel logs so it's obvious when fallbacks
  // are being used in prod (e.g. env var not set).
  console.warn(
    '[anthropic] ANTHROPIC_API_KEY is not set \u2014 plans will use static fallback copy. Set it in Vercel env vars.'
  );
}

// ------------------------------------------------------------
// parseFreeText — legacy NL \u2192 structured. Still useful for "something else"
// text fields in the wizard.
// ------------------------------------------------------------
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
- occasion: one of "first-date","early-dates","regular","special","something-else"
- vibe: one of "impressive","intimate","low-pressure","classic-romantic","adventurous","something-else"
- shape: one of "dinner-only","drinks-and-dinner","full-night"
- budget: one of "under-60","60-120","120-200","200-plus","flexible"
- city: one of "dc","nyc","atlanta","miami","philly"
- neighborhood: a neighborhood name or null
- activity: one of "none","live-music","active","creative","outdoor"

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
    for (const k of ['occasion', 'vibe', 'shape', 'budget', 'city', 'neighborhood', 'activity'] as const) {
      if (parsed[k]) (out as any)[k] = parsed[k];
    }
    return out;
  } catch {
    return {};
  }
}

// ------------------------------------------------------------
// The DatingDex Voice Guide \u2014 the moat.
// Embedded in the system prompt so every plan inherits the tone.
// ------------------------------------------------------------
const VOICE_GUIDE = `
# DatingDex voice guide

You're the producer of someone's date night \u2014 not a chatbot, not a reviewer, not a tour guide.
You've been to every spot in town. You know the staff. You've made these mistakes before, which is why you know the shortcuts.

TONE
- Warm, confident, specific. Like a well-dressed friend who already made the reservation.
- Second person present tense: "you walk in," "you order," "you tell the bartender."
- Short sentences beat long ones. Rhythm matters.

BANNED WORDS
- "hidden gem," "cozy," "charming," "vibrant," "unique," "trendy," "Instagrammable," "foodie,"
  "must-visit," "nestled," "curated" (unless literal), "tapestry," "journey," "experience" (as noun).
- No exclamation points. No emojis in the body copy. No "!" ever.
- Never say "AI" or "artificial intelligence" or "our algorithm."

HUMOR LIVES IN THREE PLACES ONLY
1. The cold open \u2014 one wink, never two.
2. The walk-between lines \u2014 micro, observational, low-stakes.
3. The producer's note \u2014 dry, knowing, never zany.
Rule of thumb: if you wouldn't send the line as a text to the group chat, cut it.

TACTICAL DETAIL > GENERIC PRAISE
Bad: "Cafe Riggs has a warm atmosphere and great cocktails."
Good: "Sit at the bar, not a table. Order the Negroni Bianco \u2014 they over-pour the gin.
       If two seats open at the far end, take them."

SPECIFICITY RULES
- Name one drink, one dish per stop. Not a menu tour.
- Name a real detail: the mural, the bartender's name if known, the building's past life.
- If you don't know something specific, say something true instead of inventing a detail.
`;

// ------------------------------------------------------------
// writeFullPlan \u2014 the rich structured output generator
// ------------------------------------------------------------
export async function writeFullPlan(
  itinerary: Itinerary,
  options?: {
    isPremium?: boolean;
    dateHistory?: string[];
    weatherContext?: { forecast: string; tempF: number };
  }
): Promise<{
  blurbs: string[];
  beats: Array<{ arrival: string; whyThisWorks: string; orderFirst: string; insiderTip: string }>;
  walkTransitions: Array<{ minutes: number; line: string }>;
  conversationHooks: string[];
  whatToWear: string[];
  photoSpots: string[];
  coldOpen: string;
  nightAtAGlance: string;
  producersNote: string;
  postDateText: string;
  bailoutLine: string | null;
  extendLine: string;
  paymentNote: string;
  shareBlurb: string;
}> {
  const fallbackBlurb = (i: number) => {
    const hook = (itinerary.stops[i]?.venue.hook || '').trim().replace(/[.!?]+$/, '');
    const desc = (itinerary.stops[i]?.venue.desc || '').trim();
    const raw = [hook, desc].filter(Boolean).join('. ');
    return dedupeLeadingSentence(raw).trim();
  };

  if (!client) {
    // No key \u2014 return safe fallbacks so the product still ships.
    return {
      blurbs: itinerary.stops.map((_, i) => fallbackBlurb(i)),
      beats: itinerary.stops.map(() => ({
        arrival: 'Arrive a few minutes early. Check in at the host stand.',
        whyThisWorks: 'Fits the vibe you described.',
        orderFirst: 'Ask the bartender for a recommendation.',
        insiderTip: 'Tip generously \u2014 good service compounds.',
      })),
      walkTransitions: itinerary.stops.slice(1).map((_, i) => ({
        minutes: 10,
        line: 'Short walk to the next stop.',
      })),
      conversationHooks: [
        'Ask about the best trip they took this year.',
        'What\u2019s something they\u2019re secretly proud of?',
        'Ask what song they\u2019d play first on a road trip.',
      ],
      whatToWear: itinerary.stops.map(() => 'Smart-casual. Jeans are fine. Skip the sneakers if they\u2019re running.'),
      photoSpots: itinerary.stops.map(() => 'The front entrance is the move \u2014 ask the host.'),
      coldOpen: 'A full night, already figured out. Go.',
      nightAtAGlance: itinerary.stops.map((s) => `${s.startTime} ${s.venue.name}`).join(' \u2192 '),
      producersNote: 'The sequence is the thing. Don\u2019t oversell any single stop.',
      postDateText: 'Had a really good time last night. Same time next week \u2014 my turn to pick?',
      bailoutLine: null,
      extendLine: 'If you\u2019re still laughing at 10:30, the after-spot is right there.',
      paymentNote: 'Slip the card before the bill arrives. Tell the server on your way back from the bathroom.',
      shareBlurb: itinerary.stops.map((s) => s.venue.name).join(' \u2192 '),
    };
  }

  const ctx = itinerary.stops
    .map(
      (s, i) =>
        `Stop ${i + 1} (${s.slot}, starts ${s.startTime}, ~${s.durationMin}min): ${s.venue.name} \u2014 ${s.venue.neighborhood} \u2014 ${s.venue.price} \u2014 ${s.venue.vibe}\nHook: ${s.venue.hook}\nDesc: ${s.venue.desc}\nBooking: ${s.bookingProvider}`
    )
    .join('\n\n');

  const userCtx = `
Occasion: ${itinerary.input.occasion}${itinerary.input.occasionNote ? ` ("${itinerary.input.occasionNote}")` : ''}
Vibe: ${itinerary.input.vibe}${itinerary.input.vibeNote ? ` ("${itinerary.input.vibeNote}")` : ''}
Shape: ${itinerary.input.shape}
Budget: ${itinerary.input.budget}
City: ${itinerary.input.city}
Activity add-on: ${itinerary.input.activity || 'none'}
${itinerary.input.freeText ? `User free-text: "${itinerary.input.freeText}"` : ''}`.trim();

  const historyNote = options?.dateHistory?.length
    ? `\nPrevious venues for this user (already suggested in the last 60 days): ${options.dateHistory.join(', ')}`
    : '';

  const weatherNote = options?.weatherContext
    ? `\nWeather context: ${options.weatherContext.tempF}\u00b0F, ${options.weatherContext.forecast}`
    : '';

  const firstDate = itinerary.input.occasion === 'first-date';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3200,
    // 25s is enough for Haiku even with 3200 max_tokens; Vercel hobby caps at 60s.
    // Without this, a flaky upstream can stall the whole plan request and
    // silently return the static fallbacks, which looks like the bug Nick hit.
    // @ts-ignore \u2014 SDK accepts request-level timeout
    timeout: 25000,
    system: `You are the DatingDex Date Producer.
${VOICE_GUIDE}

CRITICAL RULES:
1. Only reference the venues in the user\u2019s plan. Never invent venues.
2. Output must be valid JSON matching the schema below. No prose outside JSON.
3. Humor rule: max ONE line of humor per section. Not zany. Observational.
4. ${firstDate ? 'This is a first date \u2014 include a bailout line (escape hatch after first drink) in case the vibe is off. Discreet. Kind.' : 'Not a first date \u2014 set bailoutLine to null.'}
5. Every beats.insiderTip should reveal something that only a regular would know. If you don\u2019t know a specific insider detail, write a tactical seating / ordering tip that\u2019s still specific to the cuisine or format.`,
    messages: [
      {
        role: 'user',
        content: `${userCtx}${historyNote}${weatherNote}

Stops:
${ctx}

Total estimated cost: $${itinerary.totalEstimateUsd[0]}\u2013${itinerary.totalEstimateUsd[1]} for two
Walking between stops: ${itinerary.walkingMinutes} min

Return ONLY valid JSON in this exact shape:
{
  "coldOpen": "ONE line at the very top of the page. Sets the read. Example: 'Second date, natural wine girl, $120 \u2014 you want to walk in looking like you\u2019ve been here before. Here\u2019s the move.' Max 30 words. ONE wink allowed. No exclamation marks.",
  "nightAtAGlance": "One line summary: '7:00 Drinks \u2192 8:15 Dinner \u2192 10:00 After-spot \u00b7 0.4mi total \u00b7 ~$110 pp'",
  "blurbs": [
    "Stop 1 choreography as ONE flowing paragraph, 4\u20135 sentences. Arrival, where to sit, what to order first, the angle, how to transition.",
    "Stop 2 paragraph...",
    ...
  ],
  "beats": [
    {
      "arrival": "15 words: exactly what to do when you walk in. No fluff.",
      "whyThisWorks": "ONE sentence calling back to the user\u2019s vibe + occasion. No clich\u00e9s.",
      "orderFirst": "One drink, one bite. Named. 'Start with the pet-nat from the Loire and the whipped cod roe.'",
      "insiderTip": "One thing only a regular would know, or the most tactical ordering/seating tip that\u2019s still venue-specific."
    },
    ...one object per stop
  ],
  "walkTransitions": [
    {
      "minutes": 3,
      "line": "Micro beat between stop 1 and stop 2. Observational. Warm. Example: '3 minutes, walk down 14th. If she says she\u2019s cold, that\u2019s your move \u2014 the jacket thing still works in 2026.'"
    },
    ...one fewer than stops
  ],
  "conversationHooks": [
    "3 specific, calibrated conversation starters. Not 'ask about their job.' Example for anniversary: 'What\u2019s something this year you\u2019re secretly proud of that I don\u2019t know about?' Tailor to occasion.",
    "...",
    "..."
  ],
  "whatToWear": [
    "One line per stop. Tactical, not a clothing store. Example: 'Collared shirt, no tie. She\u2019ll be overdressed no matter what \u2014 lean into it by wearing the good jacket.'",
    ...one per stop
  ],
  "photoSpots": [
    "One line per stop calling out WHERE the photo is. Example: 'The mural on the north wall at Allegory is the photo. Ask the bartender to take it \u2014 he will.'",
    ...one per stop
  ],
  "producersNote": "Bottom of the plan. One short paragraph. Zoom out. Dry, knowing. Example: 'The whole arc here is momentum: you arrive somewhere cool, move somewhere intimate, end somewhere surprising. Don\u2019t oversell any single stop \u2014 the sequence is the thing. If dinner runs long, skip the after-spot. The \"we didn\u2019t need it\" is the story you\u2019ll tell later.'",
  "postDateText": "A casual follow-up text to send the next morning. References something specific from the plan. Under 25 words. Example: 'Had a really good time last night. Let\u2019s do it again soon \u2014 my turn to pick the spot.'",
  "bailoutLine": ${firstDate ? '"First-date only. Discreet escape line after drink one. Example: \\"If it\u2019s not working, the move is \u2018this was great, I have an early morning\u2019 after the first drink. Don\u2019t order food. No hard feelings \u2014 everyone\u2019s done it.\\""' : 'null'},
  "extendLine": "If it\u2019s going great, extend. Short. Example: 'If you\u2019re still laughing at 10:30, walk to the after-spot. It\u2019s right there.'",
  "paymentNote": "One tactical line. Example: 'Expected total ~$180 before tip. If you\u2019re paying, slip the card before the bill arrives \u2014 tell the server on your way back from the bathroom.'",
  "shareBlurb": "One punchy line under 90 chars for social sharing"
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
      blurbs: Array.isArray(parsed.blurbs) ? parsed.blurbs : itinerary.stops.map((_, i) => fallbackBlurb(i)),
      beats: Array.isArray(parsed.beats) ? parsed.beats : [],
      walkTransitions: Array.isArray(parsed.walkTransitions) ? parsed.walkTransitions : [],
      conversationHooks: Array.isArray(parsed.conversationHooks) ? parsed.conversationHooks : [],
      whatToWear: Array.isArray(parsed.whatToWear) ? parsed.whatToWear : [],
      photoSpots: Array.isArray(parsed.photoSpots) ? parsed.photoSpots : [],
      coldOpen: parsed.coldOpen || 'A full night, already figured out. Go.',
      nightAtAGlance: parsed.nightAtAGlance || itinerary.stops.map((s) => `${s.startTime} ${s.venue.name}`).join(' \u2192 '),
      producersNote: parsed.producersNote || 'The sequence is the thing. Don\u2019t oversell any single stop.',
      postDateText: parsed.postDateText || 'Had a really good time last night. Same time next week?',
      bailoutLine: firstDate ? (parsed.bailoutLine || null) : null,
      extendLine: parsed.extendLine || 'If you\u2019re still laughing at 10:30, the after-spot is right there.',
      paymentNote: parsed.paymentNote || 'Slip the card before the bill arrives. Tell the server on your way back from the bathroom.',
      shareBlurb: parsed.shareBlurb || itinerary.stops.map((s) => s.venue.name).join(' \u2192 '),
    };
  } catch (e) {
    console.error('writeFullPlan parse failed', e);
    return {
      blurbs: itinerary.stops.map((_, i) => fallbackBlurb(i)),
      beats: [],
      walkTransitions: [],
      conversationHooks: [],
      whatToWear: [],
      photoSpots: [],
      coldOpen: 'A full night, already figured out. Go.',
      nightAtAGlance: itinerary.stops.map((s) => `${s.startTime} ${s.venue.name}`).join(' \u2192 '),
      producersNote: 'The sequence is the thing. Don\u2019t oversell any single stop.',
      postDateText: 'Had a really good time last night.',
      bailoutLine: null,
      extendLine: 'If it\u2019s going well, extend the night.',
      paymentNote: 'Slip the card before the bill arrives.',
      shareBlurb: itinerary.stops.map((s) => s.venue.name).join(' \u2192 '),
    };
  }
}

// ------------------------------------------------------------
// Legacy compatibility \u2014 older callers use writeChoreography.
// Keep it as a thin adapter that returns the legacy shape.
// ------------------------------------------------------------
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
  const full = await writeFullPlan(itinerary, { dateHistory: options?.dateHistory });
  return {
    blurbs: full.blurbs,
    shareBlurb: full.shareBlurb,
    copilot: options?.includeeCopilot
      ? {
          dressCode: full.whatToWear?.[0] || 'Smart-casual. Jeans are fine.',
          conversationOpeners: full.conversationHooks?.slice(0, 3) || [],
          postDateText: full.postDateText,
          arrivalTip: full.beats?.[0]?.arrival || 'Arrive a few minutes early.',
        }
      : undefined,
  };
}

export { writeChoreography as writeBlurbs };

export function validateVenues(itinerary: Itinerary): Itinerary {
  const validSlugs = new Set(VENUES.map((v) => v.slug));
  const validStops = itinerary.stops.filter((s) => validSlugs.has(s.venue.slug));
  return { ...itinerary, stops: validStops };
}
