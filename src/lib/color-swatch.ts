/** Map common color names to hex for UI swatches (approximate). */
const NAMED_COLORS: Record<string, string> = {
  white: '#f8fafc',
  black: '#1e293b',
  red: '#dc2626',
  maroon: '#7f1d1d',
  mahorrn: '#7f1d1d',
  blue: '#2563eb',
  navy: '#1e3a8a',
  teal: '#0d9488',
  green: '#16a34a',
  yellow: '#eab308',
  gold: '#ca8a04',
  orange: '#ea580c',
  pink: '#ec4899',
  purple: '#9333ea',
  brown: '#92400e',
  beige: '#d6c4a8',
  cream: '#fef3c7',
  grey: '#94a3b8',
  gray: '#94a3b8',
  silver: '#cbd5e1',
  peach: '#fdba74',
  coral: '#fb7185',
  wine: '#881337',
  mustard: '#ca8a04',
  olive: '#65a30d',
  lavender: '#c4b5fd',
  turquoise: '#2dd4bf',
  magenta: '#c026d3',
  charcoal: '#475569',
  ivory: '#fffbeb',
  rust: '#c2410c',
  tan: '#d97706',
  khaki: '#a3a36d',
  cyan: '#06b6d4',
  indigo: '#4f46e5',
  violet: '#7c3aed',
};

export function getColorSwatchHex(colorName: string): string {
  const normalized = colorName.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return '#cbd5e1';

  if (NAMED_COLORS[normalized]) return NAMED_COLORS[normalized];

  for (const [key, hex] of Object.entries(NAMED_COLORS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }

  return '#cbd5e1';
}

export function swatchNeedsBorder(hex: string): boolean {
  const light = ['#f8fafc', '#fef3c7', '#fffbeb', '#fef9c3', '#d6c4a8'];
  return light.includes(hex.toLowerCase());
}
