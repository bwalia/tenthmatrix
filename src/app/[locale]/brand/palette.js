// Palette specimen for /brand. Values mirror design/tm-theme.css (BRAND.md §6);
// the page computes WCAG contrast from them at build time.
export const PALETTE = {
  light: {
    bg: '#f7f6f2',
    swatches: [
      ['--tm-bg', '#f7f6f2', 'surface'],
      ['--tm-surface', '#ffffff', 'surface'],
      ['--tm-sunken', '#efede7', 'surface'],
      ['--tm-line', '#e0ddd4', 'line'],
      ['--tm-line-strong', '#7d828a', 'control'],
      ['--tm-text', '#12161a', 'text'],
      ['--tm-text-muted', '#474d55', 'text'],
      ['--tm-text-subtle', '#5f656d', 'text'],
      ['--tm-accent', '#0a7a57', 'text'],
      ['--tm-accent-hover', '#086448', 'text'],
      ['--tm-accent-soft', '#e2f1ea', 'surface'],
      ['--tm-secondary', '#9a5300', 'text'],
      ['--tm-success', '#1f7a3b', 'text'],
      ['--tm-warn', '#8a5a00', 'text'],
      ['--tm-danger', '#b42318', 'text'],
      ['--tm-info', '#245bb8', 'text'],
      ['--tm-code-bg', '#15191c', 'surface'],
    ],
  },
  dark: {
    bg: '#0e1113',
    swatches: [
      ['--tm-bg', '#0e1113', 'surface'],
      ['--tm-surface', '#14181b', 'surface'],
      ['--tm-raised', '#1b2024', 'surface'],
      ['--tm-line', '#262c31', 'line'],
      ['--tm-line-strong', '#68717a', 'control'],
      ['--tm-text', '#e8eae6', 'text'],
      ['--tm-text-muted', '#b0b7b4', 'text'],
      ['--tm-text-subtle', '#8f9895', 'text'],
      ['--tm-accent', '#3dd69e', 'text'],
      ['--tm-accent-hover', '#6be3b6', 'text'],
      ['--tm-accent-soft', '#10281f', 'surface'],
      ['--tm-secondary', '#f2b252', 'text'],
      ['--tm-success', '#62d17e', 'text'],
      ['--tm-warn', '#f5c451', 'text'],
      ['--tm-danger', '#ff8e80', 'text'],
      ['--tm-info', '#8db4ff', 'text'],
      ['--tm-code-bg', '#090b0d', 'surface'],
    ],
  },
};

const lum = (hex) => {
  const [r, g, b] = hex
    .replace('#', '')
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Text on its theme bg needs 4.5:1, controls 3:1; surfaces/lines are reported against the theme text colour. */
export function rating(kind, ratio) {
  const need = kind === 'text' ? 4.5 : kind === 'control' ? 3 : 4.5;
  if (ratio >= 7 && kind === 'text') return 'AAA';
  return ratio >= need ? 'AA' : kind === 'line' ? 'decorative' : 'fail';
}

export const TYPE_SCALE = [
  ['--tm-text-5xl', 'Display', 'display'],
  ['--tm-text-4xl', 'Page display', 'display'],
  ['--tm-text-3xl', 'Heading 1', 'display'],
  ['--tm-text-2xl', 'Heading 2', 'heading'],
  ['--tm-text-xl', 'Heading 3', 'heading'],
  ['--tm-text-lg', 'Heading 4, card title', 'body-strong'],
  ['--tm-text-md', 'Lead paragraph', 'body'],
  ['--tm-text-base', 'Body copy', 'body'],
  ['--tm-text-sm', 'UI, meta, buttons', 'body'],
  ['--tm-text-xs', 'Eyebrow, caption', 'mono'],
  ['--tm-text-2xs', 'Badge, legal', 'mono'],
];
