/**
 * Color Range Composable
 * Generates a color range based on a base color for sequential visual elements
 */

import { computed, unref, type Ref } from 'vue';
import type { RGBColor } from '@app/types/competition';

export interface ColorRangeOptions {
  steps?: number;
}

/**
 * Generate a color range based on a base color
 * For light colors: white -> color -> black
 * For dark colors: black -> color -> white
 */
export function useColorRange(
  baseColor: Ref<RGBColor | null> | RGBColor | null,
  options: ColorRangeOptions = {},
) {
  const steps = options.steps ?? 10;

  const colorRange = computed<string[]>(() => {
    // Unwrap ref if needed using unref (handles both refs and non-refs)
    const color = unref(baseColor);

    if (!color) {
      // Fallback to grayscale if no color provided
      return generateGrayscaleRange(steps);
    }

    return generateColorRange(color, steps);
  });

  /**
   * Get a color from the range by index
   */
  function getColor(index: number): string {
    const clampedIndex = Math.max(0, Math.min(index, colorRange.value.length - 1));
    return colorRange.value[clampedIndex] ?? 'rgb(203, 213, 225)';
  }

  return {
    colorRange,
    getColor,
  };
}

/**
 * Generate a color range from a base RGB color
 *
 * The range always spans from ~15% away from white (RGB ~217) to ~15% away from black (RGB ~38),
 * going from LIGHT to DARK. This means the first item (index 0) is the lightest color,
 * and the last item is the darkest color.
 *
 * This order is intentional for use cases like round numbers, where early rounds should be
 * more prominent (lighter) and later rounds should fade into darker colors.
 */
function generateColorRange(color: RGBColor, steps: number): string[] {
  // Define the target luminance bounds (15% away from pure black/white)
  const MIN_LUMINANCE = 38; // 15% of 255 (darkest)
  const MAX_LUMINANCE = 217; // 85% of 255 (lightest)

  // Normalize RGB to 0-1 range
  const normalized = {
    r: color.r / 255,
    g: color.g / 255,
    b: color.b / 255,
  };

  // Check if it's a grayscale color
  const isGrayscale = color.r === color.g && color.g === color.b;

  // Calculate the maximum channel value (determines how much we can scale)
  const maxNormalized = Math.max(normalized.r, normalized.g, normalized.b);

  // Preserve the hue by maintaining channel ratios
  // Normalize by max channel so the brightest channel is always 1.0
  const hueRatios = isGrayscale
    ? { r: 1, g: 1, b: 1 }
    : {
        r: normalized.r / maxNormalized,
        g: normalized.g / maxNormalized,
        b: normalized.b / maxNormalized,
      };

  // Calculate the maximum achievable luminance with this hue before clamping
  const ratioSum = hueRatios.r + hueRatios.g + hueRatios.b;
  const maxBrightnessFactor = 255 / Math.max(hueRatios.r, hueRatios.g, hueRatios.b);
  const maxAchievableLuminance = (ratioSum * maxBrightnessFactor) / 3;

  const range: string[] = [];

  for (let i = 0; i < steps; i++) {
    // REVERSED: Start from MAX_LUMINANCE (light) and go to MIN_LUMINANCE (dark)
    // This means index 0 gets the lightest color, and index (steps-1) gets the darkest
    const ratio = i / (steps - 1); // 0 to 1
    const targetLuminance = MAX_LUMINANCE - ratio * (MAX_LUMINANCE - MIN_LUMINANCE);

    let finalColor: RGBColor;

    if (targetLuminance <= maxAchievableLuminance) {
      // We can achieve this luminance without desaturation
      const brightnessFactor = (targetLuminance * 3) / ratioSum;
      finalColor = {
        r: Math.round(hueRatios.r * brightnessFactor),
        g: Math.round(hueRatios.g * brightnessFactor),
        b: Math.round(hueRatios.b * brightnessFactor),
      };
    } else {
      // We need to desaturate towards white to reach the target luminance
      // First, get the color at max saturation
      const maxSaturatedColor = {
        r: hueRatios.r * maxBrightnessFactor,
        g: hueRatios.g * maxBrightnessFactor,
        b: hueRatios.b * maxBrightnessFactor,
      };

      // Calculate current luminance of max saturated color
      const currentLuminance =
        (maxSaturatedColor.r + maxSaturatedColor.g + maxSaturatedColor.b) / 3;

      // Calculate how much white (255, 255, 255) to mix in
      // to reach target luminance
      // Formula: currentLum * (1-blend) + 255 * blend = targetLum
      // Solving for blend: blend = (targetLum - currentLum) / (255 - currentLum)
      const blendRatio = (targetLuminance - currentLuminance) / (255 - currentLuminance);

      // Blend between max saturated color and white
      finalColor = {
        r: Math.round(maxSaturatedColor.r + (255 - maxSaturatedColor.r) * blendRatio),
        g: Math.round(maxSaturatedColor.g + (255 - maxSaturatedColor.g) * blendRatio),
        b: Math.round(maxSaturatedColor.b + (255 - maxSaturatedColor.b) * blendRatio),
      };
    }

    // Ensure values are within valid RGB range
    range.push(
      rgbToString({
        r: Math.max(0, Math.min(255, finalColor.r)),
        g: Math.max(0, Math.min(255, finalColor.g)),
        b: Math.max(0, Math.min(255, finalColor.b)),
      }),
    );
  }

  return range;
}

/**
 * Generate a grayscale range as fallback
 */
function generateGrayscaleRange(steps: number): string[] {
  const baseColor = { r: 203, g: 213, b: 225 }; // slate-300
  const range: string[] = [];

  for (let i = 0; i < steps; i++) {
    const darknessMultiplier = Math.pow(0.9, i);
    range.push(
      rgbToString({
        r: Math.round(baseColor.r * darknessMultiplier),
        g: Math.round(baseColor.g * darknessMultiplier),
        b: Math.round(baseColor.b * darknessMultiplier),
      }),
    );
  }

  return range;
}

/**
 * Convert RGB color object to CSS rgb() string
 */
function rgbToString(color: RGBColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
