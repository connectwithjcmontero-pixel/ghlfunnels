/**
 * Brand settings used by every template.
 * Update these once your fonts and colors are in the `brand` folder.
 */
export const brand = {
  /** Caption font. Swap for your brand font once it's loaded (see brand/README.md). */
  captionFont: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
  /** Big title font (magazine-cover style). */
  titleFont: "'Playfair Display', Georgia, 'Times New Roman', serif",
  colors: {
    text: "#FFFFFF",
    accent: "#FFFFFF",
    background: "#000000",
  },
} as const;

/** Output format for every reel. */
export const REEL = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Safe zone on a 1080x1920 frame: keep text clear of the app's own UI.
 * Bottom ~20% is caption/UI area; right side has the like/comment/share column.
 */
export const SAFE_ZONE = {
  top: 220,
  bottom: Math.round(1920 * 0.2),
  left: 60,
  right: 160,
} as const;
