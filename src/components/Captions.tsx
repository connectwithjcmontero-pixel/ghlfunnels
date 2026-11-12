import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, SAFE_ZONE } from "../brand";
import { CaptionPage, groupWords, Word } from "../lib/captions";

/**
 * Animated captions: plain white bold text with a soft drop shadow, no background box.
 * 1 to 4 words at a time, the current word is fully opaque and the others slightly dimmed.
 */
export const Captions: React.FC<{
  words: Word[];
  maxWords?: number;
  fontSize?: number;
  /** Distance of the caption block from the bottom of the frame, in px. Stays above the UI zone. */
  bottomOffset?: number;
}> = ({ words, maxWords = 3, fontSize = 84, bottomOffset = SAFE_ZONE.bottom + 120 }) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(() => groupWords(words, Math.min(Math.max(maxWords, 1), 4)), [words, maxWords]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {pages.map((page, i) => {
        const from = Math.floor((page.startMs / 1000) * fps);
        const duration = Math.max(1, Math.ceil(((page.endMs - page.startMs) / 1000) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <Page page={page} fontSize={fontSize} bottomOffset={bottomOffset} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const Page: React.FC<{ page: CaptionPage; fontSize: number; bottomOffset: number }> = ({
  page,
  fontSize,
  bottomOffset,
}) => {
  const frame = useCurrentFrame(); // relative to this page's Sequence
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;

  const pop = interpolate(frame, [0, 5], [0.92, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const fadeIn = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_ZONE.left,
        right: SAFE_ZONE.right,
        bottom: bottomOffset,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 0.28em",
        fontFamily: brand.captionFont,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.1,
        color: brand.colors.text,
        textAlign: "center",
        textShadow: "0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.45)",
        transform: `scale(${pop})`,
        opacity: fadeIn,
      }}
    >
      {page.words.map((w, i) => (
        <span key={i} style={{ opacity: nowMs >= w.startMs ? 1 : 0.55 }}>
          {w.text}
        </span>
      ))}
    </div>
  );
};
