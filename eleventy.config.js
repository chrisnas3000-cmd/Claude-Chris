/**
 * Eleventy configuration.
 *
 * There is rarely a reason to edit this file when rebranding — content,
 * colours and images all live in src/_data/site.js instead.
 */
export default function (eleventyConfig) {
  // Static assets are copied through untouched.
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  // Rebuild the browser preview when CSS or JS changes.
  eleventyConfig.addWatchTarget('src/assets/');

  /* --- Filters used by the templates ------------------------------------ */

  // Builds a WhatsApp link with a pre-filled message.
  // Usage: {{ site.contact.whatsapp.link | whatsapp(site.contact.whatsapp.prefill) }}
  eleventyConfig.addFilter('whatsapp', (link, message) =>
    message ? `${link}?text=${encodeURIComponent(message)}` : link
  );

  // Turns a service name into a WhatsApp message about that service.
  eleventyConfig.addFilter('bookingMessage', (serviceName, businessName) =>
    `Hello, I'd like to book a ${serviceName} at ${businessName}.`
  );

  // Absolute URL for canonical tags, sitemap and share previews.
  eleventyConfig.addFilter('absolute', (path, base) =>
    `${String(base).replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  );

  // ISO date for the sitemap.
  eleventyConfig.addFilter('isoDate', (d) => new Date(d).toISOString().slice(0, 10));

  // camelCase brand keys -> kebab-case CSS custom properties.
  eleventyConfig.addFilter('kebab', (s) =>
    String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  );

  // Escapes text for safe use inside a JSON-LD <script> block.
  eleventyConfig.addFilter('jsonld', (value) =>
    JSON.stringify(value).replace(/</g, '\\u003c')
  );

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
