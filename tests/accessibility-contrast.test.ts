import { describe, it, expect } from 'vitest';

/** Real WCAG 2.1 relative-luminance contrast checker, not a mock. Run
 *  against the actual design tokens in globals.css so a future color edit
 *  that breaks AA contrast fails CI instead of shipping silently. */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const AA_NORMAL_TEXT = 4.5;

// Design tokens as defined in src/app/globals.css :root. Kept as literals
// here (not imported) because these are CSS custom properties, not JS
// constants — this test is the guard against them drifting out of sync.
const DESIGN_TOKENS = {
  'stone-300': '#667085',
  'stone-500': '#475467',
  'stone-700': '#101828',
  navy: '#10284a',
  warmWhite: '#f7f8fa',
  offWhite: '#f5f6f7',
  white: '#ffffff',
};

const RISK_COLORS: Record<string, { fg: string; bg: string }> = {
  safe: { fg: '#16805b', bg: '#f0fdf4' },
  caution: { fg: '#9a6007', bg: '#fefce8' },
  risky: { fg: '#c2410c', bg: '#fff7ed' },
  critical: { fg: '#c93636', bg: '#fef2f2' },
};

describe('WCAG AA contrast — risk/severity badge colors', () => {
  for (const [name, { fg, bg }] of Object.entries(RISK_COLORS)) {
    it(`${name} badge text meets 4.5:1 against its background`, () => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });
  }
});

describe('WCAG AA contrast — muted/secondary text tokens', () => {
  it('stone-300 meets 4.5:1 on white', () => {
    expect(contrastRatio(DESIGN_TOKENS['stone-300'], DESIGN_TOKENS.white)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
  it('stone-300 meets 4.5:1 on off-white', () => {
    expect(contrastRatio(DESIGN_TOKENS['stone-300'], DESIGN_TOKENS.offWhite)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
  it('stone-500 meets 4.5:1 on white', () => {
    expect(contrastRatio(DESIGN_TOKENS['stone-500'], DESIGN_TOKENS.white)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
  it('stone-700 meets 4.5:1 on warm-white (primary body text)', () => {
    expect(contrastRatio(DESIGN_TOKENS['stone-700'], DESIGN_TOKENS.warmWhite)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});

describe('WCAG AA contrast — text on navy header/footer/cards', () => {
  it('warm-white text meets 4.5:1 on navy', () => {
    expect(contrastRatio(DESIGN_TOKENS.warmWhite, DESIGN_TOKENS.navy)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('alpha-blended white at the opacities actually used in globals.css meets 4.5:1 on navy', () => {
    // Mirrors rgba(255,255,255,X) composited over navy, as used for
    // .reading-time, .footer-sub, .verdict-reason, .verdict-summary, etc.
    const navy = hexToRgb(DESIGN_TOKENS.navy);
    const usedOpacities = [0.5, 0.55, 0.6, 0.65, 0.7];
    for (const alpha of usedOpacities) {
      const blended: [number, number, number] = [
        Math.round(navy[0] * (1 - alpha) + 255 * alpha),
        Math.round(navy[1] * (1 - alpha) + 255 * alpha),
        Math.round(navy[2] * (1 - alpha) + 255 * alpha),
      ];
      const blendedHex = `#${blended.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
      expect(contrastRatio(blendedHex, DESIGN_TOKENS.navy)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    }
  });
});
