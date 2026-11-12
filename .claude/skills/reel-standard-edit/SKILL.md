---
name: reel-standard-edit
description: Jasmine's standard reel edit. Storyboard first, then captions, text-behind-head, color grades and graphics with Whisper, Remotion and FFmpeg. Use whenever she hands over a reel or raw clip to edit.
---

# Reel Standard Edit

Use this every time Jasmine gives a reel or raw clip to edit. She is not a video editor and does not want to repeat these rules. No CapCut, no Edits app: everything is built with code (Whisper, Remotion, FFmpeg, a person segmentation model).

Work inside her reels workspace (set up with SETUP-PROMPT.md). Never change originals.

## Folders
- `public/recordings` – her raw clips (originals, never edited)
- `public/screen-recordings` – screen recordings and tutorials
- `public/images` – photos, graphics, screenshots
- `public/sound-effects` – sound effects and audio transitions
- `public/music` – background music
- `brand` – fonts, colors, visual guidelines
- `hyperframes` – editing and animation assets
- `ready to post` – final exported videos
- `scripts/transcribe.mjs` – whisper.cpp transcription to `{ text, startMs, endMs }` per word

## 0. Before each reel
If anything is missing or broken (FFmpeg, Node, whisper.cpp, Remotion, HyperFrames, Chrome, yt-dlp, a person segmentation model like MediaPipe or rembg), say what and ask before installing.

## 1. Intake
- Probe the clip with ffprobe: length, resolution, fps, audio.
- Output is always vertical 1080x1920, 30fps, H.264 + AAC, made for a phone screen first.
- If she gives no direction, ask one question: what is the hook, and what should viewers do at the end. Never invent claims, prices or links for on-screen text.

## 2. Storyboard first (required, never skip)
Transcribe with `scripts/transcribe.mjs`, then write a storyboard and get her OK before rendering. One row per beat:
- Timestamp range
- What's said
- What's on screen (effect, text, graphic, grade)
- Why (hook, proof, CTA)

Also list: the grade for the whole reel, caption style, text-behind-head moments, graphics to draw, and anything missing (B-roll, screenshots, a prompt she wants shown). Render only after she approves or edits it.

## 3. Captions (default on every reel)
- `scripts/transcribe.mjs` (whisper.cpp, base.en) for word-level timestamps; Remotion renders them.
- Style: plain white bold text with a soft drop shadow. No green box, no colored background box.
- 1 to 4 words on screen at a time, synced per word.
- Keep inside the safe zone: clear of the bottom ~20% (caption/UI area) and the right-side button column.
- Fix spelling of names and brands before rendering (Jasmine Cruz Montero, FES, Claude, GHL, Facebook).

## 4. Text behind head
- Cut her out frame by frame with person segmentation (MediaPipe selfie segmenter, rembg, or Robust Video Matting). Export a mask or alpha video.
- Remotion layers: background video, then big title text, then her cut-out on top.
- Use on the hook or one key line, 1 to 2 times per reel max.
- Never crop faces or foreheads.

## 5. Vector graphics
- Draw icons, arrows, simple diagrams or illustrations as SVG; animate them in Remotion (draw-on, pop, slide).
- No copyrighted characters or logos she doesn't own.

## 6. Color grades (FFmpeg)
- Warm: shift warmth up (colortemperature or colorbalance), slight saturation up.
- Moody: curves to pull highlights down and lift the blacks, saturation down 15%, soft vignette.
  Starting point: `-vf "curves=all='0/0.06 0.5/0.47 1/0.88',eq=saturation=0.85,vignette=PI/5"`
- Before/after slider: grade with FFmpeg, then a Remotion wipe sliding between original and graded.
- One grade for the whole reel unless the storyboard says otherwise.

## 7. Titles and zooms
- Magazine-cover titles: big serif or condensed type, layered with her cut-out when it fits.
- Zooms: subtle punch-ins only (about 105 to 112%) on emphasis words. Never constant or jumpy.

## 8. Screens and proof
- Use real screenshots or screen recordings (editor timeline, Claude chat, results), not mock-ups. Ask for them in the storyboard if missing.

## 9. 3x3 reel wall
- `yt-dlp <url>` downloads reels from Instagram, TikTok and YouTube.
- Only her own reels, or ones she has permission to use.
- FFmpeg `xstack` builds the 3x3 grid (each tile scaled to 360x640 inside 1080x1920).

## 10. Render and check
- Render to `ready to post/<original-name>-edit.mp4`.
- Pull frames at the hook, middle and end and look at them: captions readable, nothing in the UI zones, no faces cut off, audio in sync.
- Tell her in one or two lines what was done and where the file is.

## Voice for any on-screen copy
Plain, warm, no hype, no fake urgency, no exclamation marks.

## Brand
Check the `brand` folder before storyboarding and match her fonts and colors. If it's empty, ask once for her brand fonts and colors.

## Tools
Remotion (TypeScript) is the main editor. HyperFrames (HeyGen, HTML-based, `npx hyperframes`) is available for ready-made blocks like transitions and social overlays; use whichever fits the beat and say which in the storyboard.
