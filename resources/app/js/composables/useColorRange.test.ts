/**
 * Tests for useColorRange composable
 */

import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useColorRange } from './useColorRange';
import type { RGBColor } from '@app/types/competition';

describe('useColorRange', () => {
  describe('with no color (fallback to grayscale)', () => {
    it('should generate grayscale range when color is null', () => {
      const { colorRange, getColor } = useColorRange(null);

      expect(colorRange.value).toHaveLength(10);
      expect(getColor(0)).toBe('rgb(203, 213, 225)'); // slate-300
    });

    it('should generate darker colors progressively', () => {
      const { getColor } = useColorRange(null);

      const firstColor = getColor(0);
      const lastColor = getColor(9);

      // First color should be lighter than last
      expect(firstColor).toBe('rgb(203, 213, 225)');
      expect(lastColor).toMatch(/rgb\(\d+, \d+, \d+\)/);

      // Extract RGB values to verify darkness
      const firstRGB = firstColor.match(/\d+/g)?.map(Number) ?? [];
      const lastRGB = lastColor.match(/\d+/g)?.map(Number) ?? [];

      expect(firstRGB[0]).toBeGreaterThan(lastRGB[0] ?? 0);
    });

    it('should handle custom step count', () => {
      const { colorRange } = useColorRange(null, { steps: 5 });

      expect(colorRange.value).toHaveLength(5);
    });
  });

  describe('with light color', () => {
    const lightColor: RGBColor = { r: 227, g: 140, b: 18 }; // Orange

    it('should generate color range for light color', () => {
      const { colorRange } = useColorRange(lightColor);

      expect(colorRange.value).toHaveLength(10);
    });

    it('should span from ~15% away from white to ~15% away from black (light to dark)', () => {
      const { getColor } = useColorRange(lightColor);

      const firstColor = getColor(0);
      const lastColor = getColor(9);

      // Extract RGB values
      const firstRGB = firstColor.match(/\d+/g)?.map(Number) ?? [];
      const lastRGB = lastColor.match(/\d+/g)?.map(Number) ?? [];

      // First color (lightest) should be ~15% away from white (RGB ~217)
      const firstAvg = ((firstRGB[0] ?? 0) + (firstRGB[1] ?? 0) + (firstRGB[2] ?? 0)) / 3;
      expect(firstAvg).toBeGreaterThanOrEqual(200);
      expect(firstAvg).toBeLessThanOrEqual(225);

      // Last color (darkest) should be ~15% away from black (RGB ~38)
      const lastAvg = ((lastRGB[0] ?? 0) + (lastRGB[1] ?? 0) + (lastRGB[2] ?? 0)) / 3;
      expect(lastAvg).toBeGreaterThanOrEqual(30);
      expect(lastAvg).toBeLessThanOrEqual(50);

      // Verify progression: first (lightest) > last (darkest)
      expect(firstAvg).toBeGreaterThan(lastAvg);
    });

    it('should include variation across the range', () => {
      const { colorRange } = useColorRange(lightColor);

      // Calculate luminance for each color in the range
      const luminances = colorRange.value.map((color) => {
        const rgb = color.match(/\d+/g)?.map(Number) ?? [];
        return ((rgb[0] ?? 0) + (rgb[1] ?? 0) + (rgb[2] ?? 0)) / 3;
      });

      // Verify progressive decrease in luminance (lightest to darkest)
      for (let i = 1; i < luminances.length; i++) {
        expect(luminances[i]).toBeLessThan(luminances[i - 1] ?? 0);
      }

      // Verify the range has good spread
      const minLuminance = Math.min(...luminances);
      const maxLuminance = Math.max(...luminances);
      const spread = maxLuminance - minLuminance;

      expect(spread).toBeGreaterThan(150); // Should have at least 150 units of spread
    });

    it('should clamp index within valid range', () => {
      const { getColor } = useColorRange(lightColor);

      // Below range
      expect(getColor(-5)).toBe(getColor(0));

      // Above range
      expect(getColor(100)).toBe(getColor(9));
    });
  });

  describe('with dark color', () => {
    const darkColor: RGBColor = { r: 30, g: 40, b: 50 };

    it('should generate color range for dark color', () => {
      const { colorRange } = useColorRange(darkColor);

      expect(colorRange.value).toHaveLength(10);
    });

    it('should span from ~15% away from white to ~15% away from black (light to dark)', () => {
      const { getColor } = useColorRange(darkColor);

      const firstColor = getColor(0);
      const lastColor = getColor(9);

      // Extract RGB values
      const firstRGB = firstColor.match(/\d+/g)?.map(Number) ?? [];
      const lastRGB = lastColor.match(/\d+/g)?.map(Number) ?? [];

      // First color (lightest) should be ~15% away from white (RGB ~217)
      const firstAvg = ((firstRGB[0] ?? 0) + (firstRGB[1] ?? 0) + (firstRGB[2] ?? 0)) / 3;
      expect(firstAvg).toBeGreaterThanOrEqual(200);
      expect(firstAvg).toBeLessThanOrEqual(225);

      // Last color (darkest) should be ~15% away from black (RGB ~38)
      const lastAvg = ((lastRGB[0] ?? 0) + (lastRGB[1] ?? 0) + (lastRGB[2] ?? 0)) / 3;
      expect(lastAvg).toBeGreaterThanOrEqual(30);
      expect(lastAvg).toBeLessThanOrEqual(50);

      // Verify progression: first (lightest) > last (darkest)
      expect(firstAvg).toBeGreaterThan(lastAvg);
    });

    it('should include variation across the range', () => {
      const { colorRange } = useColorRange(darkColor);

      // Calculate luminance for each color in the range
      const luminances = colorRange.value.map((color) => {
        const rgb = color.match(/\d+/g)?.map(Number) ?? [];
        return ((rgb[0] ?? 0) + (rgb[1] ?? 0) + (rgb[2] ?? 0)) / 3;
      });

      // Verify progressive decrease in luminance (lightest to darkest)
      for (let i = 1; i < luminances.length; i++) {
        expect(luminances[i]).toBeLessThan(luminances[i - 1] ?? 0);
      }

      // Verify the range has good spread
      const minLuminance = Math.min(...luminances);
      const maxLuminance = Math.max(...luminances);
      const spread = maxLuminance - minLuminance;

      expect(spread).toBeGreaterThan(150); // Should have at least 150 units of spread
    });
  });

  describe('reactivity', () => {
    it('should update color range when reactive color changes', () => {
      const color = ref<RGBColor | null>({ r: 255, g: 100, b: 50 }); // Light orange
      const { colorRange, getColor } = useColorRange(color);

      const midColorBefore = getColor(4); // Middle of range where base color influence is visible
      expect(colorRange.value).toHaveLength(10);

      // Change color to dark blue
      color.value = { r: 30, g: 50, b: 100 };

      const midColorAfter = getColor(4);
      const firstColorAfter = getColor(0);
      expect(colorRange.value).toHaveLength(10);

      // Mid colors should be different (different base colors)
      expect(midColorBefore).not.toBe(midColorAfter);

      // First color should still be ~15% away from white (lightest) for both colors
      const firstRGB = firstColorAfter.match(/\d+/g)?.map(Number) ?? [];
      const firstAvg = ((firstRGB[0] ?? 0) + (firstRGB[1] ?? 0) + (firstRGB[2] ?? 0)) / 3;
      expect(firstAvg).toBeGreaterThanOrEqual(200);
      expect(firstAvg).toBeLessThanOrEqual(225);
    });

    it('should handle changing from color to null', () => {
      const color = ref<RGBColor | null>({ r: 100, g: 100, b: 100 });
      const { colorRange } = useColorRange(color);

      expect(colorRange.value).toHaveLength(10);

      // Change to null
      color.value = null;

      expect(colorRange.value).toHaveLength(10);
      // Should now use grayscale fallback
      expect(colorRange.value[0]).toBe('rgb(203, 213, 225)');
    });

    it('should handle changing from null to color', () => {
      const color = ref<RGBColor | null>(null);
      const { colorRange } = useColorRange(color);

      expect(colorRange.value[0]).toBe('rgb(203, 213, 225)');

      // Change to actual color
      color.value = { r: 255, g: 100, b: 50 };

      expect(colorRange.value).toHaveLength(10);
      expect(colorRange.value[0]).not.toBe('rgb(203, 213, 225)');
    });
  });

  describe('color range output format', () => {
    it('should return valid CSS rgb() strings', () => {
      const color: RGBColor = { r: 123, g: 45, b: 67 };
      const { colorRange } = useColorRange(color);

      colorRange.value.forEach((colorString) => {
        expect(colorString).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      });
    });

    it('should have RGB values within valid range (0-255)', () => {
      const color: RGBColor = { r: 200, g: 150, b: 100 };
      const { colorRange } = useColorRange(color);

      colorRange.value.forEach((colorString) => {
        const rgb = colorString.match(/\d+/g)?.map(Number) ?? [];
        expect(rgb).toHaveLength(3);

        rgb.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(255);
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very light color (close to white)', () => {
      const veryLightColor: RGBColor = { r: 250, g: 250, b: 250 };
      const { colorRange, getColor } = useColorRange(veryLightColor);

      expect(colorRange.value).toHaveLength(10);

      // Should still produce a full range from ~15% white to ~15% black (light to dark)
      const firstColor = getColor(0);
      const lastColor = getColor(9);

      const firstRGB = firstColor.match(/\d+/g)?.map(Number) ?? [];
      const lastRGB = lastColor.match(/\d+/g)?.map(Number) ?? [];

      const firstAvg = ((firstRGB[0] ?? 0) + (firstRGB[1] ?? 0) + (firstRGB[2] ?? 0)) / 3;
      const lastAvg = ((lastRGB[0] ?? 0) + (lastRGB[1] ?? 0) + (lastRGB[2] ?? 0)) / 3;

      // Should still have proper bounds (first is lightest, last is darkest)
      expect(firstAvg).toBeGreaterThanOrEqual(200);
      expect(firstAvg).toBeLessThanOrEqual(225);
      expect(lastAvg).toBeGreaterThanOrEqual(30);
      expect(lastAvg).toBeLessThanOrEqual(50);

      // Should have good spread
      expect(firstAvg - lastAvg).toBeGreaterThan(150);
    });

    it('should handle very dark color (close to black)', () => {
      const veryDarkColor: RGBColor = { r: 10, g: 10, b: 10 };
      const { colorRange, getColor } = useColorRange(veryDarkColor);

      expect(colorRange.value).toHaveLength(10);

      // Should still produce a full range from ~15% white to ~15% black (light to dark)
      const firstColor = getColor(0);
      const lastColor = getColor(9);

      const firstRGB = firstColor.match(/\d+/g)?.map(Number) ?? [];
      const lastRGB = lastColor.match(/\d+/g)?.map(Number) ?? [];

      const firstAvg = ((firstRGB[0] ?? 0) + (firstRGB[1] ?? 0) + (firstRGB[2] ?? 0)) / 3;
      const lastAvg = ((lastRGB[0] ?? 0) + (lastRGB[1] ?? 0) + (lastRGB[2] ?? 0)) / 3;

      // Should still have proper bounds (first is lightest, last is darkest)
      expect(firstAvg).toBeGreaterThanOrEqual(200);
      expect(firstAvg).toBeLessThanOrEqual(225);
      expect(lastAvg).toBeGreaterThanOrEqual(30);
      expect(lastAvg).toBeLessThanOrEqual(50);

      // Should have good spread
      expect(firstAvg - lastAvg).toBeGreaterThan(150);
    });

    it('should handle pure white color', () => {
      const white: RGBColor = { r: 255, g: 255, b: 255 };
      const { colorRange, getColor } = useColorRange(white);

      expect(colorRange.value).toHaveLength(10);

      // Should still produce a range with variation (light to dark)
      const firstColor = getColor(0);
      const lastColor = getColor(9);

      const firstRGB = firstColor.match(/\d+/g)?.map(Number) ?? [];
      const lastRGB = lastColor.match(/\d+/g)?.map(Number) ?? [];

      const firstAvg = ((firstRGB[0] ?? 0) + (firstRGB[1] ?? 0) + (firstRGB[2] ?? 0)) / 3;
      const lastAvg = ((lastRGB[0] ?? 0) + (lastRGB[1] ?? 0) + (lastRGB[2] ?? 0)) / 3;

      // Should have a range from light to dark
      expect(firstAvg).toBeGreaterThan(lastAvg);
      expect(firstAvg - lastAvg).toBeGreaterThan(150);
    });

    it('should handle pure black color', () => {
      const black: RGBColor = { r: 0, g: 0, b: 0 };
      const { colorRange, getColor } = useColorRange(black);

      expect(colorRange.value).toHaveLength(10);

      // Should still produce a range with variation (light to dark)
      const firstColor = getColor(0);
      const lastColor = getColor(9);

      const firstRGB = firstColor.match(/\d+/g)?.map(Number) ?? [];
      const lastRGB = lastColor.match(/\d+/g)?.map(Number) ?? [];

      const firstAvg = ((firstRGB[0] ?? 0) + (firstRGB[1] ?? 0) + (firstRGB[2] ?? 0)) / 3;
      const lastAvg = ((lastRGB[0] ?? 0) + (lastRGB[1] ?? 0) + (lastRGB[2] ?? 0)) / 3;

      // Should have a range from light to dark
      expect(firstAvg).toBeGreaterThan(lastAvg);
      expect(firstAvg - lastAvg).toBeGreaterThan(150);
    });

    it('should handle single step', () => {
      const color: RGBColor = { r: 100, g: 100, b: 100 };
      const { colorRange } = useColorRange(color, { steps: 1 });

      expect(colorRange.value).toHaveLength(1);
    });

    it('should handle default steps when not provided', () => {
      const color: RGBColor = { r: 100, g: 100, b: 100 };
      const { colorRange } = useColorRange(color);

      expect(colorRange.value).toHaveLength(10);
    });
  });
});
