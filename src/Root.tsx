import React from "react";
import { Composition } from "remotion";
import { REEL } from "./brand";
import { calculateReelMetadata, Reel, ReelProps, reelSchema } from "./templates/Reel";

/** Starting point for every reel. Each edit passes its own props (see templates/Reel.tsx). */
const defaultReelProps: ReelProps = {
  clips: [],
  transitionSeconds: 0.4,
  captions: {
    enabled: true,
    maxWordsOnScreen: 3,
    fontSize: 84,
    words: [
      { text: "Your", startMs: 500, endMs: 800 },
      { text: "captions", startMs: 800, endMs: 1300 },
      { text: "go", startMs: 1300, endMs: 1500 },
      { text: "here.", startMs: 1500, endMs: 2000 },
      { text: "White", startMs: 2300, endMs: 2700 },
      { text: "with", startMs: 2700, endMs: 2900 },
      { text: "a", startMs: 2900, endMs: 3000 },
      { text: "soft", startMs: 3000, endMs: 3400 },
      { text: "shadow.", startMs: 3400, endMs: 4200 },
    ],
  },
  broll: [],
  titles: [],
  zooms: [],
  soundEffects: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        schema={reelSchema}
        defaultProps={defaultReelProps}
        calculateMetadata={calculateReelMetadata}
        durationInFrames={REEL.fps * 5}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
    </>
  );
};
