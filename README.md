# JD Musick

Official website for JD Musick, an electric blues and soul artist. The debut album, **The Road Still Knows**, was released September 4, 2026.

Built with [Astro](https://astro.build) for static deployment to [Cloudflare Pages](https://pages.cloudflare.com/). The contact form runs as a Pages Function using Cloudflare Turnstile and Cloudflare Email Sending.

## Project locations and ownership

- `C:\Users\JD\source\jd-musick` — website source, configuration, dependencies, `README.md`, `AGENTS.md`, and versioned documentation.
- `C:\Users\JD\projects\jd-musick` — media working project: WAV masters, distribution artwork, and brand images. All folders use lowercase kebab-case; master filenames retain their song titles.
- [Asset organization](docs/assets.md) — folder map, provenance, and the workflow for producing website assets.
- [October 12, 2026 audit](docs/audits/2026-10-12/report.md) — SEO, security, and accessibility evidence and prioritized GitHub issues.

Keep published site identity and links in `src/config/site.ts` and album/track metadata in `src/data/album.ts`. Media specifications and original-file provenance belong with the asset project. Audit findings belong in GitHub Issues; dated evidence belongs in `docs/audits/`.

## Visual direction

The site takes its palette and texture from the album artwork: blackened wood, wet brick, ember orange, rust, and aged cream. Bebas Neue matches the tall condensed artist credit on the cover, Barlow Condensed carries the headlines, Libre Franklin keeps long copy readable, and Roboto Slab supplies the footer mark.

## Content status

- Spotify and Apple Music album links are live.
- Social profile links remain hidden until their correct URLs are recorded in `src/config/site.ts`.
- The released Spotify album is the source of truth for the track order and displayed timings in `src/data/album.ts`.
- Turnstile protects the production contact form with the `contact` action and an exact hostname check.
- Cloudflare Email Sending delivers form submissions to `StoneDragonMedia@gmail.com`.

## Development

```bash
npm install
npm run dev                                  # pages only; Functions are not served
npm run build
npx wrangler pages dev dist                 # includes /api/contact
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Cloudflare Pages project `jdmusick`, via `wrangler.toml`. The connected Git
repository deploys automatically, or a local build can be published with:

```bash
npx wrangler pages deploy dist --project-name jdmusick
```

## Security headers and share image

[`public/_headers`](public/_headers) applies a CSP, HSTS, `X-Frame-Options`,
`nosniff`, `Referrer-Policy`, COOP and `Permissions-Policy` to static routes
through Cloudflare Pages. Function-generated responses must set their own
headers; `_headers` does not apply to `/api/contact`.
The CSP allows only Google Fonts, Cloudflare Turnstile
and the Spotify embed; add any new third-party origin there. After a deploy,
check with `curl -I https://jdmusick.band/`.

`public/og.png` (1200×630, built from the album cover) is the default Open Graph
and Twitter card image on every page. Replace the file to change it.

## Contact form

`POST /api/contact` is the site's only server-side route. The Cloudflare Pages
Function in [`functions/api/contact.ts`](functions/api/contact.ts) verifies
Turnstile and sends messages through the Cloudflare Email Sending REST API.

Production configuration:

| Location | Type | Name |
| --- | --- | --- |
| `wrangler.toml` `[vars]` | Plaintext | `CLOUDFLARE_ACCOUNT_ID` |
| `wrangler.toml` `[vars]` | Plaintext | `EMAIL_FROM_CONTACT` |
| `wrangler.toml` `[vars]` | Plaintext | `CONTACT_TO_EMAIL` |
| `wrangler.toml` `[vars]` | Plaintext | `TURNSTILE_HOSTNAMES` |
| `wrangler.toml` `[vars]` | Plaintext | `PUBLIC_TURNSTILE_SITE_KEY` |
| Pages project secret | Encrypted | `CLOUDFLARE_API_TOKEN` |
| Pages project secret | Encrypted | `TURNSTILE_SECRET` |

The API token needs `Email Sending: Edit` permission for the account. The
Function defaults to `contact@jdmusick.band` as its verified sender. Production
uses `StoneDragonMedia@gmail.com` as the destination through
`CONTACT_TO_EMAIL`; `EMAIL_FROM_CONTACT` can override the sender at runtime.

`src/config/site.ts` contains the public production Turnstile site key as a
fallback. `PUBLIC_TURNSTILE_SITE_KEY` can override it at build time; the
`wrangler.toml` runtime variable alone does not inject a value into Astro's build.
`astro dev` uses Cloudflare's test key and does not serve the Function.
Store `TURNSTILE_SECRET` and `CLOUDFLARE_API_TOKEN` only as encrypted Pages
secrets. Copy `.dev.vars.example` to `.dev.vars` for local Function testing;
never commit the populated file.
