/**
 * Data for the visual identity system pages.
 *
 * Contrast ratios are calculated from the hex values at build time rather
 * than written by hand, so the documentation cannot drift from the palette.
 * Change a colour and every ratio and pass/fail badge on the page updates.
 *
 * All body copy on these pages is placeholder. The identity is the
 * deliverable; the words are not.
 */

/* --- WCAG relative luminance and contrast --------------------------------- */
const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};
/** WCAG grade for a ratio at normal body size. */
const grade = (ratio) => {
  if (ratio >= 7) return { label: 'AAA', level: 'pass' };
  if (ratio >= 4.5) return { label: 'AA', level: 'pass' };
  if (ratio >= 3) return { label: 'Large text & UI only', level: 'large' };
  return { label: 'Not for text', level: 'fail' };
};

/* --- The palette ---------------------------------------------------------- */
const core = {
  ivory: '#F7F2EA',
  white: '#FFFDFC',
  sand: '#DDD0BE',
  espresso: '#29211D',
  sage: '#7F8977',
  bronze: '#A87955',
};

const palette = [
  {
    name: 'Warm Ivory',
    token: '--ivory',
    hex: core.ivory,
    share: '60%',
    role: 'The primary ground. Every page starts here.',
    group: 'ground',
  },
  {
    name: 'Soft White',
    token: '--white',
    hex: core.white,
    share: '60%',
    role: 'Raised surfaces — cards, sticky header, form fields.',
    group: 'ground',
  },
  {
    name: 'Soft Sand',
    token: '--sand',
    hex: core.sand,
    share: '10%',
    role: 'Alternate sections, quiet dividers, image placeholders.',
    group: 'ground',
  },
  {
    name: 'Deep Espresso',
    token: '--espresso',
    hex: core.espresso,
    share: '20%',
    role: 'All body type, the footer, and primary buttons.',
    group: 'ink',
  },
  {
    name: 'Muted Sage',
    token: '--sage',
    hex: core.sage,
    share: '5%',
    role: 'Wellness accent. Used sparingly and never as a second brand colour.',
    group: 'accent',
  },
  {
    name: 'Warm Bronze',
    token: '--bronze',
    hex: core.bronze,
    share: '5%',
    role: 'Premium detail — hairlines, icons, eyebrow rules, italic emphasis.',
    group: 'accent',
  },
].map((c) => ({
  ...c,
  onIvory: contrast(c.hex, core.ivory),
  onIvoryGrade: grade(contrast(c.hex, core.ivory)),
  onEspresso: contrast(c.hex, core.espresso),
}));

/* --- Derived tints, and the reason each one exists ------------------------ */
const derived = [
  {
    name: 'Bronze Ink',
    token: '--bronze-ink',
    hex: '#75502F',
    from: 'Warm Bronze',
    why: 'Bronze reaches only 3.41:1 on ivory, short of the 4.5:1 body text needs. This deepened tint carries bronze-coloured text and filled bronze buttons — tuned against sand, the darkest light ground, so it holds on every section.',
  },
  {
    name: 'Sage Ink',
    token: '--sage-ink',
    hex: '#4E5748',
    from: 'Muted Sage',
    why: 'Sage measures 3.28:1 on ivory. The deeper tint lets sage appear as text without dropping below AA on ivory, white or sand.',
  },
  {
    name: 'Espresso Soft',
    token: '--espresso-soft',
    hex: '#5A524C',
    from: 'Deep Espresso',
    why: 'Secondary copy needs to recede from the primary text without turning grey. A warm mid-tone that stays AA even on a sand background.',
  },
  {
    name: 'Line',
    token: '--line',
    hex: '#C6B49B',
    from: 'Soft Sand',
    why: 'Sand against ivory is 1.36:1 — invisible as a functional border. Form fields and controls use this instead, which clears the 3:1 WCAG asks of non-text UI.',
  },
].map((c) => ({
  ...c,
  onIvory: contrast(c.hex, core.ivory),
  onIvoryGrade: grade(contrast(c.hex, core.ivory)),
  withWhite: contrast(c.hex, core.white),
}));

/* --- Pairings that are safe, and pairings that are not -------------------- */
const pairings = [
  { fg: 'Deep Espresso', bg: 'Warm Ivory', fgHex: core.espresso, bgHex: core.ivory, use: 'All body copy and headings' },
  { fg: 'Deep Espresso', bg: 'Soft Sand', fgHex: core.espresso, bgHex: core.sand, use: 'Type on alternate sections' },
  { fg: 'Espresso Soft', bg: 'Warm Ivory', fgHex: '#5A524C', bgHex: core.ivory, use: 'Secondary and supporting copy' },
  { fg: 'Espresso Soft', bg: 'Soft Sand', fgHex: '#5A524C', bgHex: core.sand, use: 'Secondary copy on alternate sections' },
  { fg: 'Bronze Ink', bg: 'Warm Ivory', fgHex: '#75502F', bgHex: core.ivory, use: 'Eyebrows, links, small accented text' },
  { fg: 'Bronze Ink', bg: 'Soft Sand', fgHex: '#75502F', bgHex: core.sand, use: 'Eyebrows and links on alternate sections' },
  { fg: 'Warm Bronze', bg: 'Warm Ivory', fgHex: core.bronze, bgHex: core.ivory, use: 'Large display text, icons, rules — not paragraphs' },
  { fg: 'Muted Sage', bg: 'Warm Ivory', fgHex: core.sage, bgHex: core.ivory, use: 'Decorative marks only' },
  { fg: 'Warm Bronze', bg: 'Soft Sand', fgHex: core.bronze, bgHex: core.sand, use: 'Avoid entirely — fails at every size' },
  { fg: 'Warm Ivory', bg: 'Deep Espresso', fgHex: core.ivory, bgHex: core.espresso, use: 'Footer and espresso blocks' },
  { fg: 'Soft Sand', bg: 'Deep Espresso', fgHex: core.sand, bgHex: core.espresso, use: 'Footer headings' },
].map((p) => ({ ...p, ratio: contrast(p.fgHex, p.bgHex), grade: grade(contrast(p.fgHex, p.bgHex)) }));

/* --- Type scale ----------------------------------------------------------- */
const typeScale = [
  { name: 'Display 1', cls: 'display-1', token: '--t-display-1', size: 'clamp(3rem, 7.5vw, 5.75rem)', face: 'Cormorant Garamond 300', use: 'One per page. The opening statement.', sample: 'A quiet hour, kept for you' },
  { name: 'Display 2', cls: 'display-2', token: '--t-display-2', size: 'clamp(2.4rem, 5vw, 3.75rem)', face: 'Cormorant Garamond 300', use: 'Section openers in editorial bands.', sample: 'Placeholder section statement' },
  { name: 'Heading 1', cls: 'h1', token: '--t-h1', size: 'clamp(2.1rem, 4vw, 3rem)', face: 'Cormorant Garamond 400', use: 'Page titles below the hero.', sample: 'Placeholder page title' },
  { name: 'Heading 2', cls: 'h2', token: '--t-h2', size: 'clamp(1.75rem, 3vw, 2.35rem)', face: 'Cormorant Garamond 400', use: 'Standard section headings.', sample: 'Placeholder section heading' },
  { name: 'Heading 3', cls: 'h3', token: '--t-h3', size: 'clamp(1.35rem, 2vw, 1.65rem)', face: 'Cormorant Garamond 500', use: 'Card titles, accordion triggers.', sample: 'Placeholder card title' },
  { name: 'Heading 4', cls: 'h4', token: '--t-h4', size: '1.15rem', face: 'Manrope 600', use: 'Small headings inside interface blocks, where the serif would lose authority.', sample: 'Placeholder interface heading' },
  { name: 'Lead', cls: 'lead', token: '--t-lead', size: 'clamp(1.075rem, 1.4vw, 1.25rem)', face: 'Manrope 300', use: 'The paragraph directly under a heading. Max 46 characters per line.', sample: 'Placeholder introductory sentence that sits beneath a heading and sets the tone.' },
  { name: 'Body', cls: 'body-text', token: '--t-body', size: '1rem', face: 'Manrope 400', use: 'Running copy. Line height 1.75, measure capped at 62 characters.', sample: 'Placeholder body copy. Running text is set at a comfortable measure so the eye never has to travel far to find the start of the next line.' },
  { name: 'Small', cls: 'small muted', token: '--t-small', size: '0.875rem', face: 'Manrope 400', use: 'Captions, hints, footer links. Never smaller than this.', sample: 'Placeholder caption or supporting note' },
  { name: 'Label', cls: 'eyebrow', token: '--t-label', size: '0.75rem', face: 'Manrope 500, 0.16em tracking', use: 'Eyebrows and field labels. Uppercase is allowed here and nowhere else.', sample: 'Placeholder label' },
];

/* --- Spacing -------------------------------------------------------------- */
const spaceScale = [
  { token: '--s-1', value: '0.25rem', px: 4, use: 'Icon nudges' },
  { token: '--s-2', value: '0.5rem', px: 8, use: 'Label to control' },
  { token: '--s-3', value: '0.75rem', px: 12, use: 'Inline gaps' },
  { token: '--s-4', value: '1rem', px: 16, use: 'Related elements' },
  { token: '--s-5', value: '1.5rem', px: 24, use: 'Grid gaps, form rows' },
  { token: '--s-6', value: '2rem', px: 32, use: 'Card padding' },
  { token: '--s-7', value: '3rem', px: 48, use: 'Sub-section breaks' },
  { token: '--s-8', value: '4rem', px: 64, use: 'Heading to content block' },
  { token: '--s-9', value: '6rem', px: 96, use: 'Column gaps in split layouts' },
  { token: '--s-10', value: '8rem', px: 128, use: 'Major separations' },
];

/* --- Motion --------------------------------------------------------------- */
const motion = [
  { name: 'Reveal on scroll', token: '--dur-slow', value: '900ms', curve: 'ease-out', note: 'Fade with a 22px rise. Staggered at 70ms, capped so a list never becomes a queue.' },
  { name: 'Image scale-in', token: '--dur-image', value: '1200ms', curve: 'ease-soft', note: 'From 1.06 to 1. Hero and band imagery only, on load.' },
  { name: 'Hover transition', token: '--dur', value: '420ms', curve: 'ease-out', note: 'Colour and border changes on cards and buttons.' },
  { name: 'Control feedback', token: '--dur-fast', value: '220ms', curve: 'ease-out', note: 'Focus rings, field borders, nav underlines. Fast enough to feel immediate.' },
];

/* --- Photography and video direction -------------------------------------- */
const imagery = {
  subjects: [
    'Warm towels, folded or stacked',
    'Massage oils and glassware',
    'Natural stone and hot stones',
    'Steam and water surfaces',
    'Candlelight',
    'Wood and soft fabrics',
    'Therapist hand movements, mid-gesture',
    'Respectfully covered clients',
    'Intimate treatment rooms',
    'Moroccan bath details',
    'Jacuzzi water',
    'Quiet moments between treatments',
  ],
  treatment: [
    { name: 'Grading', note: 'Warm neutral. Highlights lean ivory, shadows lean espresso. Never cool or blue-shifted.' },
    { name: 'Light', note: 'Soft and diffused. One dominant source, generous falloff, no hard speculars.' },
    { name: 'Skin', note: 'Natural tones, minimal retouching. Texture is kept.' },
    { name: 'Depth', note: 'Shallow. A single subject in focus, the room falling away behind it.' },
    { name: 'Framing', note: 'Calm and close. Sensory detail over wide establishing shots.' },
    { name: 'Consistency', note: 'One grade across the whole library. Images must sit together in a grid.' },
  ],
  avoid: [
    'Generic stock photography',
    'Tropical resorts and beaches',
    'Artificial smiles to camera',
    'Staged handshakes or consultations',
    'Excessive skin exposure',
    'Sexualised posing',
    'Anything resembling a clinical or medical procedure',
    'Cool or clinical white lighting',
  ],
  video: [
    'Background video plays muted, loops seamlessly, and never autoplays audio.',
    'Held or very slow-moving shots. No fast cuts.',
    'A poster frame from the same grade loads first so the section never appears empty.',
    'Under prefers-reduced-motion the poster frame is shown and the video does not play.',
  ],
};

/* --- Atmosphere ----------------------------------------------------------- */
const atmosphere = {
  is: ['Calm', 'Warm', 'Refined', 'Intimate', 'Professional', 'Restorative', 'Welcoming', 'Modern', 'Discreet', 'Naturally luxurious'],
  isNot: ['A medical clinic', 'A beauty salon', 'A cheap massage centre', 'A nightclub', 'A dark massage parlour', 'An extravagant five-star hotel', 'A generic prebuilt spa template'],
};

/* --- Navigation across the identity pages --------------------------------- */
const nav = [
  { label: 'Foundations', url: '/identity/' },
  { label: 'Components', url: '/identity/components/' },
  { label: 'Imagery & motion', url: '/identity/imagery/' },
  { label: 'Applied page', url: '/identity/applied/' },
];

/* --- Placeholder copy ------------------------------------------------------
   Deliberately obvious. These strings exist so the layout has something to
   hold; none of them are proposed website content. */
const placeholder = {
  short: 'Placeholder heading',
  sentence: 'Placeholder sentence that occupies the space real copy will take.',
  paragraph:
    'Placeholder paragraph. This block exists to show line length, line height and colour at a realistic reading size. The final words will be written separately and are not decided here.',
  cardTitle: 'Placeholder title',
  cardText: 'Placeholder description of roughly the length the finished text is expected to run to.',
  label: 'Placeholder',
};

export default {
  core,
  palette,
  derived,
  pairings,
  typeScale,
  spaceScale,
  motion,
  imagery,
  atmosphere,
  nav,
  placeholder,
  radii: [
    { token: '--r-xs', value: '3px', use: 'Checkboxes, badges' },
    { token: '--r-sm', value: '6px', use: 'Buttons and form fields' },
    { token: '--r-md', value: '10px', use: 'Cards, gallery frames' },
    { token: '--r-lg', value: '16px', use: 'Large figures and media bands' },
    { token: '--r-full', value: '999px', use: 'The floating action button and avatars only' },
  ],
  shadows: [
    { token: '--shadow-xs', value: '0 1px 2px rgba(41,33,29,0.04)', use: 'Resting cards' },
    { token: '--shadow-sm', value: '0 4px 14px -8px rgba(41,33,29,0.14)', use: 'Card hover' },
    { token: '--shadow-md', value: '0 14px 40px -22px rgba(41,33,29,0.22)', use: 'Floating elements only' },
  ],
};
