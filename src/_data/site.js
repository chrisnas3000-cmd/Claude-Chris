/**
 * ============================================================================
 *  THE ONLY FILE YOU NEED TO EDIT TO REBRAND THIS SITE.
 * ============================================================================
 *
 *  Business name, contact details, opening hours, services, copy, colours,
 *  fonts and images all live here. Every page reads from this file, so
 *  changing a value here changes it everywhere it appears.
 *
 *  To point the site at a different spa, work top to bottom through this
 *  file. Nothing outside it needs to change.
 *
 *  After editing, run:  npm start   (preview)   or   npm run build   (publish)
 *  See README.md for the full guide.
 */

/* ---------------------------------------------------------------------------
 * 1. BUSINESS IDENTITY
 * ------------------------------------------------------------------------ */
const business = {
  name: "Teena'z Spa",
  // Used where an apostrophe would break things (e.g. file names, some meta).
  namePlain: 'Teenaz Spa',
  // Short descriptor used in the header, footer and page titles.
  tagline: 'Spa, massage & beauty',
  // One sentence. Used for the meta description fallback and JSON-LD.
  summary:
    "A spa, massage and beauty centre in Sodeco, Achrafieh, open late seven days a week.",
};

/* ---------------------------------------------------------------------------
 * 2. CONTACT & LOCATION
 * ------------------------------------------------------------------------ */
const contact = {
  // WhatsApp is the primary booking channel for this site.
  whatsapp: {
    display: '+961 70 023 874',
    link: 'https://wa.me/96170023874',
    // Pre-filled first message. Keep it short — people edit it before sending.
    prefill: "Hello, I'd like to book an appointment at Teena'z Spa.",
  },
  phone: {
    display: '+961 21 429 669',
    link: 'tel:+96121429669',
  },
  instagram: {
    handle: '@teenazspa',
    link: 'https://www.instagram.com/teenazspa/',
  },
  address: {
    street: 'Sodeco',
    district: 'Achrafieh',
    city: 'Beirut',
    country: 'Lebanon',
    countryCode: 'LB',
    // Shown on the contact page and in the footer.
    lines: ['Sodeco, Achrafieh', 'Beirut, Lebanon'],
    // Opens a maps search. Replace with an exact pin when you have one.
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Sodeco%2C+Achrafieh%2C+Beirut%2C+Lebanon',
  },
};

/* ---------------------------------------------------------------------------
 * 3. OPENING HOURS
 *    `days` uses schema.org short codes — they drive the JSON-LD for Google.
 *    `note` is optional and appears under the hours table.
 * ------------------------------------------------------------------------ */
const hours = {
  groups: [
    {
      label: 'Monday — Saturday',
      time: '11:00 AM – 11:00 PM',
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      opens: '11:00',
      closes: '23:00',
    },
    {
      label: 'Sunday',
      time: '2:00 PM – 11:00 PM',
      days: ['Su'],
      opens: '14:00',
      closes: '23:00',
    },
  ],
  note: 'Last appointments start before closing — message us to check availability for the time you want.',
};

/* ---------------------------------------------------------------------------
 * 4. SERVICES
 *    Grouped into categories. Each service needs a `name` and `blurb`.
 *    Add, remove or reorder freely — the pages rebuild themselves.
 *
 *    Deliberately no prices or durations: add them only when the business
 *    confirms them. If you do add a `price` or `duration` key, it will render
 *    automatically under the service name.
 * ------------------------------------------------------------------------ */
const serviceCategories = [
  {
    id: 'massage',
    name: 'Massage',
    // Shown under the category heading on the services page.
    intro:
      'Six treatments, from a full-body wind-down to focused pressure work. Pressure is adjusted as you go — say the word at any point.',
    image: 'massage',
    services: [
      {
        name: 'Relaxing Massage',
        blurb:
          'Long, even strokes at an unhurried pace. The one to choose when you want to switch off rather than work on anything in particular.',
      },
      {
        name: 'Deep Tissue Massage',
        blurb:
          'Firm, slow pressure through the deeper layers of muscle. Best for areas that feel worked-in and tight.',
      },
      {
        name: 'Couples Massage',
        blurb:
          'Two therapists, two tables, one room. Booked as a single appointment so you begin and finish together.',
      },
      {
        name: 'Head Massage',
        blurb:
          'Scalp, neck and shoulders. Short enough to fit into an evening on its own, and a natural add-on to anything else.',
      },
      {
        name: 'Foot Massage',
        blurb:
          'Sustained pressure through the soles, arches and calves. The one people book after a long day on their feet.',
      },
      {
        name: 'Chakra Massage',
        blurb:
          'A slower, quieter treatment following the body’s energy centres from base to crown, with warm oil and long holds.',
      },
    ],
  },
  {
    id: 'body',
    name: 'Body treatments',
    intro:
      'Steam, exfoliation and wrap treatments, including the full Moroccan bath sequence. Set aside more time for these than for a massage.',
    image: 'body',
    services: [
      {
        name: 'Moroccan Bath',
        blurb:
          'The full hammam sequence: steam to soften, black soap, kessa-glove exfoliation, rinse, then rhassoul clay. Skin feels completely resurfaced afterwards.',
        // Marks the service as the standout in its category.
        featured: true,
      },
      {
        name: 'Body Scrubs',
        blurb:
          'Whole-body exfoliation worked from the feet upward, followed by a warm rinse and moisturiser.',
      },
      {
        name: 'Body Treatments',
        blurb:
          'Wraps, masks and targeted care for particular areas. Tell us what you have in mind and we will match the treatment.',
      },
      {
        name: 'Maderotherapy',
        blurb:
          'Contoured wooden tools worked over the body in firm, repetitive strokes. A vigorous, physical treatment rather than a restful one.',
      },
      {
        name: 'Wellness Rituals',
        blurb:
          'Steam, scrub and massage combined into one continuous appointment. The unhurried option when you want the whole sequence.',
      },
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty',
    intro:
      'Face, hands, feet and hair removal. Book these on their own or add them to a massage or bath appointment.',
    image: 'beauty',
    services: [
      {
        name: 'Facial Treatments',
        blurb:
          'Cleanse, exfoliate, extract and mask, adjusted to how your skin is behaving on the day.',
      },
      {
        name: 'Manicure and Pedicure',
        blurb:
          'Shaping, cuticle care and polish for hands and feet — together or separately.',
      },
      {
        name: 'Waxing',
        blurb:
          'Face and body waxing, booked on its own or added to another appointment.',
      },
      {
        name: 'Laser Treatments',
        blurb:
          'Laser hair removal, booked as a course of sessions. We will talk you through what is involved before the first one.',
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * 5. PAGE COPY
 *    Headlines and body text for each page. Keep sentences short.
 * ------------------------------------------------------------------------ */
const copy = {
  home: {
    // The hero is the first thing anyone reads. Two lines, second one accented.
    heroEyebrow: 'Sodeco · Achrafieh · Beirut',
    heroTitle: 'The evening',
    heroTitleAccent: 'belongs to you',
    heroLead:
      'A spa, massage and beauty centre in the middle of Achrafieh, open until 11 every night. Come after work, not instead of it.',
    // Three short proof points under the hero.
    // A `value` of 'auto' is replaced with the live number of services, so it
    // never goes stale when you add or remove treatments above.
    marks: [
      { label: 'Open until', value: '11 PM', detail: 'Seven days a week' },
      { label: 'Treatments', value: 'auto', detail: 'Massage, body & beauty' },
      { label: 'Booking', value: 'WhatsApp', detail: 'Usually a quick reply' },
    ],
    ritualTitle: 'The Moroccan bath',
    ritualLead:
      'The treatment worth building an evening around. Steam opens the skin, black soap softens it, and the kessa glove takes away everything the week left behind. Rhassoul clay finishes it.',
    ritualSteps: [
      {
        name: 'Steam',
        text: 'You start in the steam room. Nothing happens quickly here — the heat needs time to do its work.',
      },
      {
        name: 'Black soap',
        text: 'Olive-based savon beldi is applied and left to sit while the steam keeps working.',
      },
      {
        name: 'Kessa',
        text: 'The exfoliating glove, worked firmly over the whole body. This is the part people come back for.',
      },
      {
        name: 'Rhassoul',
        text: 'Mineral clay, then a warm rinse. You leave slower than you arrived.',
      },
    ],
    closingTitle: 'Book on WhatsApp',
    closingLead:
      'Tell us the treatment and roughly when suits you. We will come back with a time.',
  },
  services: {
    title: 'Treatments',
    lead:
      'Fifteen treatments across massage, body and beauty. Nothing here is fixed to a script — tell us what you want from the session and we will shape it around that.',
  },
  about: {
    title: 'A quiet room in a loud city',
    lead:
      'Teena’z Spa sits in Sodeco, in the middle of Achrafieh. It is a spa, massage and beauty centre built around one idea: that the useful hours for looking after yourself are the ones after work, not instead of it.',
    body: [
      'That is why the doors stay open until eleven, every night of the week. A massage at nine in the evening is a different thing from a massage at nine in the morning. It ends the day rather than interrupting it.',
      'The treatment list covers three things. Massage, from a straightforward wind-down to deep, focused pressure work. Body treatments built around the Moroccan bath and its steam-and-scrub sequence. And the beauty side — facials, hands and feet, waxing and laser.',
      'You do not need to know which one you want before you get in touch. Message us on WhatsApp, say roughly what you are after, and we will point you at the right thing.',
    ],
    // Short factual list. Only add entries the business can stand behind.
    points: [
      'Massage, body treatments and beauty services under one roof',
      'Open seven days a week, until 11 PM',
      'Couples treatments booked as a single appointment',
      'Booking and questions handled over WhatsApp',
    ],
  },
  contact: {
    title: 'Find us, message us',
    lead:
      'WhatsApp is the fastest way to reach us and the easiest way to book. Call if you would rather talk it through.',
  },
  notFound: {
    title: 'This page has closed for the night',
    lead: 'The page you were after is not here. Everything else still is.',
  },
};

/* ---------------------------------------------------------------------------
 * 6. NAVIGATION
 * ------------------------------------------------------------------------ */
const nav = [
  { label: 'Home', url: '/' },
  { label: 'Treatments', url: '/treatments/' },
  { label: 'About', url: '/about/' },
  { label: 'Visit', url: '/visit/' },
];

/* ---------------------------------------------------------------------------
 * 7. IMAGES
 *
 *    HOW TO SWAP IN REAL PHOTOS
 *    --------------------------
 *    1. Drop your photo into  src/assets/img/
 *    2. Change the `src` below to match the file name.
 *    3. Update the `alt` text to describe the new photo.
 *
 *    That is the whole process — nothing else needs touching.
 *
 *    The site currently ships with generated artwork rather than photography
 *    (see README.md for why). Landscape crops work best for `hero`, `hammam`
 *    and `interior`; portrait or square crops for the three category images.
 * ------------------------------------------------------------------------ */
const images = {
  hero: {
    // Leave `src` empty to use the generated placeholder frame; set it to a
    // file in src/assets/img/ to use a real photograph instead. Nothing else
    // needs to change — the template switches automatically.
    src: '/assets/img/hero-poster.jpg',
    tone: 'warm',
    alt: 'A treatment room lit by candles, with warm towels, hot stones and steam',
  },
  hammam: {
    src: '/assets/img/hammam.jpg',
    tone: 'steam',
    alt: 'Steam rising from a stone basin of warm water, with a kessa glove resting on the marble edge',
  },
  interior: {
    src: '/assets/img/interior.jpg',
    tone: 'stone',
    alt: 'A treatment room lit by candles, with folded towels, hot stones and a brass bowl of oil',
  },
  // Wider and quieter than `interior` — used where a band of image sits behind
  // or beside text and needs open space rather than detail.
  room: {
    src: '/assets/img/room.jpg',
    tone: 'warm',
    alt: 'A plaster wall and treatment table lit by a row of candles',
  },
  massage: {
    src: '',
    tone: 'warm',
    // Set to true once scripts/encode-service-videos.mjs has produced
    // service-massage.mp4/.webm and service-massage-poster.jpg. The card then
    // plays the clip instead of showing a placeholder frame.
    video: true,
    alt: 'Warm towels and oils laid out beside a massage table',
  },
  body: {
    src: '',
    tone: 'steam',
    // Set to true once scripts/encode-service-videos.mjs has produced
    // service-body.mp4/.webm and service-body-poster.jpg. The card then
    // plays the clip instead of showing a placeholder frame.
    video: true,
    alt: 'The steam room, prepared for a Moroccan bath',
  },
  beauty: {
    src: '',
    tone: 'bronze',
    // Set to true once scripts/encode-service-videos.mjs has produced
    // service-beauty.mp4/.webm and service-beauty-poster.jpg. The card then
    // plays the clip instead of showing a placeholder frame.
    video: true,
    alt: 'Candlelight and glassware in the beauty area',
  },
  // Used for link previews on WhatsApp, Instagram and search results.
  // This one must stay a real image file — WhatsApp will not render an SVG.
  share: {
    src: '/assets/img/share.png',
    alt: "Teena'z Spa \u2014 spa, massage and beauty in Sodeco, Achrafieh",
  },
};

/* ---------------------------------------------------------------------------
 * 8. BRAND — COLOURS & TYPE
 *
 *    These become CSS custom properties, so changing a hex here restyles the
 *    whole site (including the generated artwork, which reads the same values).
 *
 *    Keep the light/dark pairings contrast-safe if you change them:
 *    text on its background should stay at 4.5:1 or better.
 * ------------------------------------------------------------------------ */
/* ---------------------------------------------------------------------------
 * 7b. HERO VIDEO
 *
 *    Set `enabled: false` to fall back to the poster image everywhere; the
 *    hero keeps working and nothing else needs changing.
 *
 *    The video is decorative and silent. It is never the only way any
 *    information is conveyed, so it carries no captions or transcript.
 *
 *    To replace it, encode a new pair with the same recipe (see README) and
 *    drop them into src/assets/video/. Both formats matter: WebM is roughly
 *    40% smaller and covers most modern browsers, MP4 covers the rest.
 * ------------------------------------------------------------------------ */
const heroVideo = {
  enabled: true,
  webm: '/assets/video/hero.webm',
  mp4: '/assets/video/hero.mp4',
  // Phone-sized copies, used below the 48rem breakpoint. Roughly a quarter of
  // the bytes for a screen that cannot show the difference. Rebuild them with
  // `npm run video:mobile` after replacing either file above.
  webmSm: '/assets/video/hero-sm.webm',
  mp4Sm: '/assets/video/hero-sm.mp4',
  // Shown before the video loads, and instead of it whenever playback is
  // suppressed — reduced motion, Save-Data, or a slow connection.
  poster: '/assets/img/hero-poster.jpg',
  width: 1600,
  height: 894,
};

const brand = {
  /*
    The visual identity palette. These are injected as CSS custom properties
    and override the defaults in identity.css, so this stays the single place
    to change the site's colours.

    Two of the six brand colours cannot carry small text — bronze and sage
    measure 3.41:1 and 3.28:1 against ivory, where AA asks 4.5:1. The `*Ink`
    values are their accessible counterparts, tuned against sand (the darkest
    light ground). If you change a colour here, run `npm run a11y` afterwards.
    See /identity/ for the full system.
  */
  colors: {
    ivory: '#F7F2EA',       // 60% — primary ground
    white: '#FFFDFC',       // 60% — raised surfaces
    sand: '#DDD0BE',        // 10% — alternate sections, quiet dividers
    espresso: '#29211D',    // 20% — type, footer, primary buttons
    sage: '#7F8977',        //  5% — wellness accent
    bronze: '#A87955',      //  5% — premium detail, hairlines, icons
    bronzeInk: '#75502F',   // accessible bronze for text and filled buttons
    sageInk: '#4E5748',     // accessible sage for text
    espressoSoft: '#5A524C',// secondary body copy
  },
  fonts: {
    display: "'Cormorant Garamond', Cormorant, Georgia, 'Times New Roman', serif",
    body: "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
};

/* ---------------------------------------------------------------------------
 * 9. SITE / SEO SETTINGS
 * ------------------------------------------------------------------------ */
const seo = {
  // No trailing slash. Include any subpath the host serves the site from —
  // canonical URLs, the sitemap and share previews are all built from this.
  // The deploy workflow supplies SITE_URL, derived from the repository name,
  // so the published site is always right; this literal is only the fallback
  // for a local build. Set it to the real domain once one is bought.
  url: process.env.SITE_URL || 'https://chrisnas3000-cmd.github.io/Claude-Chris',
  locale: 'en',
  localeOg: 'en_US',
  // Falls back to business.summary when a page sets no description.
  defaultDescription:
    "Teena'z Spa is a spa, massage and beauty centre in Sodeco, Achrafieh, Beirut. Massage, Moroccan bath, facials and more, open until 11 PM. Book on WhatsApp.",
  keywords: [
    'spa Beirut',
    'massage Achrafieh',
    'Moroccan bath Beirut',
    'hammam Beirut',
    'spa Sodeco',
    'facial Achrafieh',
  ],
  // schema.org type. `DaySpa` is the closest match for this business.
  schemaType: 'DaySpa',
  // Price bracket for search results only — $ to $$$$, or null to omit.
  priceRange: null,
};

/* ---------------------------------------------------------------------------
 * 10. CONCEPT DISCLAIMER
 *     Set `enabled: false` once this becomes the official site.
 * ------------------------------------------------------------------------ */
const disclaimer = {
  enabled: true,
  text:
    'This is an independent website concept and not the official Teena’z Spa website. All imagery and film is AI-generated and does not show the actual premises. Details shown here should be confirmed with the spa directly.',
};

export default {
  business,
  heroVideo,
  contact,
  hours,
  serviceCategories,
  copy,
  nav,
  images,
  brand,
  seo,
  disclaimer,
  // Convenience values derived from the above — no need to edit these.
  get serviceCount() {
    return serviceCategories.reduce((n, c) => n + c.services.length, 0);
  },
  get year() {
    return new Date().getFullYear();
  },
};
