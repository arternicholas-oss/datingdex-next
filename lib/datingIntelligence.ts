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
}

const CATEGORY_EMOJI: Record<CategoryType, string> = {
  vibe: "✨",
  conversation: "💬",
  privacy: "🔒",
  kiss_likelihood: "💋",
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
    },
  ];

  const extras: DisplayCategory[] = [];

  if (data.kiss_likelihood_label === "High Chance" || data.kiss_likelihood_label === "Very Likely") {
    extras.push({
      type: "kiss_likelihood",
      emoji: CATEGORY_EMOJI.kiss_likelihood,
      label: data.kiss_likelihood_label,
      flavor: data.kiss_likelihood_flavor,
    });
  }

  if (data.privacy_label === "No Privacy" || data.privacy_label === "Very Intimate") {
    extras.push({
      type: "privacy",
      emoji: CATEGORY_EMOJI.privacy,
      label: data.privacy_label,
      flavor: data.privacy_flavor,
    });
  }

  if (data.conversation_label === "Deep Connection" || data.conversation_label === "Not Ideal for Talking") {
    extras.push({
      type: "conversation",
      emoji: CATEGORY_EMOJI.conversation,
      label: data.conversation_label,
      flavor: data.conversation_flavor,
    });
  }

  if (extras.length === 0) {
    extras.push({
      type: "kiss_likelihood",
      emoji: CATEGORY_EMOJI.kiss_likelihood,
      label: data.kiss_likelihood_label,
      flavor: data.kiss_likelihood_flavor,
    });
  }

  return [...categories, ...extras.slice(0, 2)];
}
