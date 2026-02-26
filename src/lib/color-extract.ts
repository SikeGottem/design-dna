import sharp from "sharp";

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
}

/**
 * Extract dominant colors from an image using pixel sampling + quantization.
 * Returns exact colors from the actual image pixels.
 */
export async function extractColors(imageBuffer: Buffer, maxColors = 8): Promise<ExtractedColor[]> {
  // Resize to small image for fast processing (keeps color distribution)
  const { data, info } = await sharp(imageBuffer)
    .resize(150, 150, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Build color frequency map (quantize to reduce noise)
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
  const totalPixels = info.width * info.height;

  for (let i = 0; i < data.length; i += 3) {
    // Quantize to nearest 8 to group similar colors
    const r = Math.round(data[i] / 8) * 8;
    const g = Math.round(data[i + 1] / 8) * 8;
    const b = Math.round(data[i + 2] / 8) * 8;
    const key = `${r},${g},${b}`;

    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r, g, b, count: 1 });
    }
  }

  // Sort by frequency
  const sorted = [...colorMap.values()].sort((a, b) => b.count - a.count);

  // Merge similar colors (within ΔE ~20 in RGB space)
  const merged: typeof sorted = [];
  for (const color of sorted) {
    const similar = merged.find(
      (m) =>
        Math.abs(m.r - color.r) < 30 &&
        Math.abs(m.g - color.g) < 30 &&
        Math.abs(m.b - color.b) < 30
    );
    if (similar) {
      // Weighted average
      const total = similar.count + color.count;
      similar.r = Math.round((similar.r * similar.count + color.r * color.count) / total);
      similar.g = Math.round((similar.g * similar.count + color.g * color.count) / total);
      similar.b = Math.round((similar.b * similar.count + color.b * color.count) / total);
      similar.count = total;
    } else {
      merged.push({ ...color });
    }
  }

  // Take top N colors
  const topColors = merged.slice(0, maxColors);

  return topColors.map((c) => ({
    hex: `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`,
    rgb: { r: c.r, g: c.g, b: c.b },
    percentage: Math.round((c.count / totalPixels) * 100),
  }));
}
