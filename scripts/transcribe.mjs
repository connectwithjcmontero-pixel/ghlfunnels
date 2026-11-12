#!/usr/bin/env node
/**
 * Transcribe a video with whisper.cpp (runs on this computer, nothing is uploaded).
 *
 * Usage:
 *   npm run transcribe -- public/recordings/my-clip.mp4
 *   npm run transcribe -- public/recordings/my-clip.mp4 path/to/output.json
 *
 * Output (default: public/transcripts/<clip-name>.json) is an array of words:
 *   [{ "text": "Hello", "startMs": 120, "endMs": 480 }, ...]
 *
 * The original video is only read, never changed.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const whisperDir = path.join(root, "bin", "whisper.cpp");
const modelPath = path.join(whisperDir, "models", "ggml-base.en.bin");

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function findWhisperCli() {
  const candidates = [
    path.join(whisperDir, "build", "bin", "whisper-cli"),
    path.join(whisperDir, "build", "bin", "Release", "whisper-cli.exe"),
    path.join(whisperDir, "build", "bin", "whisper-cli.exe"),
  ];
  return candidates.find((c) => existsSync(c));
}

const [input, outputArg] = process.argv.slice(2);
if (!input) fail("Give me a video file, e.g. npm run transcribe -- public/recordings/my-clip.mp4");

const inputPath = path.resolve(input);
if (!existsSync(inputPath)) fail(`Can't find the file: ${inputPath}`);

const whisperCli = findWhisperCli();
if (!whisperCli) fail("whisper.cpp isn't built yet. Expected it in bin/whisper.cpp/build/bin.");
if (!existsSync(modelPath)) {
  fail(
    "The base.en speech model is missing. Download it with:\n" +
      "  sh bin/whisper.cpp/models/download-ggml-model.sh base.en",
  );
}

const clipName = path.parse(inputPath).name;
const outputPath = path.resolve(outputArg ?? path.join(root, "public", "transcripts", `${clipName}.json`));
mkdirSync(path.dirname(outputPath), { recursive: true });

const work = mkdtempSync(path.join(tmpdir(), "transcribe-"));
try {
  // 1. Pull the audio out as 16 kHz mono WAV (the format whisper.cpp expects).
  const wavPath = path.join(work, "audio.wav");
  console.log(`→ Extracting audio from ${path.basename(inputPath)}`);
  const ff = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wavPath],
    { stdio: "inherit" },
  );
  if (ff.error) fail("FFmpeg isn't installed or isn't on the PATH.");
  if (ff.status !== 0) fail("FFmpeg couldn't read the audio from this file. Does it have sound?");

  // 2. Transcribe, one word per segment (-ml 1 -sow) so every word gets its own timing.
  console.log("→ Transcribing with whisper.cpp (base.en)");
  const outBase = path.join(work, "result");
  const wh = spawnSync(
    whisperCli,
    ["-m", modelPath, "-f", wavPath, "-l", "en", "-ml", "1", "-sow", "-oj", "-of", outBase, "-np"],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (wh.status !== 0) fail("whisper.cpp failed to transcribe the audio.");

  // 3. Convert to [{ text, startMs, endMs }].
  const raw = JSON.parse(readFileSync(`${outBase}.json`, "utf8"));
  const words = (raw.transcription ?? [])
    .map((seg) => ({
      text: String(seg.text ?? "").trim(),
      startMs: Math.round(seg.offsets?.from ?? 0),
      endMs: Math.round(seg.offsets?.to ?? 0),
    }))
    .filter((w) => w.text.length > 0 && !/^\[.*\]$/.test(w.text)); // drop blanks and [BLANK_AUDIO]-style tags

  writeFileSync(outputPath, JSON.stringify(words, null, 2));
  console.log(`✓ ${words.length} words saved to ${path.relative(root, outputPath)}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
