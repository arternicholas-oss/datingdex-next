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

/**
 * Selects which 2–3 categories to display for a venue.
 */
export function selectDisplayCategories(data: DatingIntelligenceData): DisplayCategory[] {
  const categories: DisplayCategory[] = [
    {
      type: "vibe",
      emoji: CATEGORY_EMOJI.vibe,
      label: data.vibe_label,
      flavor: data.vibe_flavor,
      sentiment: SENTIMENT_MAP[data.vibe_label],
      categoryName: CATEGORY_NAME.vibe,
    },
  ];

  const extras: DisplayCategory[] = [];

  if (data.kiss_likelihood_label === "High Chance" || data.kiss_likelihood_label === "Very Likely") {
    extras.push({
      type: "kiss_likelihood",
      emoji: CATEGORY_EMOJI.kiss_likelihood,
      label: data.kiss_likelihood_label,
      flavor: data.kiss_likelihood_flavor,
      sentiment: SENTIMENT_MAP[data.kiss_likelihood_label],
      categoryName: CATEGORY_NAME.kiss_likelihood,
    });
  }

  if (data.privacy_label === "No Privacy" || data.privacy_label === "Very Intimate") {
    extras.push({
      type: "privacy",
      emoji: CATEGORY_EMOJI.privacy,
      label: data.privacy_label,
      flavor: data.privacy_flavor,
      sentiment: SENTIMENT_MAP[data.privacy_label],
      categoryName: CATEGORY_NAME.privacy,
    });
  }

  if (data.conversation_label === "Deep Connection" || data.conversation_label === "Not Ideal for Talking") {
    extras.push({
      type: "conversation",
      emoji: CATEGORY_EMOJI.conversation,
      label: data.conversation_label,
      flavor: data.conversation_flavor,
      sentiment: SENTIMENT_MAP[data.conversation_label],
      categoryName: CATEGORY_NAME.conversation,
    });
  }

  if (extras.length === 0) {
    extras.push({
      type: "kiss_likelihood",
      emoji: CATEGORY_EMOJI.kiss_likelihood,
      label: data.kiss_likelihood_label,
      flavor: data.kiss_likelihood_flavor,
      sentiment: SENTIMENT_MAP[data.kiss_likelihood_label],
      categoryName: CATEGORY_NAME.kiss_likelihood,
    });
  }

  return [...categories, ...extras.slice(0, 2)];
}
