# Dependency triage — October 12, 2026

Remediation record for issue #4,
[[P2][Security][A03] Upgrade and triage vulnerable build dependencies](https://github.com/jmusick/jd-musick/issues/4).
The baseline is [npm-audit.json](npm-audit.json), taken at commit `0a23944`.

## Result

| | Critical | High | Moderate | Low | Total packages |
| --- | --- | --- | --- | --- | --- |
| Before (Astro 6.4.8 lockfile) | 1 | 10 | 1 | 1 | 13 |
| After (Astro 7.3.8 lockfile) | 0 | 0 | 0 | 0 | 0 |

`npm audit` reports `found 0 vulnerabilities` after `npm ci` from the updated
lockfile. No advisories remain open, so none needs a mitigation.

## How each finding was resolved

| Package | Before | After | Resolution |
| --- | --- | --- | --- |
| astro (critical: AVIF RCE GHSA-26w7-cxv4-gfx2, plus XSS and base-path advisories) | 6.4.8 | 7.3.8 | Major upgrade, reviewed against the Astro 7 upgrade guide |
| sharp (libvips, libheif and librsvg advisories) | 0.34.5 | 0.35.5 | Astro 7.2.8+ requires `^0.35.4` |
| esbuild (Windows dev-server file read) | 0.27.7 | removed | Vite 8 no longer depends on esbuild |
| devalue | 5.9.0 | 5.9.4 | Astro 7 dependency |
| svgo | 3.3.4, 4.0.2 | 4.1.0 | astro-icon 1.2.0 / Astro 7 |
| astro-icon, @iconify/tools | 1.1.5, 4.2.0 | 1.2.0, 5.0.14 | Minor upgrade; tools 5 dropped the vulnerable chain |
| extract-zip | 2.0.1 | removed | No longer used by @iconify/tools 5 |
| js-yaml | 4.3.1 | removed | No longer in the tree |
| source-map-js | 1.2.1 | 1.2.2 | Transitive, in range |
| smol-toml | 1.8.0 | 1.9.1 | Transitive, in range |
| undici | 7.29.0, 8.10.0 | 8.11.2 | `npm audit fix` within unifont's `^8.0.0` range |
| http-cache-semantics | 4.2.0 | 4.3.0 | `npm audit fix` within Astro's `^4.2.0` range |

`npm audit fix --force` was not used, and no `overrides` were needed. Every
transitive fix resolves within its parent's declared semver range.

## Applicability, for the record

None of the advisories were demonstrated to be reachable in production:

- Production is static HTML/CSS/WebP plus one Pages Function. The Function
  (`functions/api/contact.ts`) imports nothing from npm, only Workers types,
  and uses the Workers runtime `fetch`, not npm undici.
- The AVIF/sharp/libvips advisories need attacker-controlled images to reach
  the image pipeline. The only processed image is the trusted local
  `src/assets/the-road-still-knows-cover.png`, which is processed at build time.
- The site has no hydrated islands, view transitions, `base` path or
  path-based authorization, which the Astro XSS and auth-bypass advisories
  require.
- The esbuild advisory affects only the Windows dev server. The undici
  advisories sat under `cheerio` (astro-icon tooling) and `unifont` (Astro's
  font API, which this site doesn't use; it loads Google Fonts with `<link>`).

## Keep image inputs trusted

The sharp/libvips advisory class remains the most severe risk for this kind of
stack. The site processes only images committed to `src/assets/`. Before adding
remote images (`image.domains`/`remotePatterns`), CMS-sourced images, user
uploads or an on-demand image endpoint, review the then-current sharp and
Astro image advisories. Prefer pre-processed images or a hosted image service
for anything untrusted.

## Ongoing check

`npm run audit:deps` runs `npm audit --audit-level=high`. It exits non-zero on
any high or critical advisory and prints moderate and low ones for triage. It
deliberately includes devDependencies: for this static build every package is
build tooling, and `--omit=dev` would exclude only TypeScript and the Workers
types. Against the pre-upgrade lockfile it exits 1; against the current one it
exits 0.
