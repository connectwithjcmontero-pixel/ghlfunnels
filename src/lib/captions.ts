import { z } from "zod";

/** One word from scripts/transcribe.mjs. Times are on the final reel's timeline. */
export const wordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});
export type Word = z.infer<typeof wordSchema>;

export type CaptionPage = {
  words: Word[];
  startMs: number;
  endMs: number;
};

/**
 * Group words into short "pages" of 1 to `maxWords` words.
 * A new page also starts after a pause or at the end of a sentence.
 */
export const groupWords = (words: Word[], maxWords = 3, pauseMs = 350): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let current: Word[] = [];

  const flush = () => {
    if (current.length === 0) return;
    pages.push({ words: current, startMs: current[0].startMs, endMs: current[current.length - 1].endMs });
    current = [];
  };

  for (const word of words) {
    const prev = current[current.length - 1];
    if (prev && (current.length >= maxWords || word.startMs - prev.endMs > pauseMs)) flush();
    current.push(word);
    if (/[.!?]$/.test(word.text)) flush();
  }
  flush();

  // Keep each page on screen until the next one starts (no flicker between pages).
  for (let i = 0; i < pages.length - 1; i++) {
    const gap = pages[i + 1].startMs - pages[i].endMs;
    if (gap > 0 && gap < 600) pages[i].endMs = pages[i + 1].startMs;
  }
  return pages;
};
