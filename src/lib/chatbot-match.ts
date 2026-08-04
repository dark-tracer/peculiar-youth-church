export type KnowledgeEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  category: string | null;
};

export type KnowledgeDoc = {
  id: string;
  file_name: string;
  extracted_text: string | null;
  category: string | null;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "did", "do", "does",
  "for", "from", "get", "has", "have", "how", "i", "in", "is", "it", "me",
  "my", "of", "on", "or", "our", "please", "so", "тhe", "that", "the", "there",
  "this", "to", "up", "we", "what", "when", "where", "which", "who", "why",
  "will", "with", "you", "your",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** Lightweight stem so "services"/"service" and "giving"/"give" match. */
function stem(word: string): string {
  return word
    .replace(/(ings|ing|ies|ied|es|ed|s)$/i, "")
    .replace(/(.)\1$/, "$1");
}

function overlapScore(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;
  const target = new Set(targetTokens.map(stem));
  let hits = 0;
  for (const token of queryTokens) {
    const s = stem(token);
    if (target.has(s)) {
      hits += 1;
      continue;
    }
    // partial containment (e.g. "donation" vs "donate")
    for (const t of target) {
      if (t.length > 3 && s.length > 3 && (t.startsWith(s) || s.startsWith(t))) {
        hits += 0.75;
        break;
      }
    }
  }
  return hits / queryTokens.length;
}

export type MatchResult =
  | { kind: "qa"; answer: string; score: number; source: KnowledgeEntry }
  | { kind: "document"; answer: string; score: number; fileName: string }
  | { kind: "none" };

const QA_THRESHOLD = 0.4;
const DOC_THRESHOLD = 0.55;

export function findAnswer(
  question: string,
  entries: KnowledgeEntry[],
  docs: KnowledgeDoc[] = [],
): MatchResult {
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) return { kind: "none" };

  let best: { entry: KnowledgeEntry; score: number } | null = null;
  for (const entry of entries) {
    const keywordScore = overlapScore(queryTokens, (entry.keywords ?? []).flatMap(tokenize));
    const questionScore = overlapScore(queryTokens, tokenize(entry.question));
    const answerScore = overlapScore(queryTokens, tokenize(entry.answer)) * 0.5;
    const score = Math.max(keywordScore * 1.1, questionScore, answerScore);
    if (!best || score > best.score) best = { entry, score };
  }

  if (best && best.score >= QA_THRESHOLD) {
    return { kind: "qa", answer: best.entry.answer, score: best.score, source: best.entry };
  }

  // Fall back to scanning uploaded document text sentence by sentence.
  let bestDoc: { text: string; score: number; fileName: string } | null = null;
  for (const doc of docs) {
    const text = doc.extracted_text ?? "";
    if (!text) continue;
    const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 25);
    for (const sentence of sentences) {
      const score = overlapScore(queryTokens, tokenize(sentence));
      if (!bestDoc || score > bestDoc.score) {
        bestDoc = { text: sentence.trim(), score, fileName: doc.file_name };
      }
    }
  }

  if (bestDoc && bestDoc.score >= DOC_THRESHOLD) {
    return {
      kind: "document",
      answer: bestDoc.text.slice(0, 600),
      score: bestDoc.score,
      fileName: bestDoc.fileName,
    };
  }

  return { kind: "none" };
}

export const NO_ANSWER_REPLY =
  "I do not have an answer for that yet. Your question has been sent to our team and someone will follow up with you.";

export const CHATBOT_CATEGORIES = [
  "General",
  "Events",
  "Sermons",
  "Bible Studies",
  "Service Times",
  "Contact",
] as const;
