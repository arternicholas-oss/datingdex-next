// ── Dating Intelligence System ─────────────────────────────────
// Replaces traditional star ratings with emotionally intelligent,
// scenario-based tags that feel like insider dating advice.

export type VibeLabel =
  | "Soft Life Energy"
  | "Rich Date Energy"
  | "We Outside Energy"
  | "High Value Date Spot"
  | "Treat Yourself Vibes"
  | "Champagne Night Energy"
  | "CEO Date Night"
  | "First-Class Energy";

export type ConversationLabel =
  | "Deep Connection"
  | "Easy & Flowing"
  | "Balanced"
  | "Light & Playful"
  | "Not Ideal for Talking";

export type PrivacyLabel =
  | "No Privacy"
  | "Low Privacy"
  | "Medium Privacy"
  | "High Privacy"
  | "Very Intimate";

export type KissLikelihoodLabel =
  | "Not Likely"
  | "Low Chance"
  | "Possible"
  | "High Chance"
  | "Very Likely";

export interface DatingIntelligenceData {
  vibe_label: VibeLabel;
  vibe_flavor: string;
  conversation_label: ConversationLabel;
  conversation_flavor: string;
  privacy_label: PrivacyLabel;
  privacy_flavor: string;
  kiss_likelihood_label: KissLikelihoodLabel;
  kiss_likelihood_flavor: string;
}

export type CategoryType = "vibe" | "conversation" | "privacy" | "kiss_likelihood";

export interface DisplayCategory {
  type: CategoryType;
  emoji: string;
  label: string;
  flavor: string;
  sentiment: "positive" | "neutral" | "caution";
  categoryName: string;
}

const CATEGORY_EMOJI: Record<CategoryType, string> = {
  vibe: "✨",
  conversation: "💬",
  privacy: "🔒",
  kiss_likelihood: "👌",
};

const CATEGORY_NAME: Record<CategoryType, string> = {
  vibe: "Vibe",
  conversation: "Conversation",
  privacy: "Privacy",
  kiss_likelihood: "Kiss Likelihood",
};

type AllLabels = VibeLabel | ConversationLabel | PrivacyLabel | KissLikelihoodLabel;

const SENTIMENT_MAP: Record<AllLabels, "positive" | "neutral" | "caution"> = {
  // Vibe
  "Soft Life Energy": "positive",
  "Rich Date Energy": "positive",
  "We Outside Energy": "positive",
  "High Value Date Spot": "positive",
  "Treat Yourself Vibes": "positive",
  "Champagne Night Energy": "positive",
  "CEO Date Night": "positive",
  "First-Class Energy": "positive",
  // Conversation
  "Deep Connection": "positive",
  "Easy & Flowing": "positive",
  "Balanced": "neutral",
  "Light & Playful": "neutral",
  "Not Ideal for Talking": "caution",
  // Privacy
  "No Privacy": "caution",
  "Low Privacy": "neutral",
  "Medium Privacy": "neutral",
  "High Privacy": "positive",
  "Very Intimate": "positive",
  // Kiss Likelihood
  "Not Likely": "caution",
  "Low Chance": "neutral",
  "Possible": "neutral",
  "High Chance": "positive",
  "Very Likely": "positive",
};

/** Simple deterministic hash for stable ordering across renders. */
function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Selects which 2–3 categories to display for a venue.
 * All four categories are treated equally — vibe is NOT given priority.
 * Categories with extreme sentiments (positive / caution) are preferred
 * over neutral ones. Tie-breaking is deterministic but varies per venue
 * so different venues surface different category combos.
 */
export function selectDisplayCategories(data: DatingIntelligenceData): DisplayCategory[] {
  const allCats: DisplayCategory[] = [
    {
      type: "vibe",
      emoji: CATEGORY_EMOJI.vibe,
      label: data.vibe_label,
      flavor: data.vibe_flavor,
      sentiment: SENTIMENT_MAP[data.vibe_label],
      categoryName: CATEGORY_NAME.vibe,
    },
    {
      type: "conversation",
      emoji: CATEGORY_EMOJI.conversation,
      label: data.conversation_label,
      flavor: data.conversation_flavor,
      sentiment: SENTIMENT_MAP[data.conversation_label],
      categoryName: CATEGORY_NAME.conversation,
    },
    {
      type: "privacy",
      emoji: CATEGORY_EMOJI.privacy,
      label: data.privacy_label,
      flavor: data.privacy_flavor,
      sentiment: SENTIMENT_MAP[data.privacy_label],
      categoryName: CATEGORY_NAME.privacy,
    },
    {
      type: "kiss_likelihood",
      emoji: CATEGORY_EMOJI.kiss_likelihood,
      label: data.kiss_likelihood_label,
      flavor: data.kiss_likelihood_flavor,
      sentiment: SENTIMENT_MAP[data.kiss_likelihood_label],
      categoryName: CATEGORY_NAME.kiss_likelihood,
    },
  ];

  // Seed from all labels so each venue gets a unique but stable order
  const seed = stableHash(
    data.vibe_label + data.conversation_label + data.privacy_label + data.kiss_likelihood_label
  );

  // Non-neutral categories are more interesting; hash breaks ties
  const score = (cat: DisplayCategory): number => {
    const interest = cat.sentiment === "neutral" ? 0 : 1;
    return interest * 10000 + (stableHash(cat.type + String(seed)) % 9999);
  };

  allCats.sort((a, b) => score(b) - score(a));

  return allCats.slice(0, 3);
                                          }
