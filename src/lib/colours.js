// Swatch colours for the colour filter (#191). Product colours are free text from the admin
// console, so known shop words get a hand-picked shade, anything else is tried as a CSS
// colour, and the rest show a neutral striped swatch with the name beside it.

const KNOWN = {
  indigo: '#2e3f7f',
  navy: '#1b2a4a',
  saffron: '#f4a300',
  ochre: '#c98a1b',
  mustard: '#d4a017',
  maroon: '#7b1e2b',
  madder: '#a8322d',
  rust: '#b7410e',
  natural: '#e9dfc4',
  cream: '#f3ecdc',
  ivory: '#f6f1e3',
  'off white': '#f5f2ea',
  beige: '#d9c7a3',
  sand: '#d8c39a',
  charcoal: '#36393f',
  olive: '#6b6b2e',
  teal: '#1f7a7a',
  'sea green': '#2e8b57',
  'sky blue': '#7cb7e6',
  multi: 'conic-gradient(#a8322d, #f4a300, #2e8b57, #2e3f7f, #a8322d)',
  multicolour: 'conic-gradient(#a8322d, #f4a300, #2e8b57, #2e3f7f, #a8322d)',
};

const isCssColour = (value) =>
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', value);

/** CSS background for a colour name, or null when it cannot be shown as a swatch. */
export const swatchFor = (name) => {
  const key = String(name || '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  if (KNOWN[key]) return KNOWN[key];
  const compact = key.replace(/\s+/g, '');
  return isCssColour(compact) ? compact : null;
};
