Set up my personal AI-powered video editing workspace for creating vertical short-form content for Facebook Reels, Instagram Reels and TikTok. I'm not technical, so explain each step in plain words as you go.

Project specifications:
- Video format: 1080x1920 (9:16 vertical)
- Frame rate: 30fps
- Framework: Remotion with TypeScript
- The workspace should support automated editing, captions, B-roll, sound effects, background music and reusable video templates.

Setup instructions:
1. Check which computer I'm on (Mac or Windows) and use the right install commands for it.
2. Create a new Remotion project in this folder using `npm create video@latest`, choosing the blank template and TypeScript.
3. Check whether FFmpeg is installed. If not, install it (on Mac: `brew install ffmpeg`).
4. Check that Node.js is version 22 or newer (HyperFrames needs it). If not, tell me and help me update it.
5. Set up whisper.cpp for local audio transcription. Clone and build it inside `bin/whisper.cpp` and download the `base.en` model.
6. Create a transcription script at `scripts/transcribe.mjs`. It should accept an MP4 file, extract and transcribe its audio with whisper.cpp, and save JSON with word-level timestamps in milliseconds, in this shape: `{ text, startMs, endMs }`.
7. Create an organized asset library with these folders:
   - `public/recordings` – original video recordings
   - `public/screen-recordings` – screen recordings and tutorials
   - `public/images` – photos, graphics and screenshots
   - `public/sound-effects` – sound effects and audio transitions
   - `public/music` – background music
   - `brand` – brand fonts, colors and visual guidelines
   - `hyperframes` – video editing and animation assets
   - `ready to post` – final exported videos
8. Install HyperFrames and verify it works with `npx hyperframes --help` (or `npx hyperframes doctor`). Check that Google Chrome is installed for rendering.
9. Install yt-dlp (for downloading my own reels) and a person segmentation tool (MediaPipe selfie segmentation or rembg) so I can put text behind my head.
10. Save the attached SKILL.md to `.claude/skills/reel-standard-edit/SKILL.md` in this folder. That's my editing standard for every reel.
11. Prepare the project so it supports reusable editing templates, animated captions (plain white text with a soft shadow, no background box), B-roll, transitions, music and sound effects.

Important: Do not create or edit any videos yet. First finish the whole setup, check that every tool works, confirm the project builds, and then give me a short summary of what's installed, which folders were created, and anything still left for me to do. Ask my permission before creating folders or installing anything.
