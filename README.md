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

**The site currently ships with generated SVG artwork rather than photography.**
The environment this was built in blocked every stock-photo host, so rather than
reference photos that could not be verified — and would have shown as broken
images — the artwork is drawn from the brand palette by
[`scripts/generate-art.mjs`](scripts/generate-art.mjs): the lit archway, the
zellige tilework, the colonnade and the three category tiles.

It is intended to be replaced. To swap in a real photo:

1. Drop the file into `src/assets/img/`
2. Point the matching entry in `site.js` at it and update the `alt` text:

```js
hero: {
  src: '/assets/img/hero.jpg',
  alt: 'The treatment room at Teena\'z Spa, lit low in the evening',
},
```

That is the entire process. Recommended crops:

| Slot | Shape | Suggested subject |
| --- | --- | --- |
| `hero` | landscape, 1600×1100 or wider | the entrance or a treatment room, lit low |
| `hammam` | square, 1200×1200 | tilework, textures, the steam room |
| `interior` | landscape, 1600×900 | the space itself, looking through it |
| `massage` | portrait, 900×1200 | a massage table, oils, hands at work |
| `body` | portrait, 900×1200 | the steam room or scrub preparation |
| `beauty` | portrait, 900×1200 | facial, nails or the beauty area |
| `share` | 1200×630 **PNG** | used for WhatsApp and social link previews |

`share` must stay a PNG or JPG — WhatsApp will not render an SVG link preview,
and WhatsApp is where this site sends people.

Write real `alt` text for each one. It is what screen readers announce and what
search engines read.

---

## Design

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
| `npm run a11y` | axe-core WCAG 2.1 AA audit plus keyboard checks |
| `npm run e2e` | Menu, booking bar, jump links, service booking links |
| `npm run shots` | Screenshots at 3 widths into `.screenshots/` |
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
