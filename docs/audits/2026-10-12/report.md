# JD Musick site audit — October 12, 2026

## Result

Eleven GitHub issues: two accessibility, six security, and three SEO. One P1,
four P2, and six P3. Address the mobile keyboard defect first, then contact
request/deadline handling, dependency maintenance and inline-link accessibility.
No indexation blocker or demonstrated public remote-code execution was found.
SEO items are improvements rather than measured ranking failures.

This pass organized media and updated documentation. Site behavior, public copy,
dependencies and deployed configuration were not changed. Issues contain fix
recommendations and acceptance criteria; their current status belongs in GitHub.

## Scope and evidence

- Source baseline: commit 0a239448c9d021001e43edd99f5401a6debe8714, static Astro
  output plus the sole Pages Function at POST /api/contact.
- Live site: https://jdmusick.band. Browser-tested home, Music, About, Contact,
  Privacy Policy and /404.html; compared against Astro dev on local port 4322
  because 4321 was already in use. Build produced all six pages successfully.
- Chromium browser via installed Microsoft Edge and bundled Playwright.
  axe-core **4.14.0**, exact-pinned in a temporary tool project and loaded from
  its local installed file. The skill example's 4.12.1 was superseded by the
  current registry version. Website package/lock files were not changed.
- Desktop viewport 1280 × 900 and narrow viewport 320 × 800; keyboard focus,
  menu expansion, skip navigation, image candidate selection, DOM metadata and
  JSON-LD, and a text-spacing check (1.5 line height, .12em letter spacing,
  .16em word spacing, 2em paragraph spacing).
- Controlled local Function invocations tested malformed input without real
  secrets or outbound email. No live contact POST or test email was sent.
- Read-only npm audit, source security review and live HTTP resource/header/
  redirect checks. The dependency scan reported 13 vulnerable **packages**,
  not 13 distinct vulnerabilities: 1 critical, 10 high, 1 moderate, 1 low.

| Evidence | Contents |
| --- | --- |
| [browser-audit.json](browser-audit.json) | 12 page visits, live/local metadata and JSON-LD, desktop/mobile axe results, reflow, keyboard trace |
| [manual-audit.json](manual-audit.json) | Contrast calculations, text spacing, skip-link continuation, expanded-menu keyboard check |
| [function-audit.json](function-audit.json) | Local request-shape and overlong-email validation results |
| [http-audit.json](http-audit.json) | Live response statuses, selected security headers, robots/sitemap contents, redirects |
| [npm-audit.json](npm-audit.json) | Full dependency advisory snapshot and severity counts |
| [created-issues.json](created-issues.json) | Verified issue URLs, categories and priorities |

The 320px test represents the viewport width commonly used to assess reflow at
400% on a 1280px desktop. It is not a complete browser-zoom or assistive-
technology test. All six routes had no page-level horizontal overflow both at
320px and with the text-spacing override.

## Issue index by category and priority

P1 = high, user-blocking defect; P2 = confirmed defect or meaningful hardening
gap; P3 = incremental improvement or defense in depth. These are remediation
priorities, not CVSS ratings. Categories and priorities are separate labels.

| Category | Priority | GitHub issue |
| --- | --- | --- |
| accessibility | P1 | [[P1][Accessibility] Remove collapsed mobile navigation from keyboard focus](https://github.com/jmusick/jd-musick/issues/1) |
| accessibility | P2 | [[P2][Accessibility] Give inline links a visible cue beyond color](https://github.com/jmusick/jd-musick/issues/5) |
| security | P2 | [[P2][Security][A03] Upgrade and triage vulnerable build dependencies](https://github.com/jmusick/jd-musick/issues/4) |
| security | P2 | [[P2][Security][A06] Bound contact payloads and verify abuse limits](https://github.com/jmusick/jd-musick/issues/3) |
| security | P2 | [[P2][Security][A10] Handle invalid JSON shapes and bound email API requests](https://github.com/jmusick/jd-musick/issues/2) |
| security | P3 | [[P3][Security] Reconcile privacy disclosures with current third-party services](https://github.com/jmusick/jd-musick/issues/11) |
| security | P3 | [[P3][Security][A02] Set security headers on contact Function responses](https://github.com/jmusick/jd-musick/issues/6) |
| security | P3 | [[P3][Security][A09] Use bounded privacy-safe contact error logs](https://github.com/jmusick/jd-musick/issues/7) |
| seo | P3 | [[P3][SEO] Add sizes hints to responsive album images](https://github.com/jmusick/jd-musick/issues/10) |
| seo | P3 | [[P3][SEO] Connect artist and album structured data with known release facts](https://github.com/jmusick/jd-musick/issues/9) |
| seo | P3 | [[P3][SEO] Make album search metadata more descriptive](https://github.com/jmusick/jd-musick/issues/8) |

[All audit issues](https://github.com/jmusick/jd-musick/issues?q=is%3Aissue%20is%3Aopen)
can be filtered with category and priority labels. Issues were created in
priority order; this table groups them by category and then priority.

## Checks that passed

- All five sitemap pages, robots.txt, sitemap XML, share image, favicon and CSS
  returned 200. Sitemap URLs match the production origin and page canonicals.
  A deliberately missing path returned a real 404. Direct /404.html returns
  200, but has noindex,follow; it is excluded from the sitemap.
- HTTP redirects to HTTPS (301), www redirects to the apex (308), and /music
  redirects to /music/ (308). Important pages are linked from the header/footer.
- Main pages have unique titles/descriptions, one H1, English language metadata,
  self-referencing canonical URLs and default OG/Twitter image tags. Home/About/
  Music JSON-LD is present and parses in the rendered DOM.
- Static responses carry CSP, HSTS, nosniff, DENY framing, referrer policy, COOP
  and Permissions-Policy. CSP scopes third-party access to known font,
  verification and player origins. Its documented inline allowances are not
  reported as an injection exploit without a demonstrated injection sink.
- Contact validation limits name, subject, message and verification token;
  verifies Turnstile success/action/hostname server-side; escapes submitted HTML;
  strips CR/LF in header-like fields; uses reply_to; checks provider success;
  keeps secrets in runtime configuration; emits generic delivery failures and
  no-store JSON. Outbound destinations are fixed/configuration-controlled.
- Skip navigation advances the next Tab to main content in Edge. Opening the
  menu exposes Home next. Forms have associated labels, autocomplete and a live
  status region. Images use suitable empty/decriptive alt text, the iframe has
  a title, and motion transitions respect reduced-motion preference in CSS.
- Calculated nominal text/background contrasts: muted text on panel 4.66:1,
  muted text on page 5.14:1, primary-button text/background 4.59:1. These pass
  normal-text AA for those solid token pairs. Background-image compositing and
  all transient states still require human contrast review; axe marks several
  gradient/image cases incomplete.

## Current security guidance and applicability

As of October 12, 2026, OWASP Top 10:2025 is the awareness baseline and ASVS
5.0.0 (May 2025) supplies more detailed verification guidance. CSP3's September
2026 publication is still a Working Draft, not a new final mandate. Relevant
known threats include image-decoder/build supply-chain advisories and abuse of
paid email endpoints; active exploitation of this site or a CISA KEV match was
not established. Tooling has moved to Astro 7, and the local lock remains on
6.4.8. Current Cloudflare/OWASP guidance emphasizes backend verification,
actual-byte request limits, deadlines and operational throttling; this site
already has backend Turnstile verification but has the bounded-resource gaps
recorded above. Provider scripts such as Turnstile are not treated as ordinary
fixed CDN assets requiring an incompatible SRI pin.

Primary guidance: [OWASP Top 10:2025](https://top10.owasp.org/2025/en/),
[ASVS](https://github.com/OWASP/ASVS),
[CSP3 draft](https://www.w3.org/TR/2026/WD-CSP3-20260916/),
[OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html),
[Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[Pages headers](https://developers.cloudflare.com/pages/configuration/headers/),
[Astro AVIF advisory](https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2).

| OWASP category | Review outcome |
| --- | --- |
| A01 Broken access control | Public static pages/public form; no per-user resources, auth boundary or user-controlled outbound URL found. Provider account controls unverified. |
| A02 Security misconfiguration | Static headers pass; Function headers gap filed. |
| A03 Software supply chain failures | Lockfile/advisory gaps filed; static vs build applicability documented. |
| A04 Cryptographic failures | HTTPS/HSTS and redirects verified; no password/database crypto in this site. TLS-version configuration and secret lifecycle unverified. |
| A05 Injection | Escaped contact HTML and single-line header values reviewed; no SQL/shell sinks. JSON-LD uses repository-owned data. |
| A06 Insecure design | Body/email limits and verification of rate/budget controls filed. |
| A07 Authentication failures | No visitor authentication, sessions, reset or user accounts. Dashboard MFA/roles unverified. |
| A08 Software/data integrity failures | Lockfile present, JSON-only input, no arbitrary deserializer. Build provenance/branch controls and account deployment settings unverified. |
| A09 Logging and alerting failures | Raw provider-error logging gap filed; account retention/alerts unverified. |
| A10 Exceptional conditions | Null input exception and email deadline gap filed. |

Non-applicable password, session, database and payments checklist items were
excluded rather than treated as failures. This was an audit, not a deployment
approval; unknown operational checks were not marked passed.

## Findings

### [[P1][Accessibility] Remove collapsed mobile navigation from keyboard focus](https://github.com/jmusick/jd-musick/issues/1)

At 320px on the live homepage and local Astro dev build, Tab moves from the closed menu button to Home, Music, About, Contact, Spotify and Apple Music. The menu has opacity 0 and aria-expanded=false throughout. CSS only clips the menu with max-height:0 and overflow:hidden; its links remain focusable. Confirmed by a 10-step keyboard trace, independently of axe. [CSS](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/public/universal.css#L710); [toggle](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/src/components/SiteHeader.astro#L59).

**Impact:** Keyboard users encounter six invisible controls on every mobile route. This fails visible focus and focus-not-obscured expectations (WCAG 2.4.7 / 2.4.11).

**Recommended change:** Use hidden/display/visibility or inert so closed menu links leave the focus order and accessibility tree. Restore them on opening and when crossing the desktop breakpoint. Ensure closing a menu containing focus returns focus to its toggle. Keep navigation available if JavaScript fails.

### [[P2][Accessibility] Give inline links a visible cue beyond color](https://github.com/jmusick/jd-musick/issues/5)

axe-core 4.14.0 reports link-in-text-block on /contact/ and /privacy-policy/ in live and local builds at 1280px and 320px. The form Privacy Policy link contrasts 1.45:1 with surrounding text; policy prose links contrast about 1.41:1. Global CSS removes text-decoration and provides only a hover color change. [global rule](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/public/universal.css#L161).

**Impact:** People with color-vision differences cannot reliably identify prose links. Confirmed WCAG 1.4.1 failure; this is link-vs-surrounding-text contrast, not text-vs-background contrast.

**Recommended change:** Underline prose links by default or provide an equivalent non-color cue. Preserve visible hover/focus states and scope the rule to inline content so navigation/buttons retain their intended presentation. Review footer prose links as well.

### [[P2][Security][A03] Upgrade and triage vulnerable build dependencies](https://github.com/jmusick/jd-musick/issues/4)

npm audit --json on October 12, 2026 reports 13 vulnerable packages: 1 critical, 10 high, 1 moderate, 1 low (package counts, not distinct CVEs). Lockfile resolves Astro 6.4.8, sharp 0.34.5, astro-icon 1.1.5, devalue 5.9.0 and undici 7.29.0. Astro AVIF advisory GHSA-26w7-cxv4-gfx2 is fixed in >=7.2.8. The audit suggests Astro 7.3.8, a major upgrade. [manifest](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/package.json#L17).

**Impact:** Build tooling has known advisories. The critical AVIF issue requires attacker-controlled image processing; current images are trusted local PNG imports and production serves static output. No public image optimizer, upload feature, hydrated islands or path-based authorization was found. This is a dependency maintenance finding, not demonstrated production RCE; npm undici is not the deployed Function native fetch runtime.

**Recommended change:** Review Astro 7 migration and compatible integration updates; update the lockfile and vulnerable transitive tooling. Triage any remaining advisories by actual reachable behavior. Add a reproducible dependency-audit check appropriate to the static build. Do not apply npm audit fix --force without reviewing the major upgrade.

### [[P2][Security][A06] Bound contact payloads and verify abuse limits](https://github.com/jmusick/jd-musick/issues/3)

The Function buffers request.json() before field checks. No actual-byte body limit, email length limit, or rate-limiting implementation/configuration is present in the checkout. A locally generated 10,000-character email local part passes email validation and reaches Turnstile configuration checks. Turnstile already checks success/action/hostname. Dashboard WAF rules were not inspected, so production rate limiting is unknown. [limits](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/functions/api/contact.ts#L30); [body parsing](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/functions/api/contact.ts#L207).

**Impact:** Oversized requests can waste Function memory/CPU before rejection. Solved verification challenges do not cap sending frequency or cost. OWASP A06:2025, insecure design / API resource consumption.

**Recommended change:** Set a small documented actual-byte body cap before buffering, returning 413, including absent/misleading Content-Length cases. Reject unsupported content types and invalid/overlong email values. Verify existing Cloudflare route throttling and delivery-budget controls; configure and document appropriate limits if absent. Avoid isolate-local counters as a distributed guarantee.

### [[P2][Security][A10] Handle invalid JSON shapes and bound email API requests](https://github.com/jmusick/jd-musick/issues/2)

A local invocation with JSON null throws "Cannot read properties of null (reading 'website')" because request.json() is cast rather than runtime-validated. No email or live POST was sent. The Siteverify call has a 10-second deadline, but sendEmail's fetch has no abort signal. [parser](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/functions/api/contact.ts#L207); [email call](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/functions/api/contact.ts#L126).

**Impact:** Malformed input escapes the controlled JSON error handling, and a stalled email provider can keep submissions pending without a deadline. OWASP A10:2025, exceptional conditions.

**Recommended change:** Validate the parsed value as a non-null, non-array object before reading properties; validate field types. Add an explicit finite deadline to the email request and a matching client-side recovery deadline. Handle upstream timeouts with a bounded, generic JSON error and allow retry; account for ambiguous delivery before automatic resend.

### [[P3][Security] Reconcile privacy disclosures with current third-party services](https://github.com/jmusick/jd-musick/issues/11)

The published privacy policy lists Roboto Slab, Libre Franklin and Barlow Condensed, while the Google Fonts import also requests Bebas Neue. It describes Spotify and Apple Music artist-profile links, while SOCIALS points to album URLs. CONTACT_TO_EMAIL sends correspondence to a Gmail inbox; the policy describes only the site inbox and does not name that receiving provider. Sources: src/pages/privacy-policy.astro, public/universal.css, src/config/site.ts and wrangler.toml at reviewed commit 0a239448c9d021001e43edd99f5401a6debe8714.

**Impact:** Some published descriptions do not match actual services and destinations. This is a transparency/documentation gap; no legal violation, tracking-before-interaction finding or specific retention failure is asserted.

**Recommended change:** Correct font and streaming-link descriptions. Verify and describe the receiving inbox provider and actual handling/retention, using owner-confirmed facts. Update the policy date when publishing changes. Keep runtime fields/providers and privacy wording in step, without inventing consent or storage requirements.

### [[P3][Security][A02] Set security headers on contact Function responses](https://github.com/jmusick/jd-musick/issues/6)

HEAD https://jdmusick.band/api/contact returned 405 with application/json and no-store, without nosniff, HSTS, framing or referrer headers. Static homepage headers were present. public/_headers does not apply to Pages Function responses; the json helper only sets content type and cache control. [helper](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/functions/api/contact.ts#L43).

**Impact:** The API lacks its intended response-level hardening. Its limited JSON surface and no-store behavior lower severity. OWASP A02:2025, security misconfiguration.

**Recommended change:** Set applicable API security headers centrally in the Function JSON response helper or middleware, especially X-Content-Type-Options: nosniff and transport/referrer/framing policies. Do not add wildcard CORS or copy embed/font allowances unnecessarily.

### [[P3][Security][A09] Use bounded privacy-safe contact error logs](https://github.com/jmusick/jd-musick/issues/7)

sendEmail throws the upstream errors[0].message verbatim, and handlePost logs the whole Error object with console.error. The response to the visitor is generic, but provider-controlled error text reaches logs. Log exports, retention, permissions and alert configuration were not inspected. [provider error](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/functions/api/contact.ts#L159); [logging](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/functions/api/contact.ts#L278).

**Impact:** Raw upstream messages may include visitor details and produce unpredictable log content. Actual PII leakage was not observed. OWASP A09:2025, logging and alerting.

**Recommended change:** Log a bounded structured event with safe fields such as operation, status, sanitized error code and correlation ID; avoid message bodies, emails, names, tokens and raw upstream response text. Document actual log access/retention and configure a useful delivery-failure alert if absent.

### [[P3][SEO] Add sizes hints to responsive album images](https://github.com/jmusick/jd-musick/issues/10)

Rendered images have width-based srcset but sizes="" on home and Music. At a 1280px viewport with device pixel ratio 1, the Music cover occupies about 338px yet currentSrc selects the 680w candidate. Without sizes the browser assumes a 100vw slot. [Music Image](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/src/pages/music.astro#L38); [hero Image](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/src/pages/index.astro#L38).

**Impact:** The Music page can fetch a larger cover than its layout needs. This is a measured candidate-selection inefficiency; no field Core Web Vitals failure was established.

**Recommended change:** Supply sizes matching actual layout (Music cover maximum roughly 340px, narrower on small screens; hero spans the viewport), or use compatible Astro responsive layout options. Retain dimensions, WebP processing and appropriate eager/lazy behavior.

### [[P3][SEO] Connect artist and album structured data with known release facts](https://github.com/jmusick/jd-musick/issues/9)

Browser DOM confirms existing MusicGroup JSON-LD on / and /about/, and MusicAlbum on /music/. Entities lack stable @id values. Music album schema omits known release date, artwork and track durations despite these being available in ALBUM and the cover import. Home's nested album omits its canonical Music URL. [home schema](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/src/pages/index.astro#L10); [album schema](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/src/pages/music.astro#L10).

**Impact:** Machines receive less complete, less explicitly connected artist/album information. Existing schema is present; no rich-result eligibility or ranking benefit is promised.

**Recommended change:** Use consistent artist/album identifiers, connect byArtist/album references, and derive datePublished, image and ISO 8601 recording durations from existing data. Keep external album links as album URLs, not artist sameAs profiles; only add verified artist profiles if available.

### [[P3][SEO] Make album search metadata more descriptive](https://github.com/jmusick/jd-musick/issues/8)

Rendered /music/ title is "Music — JD Musick", omitting the album named in its H1. The homepage description is the album blurb and names neither JD Musick nor The Road Still Knows nor the blues/soul genre. Music's description repeats "11 tracks. Eleven...". Existing titles/descriptions are present and unique. [home](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/src/pages/index.astro#L30); [music](https://github.com/jmusick/JDMusick/blob/0a239448c9d021001e43edd99f5401a6debe8714/src/pages/music.astro#L25).

**Impact:** Search previews have less context for artist/album discovery. This is an optimization opportunity, not an indexation blocker or proven ranking loss.

**Recommended change:** Use concise unique metadata identifying the album, artist and relevant genre/listening context naturally. Generate album facts from ALBUM and site identity from config. Example music title: "The Road Still Knows — JD Musick | Music". Keep public voice consistent with README.

## Limits and follow-up

- Search Console/Bing access and traffic, query, backlink and field Core Web
  Vitals data were not supplied. No ranking, indexing submission or field
  performance claims are inferred from browser/source checks.
- Automated accessibility checks are partial. Cross-origin Spotify/Turnstile
  internals, playback, native screen-reader announcements and full zoom/state
  coverage were not certified. axe incomplete items remain manual-review
  items, not automatic violations. Empty lazy-player screenshots were not
  treated as proof of broken production playback.
- Cloudflare dashboard WAF/rate limits, sending quotas, secret permissions/
  rotation, logging settings and GitHub branch/deployment protections were not
  inspected. The issues explicitly distinguish source gaps from unknown
  operational controls. This pass did not perform a full history secret scan,
  external penetration test or destructive/load test.
- Privacy text has stale details (font list omits Bebas Neue; existing streaming
  links go to albums rather than the described artist profiles). Reconcile that
  wording during the next privacy/content edit. Inbox/provider retention needs
  owner verification before expanding claims. The About bio is flagged as
  unapproved in a source comment; approve its factual content before adding new
  biographical or identity claims.
- Re-run affected checks after fixing each issue. Preserve the static
  architecture, exact domain, original masters and hidden null profiles.
