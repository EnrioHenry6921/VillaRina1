# Villa Rina | Website

A modern, multilingual (EN / DE / HR) static website for **Villa Rina**, a luxury 5-star
holiday villa in Crikvenica, Croatia. Built with semantic HTML, modern CSS and vanilla
JavaScript. **No frameworks, no build step.** Deployable as-is to any static host.

## ⚠️ Important: activate the inquiry form (one-time step)

The inquiry forms send email through [FormSubmit](https://formsubmit.co) with no backend.
**The very first time the form is submitted, FormSubmit sends a one-time confirmation
email to `sandraskiljan11@gmail.com`. That email contains an activation link that must be
clicked before any inquiries are delivered.** Submit the form once after deploying, open
the confirmation email and click the link. Done.

Also update the redirect URL used after a successful submission: in `index.html` and
`contact.html`, find the hidden input

```html
<input type="hidden" name="_next" value="https://www.villa-rina.com/thank-you.html">
```

and replace `https://www.villa-rina.com` with the final deployed domain (the same applies
to the `<link rel="canonical">` and `og:url` / `og:image` tags in every page's `<head>`).

## Preview locally

Any static file server works. The simplest:

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

or `npx serve .` if you prefer Node. Opening `index.html` directly from the file system
also works, but a local server is closer to production behaviour.

## Deploy

The site is plain static files. Deploy the whole folder to:

- **Netlify:** drag & drop the folder in the Netlify dashboard, or `netlify deploy`.
- **Vercel:** `vercel` in the project root (framework preset: "Other").
- **GitHub Pages:** push to a repository, then Settings → Pages → deploy from branch.

No build command, no environment variables. After deploying, do the FormSubmit
activation step above and update the `_next` / canonical URLs.

## Project structure

```
index.html          Home (hero, highlights, stats, photo tour, testimonials, inquiry CTA)
villa.html          The villa: rooms, facts, interactive amenity explorer
gallery.html        All photos, filterable by category, custom lightbox
location.html       Crikvenica: distances explorer, restaurants, beaches, map
about.html          The hosts' story
contact.html        Contact cards, full inquiry form, FAQ, Google Map
thank-you.html      Post-submission confirmation page
css/style.css       All styles (design tokens at the top under ":root")
js/main.js          All interactivity (commented by module)
js/translations.js  Every UI string in EN / DE / HR
images/             Optimized villa photos (max 1600 to 2000px wide)
images/thumbs/      800px thumbnails used in grids (srcset)
images/illustrations/  Minimal SVG artwork for restaurant/beach cards (see note below)
favicon.svg         The "roof + waves" site mark
images/og-image.jpg Social sharing image (1200×630)
```

## Replacing images

1. Export the new photo as JPEG, max ~2000px on the long edge (heroes) or ~1600px
   (everything else), quality ≈ 80.
2. Drop it into `images/` and an 800px version with the **same filename** into
   `images/thumbs/`.
3. If it's a new file name, update the `<img>`/`srcset` references in the HTML.
   Gallery categories are derived from the filename prefix
   (`outdoors…`, `living…`, `kitchen…`, `bedroom…`, `wc…`).

**Restaurant & beach cards** on `location.html` currently use minimal SVG illustrations
(`images/illustrations/`) in the site's palette, and are labelled as illustrative in
their alt text. If you have real photos of the restaurants and beaches, replace the
`<img src="images/illustrations/….svg">` references with them. Real photos are always
better.

## Photo status

The outdoor, pool, terrace and aerial photos are the current professional set.
The interior photos (living room, kitchen, bedrooms, bathrooms) are from the older
shoot and are kept as placeholders until the new interior set arrives; drop the new
files into `images/` + `images/thumbs/` and update the references as described above.

## Editing translations

All UI text lives in `js/translations.js` as one big dictionary with `en`, `de` and `hr`
sections that share the same keys. Elements reference keys via `data-i18n` attributes
(plus `data-i18n-ph` for placeholders and `data-i18n-aria` for screen-reader labels).

- To change wording: edit the string in all three languages.
- To add a new translatable element: add `data-i18n="your.key"` to the element and the
  key to each language block.
- The visitor's choice is stored in `localStorage` (`vr-lang`) and defaults to English.

## Things the owner should confirm (marked with TODO in the code)

- Check-in / check-out times (FAQ answer says 4 pm / 10 am).
- The months in which the pool is heated.
- Number of parking spaces.
- Pet policy.
- Security deposit amount.
- The final deployed domain in `_next`, canonical and Open Graph URLs (see above).

## Notes

- Smooth scrolling uses the tiny [Lenis](https://lenis.darkroom.engineering/) library via
  CDN; if the CDN is unreachable the site silently falls back to native scrolling.
- All animation respects `prefers-reduced-motion` and degrades to a fully static page.
- SEO: every page has unique meta tags and Open Graph data; `index.html` carries
  `schema.org` VacationRental structured data with the villa's real details.
