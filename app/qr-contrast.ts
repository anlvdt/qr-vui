// Automatic art colors use a stronger visual target than the manual color guard.
export const ART_INK_CONTRAST = 12;

export function contrastOnWhite(hex: string) {
  const values = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
  const luminance = values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  return 1.05 / (luminance + 0.05);
}

export function darkArtInk(color: [number, number, number]) {
  for (let step = 0; step <= 13; step += 1) {
    // Mix toward black to retain the illustration's hue without pastel ink.
    const hex = "#" + color.map((channel) => Math.round(Math.max(0, Math.min(255, channel)) * (1 - step / 13)).toString(16).padStart(2, "0")).join("");
    if (contrastOnWhite(hex) >= ART_INK_CONTRAST) return hex;
  }
  return "#171717";
}
