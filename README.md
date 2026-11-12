# Reels Studio

Jasmine's workspace for vertical reels (Facebook, Instagram, TikTok): 1080x1920, 30fps, H.264 + AAC.
Every edit follows `.claude/skills/reel-standard-edit/SKILL.md` (storyboard first, always).

## How to use it
Drop a clip into `public/recordings`, then tell Claude:

> Edit [file name] using my reel standard. Storyboard first.

Finished videos go to `ready to post/`. Originals are never changed.

## Folders
| Folder | What goes in it |
| --- | --- |
| `public/recordings` | original video recordings |
| `public/screen-recordings` | screen recordings and tutorials |
| `public/images` | photos, graphics, screenshots |
| `public/sound-effects` | sound effects and audio transitions |
| `public/music` | background music |
| `brand` | brand fonts, colors, visual guidelines |
| `hyperframes` | HyperFrames editing and animation assets |
| `ready to post` | final exported videos |
| `public/transcripts`, `public/cutouts` | made automatically by the scripts below |

Video, audio and the big tools in `bin/` stay on your computer; they are not uploaded to GitHub.

## Commands (Claude runs these for you)
| Command | What it does |
| --- | --- |
| `npm run transcribe -- public/recordings/clip.mp4` | word-by-word transcript → `public/transcripts/clip.json` (`[{ text, startMs, endMs }]`) |
| `npm run cutout -- public/recordings/clip.mp4` | transparent cut-out of the speaker → `public/cutouts/clip-cutout.webm` (text behind head) |
| `npm run dev` | open Remotion Studio to preview |
| `npx remotion render Reel "ready to post/clip-edit.mp4" --props=props.json` | render a reel |
| `npm run check` | lint, type-check and bundle |
| `npx hyperframes doctor` | check that the video tools are healthy |

## The Reel template (`src/templates/Reel.tsx`)
One reusable template; each reel is just a props file:
- `clips`: one or more cuts from recordings, joined with `cut`, `fade`, `slide` or `wipe`
- `captions`: white bold text with a soft shadow, no box, 1 to 4 words at a time, kept in the safe zone
- `broll`: videos or images, full screen or as a card
- `titles`: magazine-style titles; add `cutoutSrc` to put the title behind the speaker's head
- `zooms`: subtle punch-ins (105 to 112%)
- `music` (with fade-out) and `soundEffects`

Brand fonts and colors live in `src/brand.ts`, along with the phone safe zone.

## Tools in `bin/` (not in GitHub; re-create them on a new computer)
- `bin/whisper.cpp`: clone `https://github.com/ggml-org/whisper.cpp`, build with `cmake -B build && cmake --build build --config Release`, then run `sh models/download-ggml-model.sh base.en`
- `bin/venv`: `python3 -m venv bin/venv && bin/venv/bin/pip install yt-dlp mediapipe opencv-python-headless numpy`
- `bin/models/selfie_segmenter.tflite`: from `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite`

Setup prompt and guide: `reels-kit/`.
