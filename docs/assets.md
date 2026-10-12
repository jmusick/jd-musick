# JD Musick asset organization

Organized October 12, 2026. The website checkout is `C:\Users\JD\source\jd-musick`;
the media working project is `C:\Users\JD\projects\jd-musick`.

## What belongs where

| Information or file | Owner |
| --- | --- |
| Website setup, build, deployment, coding conventions | Source repository `README.md`, `AGENTS.md`; `CLAUDE.md` points to `AGENTS.md` |
| Site identity, domain, contact address, streaming/social links | Source repository `src/config/site.ts` |
| Published album title, release date, track order, displayed timings, notes | Source repository `src/data/album.ts`; released Spotify listing is the documented reference |
| WAV masters and technical specifications | Asset project `assets/albums/the-road-still-knows/audio/` and the album README |
| Distribution cover master | Asset project `assets/albums/the-road-still-knows/artwork/` |
| Original logos and wordmarks | Asset project `assets/brand/` and its README |
| Website cover input | Source repository `src/assets/the-road-still-knows-cover.png` |
| Website share image, favicon, CSS, robots and security headers | Source repository `public/` |
| Actionable audit findings and status | GitHub Issues, categorized and prioritized |
| Dated audit methods, evidence and issue index | Source repository `docs/audits/` |
| Songwriting notes | Existing vault `C:\Users\JD\Vault\Projects\JD Musick\Songs\` |
| Recovered conversation archive | Existing backup `C:\Users\JD\Backup\ChatGPT Exports\2026-08-08\JD Musick\` |

The vault and backup remain in their original locations. Their paths are
provenance references, not build inputs. This pass did not inspect or reorganize
those stores.

## Working project layout

```text
jd-musick/
├── README.md
├── asset-inventory.json
└── assets/
    ├── albums/
    │   └── the-road-still-knows/
    │       ├── README.md
    │       ├── audio/       # 11 WAV masters, original song-title filenames
    │       └── artwork/     # 3000 × 3000 distribution cover
    └── brand/
        ├── README.md
        └── *.png
```

Folder names are lowercase kebab-case. Conventional `README.md` filenames and
existing song-title filenames are retained. The inventory records original and
current relative paths, byte counts, and SHA-256 hashes for all 14 media files;
every hash matched after renaming. It describes the October 12 snapshot, not an
automatically maintained database.

## Publishing an asset to the website

1. Keep the original master in the working project. Use the album or brand
   directory appropriate to the asset, rather than a miscellaneous folder.
2. Create a web derivative and add it to `src/assets/` for Astro processing, or
   `public/` when an exact static filename is required. Record its source when
   replacing a derivative; never ship WAV masters as incidental site assets.
3. Update identity/links in `src/config/site.ts` and album metadata in
   `src/data/album.ts`. Do not treat alphabetical WAV filenames as track order or
   overwrite released timings from locally rounded WAV durations. Older comments
   in `album.ts` describing a proposed sequence/source-WAV timings are stale;
   the README and released listing describe the intended metadata authority.
4. Run `npm run build` and inspect visual changes in the browser. Check the
   static CSP allowlist if the change introduces an external origin.

The repository has no runtime or build-time dependency on the media project,
vault, or conversation backup. Other contributors can build from the checkout.
