import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { linearTiming, TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { z } from "zod";
import { brand, REEL, SAFE_ZONE } from "../brand";
import { Captions } from "../components/Captions";
import { wordSchema } from "../lib/captions";

/**
 * The reusable reel template. Every edit is just a different set of props:
 * clips (with transitions), captions, B-roll, titles (incl. text-behind-head),
 * subtle zooms, music and sound effects. All times are on the final reel's timeline,
 * except a clip's `trimStartSeconds`, which is where to start inside that source file.
 *
 * File paths are relative to the `public` folder, e.g. "recordings/my-clip.mp4".
 */

const transitionSchema = z.enum(["cut", "fade", "slide", "wipe"]);

export const reelSchema = z.object({
  clips: z.array(
    z.object({
      src: z.string(),
      trimStartSeconds: z.number().min(0).default(0),
      durationSeconds: z.number().positive(),
      /** Transition INTO this clip from the previous one. Ignored on the first clip. */
      transitionIn: transitionSchema.default("cut"),
      volume: z.number().min(0).max(2).default(1),
    }),
  ),
  transitionSeconds: z.number().min(0.1).max(2).default(0.4),
  captions: z.object({
    enabled: z.boolean().default(true),
    words: z.array(wordSchema).default([]),
    maxWordsOnScreen: z.number().int().min(1).max(4).default(3),
    fontSize: z.number().default(84),
  }),
  broll: z
    .array(
      z.object({
        src: z.string(),
        kind: z.enum(["video", "image"]),
        startSeconds: z.number().min(0),
        durationSeconds: z.number().positive(),
        trimStartSeconds: z.number().min(0).default(0),
        /** "full" covers the screen; "card" shows it as a rounded picture-in-picture. */
        layout: z.enum(["full", "card"]).default("full"),
      }),
    )
    .default([]),
  titles: z
    .array(
      z.object({
        text: z.string(),
        startSeconds: z.number().min(0),
        durationSeconds: z.number().positive(),
        style: z.enum(["magazine", "plain"]).default("magazine"),
        /** Transparent cut-out of the speaker (WebM with alpha), full reel length. Puts the title behind her head. */
        cutoutSrc: z.string().optional(),
      }),
    )
    .default([]),
  zooms: z
    .array(
      z.object({
        startSeconds: z.number().min(0),
        durationSeconds: z.number().positive(),
        /** Subtle punch-in only: 1.05 to 1.12. */
        scale: z.number().min(1).max(1.12).default(1.08),
      }),
    )
    .default([]),
  music: z
    .object({
      src: z.string(),
      volume: z.number().min(0).max(1).default(0.12),
      fadeOutSeconds: z.number().min(0).default(1.5),
    })
    .optional(),
  soundEffects: z
    .array(z.object({ src: z.string(), atSeconds: z.number().min(0), volume: z.number().min(0).max(2).default(0.6) }))
    .default([]),
});

export type ReelProps = z.infer<typeof reelSchema>;

const asSrc = (p: string) => (/^(https?:|data:|blob:)/.test(p) ? p : staticFile(p));
const sec = (s: number, fps: number) => Math.round(s * fps);

const presentationFor = (t: z.infer<typeof transitionSchema>): TransitionPresentation<Record<string, unknown>> => {
  switch (t) {
    case "slide":
      return slide({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>;
    case "wipe":
      return wipe({ direction: "from-left" }) as TransitionPresentation<Record<string, unknown>>;
    default:
      return fade() as TransitionPresentation<Record<string, unknown>>;
  }
};

export const calculateReelMetadata: CalculateMetadataFunction<ReelProps> = ({ props: input }) => {
  // Fill in defaults for anything left out (e.g. trimStartSeconds, volume, transitionIn).
  const props = reelSchema.parse(input);
  const fps = REEL.fps;
  const t = sec(props.transitionSeconds, fps);
  const total = props.clips.reduce((sum, clip, i) => {
    const overlap = i > 0 && clip.transitionIn !== "cut" ? t : 0;
    return sum + sec(clip.durationSeconds, fps) - overlap;
  }, 0);
  return {
    durationInFrames: Math.max(total, sec(1, fps)),
    fps,
    width: REEL.width,
    height: REEL.height,
    props,
  };
};

export const Reel: React.FC<ReelProps> = (props) => {
  const { fps } = useVideoConfig();
  const t = sec(props.transitionSeconds, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.background }}>
      {/* 1. Main footage, with subtle punch-in zooms */}
      <ZoomLayer zooms={props.zooms}>
        {props.clips.length === 0 ? (
          <EmptyState />
        ) : (
          <TransitionSeries>
            {props.clips.flatMap((clip, i) => {
              const nodes: React.ReactNode[] = [];
              if (i > 0 && clip.transitionIn !== "cut") {
                nodes.push(
                  <TransitionSeries.Transition
                    key={`t${i}`}
                    presentation={presentationFor(clip.transitionIn)}
                    timing={linearTiming({ durationInFrames: t })}
                  />,
                );
              }
              nodes.push(
                <TransitionSeries.Sequence key={`c${i}`} durationInFrames={sec(clip.durationSeconds, fps)}>
                  <OffthreadVideo
                    src={asSrc(clip.src)}
                    trimBefore={sec(clip.trimStartSeconds, fps)}
                    volume={clip.volume}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </TransitionSeries.Sequence>,
              );
              return nodes;
            })}
          </TransitionSeries>
        )}
      </ZoomLayer>

      {/* 2. B-roll */}
      {props.broll.map((b, i) => (
        <Sequence key={`b${i}`} from={sec(b.startSeconds, fps)} durationInFrames={sec(b.durationSeconds, fps)}>
          <BRoll item={b} />
        </Sequence>
      ))}

      {/* 3. Titles (optionally behind the speaker's head) */}
      {props.titles.map((title, i) => (
        <Sequence
          key={`ti${i}`}
          from={sec(title.startSeconds, fps)}
          durationInFrames={sec(title.durationSeconds, fps)}
        >
          <Title text={title.text} style={title.style} />
          {title.cutoutSrc ? (
            <OffthreadVideo
              src={asSrc(title.cutoutSrc)}
              trimBefore={sec(title.startSeconds, fps)}
              transparent
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </Sequence>
      ))}

      {/* 4. Captions */}
      {props.captions.enabled ? (
        <Captions
          words={props.captions.words}
          maxWords={props.captions.maxWordsOnScreen}
          fontSize={props.captions.fontSize}
        />
      ) : null}

      {/* 5. Music and sound effects */}
      {props.music ? <Music {...props.music} /> : null}
      {props.soundEffects.map((s, i) => (
        <Sequence key={`s${i}`} from={sec(s.atSeconds, fps)} layout="none">
          <Audio src={asSrc(s.src)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const ZoomLayer: React.FC<{ zooms: ReelProps["zooms"]; children: React.ReactNode }> = ({ zooms, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ramp = Math.round(fps * 0.25);
  let scale = 1;
  for (const z of zooms) {
    const start = sec(z.startSeconds, fps);
    const end = start + sec(z.durationSeconds, fps);
    if (frame >= start - 1 && frame <= end + ramp) {
      scale = interpolate(frame, [start, start + ramp, end, end + ramp], [1, z.scale, z.scale, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      });
    }
  }
  return <AbsoluteFill style={{ transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
};

const BRoll: React.FC<{ item: ReelProps["broll"][number] }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, 6, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const media =
    item.kind === "video" ? (
      <OffthreadVideo
        src={asSrc(item.src)}
        trimBefore={sec(item.trimStartSeconds, fps)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <Img src={asSrc(item.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    );

  if (item.layout === "card") {
    const rise = interpolate(frame, [0, 8], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill style={{ opacity, alignItems: "center", paddingTop: SAFE_ZONE.top + 80 }}>
        <div
          style={{
            width: 820,
            height: 820,
            borderRadius: 36,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            transform: `translateY(${rise}px)`,
          }}
        >
          {media}
        </div>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ opacity }}>{media}</AbsoluteFill>;
};

const Title: React.FC<{ text: string; style: "magazine" | "plain" }> = ({ text, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 10], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const magazine = style === "magazine";
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: SAFE_ZONE.top,
        paddingLeft: SAFE_ZONE.left,
        paddingRight: SAFE_ZONE.left,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: magazine ? brand.titleFont : brand.captionFont,
          fontWeight: magazine ? 900 : 800,
          fontSize: magazine ? 220 : 110,
          lineHeight: 0.9,
          letterSpacing: magazine ? "-0.02em" : 0,
          textTransform: magazine ? "uppercase" : "none",
          color: brand.colors.text,
          textAlign: "center",
          textShadow: "0 6px 24px rgba(0,0,0,0.35)",
          transform: `translateY(${y}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Music: React.FC<NonNullable<ReelProps["music"]>> = ({ src, volume, fadeOutSeconds }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = Math.max(1, sec(fadeOutSeconds, fps));
  return (
    <Audio
      src={asSrc(src)}
      loop
      volume={(f) =>
        interpolate(f, [0, 10, durationInFrames - fadeFrames, durationInFrames], [0, volume, volume, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};

const EmptyState: React.FC = () => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      color: "#888",
      fontFamily: brand.captionFont,
      fontSize: 48,
      textAlign: "center",
      padding: 120,
    }}
  >
    Reel template ready. Add a clip from public/recordings.
  </AbsoluteFill>
);
