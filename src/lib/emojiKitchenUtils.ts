// Ensure window types are available if not already globally defined in the project
declare global {
  interface Window {
    points: string[];
    revisions: number[];
    pairs: string;
    // Optional: add counts and point_names if they become necessary
    // counts?: number[];
    // point_names?: string[];
  }
}

// Helper function to convert numbers between bases (used for decoding indices)
export function convertBase(value: string, from_base: number, to_base: number): string {
  const range = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
  const from_range = range.slice(0, from_base);
  const to_range = range.slice(0, to_base);

  let dec_value = value.split('').reverse().reduce((carry, digit, index) => {
    const digitValue = from_range.indexOf(digit);
    if (digitValue === -1) throw new Error(`Invalid digit \`${digit}\` for base ${from_base}.`);
    return carry + digitValue * (Math.pow(from_base, index));
  }, 0);

  if (dec_value === 0) return '0';

  let new_value = '';
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = Math.floor(dec_value / to_base);
  }
  return new_value;
}

// Function to construct the fused emoji image URL
export const mixmojiUrl = (revision: number, codepoints: [string, string]): string => {
  const r = revision;
  const c = [...codepoints]; // Create a mutable copy

  const padZeros = r < 20220500;

  c[0] = c[0].split(/-/g)
             .map(s => (padZeros && s.length < 4) ? s.padStart(4, "0") : s)
             .join("-u");

  c[1] = c[1].split(/-/g)
             .map(s => (padZeros && s.length < 4) ? s.padStart(4, "0") : s)
             .join("-u");

  // Retaining original logic for handling single vs multi-codepoint strings if necessary
  if (c[0] && !codepoints[0].includes('-')) c[0] = codepoints[0];
  if (c[1] && !codepoints[1].includes('-')) c[1] = codepoints[1];


  return `https://www.gstatic.com/android/keyboard/emojikitchen/${r}/u${c[0]}/u${c[0]}_u${c[1]}.png`;
};

export interface EmojiCombinationData {
  partnerCodepoint: string;
  revisionDate: number;
  baseForThisPair: string; // Canonical base emoji for the URL
  secondaryForThisPair: string; // Canonical secondary emoji for the URL
}

const emojiCombinationLinks: Map<string, Array<EmojiCombinationData>> = new Map();
let isDataProcessed = false;

export function processEmojiData(): void {
  if (typeof window === 'undefined' || !window.points || !window.revisions || !window.pairs) {
    console.warn("Emoji Kitchen data not found on window object. Ensure emojiKitchen.ts (or its data source) is loaded before this script runs or its functions are called.");
    return;
  }

  if (isDataProcessed || window.points.length === 0 || window.revisions.length === 0 || (typeof window.pairs === 'string' && window.pairs.trim() === '')) {
    return;
  }

  const lines = window.pairs.trim().split('\n');
  for (const line of lines) {
    const parts = line.split('.');
    if (parts.length >= 3) {
      const dateIndexB64 = parts[0];
      const emoji1IndexB64 = parts[1];
      const emoji2IndexB64 = parts[2];

      try {
        const dateIdx = parseInt(convertBase(dateIndexB64, 64, 10), 10);
        const emoji1Idx = parseInt(convertBase(emoji1IndexB64, 64, 10), 10);
        const emoji2Idx = parseInt(convertBase(emoji2IndexB64, 64, 10), 10);

        if (dateIdx < window.revisions.length && emoji1Idx < window.points.length && emoji2Idx < window.points.length) {
          const revisionDate = window.revisions[dateIdx];
          const originalBaseCp = window.points[emoji1Idx];    // emoji1 is the original base
          const originalSecondaryCp = window.points[emoji2Idx]; // emoji2 is the original secondary

          const comboDataDefinition: Omit<EmojiCombinationData, 'partnerCodepoint'> = {
            revisionDate,
            baseForThisPair: originalBaseCp,
            secondaryForThisPair: originalSecondaryCp,
          };

          // Store for originalBaseCp -> originalSecondaryCp
          if (!emojiCombinationLinks.has(originalBaseCp)) {
            emojiCombinationLinks.set(originalBaseCp, []);
          }
          emojiCombinationLinks.get(originalBaseCp)!.push({ ...comboDataDefinition, partnerCodepoint: originalSecondaryCp });

          // Store for originalSecondaryCp -> originalBaseCp (symmetrical lookup)
          if (originalBaseCp !== originalSecondaryCp) {
            if (!emojiCombinationLinks.has(originalSecondaryCp)) {
               emojiCombinationLinks.set(originalSecondaryCp, []);
            }
            // For this entry, partner is originalBaseCp, but base/secondary for URL remain originalBaseCp/originalSecondaryCp
            emojiCombinationLinks.get(originalSecondaryCp)!.push({ ...comboDataDefinition, partnerCodepoint: originalBaseCp });
          }
        }
      } catch (error) {
        // console.warn("Skipping invalid pair line:", line, error);
      }
    }
  }
  isDataProcessed = true;
  console.log("Emoji Kitchen data processed (v2) from window. Combinations found for:", emojiCombinationLinks.size, "base emojis.");
}

function ensureDataProcessed(): boolean {
    if (!isDataProcessed) {
        if (typeof window !== 'undefined' && window.points && window.revisions && window.pairs &&
            window.points.length > 0 && window.revisions.length > 0 && (typeof window.pairs === 'string' && window.pairs.trim().length > 0)) {
            processEmojiData();
        } else {
            console.warn("Emoji data not ready or available on window for processing.");
            return false;
        }
    }
    return isDataProcessed;
}

// Adjusted getEmojiCombinations to reflect new stored data structure if it were to be used.
// For now, focusing on getSpecificCombinationUrl. If getEmojiCombinations is used, it needs similar logic.
export function getEmojiCombinations(emoji1Codepoint: string): Array<{ emoji1: string, emoji2: string, imageUrl: string }> {
  if (!ensureDataProcessed()) {
    return [];
  }

  const combinations = emojiCombinationLinks.get(emoji1Codepoint) || [];
  return combinations.map(combo => ({
    emoji1: combo.baseForThisPair, // Or emoji1Codepoint if that's preferred as the 'query' emoji
    emoji2: combo.secondaryForThisPair, // Or combo.partnerCodepoint
    imageUrl: mixmojiUrl(combo.revisionDate, [combo.baseForThisPair, combo.secondaryForThisPair]),
  }));
}

export function getSpecificCombinationUrl(emoji1: string, emoji2: string): string | null {
    if (!ensureDataProcessed()) {
        return null;
    }

    const combosForEmojiA = emojiCombinationLinks.get(emoji1); // emoji1 is the first param
    if (combosForEmojiA) {
        const specificCombo = combosForEmojiA.find(c => c.partnerCodepoint === emoji2); // emoji2 is the second param
        if (specificCombo) {
            // Use the stored canonical base and secondary for the URL
            return mixmojiUrl(specificCombo.revisionDate, [specificCombo.baseForThisPair, specificCombo.secondaryForThisPair]);
        }
    }
    // If not found via emoji1 as key, it implies the pair doesn't exist or wasn't processed correctly.
    // The symmetrical storage in processEmojiData ensures that if (A,B) or (B,A) exists as an original pair,
    // looking up A should find B as a partner, and the comboData will hold the true base/secondary.
    return null;
}
