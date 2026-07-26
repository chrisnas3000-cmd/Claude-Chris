# Teena'z Spa — website

A website concept for Teena'z Spa, a spa, massage and beauty centre in Sodeco,
Achrafieh, Beirut. The site exists to present the business properly and push
visitors towards booking on WhatsApp.

> **This is an independent concept, not the official Teena'z Spa website.**
> A disclaimer to that effect sits in the footer of every page. Turn it off in
> `src/_data/site.js` (`disclaimer.enabled: false`) once it becomes official.

---

## Quick start

```bash
npm install
npm start        # preview at http://localhost:8080
npm run build    # publish to _site/
npm test         # build, then run every check
```

Requires Node 18 or newer. No other tooling needed.

---

## Changing the site

**Almost everything lives in one file: [`src/_data/site.js`](src/_data/site.js).**

Business name, phone numbers, WhatsApp link, address, opening hours, the whole
treatment list, page copy, brand colours, fonts and image paths are all defined
there, with comments explaining each section. Every page reads from it, so a
change in that file changes the site everywhere the value appears.

| To change… | Edit |
| --- | --- |
| Name, tagline, summary | `business` |
| WhatsApp, phone, Instagram, address | `contact` |
| Opening hours | `hours` |
| Treatments and their descriptions | `serviceCategories` |
| Headlines and body copy | `copy` |
| Menu items | `nav` |
| Photographs | `images` |
| Colours and fonts | `brand` |
| Domain, meta description, keywords | `seo` |
| The concept disclaimer | `disclaimer` |

### Adding or removing a treatment

Add an entry to the relevant category in `serviceCategories`:

```js
{
  name: 'Hot Stone Massage',
  blurb: 'Warm basalt stones worked along the back and shoulders.',
  featured: true,        // optional — flags it as the category's signature
  duration: '60 min',    // optional — renders only if present
  price: '',             // optional — renders only if present
}
```

The treatments page, the home page counts, the "15 treatments" figure and the
structured data for search engines all update themselves. Nothing else to touch.

### Rebranding to a different spa

Work top to bottom through `src/_data/site.js`, replacing values as you go.
Then run `npm run build`. That is the whole job — no template edits required.

If you change the colours in `brand.colors`, run `npm run art` afterwards so the
generated artwork picks up the new palette. Keep text and background pairings at
a contrast ratio of 4.5:1 or better; `npm run a11y` will tell you if you break it.

---

## Images

**All imagery is AI-generated and does not show the real premises.** Stock-photo
hosts were unreachable in the environment this was built in, and no photography
of the actual spa was supplied, so the hero film, the three service clips and
the interior stills were all generated. They are graded to one warm neutral so
they read as a single shoot.

This is stated plainly in the footer disclaimer, and it matters: the site should
not imply these are photographs of the business. Replace them with real
photography before this goes anywhere near a customer.

To swap in a real photo, set `src` on the matching entry in `site.js`:

```js
hero: {
  src: '/assets/img/hero.jpg',    // was ''
  tone: 'warm',                   // only used if src is empty
  alt: 'The treatment room at Teena\'z Spa, lit low in the evening',
},
```

The template switches from a placeholder frame to a real `<img>` automatically
— sized identically, so nothing about the layout moves. Recommended crops:

| Slot | Shape | Suggested subject |
| --- | --- | --- |
| `hero` | poster for the hero film, 1600×894 | the room, lit low |
| `hammam` | portrait, 1000×1250 | steam, water, Moroccan bath detail |
| `interior` | landscape, 1600×1000 | a treatment room with detail in frame |
| `room` | wide, 1800×900 | the space with open, uncluttered wall |
| `share` | 1200×630 **PNG** | used for WhatsApp and social link previews |

`share` must stay a PNG or JPG — WhatsApp will not render an SVG link preview,
and WhatsApp is where this site sends people.

Write real `alt` text for each one. It is what screen readers announce and what
search engines read.

---

## The hero video

The home page opens on a silent, looping clip of the treatment room. It is
configured in `site.js` under `heroVideo`; set `enabled: false` to fall back to
the poster image everywhere.

### How it behaves

The poster image paints first and the video fades in over it only once frames
are genuinely rendering, so the hero is never blank and never depends on the
video arriving. The markup ships with **no `<source>` element and
`preload="none"`** — nothing is downloaded until the loader decides the video is
worth fetching.

It is not fetched at all when:

- the visitor prefers reduced motion,
- `Save-Data` is set,
- or the connection reports as 2G.

In each case the poster carries the hero on its own and **zero video bytes are
transferred** — the tests assert this, because skipping playback while still
downloading two megabytes would miss the point.

Playback also pauses while the tab is hidden, and the browser only downloads
the first format it supports, never both.

### Encoding

The source was 11.7 MB, 10s, 1924×1076 at 9.3 Mb/s — far too heavy for a hero.
The shipped pair is 1.74 MB (MP4) and 1.02 MB (WebM) for a **20-second** loop.
It is longer because it is a boomerang: the clip is a one-way camera pan, so
playing it forward then reversed removes the jump cut a plain loop would have
at the seam.

To re-encode a replacement, from a source at `in.mp4`:

```bash
FF=node_modules/ffmpeg-static/ffmpeg
FILTER="[0:v]scale=1600:-2,setsar=1,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]"

$FF -i in.mp4 -filter_complex "$FILTER" -map "[v]" -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -preset slow \
  -movflags +faststart src/assets/video/hero.mp4

$FF -i in.mp4 -filter_complex "$FILTER" -map "[v]" -an \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 src/assets/video/hero.webm

$FF -ss 0.2 -i in.mp4 -frames:v 1 -vf scale=1600:-2 -q:v 5 \
  src/assets/img/hero-poster.jpg
```

`-an` matters: it guarantees no audio track ships, so the video cannot make a
sound under any circumstance.

### Legibility over moving footage

Text over video cannot be checked by a static audit — the background moves, so
a frame that passes now may not three seconds later. `npm run check:video`
samples the **actual composited pixels** behind each piece of hero type across
the whole loop, at both phone and desktop widths, and reports the worst frame.

It measures the real glyph bounds rather than the block box, and reports the
95th percentile alongside the maximum: a single candle flame behind one letter
should not condemn a headline, but the bright tail of the region still has to
be legible. Every text element currently clears AA on both counts.

If you replace the footage, run that check. The scrim is tuned to this clip,
and a brighter one will need a stronger one.

---

## Service card videos

Each of the three category cards on the home page plays its own silent,
looping clip.

### Replacing them

1. Put the three source videos somewhere on disk.
2. Encode them — order matters, it is massage, body, beauty:

```bash
node scripts/encode-service-videos.mjs massage.mp4 body.mp4 beauty.mp4
```

That writes `service-<name>.mp4`, `service-<name>.webm` and
`service-<name>-poster.jpg` for each. The current set is 424–552 KB (MP4),
398–490 KB (WebM) and 44–57 KB (poster), from 8-second 1664×1244 sources.

3. `npm test`.

`video: true` is already set on the three entries in the `images` block of
`src/_data/site.js`. Set it to `false` on any card to fall back to a
placeholder frame.

### How they behave

Nothing is downloaded until a card scrolls near the viewport, so a visitor who
never reaches that section pays nothing for three videos. Playback pauses when
a card scrolls back off screen. The same gates as the hero apply — reduced
motion, `Save-Data` and 2G all skip the video entirely and leave the poster.

### Why a crossfade rather than a boomerang

The hero loops by playing forward then reversed, which is invisible on a slow
camera pan. That would be wrong here: these clips contain hands moving in one
direction, and a massage stroke played backwards reads as obviously fake. The
card encoder instead dissolves the tail back over the head, so the clip loops
seamlessly with every frame still moving forwards. It costs one second of
duration.

### Framing

The card frame is **4:3** and the encoder outputs 1000×750 to match, so a 4:3
source is preserved intact. Anything else is centre-cropped to fit — a square
source loses about 12% off the top and bottom. Keep the subject centred.

---

## Two separate things in this repository

| | What it is | Where |
| --- | --- | --- |
| **The content site** | A working website with the real business details, built to drive WhatsApp bookings. | `/`, `/treatments/`, `/about/`, `/visit/` |
| **The visual identity system** | A design system — palette, type, spacing, components, imagery and motion — using placeholder copy only. | `/identity/*` |

The identity system is the visual authority; the content site is built on it.
`identity.css` owns the tokens and shared components, and `site.css` adds only
what is specific to this site — the hero, the treatment list, the opening
hours, the booking bar. No colour or size is hard-coded in either.

---

## The visual identity system

Four pages under `/identity/`, built from `src/assets/css/identity.css` and
`src/_data/identity.js`:

- **Foundations** — atmosphere, palette, derived tints, a measured contrast
  table, the type scale, spacing, radius and elevation.
- **Components** — buttons, cards, testimonials, editorial sections, media
  bands, gallery, accordion, forms, location container and all four navigation
  surfaces.
- **Imagery & motion** — the photography brief, the tonal range, rules for type
  over pictures, video handling, motion durations and the quality floor.
- **Applied page** — the whole system composed as a homepage, so the atmosphere
  can be judged in context.

**Every word on those pages is placeholder.** The identity is the deliverable;
the copy is not.

### The palette, and why there are ten colours instead of six

The six brand colours are used exactly as specified. Four additional tints
exist because two of the six cannot legally carry small text — bronze measures
3.41:1 against ivory and sage 3.28:1, where WCAG AA asks 4.5:1. Each has a
deepened counterpart for type and filled buttons, while the originals stay for
headings, icons, borders and decoration, where the bar is 3:1.

Those tints are tuned against **sand**, not ivory. Sand is the darkest of the
three light grounds and is itself a section background — a tint tuned only to
ivory passes on the page you tested and then fails the moment it lands on a
sand section. That mistake was made and caught here by `npm run a11y`.

Every ratio shown on the foundations page is calculated from the hex values at
build time, so the documentation cannot drift from the palette.

### Single theme, deliberately

The system commits to one warm, light world rather than shipping a dark
variant. That is the brief: ivory-led, never dim. The dark register is
expressed as espresso blocks inside a light page. A night theme would read as
the "dark massage parlour" the direction explicitly rules out.

### Imagery

Image areas are painted `<canvas>` fields, not photographs — soft, out-of-focus
washes in the brand's warm grade. They show how the palette behaves at image
scale, how type sits on a scrim and how a grid of pictures reads together,
without asserting photographs that have not been taken. Each is sized and toned
to be swapped one-for-one with a real shot. The `/identity/imagery/` page is
written to be handed to a photographer as-is.

### The identity is applied

The content site runs on this system. Changing a token in `identity.css` — or
overriding it from `site.js` — restyles both the identity pages and the live
site at once.

The palette in `site.js` overrides the defaults in `identity.css`, so `site.js`
remains the single place to change this site's colours and faces. Run
`npm run a11y` after any colour change; it is what caught the sand failure
described above.

---

## Design (content site)

The direction is built on two facts about this business: it runs a Moroccan
bath, and it stays open until 11 PM every night. So the site is set in the
evening rather than in the bright white daylight most spa sites default to.

- **Palette** — deep hammam greens (`noir`, `stone`, `jade`) against warm
  plaster (`tadelakt`), with brass as the single accent and rose clay used
  sparingly. Dark and light sections alternate to give the page rhythm.
- **Type** — Marcellus for display, an inscriptional Roman face that suits the
  stone-and-arch subject, paired with Jost for body text. Both are self-hosted;
  no request ever leaves for a font CDN.
- **The signature** — the Moorish pointed arch. It is defined once as an SVG
  clip path in `base.njk` and reused for the category images, the section
  figures, the logo mark and the outline behind the closing call to action.
- **Numbered steps** appear in exactly one place, the Moroccan bath sequence,
  because a hammam genuinely is an ordered process. They are not used as
  decoration elsewhere.

Motion is limited to a short reveal on scroll and hover states, and is disabled
entirely under `prefers-reduced-motion`.

---

## Structure

```
src/
  _data/site.js          ← all content and branding
  _includes/
    layouts/base.njk     ← <head>, SEO, structured data, arch clip path
    partials/            ← header, footer, booking bar
  assets/
    css/style.css        ← all styling (colours come from site.js)
    css/fonts.css        ← generated by npm run fonts
    js/main.js           ← menu, sticky header, reveals
    img/                 ← generated by npm run art
    fonts/               ← self-hosted woff2
  index.njk              ← home
  treatments.njk         ← all treatments, grouped by category
  about.njk
  visit.njk              ← contact, hours, location
  404.njk
  sitemap.njk robots.njk
scripts/                 ← build and test tooling
```

---

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Preview with live reload |
| `npm run build` | Generate artwork, then build to `_site/` |
| `npm test` | Build and run every check below |
| `npm run check` | Broken links, missing assets, JSON-LD, meta tags, headings |
| `node scripts/encode-service-videos.mjs a b c` | Encode the three service card clips |
| `npm run check:video` | Contrast of hero type against the moving video, across the loop |
| `npm run a11y` | axe-core WCAG 2.1 AA audit plus keyboard checks |
| `npm run e2e` | Menu, booking bar, jump links, service booking links |
| `npm run shots` | Screenshots at 3 widths into `.screenshots/` |
| `npm run preview` | Pack the content site into a single `preview.html` |
| `npm run preview:identity` | Pack the identity system into a single `identity.html` |
| `npm run art` | Regenerate SVG artwork from the brand palette |
| `npm run raster` | Regenerate `share.png` and the touch icon |
| `npm run fonts` | Re-download and self-host the web fonts |

---

## Before going live

1. **Set the real domain** in `seo.url` in `site.js`. Canonical URLs, the
   sitemap and link previews all depend on it, and they are wrong until you do.
2. **Replace the artwork** with real photography (see above).
3. **Confirm the details** — hours, phone numbers and the treatment list should
   be checked with the business.
4. **Add an exact map pin.** `contact.address.mapsLink` currently points at a
   Sodeco area search, not the building.
5. **Turn off the disclaimer** once it is the official site.
6. Run `npm test` and deploy the `_site/` folder.

The build output is plain static files. Any static host works — Netlify, Vercel,
Cloudflare Pages, GitHub Pages, or ordinary shared hosting. Point it at `_site/`
with `npm run build` as the build command.

---

## What this site deliberately does not claim

No prices, no reviews or ratings, no awards, no staff names or qualifications,
and no medical or therapeutic claims. Treatment descriptions say what happens
during the treatment, not what it will do for your health. Keep it that way
unless the business supplies the details and can stand behind them.

---

## Licence

MIT for the code. The artwork is generated from this repository's own palette
and carries no third-party licence. Any photography you add is your own to
clear.
