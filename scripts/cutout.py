"""
Cut the speaker out of a video (for text-behind-head), using MediaPipe's selfie segmenter.

Usage:
  bin/venv/bin/python scripts/cutout.py public/recordings/my-clip.mp4
  bin/venv/bin/python scripts/cutout.py public/recordings/my-clip.mp4 --out public/cutouts/my-clip-cutout.webm

Makes a transparent WebM (only the person is visible), ready for the `cutoutSrc`
option of a title in the Reel template. The original video is only read, never changed.
"""
import argparse
import os
import subprocess
import sys

import cv2
import mediapipe as mp
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, "bin", "models", "selfie_segmenter.tflite")


def main() -> None:
    parser = argparse.ArgumentParser(description="Cut the person out of a video as a transparent WebM.")
    parser.add_argument("input", help="video file, e.g. public/recordings/my-clip.mp4")
    parser.add_argument("--out", help="output .webm (default: public/cutouts/<name>-cutout.webm)")
    parser.add_argument("--threshold", type=float, default=0.5, help="0-1, higher = tighter edge")
    parser.add_argument("--feather", type=int, default=5, help="edge softness in pixels")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        sys.exit(f"Can't find the file: {args.input}")
    if not os.path.exists(MODEL):
        sys.exit(f"Segmentation model missing: {MODEL}")

    name = os.path.splitext(os.path.basename(args.input))[0]
    out = args.out or os.path.join(ROOT, "public", "cutouts", f"{name}-cutout.webm")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        sys.exit("Couldn't open the video.")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    vision = mp.tasks.vision
    options = vision.ImageSegmenterOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=MODEL),
        running_mode=vision.RunningMode.VIDEO,
        output_confidence_masks=True,
    )

    print(f"→ Cutting out the person in {os.path.basename(args.input)} ({total} frames)")
    with vision.ImageSegmenter.create_from_options(options) as segmenter:
        # Start the encoder only once the segmenter has loaded, so a failure leaves no broken file.
        ffmpeg = subprocess.Popen(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{width}x{height}", "-r", f"{fps}", "-i", "-",
                "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-row-mt", "1",
                "-auto-alt-ref", "0", out,
            ],
            stdin=subprocess.PIPE,
        )
        index = 0
        while True:
            ok, frame_bgr = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = segmenter.segment_for_video(image, int(index * 1000 / fps))
            mask = result.confidence_masks[-1].numpy_view().squeeze()
            if mask.shape[:2] != (height, width):
                mask = cv2.resize(mask, (width, height), interpolation=cv2.INTER_LINEAR)
            alpha = np.clip((mask - args.threshold) / 0.15 + 0.5, 0, 1)
            if args.feather > 0:
                k = args.feather * 2 + 1
                alpha = cv2.GaussianBlur(alpha, (k, k), 0)
            rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
            ffmpeg.stdin.write(rgba.tobytes())
            index += 1
            if index % 60 == 0:
                print(f"  {index}/{total} frames")

    cap.release()
    ffmpeg.stdin.close()
    if ffmpeg.wait() != 0:
        sys.exit("FFmpeg failed to write the cut-out video.")
    print(f"✓ Saved {os.path.relpath(out, ROOT)}")


if __name__ == "__main__":
    main()
